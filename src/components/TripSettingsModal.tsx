import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Save,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { DayPlan, TripProject } from '../types';

interface TripSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: TripProject;
  onSave: (updated: Partial<TripProject>) => void;
  onResetToSampleData: () => void;
}

export const TripSettingsModal: React.FC<TripSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
  onResetToSampleData,
}) => {
  const [tripName, setTripName] = useState(project.tripName);
  const [destination, setDestination] = useState(project.destination);
  const [startDate, setStartDate] = useState(project.startDate);
  const [endDate, setEndDate] = useState(project.endDate);
  const [expectedStudents, setExpectedStudents] = useState(project.expectedStudents);
  const [days, setDays] = useState<DayPlan[]>(project.days);
  const [autoShiftDays, setAutoShiftDays] = useState(true);
  const [isLocked, setIsLocked] = useState(Boolean(project.isLocked));
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTripName(project.tripName);
      setDestination(project.destination);
      setStartDate(project.startDate);
      setEndDate(project.endDate);
      setExpectedStudents(project.expectedStudents);
      setDays(project.days);
      setIsLocked(Boolean(project.isLocked));
      setShowResetConfirm(false);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  // Smart Start Date change with automatic daily date shifting
  const handleStartDateChange = (newStart: string) => {
    const oldStart = startDate;
    setStartDate(newStart);

    if (autoShiftDays && newStart && oldStart) {
      const oldTime = new Date(oldStart + 'T00:00:00').getTime();
      const newTime = new Date(newStart + 'T00:00:00').getTime();
      const diffDays = Math.round((newTime - oldTime) / (1000 * 60 * 60 * 24));

      if (!isNaN(diffDays) && diffDays !== 0) {
        // Shift end date by same delta
        const oldEndTime = new Date(endDate + 'T00:00:00').getTime();
        if (!isNaN(oldEndTime)) {
          const newEndTime = new Date(oldEndTime + diffDays * 24 * 60 * 60 * 1000);
          setEndDate(newEndTime.toISOString().split('T')[0]);
        }

        // Shift all day dates
        const updatedDays = days.map((day) => {
          const dayTime = new Date(day.dateStr + 'T00:00:00').getTime();
          if (!isNaN(dayTime)) {
            const shifted = new Date(dayTime + diffDays * 24 * 60 * 60 * 1000);
            return {
              ...day,
              dateStr: shifted.toISOString().split('T')[0],
            };
          }
          return day;
        });
        setDays(updatedDays);
      }
    }
  };

  const handleUpdateDay = (index: number, field: keyof DayPlan, val: any) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: val };
    
    // If the last day's date was edited, update endDate
    if (field === 'dateStr' && index === days.length - 1) {
      setEndDate(val);
    }
    // If the first day's date was edited, update startDate
    if (field === 'dateStr' && index === 0) {
      setStartDate(val);
    }

    setDays(updated);
  };

  const handleAddDay = () => {
    const nextDayNum = days.length + 1;
    let nextDateStr = '2026-10-31';
    if (days.length > 0) {
      const lastDay = days[days.length - 1];
      const lastTime = new Date(lastDay.dateStr + 'T00:00:00').getTime();
      if (!isNaN(lastTime)) {
        const nextTime = new Date(lastTime + 24 * 60 * 60 * 1000);
        nextDateStr = nextTime.toISOString().split('T')[0];
      }
    }

    const newDay: DayPlan = {
      id: `day-${Date.now()}`,
      dayNumber: nextDayNum,
      dateStr: nextDateStr,
      title: `Day ${nextDayNum}: Adventure Continuation`,
      subtitle: 'Extra outdoor explorations and team bonding',
      startTime: '08:00',
      activityIds: [],
    };

    const updated = [...days, newDay];
    setDays(updated);
    setEndDate(nextDateStr);
  };

  const handleRemoveDay = (index: number) => {
    if (days.length <= 1) {
      alert('Trip must have at least one day.');
      return;
    }
    if (confirm(`Remove Day ${days[index].dayNumber}? Any activity cards placed on this day will return to the Activity Bank.`)) {
      const filtered = days.filter((_, i) => i !== index).map((d, i) => ({
        ...d,
        dayNumber: i + 1,
      }));
      setDays(filtered);
      if (filtered.length > 0) {
        setEndDate(filtered[filtered.length - 1].dateStr);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      tripName: tripName.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      expectedStudents: Number(expectedStudents) || 30,
      days,
      isLocked,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-amber-50 rounded-3xl border-3 border-amber-800/80 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95">
        <div className="bg-amber-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-200" />
            <h2 className="text-lg font-black font-display tracking-tight">
              Expedition Configuration
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Overwrite Protection Lock Card */}
          <div className="bg-amber-100/90 p-4 rounded-2xl border-2 border-amber-300 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200/90 border border-amber-400 flex items-center justify-center text-amber-900 shrink-0 mt-0.5">
                {isLocked ? <Lock className="w-4 h-4 text-amber-900" /> : <Unlock className="w-4 h-4 text-amber-700" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-amber-950">
                    Lock Plan (Prevent Accidental Overwrites)
                  </span>
                  {isLocked && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-700 text-white">
                      Protected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-900 mt-0.5 leading-normal">
                  Prevents accidental edits, card movement, schedule modifications, and resets.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-700"></div>
            </label>
          </div>

          {/* Trip Name */}
          <div>
            <label className="block text-xs font-black uppercase text-amber-950 mb-1">
              Trip Name
            </label>
            <input
              type="text"
              required
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 font-bold text-stone-800 text-sm outline-none focus:border-amber-600"
            />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-black uppercase text-amber-950 mb-1">
              Destination & Campsite Details
            </label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-stone-800 outline-none focus:border-amber-600"
            />
          </div>

          {/* Date range & Students */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-stone-800 outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-stone-800 outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                  Expected Campers
                </label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={expectedStudents}
                  onChange={(e) => setExpectedStudents(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-stone-800 outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Auto-shift helper info */}
            <div className="flex items-center justify-between gap-2 text-xs bg-amber-100/70 px-3 py-2 rounded-xl border border-amber-200">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoShiftDays}
                  onChange={(e) => setAutoShiftDays(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-700 focus:ring-amber-600 border-amber-300"
                />
                <span className="font-semibold text-amber-950">
                  Auto-shift all day dates when changing Start Date
                </span>
              </label>

              <span className="font-bold text-amber-900 bg-white/80 px-2 py-0.5 rounded-md border border-amber-300 text-[11px]">
                {days.length} Day Expedition
              </span>
            </div>
          </div>

          {/* Days breakdown (2-3 days customizable) */}
          <div className="bg-amber-100/60 p-4 rounded-2xl border border-amber-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                Expedition Days & Daily Themes ({days.length} Days)
              </span>
              <button
                type="button"
                onClick={handleAddDay}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 bg-white px-2.5 py-1 rounded-lg border border-amber-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Day</span>
              </button>
            </div>

            <div className="space-y-2">
              {days.map((d, index) => (
                <div
                  key={d.id}
                  className="bg-white p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between"
                >
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                      {d.dayNumber}
                    </span>
                    <input
                      type="text"
                      value={d.title}
                      onChange={(e) => handleUpdateDay(index, 'title', e.target.value)}
                      className="font-bold text-xs text-stone-800 border-b border-stone-200 focus:border-amber-600 outline-none flex-1 sm:w-60 px-1 py-0.5"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <input
                      type="date"
                      value={d.dateStr}
                      onChange={(e) => handleUpdateDay(index, 'dateStr', e.target.value)}
                      className="text-xs font-medium text-stone-600 border border-stone-200 rounded px-1.5 py-0.5 outline-none"
                    />
                    {days.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(index)}
                        className="text-stone-400 hover:text-red-700 p-1"
                        title="Delete this day"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (isLocked) {
                  alert('This plan is locked against overwrites. Please unlock it first to reset to sample data.');
                  return;
                }
                setShowResetConfirm(true);
              }}
              className={`text-xs font-bold flex items-center gap-1.5 ${
                isLocked 
                  ? 'text-stone-400 cursor-not-allowed' 
                  : 'text-stone-500 hover:text-amber-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
              {isLocked && <Lock className="w-3 h-3 text-stone-400" />}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-amber-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-black uppercase bg-amber-700 text-white hover:bg-amber-800 shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Apply Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Safety Confirmation for Resetting to Sample Data */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>

            <h3 className="text-base font-bold text-center text-stone-900 mb-2">
              Overwrite Plan with Sample Data?
            </h3>

            <p className="text-xs text-center text-stone-600 mb-5 leading-relaxed">
              This will replace all activities, schedules, and custom settings in{' '}
              <strong className="text-stone-900">"{tripName}"</strong> with the default expedition template. Custom edits in this plan will be lost.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetToSampleData();
                  setShowResetConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-xs"
              >
                Yes, Overwrite with Sample Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
