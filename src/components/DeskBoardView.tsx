import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  Clock, 
  Sparkles, 
  Plus, 
  Flame, 
  Footprints, 
  TreePine, 
  RotateCcw, 
  LayoutGrid, 
  Shuffle, 
  Layers, 
  MapPin, 
  Check, 
  X, 
  Filter, 
  Maximize2,
  HelpCircle,
  Eye,
  Users
} from 'lucide-react';
import { ActivityCard, DayPlan, TeacherChaperone, TripProject } from '../types';
import { computeTimelineSlots, formatTime12h, analyzeDayFlow } from '../utils/tripHelpers';
import { ActivityCardItem } from './ActivityCardItem';

interface DeskBoardViewProps {
  project: TripProject;
  onMoveActivityInDay: (dayId: string, fromIndex: number, toIndex: number) => void;
  onMoveActivityAcrossDays: (sourceDayId: string, fromIndex: number, targetDayId: string, toIndex: number) => void;
  onAddActivityToDayAt: (activityId: string, targetDayId: string, targetIndex?: number) => void;
  onRemoveFromTimeline: (dayId: string, activityId: string) => void;
  onOpenCreateActivity: (targetDayId?: string) => void;
  onEditActivity: (act: ActivityCard) => void;
  onUpdateDayStartTime: (dayId: string, newTime: string) => void;
  onViewOnMap?: (activityId: string) => void;
  onSaveDeskPositions?: (positions: Record<string, { x: number; y: number; rotation: number }>) => void;
}

interface DraggingState {
  activityId: string;
  sourceDayId: string | null;
  sourceIndex: number | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  hoveredDayId: string | null;
  hoveredSlotIndex: number | null;
}

export const DeskBoardView: React.FC<DeskBoardViewProps> = ({
  project,
  onMoveActivityInDay,
  onMoveActivityAcrossDays,
  onAddActivityToDayAt,
  onRemoveFromTimeline,
  onOpenCreateActivity,
  onEditActivity,
  onUpdateDayStartTime,
  onViewOnMap,
}) => {
  const deskContainerRef = useRef<HTMLDivElement>(null);
  const dayLanesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [cohortFilter, setCohortFilter] = useState<'all' | 'group-1' | 'group-2'>('all');

  // Positions of cards placed freely on the desk table
  const [deskCardPositions, setDeskCardPositions] = useState<
    Record<string, { x: number; y: number; rotation: number; zIndex: number }>
  >(() => {
    const initial: Record<string, { x: number; y: number; rotation: number; zIndex: number }> = {};
    const placedSet = new Set(project.days.flatMap((d) => d.activityIds));
    const unplaced = project.activities.filter((a) => !placedSet.has(a.id));

    unplaced.forEach((act, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      // Natural slight rotation like desk.html
      const rotation = ((idx * 7) % 11) - 5;
      initial[act.id] = {
        x: 40 + col * 320,
        y: 40 + row * 260,
        rotation,
        zIndex: idx + 1,
      };
    });
    return initial;
  });

  const [highestZIndex, setHighestZIndex] = useState(50);
  const [activeDrag, setActiveDrag] = useState<DraggingState | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showGuide, setShowGuide] = useState(true);

  // Set of all placed IDs across all days
  const placedActivityIds = new Set(project.days.flatMap((d) => d.activityIds));

  // Determine cards sitting on the desk
  const deskActivities = project.activities.filter((act) => {
    if (placedActivityIds.has(act.id)) return false;
    if (selectedCategory !== 'all' && act.category !== selectedCategory) return false;
    return true;
  });

  // Check if a point (clientX, clientY) is over one of the Day swimlanes
  const detectDayLaneAndSlot = (clientX: number, clientY: number) => {
    for (const day of project.days) {
      const el = dayLanesRef.current.get(day.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          // Find closest slot index based on horizontal position
          const slots = computeTimelineSlots(day, project.activities);
          // Standard card slot width approx 320px
          const relativeX = clientX - (rect.left + 150); // offset past trailhead
          const estimatedIndex = Math.max(0, Math.min(slots.length, Math.round(relativeX / 320)));
          return { dayId: day.id, slotIndex: estimatedIndex };
        }
      }
    }
    return { dayId: null, slotIndex: null };
  };

  // Start direct pointer dragging (Desk card or Day card)
  const handlePointerDown = (
    e: React.PointerEvent,
    activityId: string,
    sourceDayId: string | null,
    sourceIndex: number | null
  ) => {
    // Only primary button
    if (e.button !== 0) return;

    // Don't drag if clicking buttons or inputs inside card
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('button') || targetEl.closest('input') || targetEl.closest('select') || targetEl.closest('a')) {
      return;
    }

    const deskRect = deskContainerRef.current?.getBoundingClientRect();
    if (!deskRect) return;

    const currentCardPos = deskCardPositions[activityId] || {
      x: e.clientX - deskRect.left - 150,
      y: e.clientY - deskRect.top - 100,
      rotation: 0,
      zIndex: highestZIndex + 1,
    };

    const newZ = highestZIndex + 1;
    setHighestZIndex(newZ);

    const clientX = e.clientX;
    const clientY = e.clientY;

    const cardEl = e.currentTarget as HTMLElement;
    const cardRect = cardEl.getBoundingClientRect();
    const offsetX = clientX - cardRect.left;
    const offsetY = clientY - cardRect.top;

    // Slight dynamic tilt on grab (like desk.html: rotate -3deg or +3deg)
    const randomTilt = ((activityId.charCodeAt(activityId.length - 1) % 7) - 3) * 1.5;

    setActiveDrag({
      activityId,
      sourceDayId,
      sourceIndex,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      offsetX,
      offsetY,
      rotation: randomTilt,
      hoveredDayId: sourceDayId,
      hoveredSlotIndex: sourceIndex,
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    const { dayId, slotIndex } = detectDayLaneAndSlot(clientX, clientY);

    setActiveDrag((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentX: clientX,
        currentY: clientY,
        hoveredDayId: dayId,
        hoveredSlotIndex: slotIndex,
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!activeDrag) return;

    const { activityId, sourceDayId, sourceIndex, hoveredDayId, hoveredSlotIndex } = activeDrag;
    const deskRect = deskContainerRef.current?.getBoundingClientRect();

    // CASE 1: Dropped onto a Day's Horizontal Track
    if (hoveredDayId) {
      const targetIndex = hoveredSlotIndex ?? 999;

      if (sourceDayId === hoveredDayId && sourceIndex !== null) {
        // Reorder within same day
        let finalIdx = targetIndex;
        if (sourceIndex < targetIndex) finalIdx = targetIndex - 1;
        if (sourceIndex !== finalIdx) {
          onMoveActivityInDay(hoveredDayId, sourceIndex, finalIdx);
        }
      } else if (sourceDayId && sourceIndex !== null) {
        // Move from another day
        onMoveActivityAcrossDays(sourceDayId, sourceIndex, hoveredDayId, targetIndex);
      } else {
        // Drop from desk onto day
        onAddActivityToDayAt(activityId, hoveredDayId, targetIndex);
      }
    } 
    // CASE 2: Dropped outside day tracks onto the Desk Canvas
    else {
      if (sourceDayId) {
        // Was on a day trail -> Remove from day back to the desk table
        onRemoveFromTimeline(sourceDayId, activityId);
      }

      // Record its new position on the desk
      if (deskRect) {
        const dropX = Math.max(20, Math.min(deskRect.width - 320, activeDrag.currentX - deskRect.left - activeDrag.offsetX));
        const dropY = Math.max(20, activeDrag.currentY - deskRect.top - activeDrag.offsetY);
        const naturalRotation = ((activityId.charCodeAt(0) % 9) - 4) * 1.5;

        setDeskCardPositions((prev) => ({
          ...prev,
          [activityId]: {
            x: dropX,
            y: dropY,
            rotation: naturalRotation,
            zIndex: highestZIndex + 1,
          },
        }));
      }
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setActiveDrag(null);
  };

  // Tidy all cards on the desk into a clean grid
  const handleTidyDesk = () => {
    setDeskCardPositions((prev) => {
      const updated = { ...prev };
      deskActivities.forEach((act, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        updated[act.id] = {
          x: 40 + col * 330,
          y: 40 + row * 270,
          rotation: 0,
          zIndex: idx + 1,
        };
      });
      return updated;
    });
  };

  // Scatter cards casually on desk (like desk.html)
  const handleScatterDesk = () => {
    const deskWidth = deskContainerRef.current?.clientWidth || 1000;
    setDeskCardPositions((prev) => {
      const updated = { ...prev };
      deskActivities.forEach((act, idx) => {
        const randomX = 30 + Math.random() * Math.max(200, deskWidth - 400);
        const randomY = 30 + Math.random() * 400;
        const randomRot = (Math.random() * 16) - 8;
        updated[act.id] = {
          x: randomX,
          y: randomY,
          rotation: randomRot,
          zIndex: idx + 1,
        };
      });
      return updated;
    });
  };

  const activeDraggedActivity = activeDrag 
    ? project.activities.find((a) => a.id === activeDrag.activityId) 
    : null;

  return (
    <div className="space-y-6">
      {/* Desk Board Controls & Mode Bar */}
      <div className="bg-amber-100/80 rounded-3xl border-2 border-amber-300 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-800 text-amber-50">
                Direct Tabletop Canvas
              </span>
              <span className="text-xs text-amber-900 font-bold">
                Move & drop cards freely with mouse or touch
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-display mt-1">
              Camp Director's Planning Desk
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-medium">
              Pick up any card and drag it smoothly across the board. Drop into Day 1, 2, or 3 to lock it in, or scatter it on the table to review your quest deck!
            </p>
          </div>

          {/* Desk Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Cohort Filter Control */}
            <div className="flex items-center bg-white/90 p-0.5 rounded-xl border border-amber-300 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setCohortFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  cohortFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setCohortFilter('group-1')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  cohortFilter === 'group-1'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Group 1</span>
              </button>
              <button
                type="button"
                onClick={() => setCohortFilter('group-2')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  cohortFilter === 'group-2'
                    ? 'bg-amber-700 text-white shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Group 2</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleTidyDesk}
              title="Arrange cards into neat rows"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/90 hover:bg-white text-stone-800 border border-amber-300 text-xs font-bold shadow-2xs transition-all"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-700" />
              <span>Tidy Desk</span>
            </button>

            <button
              type="button"
              onClick={handleScatterDesk}
              title="Scatter cards casually on table"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/90 hover:bg-white text-stone-800 border border-amber-300 text-xs font-bold shadow-2xs transition-all"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-700" />
              <span>Scatter Deck</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateActivity()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Activity</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs transition-colors"
              title="Help guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Instructions Banner */}
        {showGuide && (
          <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>How to arrange:</strong> Click and drag any activity card. Drag over <strong>Day 1, 2, or 3</strong> horizontal tracks above to dock it into the itinerary. Drag a card away from a day onto the open table to unassign it.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1: STACKED HORIZONTAL DAY TIMELINES (The Landing Tracks) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-base font-black text-stone-900 font-display flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-700" />
            <span>Expedition Itinerary Lanes (Day 1, 2, 3)</span>
          </h3>
          <span className="text-xs text-stone-500 font-semibold">
            Drop cards into any lane to schedule
          </span>
        </div>

        {project.days.map((day) => {
          const slots = computeTimelineSlots(day, project.activities);
          const flow = analyzeDayFlow(day, project.activities);
          const isThisDayHovered = activeDrag?.hoveredDayId === day.id;

          return (
            <div
              key={day.id}
              ref={(el) => {
                if (el) dayLanesRef.current.set(day.id, el);
                else dayLanesRef.current.delete(day.id);
              }}
              className={`rounded-3xl border-3 transition-all duration-200 overflow-hidden shadow-sm ${
                isThisDayHovered
                  ? 'border-amber-600 bg-amber-200/60 ring-4 ring-amber-400/40 shadow-lg scale-[1.005]'
                  : 'border-amber-300/80 bg-amber-50/80'
              }`}
            >
              {/* Day Header */}
              <div className="bg-amber-200/60 border-b border-amber-300/80 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-800 text-amber-50 flex items-center justify-center font-display font-black text-xs shadow-xs">
                    D{day.dayNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-stone-900 text-sm font-display">
                        {day.title}
                      </h4>
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-300/80 px-2 py-0.2 rounded-full">
                        {day.dateStr}
                      </span>
                    </div>
                    <span className="text-xs text-stone-500 font-medium">
                      {day.subtitle}
                    </span>
                  </div>
                </div>

                {/* Day stats & Start Time */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-xl border border-amber-300 text-stone-700 font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Start:</span>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => onUpdateDayStartTime(day.id, e.target.value)}
                      className="bg-amber-50 px-1 py-0.5 rounded border border-amber-200 text-xs font-bold"
                    />
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-amber-300 font-bold text-stone-800">
                    {flow.totalHours} hrs • {slots.length} quests
                  </span>

                  <button
                    type="button"
                    onClick={() => onOpenCreateActivity(day.id)}
                    className="px-2.5 py-1 rounded-xl bg-amber-700 text-white font-bold hover:bg-amber-800 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Trail */}
              <div className="boardgame-grid p-4 overflow-x-auto custom-scrollbar">
                <div className="flex items-center min-w-max gap-3 py-1">
                  {/* Trailhead departure flag */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-200/80 border-2 border-amber-400 text-center w-24 shrink-0">
                    <Footprints className="w-4 h-4 text-amber-800 mb-1" />
                    <span className="text-[9px] font-black uppercase text-amber-900">Start</span>
                    <span className="text-xs font-black text-stone-900">
                      {formatTime12h(day.startTime)}
                    </span>
                  </div>

                  {/* Scheduled cards on this day */}
                  {slots.length > 0 ? (
                    slots.map((slot, index) => {
                      const isThisCardBeingDragged = activeDrag?.activityId === slot.activity.id;
                      const isAssignedToFilteredGroup =
                        cohortFilter === 'all' ||
                        slot.activity.assignedGroup === 'all' ||
                        !slot.activity.assignedGroup ||
                        slot.activity.assignedGroup === cohortFilter;

                      return (
                        <div
                          key={slot.activity.id}
                          onPointerDown={(e) =>
                            handlePointerDown(e, slot.activity.id, day.id, index)
                          }
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          className={`transition-all duration-100 ${
                            isThisCardBeingDragged ? 'opacity-30 pointer-events-none' : 'opacity-100'
                          } ${!isAssignedToFilteredGroup ? 'opacity-30 hover:opacity-90 grayscale-50' : ''}`}
                        >
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
                            canMoveLeft={index > 0}
                            canMoveRight={index < slots.length - 1}
                            onMoveLeft={() => onMoveActivityInDay(day.id, index, index - 1)}
                            onMoveRight={() => onMoveActivityInDay(day.id, index, index + 1)}
                            onMoveToDay={(targetDayId) =>
                              onMoveActivityAcrossDays(day.id, index, targetDayId, 999)
                            }
                            onRemoveFromTimeline={() => onRemoveFromTimeline(day.id, slot.activity.id)}
                            onEdit={() => onEditActivity(slot.activity)}
                            onViewOnMap={onViewOnMap}
                            availableDays={project.days.map((d) => ({
                              id: d.id,
                              dayNumber: d.dayNumber,
                              title: d.title,
                            }))}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center p-6 bg-white/70 rounded-2xl border-2 border-dashed border-amber-300 w-72 text-center text-xs text-stone-500">
                      Drop an activity card here to start Day {day.dayNumber}'s trail!
                    </div>
                  )}

                  {/* Drop landing target at end of day */}
                  <div className="flex flex-col items-center justify-center w-36 h-48 rounded-2xl border-2 border-dashed border-amber-400 bg-white/40 text-amber-900 text-center p-3 shrink-0">
                    <Plus className="w-5 h-5 mb-1 opacity-70" />
                    <span className="text-xs font-bold">Drop Here</span>
                    <span className="text-[10px] text-stone-400">to add to Day {day.dayNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 2: THE OPEN TABLETOP DESK CANVAS (Unassigned Activity Bank Cards) */}
      <div className="bg-amber-900/10 rounded-3xl border-3 border-amber-300/80 p-5 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-300/60 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-800 text-amber-100 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900 font-display flex items-center gap-2">
                <span>Freeform Activity Planning Table</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                  {deskActivities.length} Cards on Desk
                </span>
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                Click and drag any card to reposition it or drag it upward into Day 1, 2, or 3
              </p>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {['all', 'campcraft', 'hike', 'water', 'teamwork', 'meal', 'campfire', 'rest'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-800 text-white border-amber-900'
                    : 'bg-white/80 text-stone-700 border-amber-200 hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Freeform Desk Area */}
        <div
          ref={deskContainerRef}
          className="relative min-h-[580px] bg-amber-50/60 rounded-2xl border-2 border-dashed border-amber-300/80 overflow-hidden p-4"
          style={{
            backgroundImage: `radial-gradient(#d97706 0.75px, transparent 0.75px)`,
            backgroundSize: '24px 24px',
          }}
        >
          {deskActivities.length > 0 ? (
            deskActivities.map((act) => {
              const pos = deskCardPositions[act.id] || { x: 30, y: 30, rotation: 0, zIndex: 1 };
              const isBeingDragged = activeDrag?.activityId === act.id;
              const isAssignedToFilteredGroup =
                cohortFilter === 'all' ||
                act.assignedGroup === 'all' ||
                !act.assignedGroup ||
                act.assignedGroup === cohortFilter;

              return (
                <div
                  key={act.id}
                  onPointerDown={(e) => handlePointerDown(e, act.id, null, null)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    transform: `rotate(${pos.rotation}deg)`,
                    zIndex: pos.zIndex,
                  }}
                  className={`w-72 sm:w-80 transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                    isBeingDragged ? 'opacity-20 pointer-events-none' : 'hover:scale-[1.02] hover:shadow-xl'
                  } ${!isAssignedToFilteredGroup ? 'opacity-30 hover:opacity-90 grayscale-50' : ''}`}
                >
                  <ActivityCardItem
                    activity={act}
                    isOnTimeline={false}
                    teachers={project.teachers}
                    onEdit={() => onEditActivity(act)}
                    onAddToTimeline={(dayId) => onAddActivityToDayAt(act.id, dayId)}
                    onViewOnMap={onViewOnMap}
                    availableDays={project.days.map((d) => ({
                      id: d.id,
                      dayNumber: d.dayNumber,
                      title: d.title,
                    }))}
                  />
                </div>
              );
            })
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-center p-6">
              <Sparkles className="w-10 h-10 text-stone-400 mb-2 opacity-60" />
              <h4 className="font-bold text-stone-800 text-sm">
                All Activities Are Scheduled on the Timeline
              </h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm">
                Every activity card has been placed into the timeline. Drag any card from a day back onto this table to unassign it, or create a new activity.
              </p>
              <button
                type="button"
                onClick={() => onOpenCreateActivity()}
                className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
              >
                + Create New Activity
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Active Dragged Card */}
      {activeDrag && activeDraggedActivity && (
        <div
          style={{
            position: 'fixed',
            left: `${activeDrag.currentX - activeDrag.offsetX}px`,
            top: `${activeDrag.currentY - activeDrag.offsetY}px`,
            transform: `rotate(${activeDrag.rotation}deg) scale(1.03)`,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className="w-64 sm:w-72 shadow-2xl ring-2 ring-emerald-500/40 rounded-xl animate-pulse"
        >
          <div className="bg-stone-800 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-t-lg flex items-center justify-between">
            <span>Moving Activity</span>
            {activeDrag.hoveredDayId ? (
              <span className="text-emerald-300">
                Ready to drop on Day {project.days.find((d) => d.id === activeDrag.hoveredDayId)?.dayNumber}
              </span>
            ) : (
              <span>Release to place on desk</span>
            )}
          </div>
          <ActivityCardItem
            activity={activeDraggedActivity}
            isOnTimeline={false}
            teachers={project.teachers}
            onEdit={() => {}}
          />
        </div>
      )}
    </div>
  );
};
