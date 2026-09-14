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
  PlusCircle
} from 'lucide-react';
import { TripProject } from '../types';
import { FirebaseAuthButton } from './FirebaseAuthButton';

interface HeaderProps {
  project: TripProject;
  activeTab: 'timeline' | 'desk' | 'map' | 'students' | 'supplies' | 'teachers' | 'calendar';
  onTabChange: (tab: 'timeline' | 'desk' | 'map' | 'students' | 'supplies' | 'teachers' | 'calendar') => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onPrint: () => void;
  onOpenNewPlan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenShare,
  onPrint,
  onOpenNewPlan,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
          {/* Trip Identification */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Tent className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 truncate">
                  {project.tripName}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {project.days.length} Days
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium flex-wrap">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Palermo, Santa Cruz, Bolivia</span>
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
            {/* Start New Plan Button */}
            <button
              id="header-new-plan-btn"
              type="button"
              onClick={onOpenNewPlan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Plan</span>
            </button>

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
              <span>Share & Export</span>
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
