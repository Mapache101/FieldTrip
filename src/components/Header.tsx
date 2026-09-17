import React from 'react';
import { 
  Compass, 
  Tent, 
  Users, 
  Package, 
  Calendar, 
  Share2, 
  Printer, 
  Settings, 
  MapPin, 
  Layers,
  PlusCircle,
  FolderOpen,
  Lock,
  Unlock,
  Copy,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { TripProject } from '../types';
import { FirebaseAuthButton } from './FirebaseAuthButton';
import { RefreshCw, Radio, CheckCircle, Wifi, AlertCircle } from 'lucide-react';

interface HeaderProps {
  project: TripProject;
  activeTab: 'timeline' | 'desk' | 'map' | 'students' | 'supplies' | 'teachers' | 'calendar';
  onTabChange: (tab: 'timeline' | 'desk' | 'map' | 'students' | 'supplies' | 'teachers' | 'calendar') => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onPrint: () => void;
  onOpenNewPlan: () => void;
  onOpenPlanManager: () => void;
  onToggleLockCurrentPlan?: () => void;
  onDuplicateCurrentPlan?: () => void;
  syncStatus?: 'connected' | 'saving' | 'offline' | 'error';
  lastSyncedTime?: string | null;
  onCopyLiveLink?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenShare,
  onPrint,
  onOpenNewPlan,
  onOpenPlanManager,
  onToggleLockCurrentPlan,
  onDuplicateCurrentPlan,
  syncStatus = 'connected',
  lastSyncedTime,
  onCopyLiveLink,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
          {/* Trip Identification */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenPlanManager}
              title="Click to view all plans or switch between trips"
              className="w-10 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-xs shrink-0 cursor-pointer transition-colors group"
            >
              <Tent className="w-5 h-5 group-hover:scale-105 transition-transform" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Clickable Trip Name to switch plans */}
                <button
                  id="header-trip-name-dropdown-btn"
                  type="button"
                  onClick={onOpenPlanManager}
                  title="Click to switch or manage expedition plans"
                  className="inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-stone-900 hover:text-emerald-800 truncate text-left group"
                >
                  <span className="truncate">{project.tripName}</span>
                  <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 transition-colors shrink-0" />
                </button>

                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {project.days.length} Days
                </span>

                {/* Overwrite Protection Lock Badge */}
                {project.isLocked ? (
                  <button
                    id="header-lock-badge-btn"
                    type="button"
                    onClick={onToggleLockCurrentPlan}
                    title="Protected Plan: Edits are locked to prevent accidental overwrites. Click to unlock."
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 transition-colors shadow-2xs"
                  >
                    <Lock className="w-3 h-3 text-amber-700" />
                    <span>Protected</span>
                  </button>
                ) : (
                  <button
                    id="header-lock-badge-btn"
                    type="button"
                    onClick={onToggleLockCurrentPlan}
                    title="Plan is editable. Click to lock and protect against accidental overwrites."
                    className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 transition-colors"
                  >
                    <Unlock className="w-3 h-3 text-stone-400" />
                    <span>Lock Plan</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium flex-wrap">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{project.destination || 'Palermo, Santa Cruz, Bolivia'}</span>
                </span>
                <span>•</span>
                {/* Direct Trip Dates Clickable Action */}
                <button
                  type="button"
                  onClick={onOpenSettings}
                  title="Click to change trip start/end dates or add/remove days"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer group shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                  <span>{project.startDate} to {project.endDate}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold underline underline-offset-2 ml-0.5">
                    (Edit Dates)
                  </span>
                </button>
                <span>•</span>
                <span>{project.expectedStudents} Students</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
            {/* Real-Time Live Sync Status Indicator */}
            <div
              id="header-live-sync-indicator"
              title={
                syncStatus === 'connected'
                  ? `Live real-time sync active${lastSyncedTime ? ` (Last saved: ${lastSyncedTime})` : ''}. Any collaborator with the link sees changes instantly.`
                  : syncStatus === 'saving'
                  ? 'Saving changes to cloud in real time...'
                  : 'Syncing issue or offline mode'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                syncStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : syncStatus === 'saving'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {syncStatus === 'connected' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
              )}
              {syncStatus === 'saving' && (
                <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
              )}
              {syncStatus === 'error' && (
                <AlertCircle className="w-3 h-3 text-rose-600" />
              )}
              <span className="text-[11px] uppercase tracking-wide">
                {syncStatus === 'connected' ? 'Live Synced' : syncStatus === 'saving' ? 'Syncing...' : 'Sync Retry'}
              </span>
            </div>

            {/* Select & Manage Plans (All Plans) Button */}
            <button
              id="header-manage-plans-btn"
              type="button"
              onClick={onOpenPlanManager}
              title="View all plans, switch plans, duplicate or delete old plans"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 shadow-2xs transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>All Plans</span>
            </button>

            {/* Start New Plan Button */}
            <button
              id="header-new-plan-btn"
              type="button"
              onClick={onOpenNewPlan}
              title="Create a new expedition plan or clean blank slate"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Plan</span>
            </button>

            {/* Duplicate / Save Copy Button */}
            {onDuplicateCurrentPlan && (
              <button
                id="header-duplicate-btn"
                type="button"
                onClick={onDuplicateCurrentPlan}
                title="Duplicate this plan as a safe copy so you don't overwrite the original"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>Save Copy</span>
              </button>
            )}

            {/* Print Slip */}
            <button
              id="header-print-btn"
              type="button"
              onClick={onPrint}
              title="Print Trip Itinerary & Packing Lists"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden md:inline">Print</span>
            </button>

            {/* Share / Export */}
            <button
              id="header-share-btn"
              type="button"
              onClick={onOpenShare}
              title="Share link or export plan"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Share</span>
            </button>

            {/* Trip Settings */}
            <button
              id="header-settings-btn"
              type="button"
              onClick={onOpenSettings}
              title="Trip Dates & Settings"
              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* SCIS Firebase Authentication */}
            <FirebaseAuthButton />
          </div>
        </div>

        {/* Protection Warning Banner if locked */}
        {project.isLocked && (
          <div className="py-1.5 px-3 mb-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                <strong>Protected Plan (Read-Only):</strong> Modifications and overwrites are disabled to protect this itinerary.
              </span>
            </div>
            {onToggleLockCurrentPlan && (
              <button
                type="button"
                onClick={onToggleLockCurrentPlan}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 shrink-0 cursor-pointer"
              >
                Unlock to Edit
              </button>
            )}
          </div>
        )}

        {/* Modern Tab Bar */}
        <nav className="flex items-center gap-1 border-t border-stone-100 overflow-x-auto no-scrollbar -mb-px">
          <button
            id="tab-timeline-btn"
            type="button"
            onClick={() => onTabChange('timeline')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Horizontal Timeline</span>
          </button>

          <button
            id="tab-desk-btn"
            type="button"
            onClick={() => onTabChange('desk')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'desk'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Card Desk Board</span>
          </button>

          <button
            id="tab-map-btn"
            type="button"
            onClick={() => onTabChange('map')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'map'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Map (Palermo, Bolivia)</span>
          </button>

          <button
            id="tab-students-btn"
            type="button"
            onClick={() => onTabChange('students')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'students'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-700" />
            <span>Student Groups (2 Cohorts)</span>
          </button>

          <button
            id="tab-supplies-btn"
            type="button"
            onClick={() => onTabChange('supplies')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'supplies'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Supplies & Gear</span>
          </button>

          <button
            id="tab-teachers-btn"
            type="button"
            onClick={() => onTabChange('teachers')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'teachers'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Chaperones & Staff</span>
          </button>

          <button
            id="tab-calendar-btn"
            type="button"
            onClick={() => onTabChange('calendar')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Milestones</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
