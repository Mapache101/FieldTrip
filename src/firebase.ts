import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  OAuthProvider,
  GoogleAuthProvider,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Main Firebase App for CampQuest Real-Time Database
export const app = getApps().find((a) => a.name === '[DEFAULT]') || initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: Required for named database */
export const auth = getAuth(app);

// Test connection on boot as mandated by firebase-integration skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
    }
  }
}
testConnection();

// Secondary Firebase App for SCIS HousePoints Student Roster
export const scisFirebaseConfig = {
  apiKey: 'AIzaSyDyFV6WAZhpr4leljJOQozPzEWlNaU-heQ',
  authDomain: 'scis-house-points.firebaseapp.com',
  projectId: 'scis-house-points',
  storageBucket: 'scis-house-points.firebasestorage.app',
  messagingSenderId: '929403398815',
  appId: '1:929403398815:web:c6634925bfac5b665650aa',
};

export const APP_ID = 'scis-house-points';

export const scisApp = getApps().find((a) => a.name === 'scis') || initializeApp(scisFirebaseConfig, 'scis');
export const scisDb = getFirestore(scisApp);

// Operation types for standard error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Authentication Helpers
export async function signInWithMicrosoft() {
  const provider = new OAuthProvider('microsoft.com');
  provider.setCustomParameters({
    tenant: 'scis-bo.com',
  });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Microsoft login failed:', error);
    throw error;
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google login failed:', error);
    throw error;
  }
}

export async function signInGuest() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous auth failed:', error);
    throw error;
  }
}

export async function logOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// Firebase Student Type from SCIS HousePoints
export interface SCISStudentFirebase {
  id: string;
  name: string;
  grade: string;
  house?: 'centaurs' | 'pegasus' | 'titans' | 'unicorns' | string;
  displayName?: string;
}

// Fetch all SCIS students from external SCIS Firestore
export async function fetchSCISStudents(): Promise<SCISStudentFirebase[]> {
  const path = `artifacts/${APP_ID}/public/data/students`;
  try {
    const studentsCol = collection(scisDb, 'artifacts', APP_ID, 'public', 'data', 'students');
    const snap = await getDocs(studentsCol);
    const list: SCISStudentFirebase[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      let formattedGrade = data.grade || '';
      formattedGrade = formattedGrade.replace(/s1/gi, 'sA').replace(/s2/gi, 'sB');
      list.push({
        id: docSnap.id,
        name: data.name || '',
        displayName: (data.name || '').toUpperCase(),
        grade: formattedGrade,
        house: data.house,
      });
    });

    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

// Listen to real-time students updates from SCIS Firestore
export function subscribeSCISStudents(
  onData: (students: SCISStudentFirebase[]) => void,
  onError?: (err: unknown) => void
) {
  const path = `artifacts/${APP_ID}/public/data/students`;
  const studentsCol = collection(scisDb, 'artifacts', APP_ID, 'public', 'data', 'students');
  return onSnapshot(
    studentsCol,
    (snap) => {
      const list: SCISStudentFirebase[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        let formattedGrade = data.grade || '';
        formattedGrade = formattedGrade.replace(/s1/gi, 'sA').replace(/s2/gi, 'sB');
        list.push({
          id: docSnap.id,
          name: data.name || '',
          displayName: (data.name || '').toUpperCase(),
          grade: formattedGrade,
          house: data.house,
        });
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}
