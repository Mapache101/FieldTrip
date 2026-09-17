import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { TripProject } from '../types';
import { INITIAL_PROJECT, createEmptyTripProject } from '../data/initialTripData';

export const DEFAULT_TRIP_ID = 'palermo-expedition-2026';

export interface TripSummary {
  id: string;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  expectedStudents: number;
  activitiesCount: number;
  teachersCount: number;
  isLocked: boolean;
  lastSavedAt?: string;
  updatedBy?: string;
}

const KNOWN_TRIPS_KEY = 'CAMPQUEST_KNOWN_TRIP_IDS';

// Helper to keep track of known trips locally
export function getLocalKnownTripIds(): string[] {
  try {
    const raw = localStorage.getItem(KNOWN_TRIPS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return Array.from(new Set([DEFAULT_TRIP_ID, ...arr]));
      }
    }
  } catch (e) {
    // Ignore error
  }
  return [DEFAULT_TRIP_ID];
}

export function addLocalKnownTripId(tripId: string) {
  try {
    const list = getLocalKnownTripIds();
    if (!list.includes(tripId)) {
      list.push(tripId);
      localStorage.setItem(KNOWN_TRIPS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    // Ignore error
  }
}

export function removeLocalKnownTripId(tripId: string) {
  try {
    const list = getLocalKnownTripIds().filter((id) => id !== tripId);
    localStorage.setItem(KNOWN_TRIPS_KEY, JSON.stringify(list));
  } catch (e) {
    // Ignore error
  }
}

// Clean TripProject object to ensure no undefined values reach Firestore
export function sanitizeProjectForFirestore(project: TripProject): Record<string, any> {
  const cleanObject = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(cleanObject);
    if (typeof obj === 'object') {
      const clean: Record<string, any> = {};
      for (const [key, val] of Object.entries(obj)) {
        if (val !== undefined) {
          clean[key] = cleanObject(val);
        }
      }
      return clean;
    }
    return obj;
  };

  return cleanObject({
    ...project,
    id: project.id || DEFAULT_TRIP_ID,
    tripName: project.tripName || 'Campamento Escolar',
    destination: project.destination || '',
    baseLocation: project.baseLocation || null,
    startDate: project.startDate || '2026-10-28',
    endDate: project.endDate || '2026-10-30',
    expectedStudents: Number(project.expectedStudents) || 30,
    days: project.days || [],
    activities: project.activities || [],
    supplies: project.supplies || [],
    studentItems: project.studentItems || [],
    teachers: project.teachers || [],
    milestones: project.milestones || [],
    studentGroups: project.studentGroups || [],
    students: project.students || [],
    selectedPawn: project.selectedPawn || null,
    isLocked: Boolean(project.isLocked),
    lastSavedAt: new Date().toISOString(),
    updatedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Field Trip Coordinator',
  });
}

// Get the current Trip ID from URL query param ?trip=...
export function getCurrentTripIdFromUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_TRIP_ID;
  const params = new URLSearchParams(window.location.search);
  const tripParam = params.get('trip');
  if (tripParam && /^[a-zA-Z0-9_-]+$/.test(tripParam)) {
    return tripParam;
  }
  return DEFAULT_TRIP_ID;
}

// Set or update trip ID in URL without full page reload
export function setTripIdInUrl(tripId: string) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('trip', tripId);
  window.history.replaceState({}, '', url.toString());
}

// Generate full shareable live collaboration link
export function getLiveCollaborationUrl(tripId: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('trip', tripId);
  url.hash = ''; // Clear any legacy snapshot hash
  return url.toString();
}

// Save trip to Cloud Firestore
export async function saveTripToCloud(project: TripProject): Promise<void> {
  const tripId = project.id || DEFAULT_TRIP_ID;
  const path = `trips/${tripId}`;
  try {
    const tripRef = doc(db, 'trips', tripId);
    const data = sanitizeProjectForFirestore(project);
    await setDoc(tripRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Subscribe to real-time updates for a trip document
export function subscribeToTrip(
  tripId: string,
  onUpdate: (project: TripProject) => void,
  onStatusChange?: (status: 'connected' | 'saving' | 'offline' | 'error') => void
): () => void {
  const path = `trips/${tripId}`;
  const tripRef = doc(db, 'trips', tripId);

  let initialFetchDone = false;

  const unsubscribe = onSnapshot(
    tripRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        // First time initialization: initialize trip with INITIAL_PROJECT for default trip, or a clean blank plan for new custom trips
        try {
          if (onStatusChange) onStatusChange('saving');
          const fallbackProject: TripProject =
            tripId === DEFAULT_TRIP_ID
              ? { ...INITIAL_PROJECT, id: tripId }
              : { ...createEmptyTripProject('Nuevo Campamento Escolar'), id: tripId };
          const initialData = sanitizeProjectForFirestore(fallbackProject);
          await setDoc(tripRef, initialData);
          if (onStatusChange) onStatusChange('connected');
          onUpdate(fallbackProject);
        } catch (err) {
          console.error('Error initializing trip in cloud:', err);
          if (onStatusChange) onStatusChange('error');
        }
        return;
      }

      const data = snapshot.data() as TripProject;
      if (onStatusChange) onStatusChange('connected');
      onUpdate(data);
      initialFetchDone = true;
    },
    (error) => {
      console.error('Real-time trip subscription error:', error);
      handleFirestoreError(error, OperationType.GET, path);
      if (onStatusChange) onStatusChange('error');
    }
  );

  return unsubscribe;
}

// Real-time subscription to all available trip plans
export function subscribeToAllTrips(
  onTrips: (trips: TripSummary[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = 'trips';
  const tripsCol = collection(db, 'trips');
  return onSnapshot(
    tripsCol,
    (snapshot) => {
      const list: TripSummary[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const id = docSnap.id;
        addLocalKnownTripId(id);
        list.push({
          id,
          tripName: data.tripName || 'Sin Nombre',
          destination: data.destination || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          daysCount: Array.isArray(data.days) ? data.days.length : 0,
          expectedStudents: Number(data.expectedStudents) || 0,
          activitiesCount: Array.isArray(data.activities) ? data.activities.length : 0,
          teachersCount: Array.isArray(data.teachers) ? data.teachers.length : 0,
          isLocked: Boolean(data.isLocked),
          lastSavedAt: data.lastSavedAt,
          updatedBy: data.updatedBy,
        });
      });

      // Sort by lastSavedAt descending
      list.sort((a, b) => {
        const tA = a.lastSavedAt ? new Date(a.lastSavedAt).getTime() : 0;
        const tB = b.lastSavedAt ? new Date(b.lastSavedAt).getTime() : 0;
        return tB - tA;
      });

      onTrips(list);
    },
    (error) => {
      console.error('Error fetching all trips list:', error);
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

// Delete trip from Firestore and local cache
export async function deleteTripFromCloud(tripId: string): Promise<void> {
  const path = `trips/${tripId}`;
  try {
    const docRef = doc(db, 'trips', tripId);
    await deleteDoc(docRef);
    removeLocalKnownTripId(tripId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// Duplicate an existing trip into a brand-new plan document (safe copy to prevent overwriting)
export async function duplicateTripInCloud(
  source: TripProject | string,
  newTripName?: string
): Promise<TripProject> {
  let baseProject: TripProject;
  if (typeof source === 'string') {
    const docRef = doc(db, 'trips', source);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      baseProject = snap.data() as TripProject;
    } else {
      throw new Error(`Plan "${source}" not found.`);
    }
  } else {
    baseProject = source;
  }

  const newId = `trip-${Date.now()}`;
  const duplicate: TripProject = {
    ...JSON.parse(JSON.stringify(baseProject)),
    id: newId,
    tripName: newTripName || `${baseProject.tripName} (Copy)`,
    isLocked: false, // New copy is unlocked so user can safely edit it
    lastSavedAt: new Date().toISOString(),
    updatedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Field Trip Coordinator',
  };
  addLocalKnownTripId(newId);
  await saveTripToCloud(duplicate);
  return duplicate;
}

// Update lock status of a trip
export async function setTripLockStatus(tripId: string, isLocked: boolean): Promise<void> {
  const path = `trips/${tripId}`;
  try {
    const docRef = doc(db, 'trips', tripId);
    await setDoc(docRef, { isLocked, lastSavedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

