import React, { useState } from 'react';
import { Sparkles, Calendar, MapPin, Users, FilePlus, RefreshCw, X, AlertTriangle, Check } from 'lucide-react';
import { TripProject } from '../types';
import { createEmptyTripProject, INITIAL_PROJECT } from '../data/initialTripData';

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNewPlan: (newProject: TripProject) => void;
}

export const NewPlanModal: React.FC<NewPlanModalProps> = ({
  isOpen,
  onClose,
  onCreateNewPlan,
}) => {
  const [templateChoice, setTemplateChoice] = useState<'blank' | 'palermo-creek'>('blank');
  const [tripName, setTripName] = useState('Nuevo Campamento Escolar');
  const [startDate, setStartDate] = useState('2026-10-28');
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [expectedStudents, setExpectedStudents] = useState(30);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (templateChoice === 'palermo-creek') {
      const palermoTemplate: TripProject = {
        ...INITIAL_PROJECT,
        id: `trip-${Date.now()}`,
        tripName: tripName.trim() || 'Campamento Escolar Palermo - Santa Cruz',
        startDate,
        expectedStudents,
        lastSavedAt: new Date().toISOString(),
      };
      onCreateNewPlan(palermoTemplate);
    } else {
      const blankPlan = createEmptyTripProject(
        tripName.trim() || 'Nuevo Campamento Escolar',
        startDate,
        numberOfDays,
        expectedStudents
      );
      onCreateNewPlan(blankPlan);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
              <FilePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Start New Camp Plan</h2>
              <p className="text-xs text-stone-500">Create a blank plan from scratch or start from a template</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Template Choice */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Plan Starting Point
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTemplateChoice('blank');
                  if (tripName === 'Campamento Escolar Palermo - Santa Cruz') {
                    setTripName('Nuevo Campamento Escolar');
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  templateChoice === 'blank'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-stone-900">Blank Slate</span>
                  {templateChoice === 'blank' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  100% blank plan. Zero activities, students, chaperones, or locations on the map.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTemplateChoice('palermo-creek');
                  setTripName('Campamento Escolar Palermo - Santa Cruz');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  templateChoice === 'palermo-creek'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-stone-900">Palermo Creek Template</span>
                  {templateChoice === 'palermo-creek' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  Pre-configured with 9 activities, creek exploration, Chiquitano hike, and supply list.
                </p>
              </button>
            </div>
          </div>

          {/* Trip Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Trip / Expedition Title
            </label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="e.g. Campamento 8vo Grado"
              required
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            />
          </div>

          {/* Location details */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-800">Map & Coordinates: </span>
              {templateChoice === 'palermo-creek' ? (
                <span>Palermo, Santa Cruz, Bolivia (-18.210799, -63.748706) with Arroyo Palermo creek access</span>
              ) : (
                <span>Blank map with no pre-pinned markers or locations. Add custom locations as you create activities.</span>
              )}
            </div>
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Number of Days
              </label>
              <select
                value={numberOfDays}
                disabled={templateChoice === 'palermo-creek'}
                onChange={(e) => setNumberOfDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 disabled:bg-stone-100 disabled:text-stone-400"
              >
                <option value={1}>1 Day (Day Camp)</option>
                <option value={2}>2 Days (1 Night)</option>
                <option value={3}>3 Days (2 Nights - Standard)</option>
                <option value={4}>4 Days (3 Nights)</option>
                <option value={5}>5 Days (Week Expedition)</option>
              </select>
            </div>
          </div>

          {/* Expected Students */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-stone-500" />
              <span>Expected Students Count</span>
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={expectedStudents}
              onChange={(e) => setExpectedStudents(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs transition-colors"
            >
              Create New Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
