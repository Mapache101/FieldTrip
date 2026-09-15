import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { TripProject } from '../types';
import { INITIAL_PROJECT } from '../data/initialTripData';

export const DEFAULT_TRIP_ID = 'palermo-expedition-2026';

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
    tripName: project.tripName || 'Wilderness Camping Expedition',
    destination: project.destination || 'Palermo, Santa Cruz, Bolivia',
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
        // First time initialization: initialize trip with INITIAL_PROJECT in cloud
        try {
          if (onStatusChange) onStatusChange('saving');
          const initialData = sanitizeProjectForFirestore({
            ...INITIAL_PROJECT,
            id: tripId,
          });
          await setDoc(tripRef, initialData);
          if (onStatusChange) onStatusChange('connected');
          onUpdate({ ...INITIAL_PROJECT, id: tripId });
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
