import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  User, 
  Trash2, 
  Check, 
  Tent,
  Sparkles,
  X
} from 'lucide-react';
import { ProjectMilestone, TripProject } from '../types';

interface CalendarViewProps {
  project: TripProject;
  onUpdateMilestones: (milestones: ProjectMilestone[]) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  project,
  onUpdateMilestones,
}) => {
  // Calendar month state: initialize to October 2026 (the trip month!)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Add Milestone Form State
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-10-15');
  const [newCategory, setNewCategory] = useState<ProjectMilestone['category']>('logistics');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Milestone Stats
  const totalMilestones = project.milestones.length;
  const completedCount = project.milestones.filter((m) => m.completed).length;
  const completedPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Month Name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in month logic
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  const toggleMilestone = (id: string) => {
    onUpdateMilestones(
      project.milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const handleDeleteMilestone = (id: string) => {
    onUpdateMilestones(project.milestones.filter((m) => m.id !== id));
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    const milestone: ProjectMilestone = {
      id: `m-${Date.now()}`,
      title: newTitle.trim(),
      dueDate: newDueDate,
      category: newCategory,
      completed: false,
      assignedTo: newAssignee.trim() || undefined,
      description: newDesc.trim() || undefined,
    };

    onUpdateMilestones([...project.milestones, milestone]);
    setNewTitle('');
    setNewDesc('');
    setIsAddingMilestone(false);
  };

  // Trip Dates check
  const isTripDay = (dateStr: string) => {
    return project.days.some((d) => d.dateStr === dateStr);
  };

  return (
    <div className="space-y-6">
      {/* Header & Milestone Progress Bar */}
      <div className="bg-amber-100/60 rounded-3xl border-2 border-amber-300/80 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-700 text-amber-50 flex items-center justify-center font-bold shadow-xs">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-stone-900 tracking-tight">
                Project Milestones & Planning Calendar
              </h2>
              <p className="text-xs text-stone-600 font-medium">
                Track parent deadlines, bus confirmations, district approvals, and the October 2026 departure
              </p>
            </div>
          </div>

          <button
            id="add-milestone-btn"
            type="button"
            onClick={() => setIsAddingMilestone(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
        </div>

        {/* Milestone Progress bar */}
        <div className="mt-4 pt-3 border-t border-amber-200/80">
          <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1.5">
            <span>Pre-Trip Planning Milestones:</span>
            <span className="text-amber-900 font-black">
              {completedCount} of {totalMilestones} Completed ({completedPct}%)
            </span>
          </div>
          <div className="w-full h-3 bg-amber-200/80 rounded-full overflow-hidden p-0.5 border border-amber-300">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500 shadow-inner"
              style={{ width: `${completedPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar Month on Left, Milestones List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= LEFT: MONTHLY CALENDAR GRID (7 Cols) ================= */}
        <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-amber-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Calendar Header with Prev / Next */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-display text-stone-900">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                {currentMonth === 9 && currentYear === 2026 && (
                  <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                    🏕️ Trip Month
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-xl border border-stone-200 hover:bg-amber-100 text-stone-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMonth(9);
                    setCurrentYear(2026);
                  }}
                  className="px-2 py-1 text-xs font-bold rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-900"
                >
                  Oct '26
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-xl border border-stone-200 hover:bg-amber-100 text-stone-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-black text-stone-400 uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Blank leading slots */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-16 rounded-xl bg-amber-50/20" />
              ))}

              {/* Days of Month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayMilestones = project.milestones.filter((m) => m.dueDate === formattedDate);
                const isTrip = isTripDay(formattedDate);
                const isSelected = selectedDay === formattedDate;

                return (
                  <button
                    key={formattedDate}
                    type="button"
                    onClick={() => setSelectedDay(isSelected ? null : formattedDate)}
                    className={`h-16 p-1 rounded-xl text-left border flex flex-col justify-between transition-all ${
                      isTrip
                        ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-500/30'
                        : isSelected
                        ? 'bg-amber-200/60 border-amber-600 ring-2 ring-amber-500/40'
                        : dayMilestones.length > 0
                        ? 'bg-orange-50/60 border-orange-200 hover:border-amber-400'
                        : 'bg-white border-stone-100 hover:bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${
                        isTrip ? 'text-amber-950 font-display' : 'text-stone-700'
                      }`}>
                        {dayNum}
                      </span>
                      {isTrip && (
                        <span className="text-[10px]" title="Camping Trip Day">🏕️</span>
                      )}
                    </div>

                    {/* Milestone Dots */}
                    <div className="space-y-0.5 overflow-hidden">
                      {dayMilestones.map((m) => (
                        <div
                          key={m.id}
                          className={`text-[9px] font-bold truncate px-1 py-0.2 rounded ${
                            m.completed
                              ? 'bg-emerald-100 text-emerald-900 line-through opacity-70'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {m.title}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-semibold">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                Pending Milestone
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Camping Expedition Day
              </span>
            </div>
            {selectedDay && (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-amber-800 font-bold hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* ================= RIGHT: MILESTONES CHECKLIST (5 Cols) ================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-amber-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-100">
              <h3 className="text-sm font-black font-display text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-700" />
                <span>
                  {selectedDay ? `Milestones for ${selectedDay}` : 'All Planning Milestones'}
                </span>
              </h3>
              <span className="text-xs font-bold text-stone-500">
                {project.milestones.length} Tasks
              </span>
            </div>

            {/* List of Milestones */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
              {project.milestones
                .filter((m) => !selectedDay || m.dueDate === selectedDay)
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map((m) => {
                  const categoryBadge = {
                    approval: 'bg-blue-100 text-blue-800 border-blue-200',
                    parents: 'bg-purple-100 text-purple-800 border-purple-200',
                    logistics: 'bg-amber-100 text-amber-800 border-amber-200',
                    safety: 'bg-red-100 text-red-800 border-red-200',
                    payment: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  }[m.category];

                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl border-2 transition-all ${
                        m.completed
                          ? 'bg-stone-50 border-stone-200 opacity-80'
                          : 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleMilestone(m.id)}
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            m.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-stone-300 hover:border-amber-600'
                          }`}
                        >
                          {m.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className={`text-xs font-extrabold text-stone-900 leading-snug font-display ${
                                m.completed ? 'line-through text-stone-500' : ''
                              }`}
                            >
                              {m.title}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleDeleteMilestone(m.id)}
                              className="text-stone-400 hover:text-red-700 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {m.description && (
                            <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2">
                              {m.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center justify-between text-[10px] flex-wrap gap-1">
                            <span className="font-bold text-amber-900">
                              📅 Due: {m.dueDate}
                            </span>
                            {m.assignedTo && (
                              <span className="font-semibold text-stone-600 flex items-center gap-0.5">
                                <User className="w-3 h-3 text-stone-400" />
                                {m.assignedTo}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-md font-bold uppercase border ${categoryBadge}`}>
                              {m.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {project.milestones.length === 0 && (
                <div className="p-6 text-center text-xs text-stone-500 font-medium">
                  No milestones defined yet. Click "Add Milestone" to schedule pre-trip deadlines!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Milestone Modal */}
      {isAddingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-amber-50 rounded-3xl border-3 border-amber-800/80 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="bg-amber-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-black font-display">Schedule New Project Milestone</h3>
              <button
                type="button"
                onClick={() => setIsAddingMilestone(false)}
                className="text-amber-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Milestone Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bus Charter Contract Signed, Medical Forms Due..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 font-bold text-stone-800 text-sm outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-stone-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-stone-800 outline-none"
                  >
                    <option value="approval">District / Admin Approval</option>
                    <option value="parents">Parent & Student Outreach</option>
                    <option value="logistics">Bus, Campsite & Logistics</option>
                    <option value="safety">Medical & Safety</option>
                    <option value="payment">Budget & Payments</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Staff Assignee
                </label>
                <input
                  type="text"
                  placeholder="e.g. David Vance, Coach Reed..."
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-medium text-stone-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Description / Action Checklist
                </label>
                <textarea
                  rows={2}
                  placeholder="Details on requirements, document links, or steps..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-medium text-stone-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setIsAddingMilestone(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-amber-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase bg-amber-700 text-white hover:bg-amber-800 shadow-xs"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
