import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Sun,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Layers,
  Calendar,
  Sparkles,
  Users
} from 'lucide-react';
import { ActivityCard, DayPlan, TripProject } from '../types';
import { computeTimelineSlots, analyzeDayFlow, formatTime12h } from '../utils/tripHelpers';
import { ActivityCardItem } from './ActivityCardItem';

interface TimelineBoardProps {
  project: TripProject;
  activeDayId: string;
  onSelectDay: (dayId: string) => void;
  onMoveActivityInDay: (dayId: string, fromIndex: number, toIndex: number) => void;
  onMoveActivityAcrossDays: (sourceDayId: string, fromIndex: number, targetDayId: string, toIndex: number) => void;
  onAddActivityToDayAt: (activityId: string, targetDayId: string, targetIndex?: number) => void;
  onRemoveFromTimeline: (dayId: string, activityId: string) => void;
  onOpenCreateActivity: (targetDayId?: string) => void;
  onEditActivity: (act: ActivityCard) => void;
  onUpdateDayStartTime: (dayId: string, newTime: string) => void;
  onViewOnMap?: (activityId: string) => void;
  onSwitchToDeskMode?: () => void;
}

export const TimelineBoard: React.FC<TimelineBoardProps> = ({
  project,
  activeDayId,
  onSelectDay,
  onMoveActivityInDay,
  onMoveActivityAcrossDays,
  onAddActivityToDayAt,
  onRemoveFromTimeline,
  onOpenCreateActivity,
  onEditActivity,
  onUpdateDayStartTime,
  onViewOnMap,
  onSwitchToDeskMode,
}) => {
  // Drag-over visual feedback tracking
  const [dragOverTarget, setDragOverTarget] = useState<{ dayId: string; index: number } | null>(null);
  const [dragOverDayLane, setDragOverDayLane] = useState<string | null>(null);
  const [cohortFilter, setCohortFilter] = useState<'all' | 'group-1' | 'group-2'>('all');

  // Handle generic drop on a specific slot index in a day
  const handleDropOnSlot = (e: React.DragEvent, targetDayId: string, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    setDragOverDayLane(null);

    let dragData: { activityId: string; sourceDayId: string | null; sourceIndex: number | null } | null = null;
    try {
      const json = e.dataTransfer.getData('application/json');
      if (json) {
        dragData = JSON.parse(json);
      }
    } catch (err) {
      console.warn('Could not parse drag data', err);
    }

    const activityId = dragData?.activityId || e.dataTransfer.getData('text/plain');
    if (!activityId) return;

    const sourceDayId = dragData?.sourceDayId;
    const sourceIndex = dragData?.sourceIndex;

    // Case 1: Dragging within the same day
    if (sourceDayId === targetDayId && typeof sourceIndex === 'number') {
      let finalTarget = targetIndex;
      if (sourceIndex < targetIndex) {
        finalTarget = targetIndex - 1;
      }
      if (sourceIndex !== finalTarget) {
        onMoveActivityInDay(targetDayId, sourceIndex, finalTarget);
      }
      return;
    }

    // Case 2: Dragging from another day
    if (sourceDayId && typeof sourceIndex === 'number') {
      onMoveActivityAcrossDays(sourceDayId, sourceIndex, targetDayId, targetIndex);
      return;
    }

    // Case 3: Dragging an unassigned activity from the Activity Bank
    onAddActivityToDayAt(activityId, targetDayId, targetIndex);
  };

  const handleDropOnLaneEnd = (e: React.DragEvent, targetDayId: string, dayLength: number) => {
    handleDropOnSlot(e, targetDayId, dayLength);
  };

  const availableDaysForSelector = project.days.map((d) => ({
    id: d.id,
    dayNumber: d.dayNumber,
    title: d.title,
  }));

  const totalSlotsPlaced = project.days.reduce((acc, d) => acc + d.activityIds.length, 0);

  return (
    <div className="space-y-4">
      {/* Modern Compact Toolbar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">
                Horizontal Timeline
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                Gantt Chart Mode
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Activity card widths scale proportionally with duration. Drag and drop cards along each horizontal lane to optimize the schedule.
            </p>
          </div>
        </div>

        {/* Action Controls & Day Quicklinks */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-700">
            <span>{totalSlotsPlaced} scheduled</span>
          </div>

          {project.days.map((day) => (
            <a
              key={day.id}
              href={`#day-lane-${day.id}`}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200 transition-colors"
            >
              Day {day.dayNumber}
            </a>
          ))}

          {onSwitchToDeskMode && (
            <button
              type="button"
              onClick={onSwitchToDeskMode}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200 transition-colors"
              title="Switch to tabletop card board"
            >
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <span>Desk Board</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenCreateActivity()}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {/* Cohort Wave Quick Filter Bar */}
      <div className="flex items-center justify-between gap-3 p-2.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-600 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-stone-500" />
            <span>Filter by Student Wave:</span>
          </span>
          <div className="flex items-center bg-white p-0.5 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setCohortFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                cohortFilter === 'all'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Activities
            </button>
            <button
              type="button"
              onClick={() => setCohortFilter('group-1')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                cohortFilter === 'group-1'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Group 1 (Alpha)</span>
            </button>
            <button
              type="button"
              onClick={() => setCohortFilter('group-2')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                cohortFilter === 'group-2'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Group 2 (Bravo)</span>
            </button>
          </div>
        </div>

        {cohortFilter !== 'all' && (
          <span className="text-[11px] text-stone-500 font-semibold">
            Highlighting activities for {cohortFilter === 'group-1' ? 'Group 1 (and Joint)' : 'Group 2 (and Joint)'}
          </span>
        )}
      </div>

      {/* Stacked Horizontal Days: Each Day is a clean horizontal swimlane */}
      <div className="space-y-4">
        {project.days.map((day) => {
          const slots = computeTimelineSlots(day, project.activities);
          const flowAnalysis = analyzeDayFlow(day, project.activities);
          const isLaneHovered = dragOverDayLane === day.id;

          return (
            <div
              key={day.id}
              id={`day-lane-${day.id}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDayLane(day.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverDayLane(null);
                }
              }}
              onDrop={(e) => {
                handleDropOnLaneEnd(e, day.id, slots.length);
              }}
              className={`rounded-xl border bg-white transition-colors duration-150 shadow-2xs overflow-hidden ${
                isLaneHovered 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                  : 'border-stone-200'
              }`}
            >
              {/* Day Header Row */}
              <div className="px-4 py-2.5 bg-stone-50/80 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-stone-800 text-white font-bold text-xs">
                    Day {day.dayNumber}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-stone-900 mr-2">
                      {day.title}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      {day.dateStr}
                    </span>
                  </div>
                </div>

                {/* Day Controls */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {/* Start time */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-stone-200 text-stone-700">
                    <Sun className="w-3 h-3 text-amber-600" />
                    <span className="font-semibold text-stone-500 text-[11px]">Start:</span>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => onUpdateDayStartTime(day.id, e.target.value)}
                      className="px-1 py-0 rounded bg-stone-50 border border-stone-200 font-semibold text-stone-800 text-xs outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Flow Pills */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-stone-200 text-stone-600 font-medium">
                    <Clock className="w-3 h-3 text-stone-500" />
                    <span>{flowAnalysis.totalHours} hrs</span>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-stone-200 text-stone-600 font-medium">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{slots.length - flowAnalysis.unassignedCount}/{slots.length} Supervised</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenCreateActivity(day.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-stone-600" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Trail Lane */}
              <div className="p-3 overflow-x-auto custom-scrollbar">
                <div className="flex items-center min-w-max gap-2 py-1">
                  {/* Trailhead Starting Post */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-stone-100 border border-stone-200 text-center w-20 shrink-0">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Start
                    </span>
                    <span className="text-xs font-bold text-stone-800">
                      {formatTime12h(day.startTime)}
                    </span>
                  </div>

                  {/* Initial Drop Slot Before First Card */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverTarget({ dayId: day.id, index: 0 });
                    }}
                    onDragLeave={() => setDragOverTarget(null)}
                    onDrop={(e) => handleDropOnSlot(e, day.id, 0)}
                    className={`transition-all duration-150 flex items-center justify-center rounded-lg shrink-0 ${
                      dragOverTarget?.dayId === day.id && dragOverTarget?.index === 0
                        ? 'w-40 h-40 border-2 border-dashed border-emerald-500 bg-emerald-50 text-emerald-800 font-bold text-xs'
                        : 'w-2 h-40'
                    }`}
                  >
                    {dragOverTarget?.dayId === day.id && dragOverTarget?.index === 0 && (
                      <span className="flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Drop Here
                      </span>
                    )}
                  </div>

                  {/* The Horizontal Sequence of Activity Cards */}
                  {slots.length > 0 ? (
                    slots.map((slot, index) => {
                      const canMoveLeft = index > 0;
                      const canMoveRight = index < slots.length - 1;
                      const isNextSlotHovered =
                        dragOverTarget?.dayId === day.id && dragOverTarget?.index === index + 1;
                      const isAssignedToFilteredGroup =
                        cohortFilter === 'all' ||
                        slot.activity.assignedGroup === 'all' ||
                        !slot.activity.assignedGroup ||
                        slot.activity.assignedGroup === cohortFilter;

                      return (
                        <React.Fragment key={slot.activity.id}>
                          {/* The Activity Card */}
                          <div className={`transition-all ${!isAssignedToFilteredGroup ? 'opacity-30 hover:opacity-90 grayscale-50' : ''}`}>
                            <ActivityCardItem
                              activity={slot.activity}
                              stepNumber={slot.stepNumber}
                              startTime={slot.startTime}
                              endTime={slot.endTime}
                              isAfterSunset={slot.isAfterSunset}
                              isOnTimeline={true}
                              sourceDayId={day.id}
                              sourceIndex={index}
                              teachers={project.teachers}
                              canMoveLeft={canMoveLeft}
                              canMoveRight={canMoveRight}
                              onMoveLeft={() => onMoveActivityInDay(day.id, index, index - 1)}
                              onMoveRight={() => onMoveActivityInDay(day.id, index, index + 1)}
                              onMoveToDay={(targetDayId) =>
                                onMoveActivityAcrossDays(day.id, index, targetDayId, 999)
                              }
                              onRemoveFromTimeline={() => onRemoveFromTimeline(day.id, slot.activity.id)}
                              onEdit={() => onEditActivity(slot.activity)}
                              onViewOnMap={onViewOnMap}
                              availableDays={availableDaysForSelector}
                            />
                          </div>

                          {/* Subtle Drop Slot Between Cards */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverTarget({ dayId: day.id, index: index + 1 });
                            }}
                            onDragLeave={() => setDragOverTarget(null)}
                            onDrop={(e) => handleDropOnSlot(e, day.id, index + 1)}
                            className={`transition-all duration-150 flex items-center justify-center shrink-0 ${
                              isNextSlotHovered
                                ? 'w-40 h-40 border-2 border-dashed border-emerald-500 bg-emerald-50 rounded-lg text-emerald-800 font-bold text-xs'
                                : 'flex-col items-center px-1'
                            }`}
                          >
                            {isNextSlotHovered ? (
                              <span className="flex items-center gap-1 font-bold">
                                <Plus className="w-3.5 h-3.5" /> Drop Here
                              </span>
                            ) : (
                              <div className="flex flex-col items-center gap-0.5 py-1 text-stone-400 hover:text-emerald-700 transition-colors cursor-pointer group select-none" title="Drag card here to insert (15m transition buffer)">
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 border border-stone-200 transition-colors whitespace-nowrap">
                                  +15m
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-emerald-600 transition-colors" />
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    /* Empty Day Lane Placeholder */
                    <div className="flex items-center justify-center p-6 bg-stone-50 rounded-lg border border-dashed border-stone-200 w-64 text-center">
                      <div>
                        <p className="font-semibold text-stone-600 text-xs">No activities yet</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">Drag an activity card here or create one.</p>
                        <button
                          type="button"
                          onClick={() => onOpenCreateActivity(day.id)}
                          className="mt-2 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-900 text-white text-[11px] font-semibold transition-colors"
                        >
                          + Add Activity
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Append / End of Day Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverTarget({ dayId: day.id, index: slots.length });
                    }}
                    onDragLeave={() => setDragOverTarget(null)}
                    onDrop={(e) => handleDropOnSlot(e, day.id, slots.length)}
                    onClick={() => onOpenCreateActivity(day.id)}
                    className="flex flex-col items-center justify-center w-28 h-36 rounded-lg border border-dashed border-stone-300 hover:border-emerald-600 bg-stone-50/60 hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer shrink-0 p-2 text-center group"
                  >
                    <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors mb-1">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[11px]">
                      + Add Activity
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
