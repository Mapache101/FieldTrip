import React, { useState } from 'react';
import { 
  Clock, 
  Flame, 
  Wrench, 
  ShoppingBag, 
  User, 
  CloudRain, 
  ArrowLeft, 
  ArrowRight, 
  Edit3, 
  XCircle, 
  Backpack, 
  ChevronDown, 
  ChevronUp,
  Plus,
  MapPin,
  GripVertical,
  ExternalLink,
  Navigation,
  MoveHorizontal
} from 'lucide-react';
import { ActivityCard, TeacherChaperone } from '../types';
import { formatTime12h } from '../utils/tripHelpers';

interface ActivityCardItemProps {
  activity: ActivityCard;
  stepNumber?: number;
  startTime?: string;
  endTime?: string;
  isAfterSunset?: boolean;
  isOnTimeline?: boolean;
  sourceDayId?: string;
  sourceIndex?: number;
  teachers: TeacherChaperone[];
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onMoveToDay?: (targetDayId: string) => void;
  onRemoveFromTimeline?: () => void;
  onAddToTimeline?: (dayId: string) => void;
  onEdit: () => void;
  onViewOnMap?: (activityId: string) => void;
  availableDays?: { id: string; dayNumber: number; title: string }[];
  isDragging?: boolean;
}

export const ActivityCardItem: React.FC<ActivityCardItemProps> = ({
  activity,
  stepNumber,
  startTime,
  endTime,
  isAfterSunset,
  isOnTimeline,
  sourceDayId,
  sourceIndex,
  teachers,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onMoveToDay,
  onRemoveFromTimeline,
  onAddToTimeline,
  onEdit,
  onViewOnMap,
  availableDays,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [isDraggingSelf, setIsDraggingSelf] = useState(false);

  const leadTeacher = teachers.find((t) => t.id === activity.leadTeacherId);
  const assistantTeachers = teachers.filter((t) => activity.assistantTeacherIds?.includes(t.id));

  // Category Theme Colors & Icons
  const categoryConfig: Record<string, { bg: string; border: string; badge: string; icon: string; label: string }> = {
    campcraft: { bg: 'bg-amber-50/70', border: 'border-amber-200', badge: 'bg-amber-800 text-amber-50', icon: '🏕️', label: 'Campcraft' },
    hike: { bg: 'bg-emerald-50/70', border: 'border-emerald-200', badge: 'bg-emerald-800 text-emerald-50', icon: '🥾', label: 'Hike & Trail' },
    water: { bg: 'bg-cyan-50/70', border: 'border-cyan-200', badge: 'bg-cyan-800 text-cyan-50', icon: '🌊', label: 'Creek & Stream' },
    teamwork: { bg: 'bg-purple-50/70', border: 'border-purple-200', badge: 'bg-purple-800 text-purple-50', icon: '🤝', label: 'Team Activity' },
    meal: { bg: 'bg-orange-50/70', border: 'border-orange-200', badge: 'bg-orange-800 text-orange-50', icon: '🍲', label: 'Meal Prep' },
    campfire: { bg: 'bg-rose-50/70', border: 'border-rose-200', badge: 'bg-rose-800 text-rose-50', icon: '🔥', label: 'Campfire' },
    rest: { bg: 'bg-teal-50/70', border: 'border-teal-200', badge: 'bg-teal-800 text-teal-50', icon: '🌿', label: 'Rest & Nature' },
  };

  const currentTheme = categoryConfig[activity.category] || categoryConfig.campcraft;

  // Energy level pill
  const energyBadge = {
    low: { label: 'Low', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' },
    medium: { label: 'Moderate', color: 'text-amber-800 bg-amber-100 border-amber-300' },
    high: { label: 'High Energy', color: 'text-rose-800 bg-rose-100 border-rose-300' },
  }[activity.energyLevel];

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    setIsDraggingSelf(true);
    e.dataTransfer.effectAllowed = 'move';
    const dragData = {
      activityId: activity.id,
      sourceDayId: sourceDayId || null,
      sourceIndex: sourceIndex !== undefined ? sourceIndex : null,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', activity.id);
  };

  const handleDragEnd = () => {
    setIsDraggingSelf(false);
  };

  // Gantt Chart sizing: for the horizontal timeline view, width is proportional to duration
  const ganttWidth = Math.max(200, Math.min(850, Math.round(140 + (activity.durationMinutes || 60) * 3.2)));

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={isOnTimeline ? { width: `${ganttWidth}px`, minWidth: `${ganttWidth}px` } : undefined}
      className={`group relative rounded-xl border bg-white transition-all duration-150 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing select-none ${
        currentTheme.border
      } ${
        isOnTimeline ? 'shrink-0' : 'w-full'
      } ${isDraggingSelf ? 'opacity-40 scale-95 border-dashed border-emerald-600' : 'opacity-100'}`}
    >
      {/* Gantt Duration Strip (Exclusive to Horizontal Timeline View) */}
      {isOnTimeline && startTime && endTime && (
        <div className="px-3 py-1.5 bg-stone-100/90 border-b border-stone-200/90 rounded-t-xl flex items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-stone-700 truncate">
            <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">{formatTime12h(startTime)} – {formatTime12h(endTime)}</span>
          </div>
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-stone-300 text-stone-700 font-mono font-bold text-[10px] shrink-0 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>{activity.durationMinutes}m Gantt Span</span>
          </div>
        </div>
      )}

      {/* Step number badge if on timeline */}
      {isOnTimeline && stepNumber !== undefined && (
        <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-stone-800 text-stone-100 font-bold text-[11px] flex items-center justify-center border border-white shadow-xs z-10">
          {stepNumber}
        </div>
      )}

      {/* Drag handle token */}
      <div 
        className="absolute top-2.5 right-2 text-stone-400 hover:text-stone-700 cursor-grab active:cursor-grabbing p-1 rounded-md opacity-70 group-hover:opacity-100"
        title="Drag to reorder or move across days"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Card Header Bar */}
      <div className="p-3.5 pb-2">
        <div className="flex items-start justify-between gap-1 pr-6">
          {/* Category & Energy Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${currentTheme.badge}`}>
              <span>{currentTheme.icon}</span>
              <span>{currentTheme.label}</span>
            </span>

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${energyBadge.color}`}>
              <Flame className="w-2.5 h-2.5" />
              <span>{energyBadge.label}</span>
            </span>

            {activity.weatherDependent && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200" title="Weather sensitive">
                <CloudRain className="w-2.5 h-2.5 text-blue-600" />
                <span>Fair Weather</span>
              </span>
            )}

            {/* Assigned Cohort Group Badge */}
            {activity.assignedGroup === 'group-1' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300" title="Assigned to Group 1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Group 1 (Alpha)</span>
              </span>
            )}
            {activity.assignedGroup === 'group-2' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300" title="Assigned to Group 2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span>Group 2 (Bravo)</span>
              </span>
            )}
            {activity.assignedGroup === 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300" title="Shared by both student groups simultaneously">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                <span>Shared (Both Groups)</span>
              </span>
            )}
          </div>
        </div>

        {/* Activity Name & Description */}
        <div className="mt-2">
          <h3 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight leading-snug font-display line-clamp-2">
            {activity.name}
          </h3>
          {activity.description && !isExpanded && (
            <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed font-medium">
              {activity.description}
            </p>
          )}
        </div>

        {/* Geolocation Tag */}
        {(activity.locationName || activity.coordinates) && (
          <div className="mt-2 flex items-center justify-between gap-1 p-1.5 rounded-xl bg-amber-100/70 border border-amber-200/80 text-[11px]">
            <div className="flex items-center gap-1 text-amber-900 font-bold truncate">
              <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="truncate">{activity.locationName || 'Palermo Outdoor Area'}</span>
            </div>
            {activity.coordinates && onViewOnMap && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOnMap(activity.id);
                }}
                className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/90 hover:bg-white text-[10px] font-extrabold text-amber-800 border border-amber-300 shadow-2xs hover:scale-102 transition-transform"
                title="View on Map"
              >
                <span>Map</span>
                <Navigation className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}

        {/* Time Schedule (if on timeline) */}
        {isOnTimeline && startTime && endTime ? (
          <div className="mt-2 flex items-center justify-between p-1.5 rounded-xl bg-white/90 border border-amber-200/80 text-xs">
            <div className="flex items-center gap-1 font-bold text-stone-800 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>{formatTime12h(startTime)} – {formatTime12h(endTime)}</span>
            </div>
            <span className="font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded text-[10px]">
              {activity.durationMinutes} min
            </span>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-stone-600">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Duration: {activity.durationMinutes} minutes</span>
          </div>
        )}

        {isAfterSunset && (
          <div className="mt-1.5 text-[10px] font-bold text-indigo-900 bg-indigo-100/90 border border-indigo-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <span>🌙 After Dusk (~6:15 PM): Headlamps needed</span>
          </div>
        )}
      </div>

      {/* Teacher Supervision Strip */}
      <div className="px-3.5 py-1.5 bg-black/[0.02] border-t border-black/[0.05] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <User className="w-3.5 h-3.5 text-amber-800 shrink-0" />
          {leadTeacher ? (
            <span className="font-bold text-stone-800 text-[11px] truncate">
              Lead: <span className="text-amber-900">{leadTeacher.name}</span>
            </span>
          ) : (
            <span className="font-semibold text-rose-600 italic text-[11px]">
              ⚠️ Needs Chaperone
            </span>
          )}
        </div>

        {assistantTeachers.length > 0 && (
          <span className="text-[10px] text-stone-500 font-semibold shrink-0">
            +{assistantTeachers.length}
          </span>
        )}
      </div>

      {/* Action / Expand Bar */}
      <div className="px-3.5 py-1.5 text-xs flex items-center justify-between border-t border-black/[0.05] bg-white/40">
        <div className="flex items-center gap-2 text-stone-600 font-medium text-[11px]">
          <span className="flex items-center gap-0.5">
            <Wrench className="w-3 h-3 text-stone-500" />
            <strong className="text-stone-800">{activity.requiredEquipment.length}</strong>
          </span>
          <span className="flex items-center gap-0.5">
            <ShoppingBag className="w-3 h-3 text-stone-500" />
            <strong className="text-stone-800">{activity.requiredSupplies.length}</strong>
          </span>
        </div>

        {/* Quick controls: Left, Right, Edit, Remove, Expand */}
        <div className="flex items-center gap-1">
          {isOnTimeline && (
            <div className="flex items-center gap-0.5 bg-white/90 rounded-lg border border-amber-300/80 p-0.5">
              {canMoveLeft && (
                <button
                  type="button"
                  onClick={onMoveLeft}
                  title="Move earlier"
                  className="p-1 text-stone-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
              )}
              {canMoveRight && (
                <button
                  type="button"
                  onClick={onMoveRight}
                  title="Move later"
                  className="p-1 text-stone-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {onRemoveFromTimeline && (
                <button
                  type="button"
                  onClick={onRemoveFromTimeline}
                  title="Remove to Activity Bank"
                  className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onEdit}
            title="Edit Activity Details"
            className="p-1 text-stone-500 hover:text-stone-900 hover:bg-amber-200/60 rounded-lg transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-stone-600 hover:text-stone-900 p-1 flex items-center gap-0.5 text-[11px] font-bold rounded-lg hover:bg-amber-200/50"
          >
            <span>{isExpanded ? 'Less' : 'Details'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Full Info & Inline Editing Trigger */}
      {isExpanded && (
        <div className="px-3.5 py-3 bg-white/95 border-t border-amber-200/90 rounded-b-2xl space-y-2.5 text-xs">
          {/* Full Description */}
          {activity.description && (
            <div>
              <span className="font-bold text-stone-700 text-[10px] uppercase tracking-wider block">Description</span>
              <p className="text-stone-800 text-xs mt-0.5 leading-relaxed">{activity.description}</p>
            </div>
          )}

          {/* Coordinates & Map Link */}
          {activity.coordinates && (
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900 block">GPS Coordinates</span>
                <span className="font-mono text-stone-700">
                  {activity.coordinates.lat.toFixed(6)}, {activity.coordinates.lng.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {onViewOnMap && (
                  <button
                    type="button"
                    onClick={() => onViewOnMap(activity.id)}
                    className="px-2 py-1 rounded bg-amber-700 text-white font-bold text-[10px] flex items-center gap-1 hover:bg-amber-800"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>View Map</span>
                  </button>
                )}
                <a
                  href={`https://www.google.com/maps?q=${activity.coordinates.lat},${activity.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded bg-stone-100 text-stone-600 hover:text-stone-900"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Equipment list */}
          {activity.requiredEquipment.length > 0 && (
            <div>
              <span className="font-bold text-stone-800 block text-[10px] uppercase tracking-wider mb-1">
                Required Equipment:
              </span>
              <div className="flex flex-wrap gap-1">
                {activity.requiredEquipment.map((eq) => (
                  <span key={eq} className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 text-[10px] font-medium border border-amber-200">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Supplies list */}
          {activity.requiredSupplies.length > 0 && (
            <div>
              <span className="font-bold text-stone-800 block text-[10px] uppercase tracking-wider mb-1">
                Required Supplies:
              </span>
              <div className="flex flex-wrap gap-1">
                {activity.requiredSupplies.map((sup) => (
                  <span key={sup} className="px-2 py-0.5 rounded bg-orange-100 text-orange-950 text-[10px] font-medium border border-orange-200">
                    {sup}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Student items required */}
          {activity.studentItemNeeded && (
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px]">
              <span className="font-bold flex items-center gap-1">
                <Backpack className="w-3.5 h-3.5 text-emerald-700" />
                Student Required Gear:
              </span>
              <span className="font-medium ml-4 block">{activity.studentItemNeeded}</span>
            </div>
          )}

          {/* Teacher Assistants & Notes */}
          {assistantTeachers.length > 0 && (
            <div className="text-[11px] text-stone-700">
              <span className="font-bold">Assistant Chaperones:</span>{' '}
              {assistantTeachers.map((t) => t.name).join(', ')}
            </div>
          )}

          {activity.notes && (
            <div className="text-[11px] text-stone-500 italic bg-stone-50 p-2 rounded-lg border border-stone-200">
              <strong>Notes:</strong> {activity.notes}
            </div>
          )}

          {/* Move to another Day selector if on timeline */}
          {isOnTimeline && onMoveToDay && availableDays && availableDays.length > 1 && (
            <div className="pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Transfer Day:</span>
                <div className="flex gap-1">
                  {availableDays
                    .filter((d) => d.id !== sourceDayId)
                    .map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => onMoveToDay(d.id)}
                        className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold border border-amber-300"
                      >
                        → Day {d.dayNumber}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Direct Edit Button */}
          <div className="pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onEdit}
              className="w-full py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Activity Details</span>
            </button>
          </div>
        </div>
      )}

      {/* If in Activity Bank: "Place on Day 1 / 2 / 3" quick action */}
      {!isOnTimeline && onAddToTimeline && availableDays && (
        <div className="p-3 bg-amber-100/60 border-t border-amber-200 rounded-b-2xl">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDayPicker(!showDayPicker)}
              className="w-full py-1.5 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Place on Trail Board</span>
              <ChevronDown className="w-3.5 h-3.5 ml-auto" />
            </button>

            {showDayPicker && (
              <div className="absolute left-0 right-0 bottom-full mb-1 bg-white rounded-xl shadow-xl border-2 border-amber-300 p-1.5 z-20 space-y-1 animate-in fade-in">
                <span className="block text-[10px] font-black uppercase tracking-wider text-stone-500 px-2 py-0.5">
                  Choose Expedition Day:
                </span>
                {availableDays.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onAddToTimeline(d.id);
                      setShowDayPicker(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-stone-800 hover:bg-amber-100 hover:text-amber-900 transition-colors flex items-center justify-between"
                  >
                    <span>Day {d.dayNumber}: {d.title.split(':')[1] || d.title}</span>
                    <span className="text-[10px] text-stone-400">Add to end</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
