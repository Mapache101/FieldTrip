import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderOpen, 
  PlusCircle, 
  Search, 
  Lock, 
  Unlock, 
  Copy, 
  Trash2, 
  Calendar, 
  Users, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { TripProject } from '../types';
import { TripSummary, subscribeToAllTrips, DEFAULT_TRIP_ID } from '../services/tripSyncService';

interface PlanManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTripId: string;
  currentProject: TripProject;
  onSelectTrip: (tripId: string) => void;
  onDuplicateTrip: (trip: TripSummary) => Promise<void>;
  onDeleteTrip: (tripId: string) => Promise<void>;
  onToggleLockTrip: (tripId: string, isLocked: boolean) => Promise<void>;
  onOpenNewPlan: () => void;
}

export const PlanManagerModal: React.FC<PlanManagerModalProps> = ({
  isOpen,
  onClose,
  currentTripId,
  currentProject,
  onSelectTrip,
  onDuplicateTrip,
  onDeleteTrip,
  onToggleLockTrip,
  onOpenNewPlan,
}) => {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'protected' | 'editable'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<TripSummary | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Subscribe to all trips while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToAllTrips(
      (list) => {
        // Ensure the current active trip is in the list even if Firestore sync is pending
        const exists = list.some((t) => t.id === currentTripId);
        if (!exists && currentProject) {
          const currentSummary: TripSummary = {
            id: currentTripId,
            tripName: currentProject.tripName || 'Current Plan',
            destination: currentProject.destination || '',
            startDate: currentProject.startDate || '',
            endDate: currentProject.endDate || '',
            daysCount: currentProject.days ? currentProject.days.length : 0,
            expectedStudents: currentProject.expectedStudents || 0,
            activitiesCount: currentProject.activities ? currentProject.activities.length : 0,
            teachersCount: currentProject.teachers ? currentProject.teachers.length : 0,
            isLocked: Boolean(currentProject.isLocked),
            lastSavedAt: currentProject.lastSavedAt,
          };
          setTrips([currentSummary, ...list]);
        } else {
          setTrips(list);
        }
      },
      (err) => {
        console.warn('Could not list all trips:', err);
      }
    );

    return () => unsubscribe();
  }, [isOpen, currentTripId, currentProject]);

  if (!isOpen) return null;

  // Filter trips
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = 
      trip.tripName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'protected') return trip.isLocked;
    if (statusFilter === 'editable') return !trip.isLocked;
    return true;
  });

  const handleSwitchTrip = (targetTripId: string) => {
    if (targetTripId === currentTripId) {
      onClose();
      return;
    }
    onSelectTrip(targetTripId);
    onClose();
  };

  const handleDuplicate = async (trip: TripSummary) => {
    setIsProcessing(true);
    setActionError(null);
    try {
      await onDuplicateTrip(trip);
      onClose();
    } catch (err: any) {
      setActionError('Failed to duplicate plan: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    if (deleteCandidate.isLocked) {
      setActionError('This plan is protected. Please unlock it before deleting.');
      setDeleteCandidate(null);
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    try {
      await onDeleteTrip(deleteCandidate.id);
      setDeleteCandidate(null);
      // If deleted current active plan, close modal or let App redirect
      if (deleteCandidate.id === currentTripId) {
        onClose();
      }
    } catch (err: any) {
      setActionError('Failed to delete plan: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleLock = async (trip: TripSummary) => {
    setIsProcessing(true);
    setActionError(null);
    try {
      await onToggleLockTrip(trip.id, !trip.isLocked);
    } catch (err: any) {
      setActionError('Failed to update protection status: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="plan-manager-modal"
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="bg-emerald-800 text-white px-6 py-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-600 flex items-center justify-center text-emerald-100 shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Expedition Plans & Saved Trips
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-700 text-emerald-200 border border-emerald-600">
                  {trips.length} {trips.length === 1 ? 'Plan' : 'Plans'} Available
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Select a plan to view, switch between trips, duplicate as a safe copy, or delete old plans.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="plan-manager-create-new-btn"
              type="button"
              onClick={() => {
                onClose();
                onOpenNewPlan();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ New Plan</span>
            </button>
            <button
              id="plan-manager-close-btn"
              type="button"
              onClick={onClose}
              className="text-emerald-300 hover:text-white p-1.5 rounded-xl hover:bg-emerald-700/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety Banner & Advice */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Overwrite Protection:</strong> Lock completed plans to prevent accidental edits. Always use <strong>"Duplicate (Save as Copy)"</strong> when adapting an existing itinerary.
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="plan-manager-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plans by name, destination..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              All ({trips.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('protected')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'protected'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Protected ({trips.filter((t) => t.isLocked).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('editable')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'editable'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Unlock className="w-3 h-3 text-emerald-500" />
              <span>Editable ({trips.filter((t) => !t.isLocked).length})</span>
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-rose-600 font-bold hover:text-rose-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Plan Cards Grid / List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredTrips.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FolderOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-stone-700">No matching expedition plans found</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try searching with another keyword or clearing your filter.'
                  : 'Get started by creating a new expedition plan or blank slate.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewPlan();
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Plan</span>
              </button>
            </div>
          ) : (
            filteredTrips.map((trip) => {
              const isCurrent = trip.id === currentTripId;

              return (
                <div
                  key={trip.id}
                  id={`plan-card-${trip.id}`}
                  className={`p-4.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Plan Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-bold text-stone-900 truncate">
                          {trip.tripName}
                        </h3>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-2xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active Plan</span>
                          </span>
                        )}

                        {trip.isLocked ? (
                          <span 
                            title="Protected: Edits are locked to prevent accidental overwrites."
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                          >
                            <Lock className="w-3 h-3 text-amber-700" />
                            <span>Protected (Read-Only)</span>
                          </span>
                        ) : (
                          <span 
                            title="Editable: Can be edited and synced in real time."
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200"
                          >
                            <Unlock className="w-3 h-3 text-stone-500" />
                            <span>Editable</span>
                          </span>
                        )}
                      </div>

                      {/* Details row */}
                      <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                        {trip.destination && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{trip.destination}</span>
                          </span>
                        )}

                        {trip.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{trip.startDate} to {trip.endDate}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1 font-semibold text-stone-700">
                          <Layers className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{trip.daysCount} {trip.daysCount === 1 ? 'Day' : 'Days'}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{trip.expectedStudents} Students</span>
                        </span>

                        <span className="text-stone-400">•</span>
                        <span>{trip.activitiesCount} Activities</span>

                        {trip.lastSavedAt && (
                          <>
                            <span className="text-stone-400">•</span>
                            <span className="flex items-center gap-1 text-[11px] text-stone-400">
                              <Clock className="w-3 h-3" />
                              <span>Saved {new Date(trip.lastSavedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                      {/* Select / Switch button */}
                      {isCurrent ? (
                        <button
                          type="button"
                          disabled
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 cursor-default"
                        >
                          Currently Loaded
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchTrip(trip.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors"
                        >
                          <span>Open Plan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Duplicate / Save As Copy (Hardens against overwriting original) */}
                      <button
                        type="button"
                        onClick={() => handleDuplicate(trip)}
                        disabled={isProcessing}
                        title="Create an independent copy of this plan so you can modify it safely without overwriting the original"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        <span className="hidden sm:inline">Duplicate</span>
                      </button>

                      {/* Lock / Unlock Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleLock(trip)}
                        disabled={isProcessing}
                        title={trip.isLocked ? "Unlock plan to allow changes" : "Lock plan to protect against accidental edits"}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          trip.isLocked
                            ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            : 'text-stone-600 bg-white hover:bg-stone-100 border-stone-200'
                        }`}
                      >
                        {trip.isLocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-amber-700" />
                            <span className="hidden sm:inline">Unlock</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-stone-500" />
                            <span className="hidden sm:inline">Protect</span>
                          </>
                        )}
                      </button>

                      {/* Delete Plan */}
                      <button
                        type="button"
                        onClick={() => {
                          if (trip.isLocked) {
                            setActionError(`"${trip.tripName}" is protected from deletion. Please unlock it first.`);
                            return;
                          }
                          setDeleteCandidate(trip);
                        }}
                        disabled={isProcessing}
                        title={trip.isLocked ? "Cannot delete protected plan" : "Permanently delete old plan"}
                        className={`p-1.5 rounded-xl transition-colors ${
                          trip.isLocked
                            ? 'text-stone-300 cursor-not-allowed'
                            : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 shrink-0">
          <div>
            Trip ID: <code className="text-[11px] font-mono bg-stone-200/70 px-1.5 py-0.5 rounded text-stone-700">{currentTripId}</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Safety Confirmation Dialog for Deleting a Plan */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-stone-900 mb-2">
              Delete Expedition Plan?
            </h3>
            
            <p className="text-xs text-center text-stone-600 mb-4 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-stone-900">"{deleteCandidate.tripName}"</strong>?
              This will permanently remove all activities, trail maps, and student assignments associated with this plan. This action cannot be undone.
            </p>

            {deleteCandidate.id === currentTripId && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>This is your currently active plan. Deleting it will switch you back to the default expedition.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-plan-btn"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Deleting...' : 'Yes, Delete Plan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
