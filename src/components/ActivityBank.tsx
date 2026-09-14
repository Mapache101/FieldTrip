import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Layers, 
  Compass
} from 'lucide-react';
import { ActivityCard, DayPlan, TeacherChaperone } from '../types';
import { ActivityCardItem } from './ActivityCardItem';

interface ActivityBankProps {
  activities: ActivityCard[];
  days: DayPlan[];
  activeDayId: string;
  teachers: TeacherChaperone[];
  onCreateNew: () => void;
  onEditActivity: (act: ActivityCard) => void;
  onAddToTimeline: (activityId: string, dayId: string) => void;
  onViewOnMap?: (activityId: string) => void;
}

export const ActivityBank: React.FC<ActivityBankProps> = ({
  activities,
  days,
  activeDayId,
  teachers,
  onCreateNew,
  onEditActivity,
  onAddToTimeline,
  onViewOnMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const currentDay = days.find((d) => d.id === activeDayId) || days[0];
  const placedIdsOnCurrentDay = new Set(currentDay?.activityIds || []);

  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'All Activities', icon: '⛺' },
    { id: 'campcraft', label: 'Campcraft', icon: '🏕️' },
    { id: 'hike', label: 'Hikes', icon: '🥾' },
    { id: 'water', label: 'Creek', icon: '🌊' },
    { id: 'teamwork', label: 'Team', icon: '🤝' },
    { id: 'meal', label: 'Meals', icon: '🍲' },
    { id: 'campfire', label: 'Campfire', icon: '🔥' },
    { id: 'rest', label: 'Nature', icon: '🌿' },
  ];

  const filteredActivities = activities.filter((act) => {
    const matchesCategory = selectedCategory === 'all' || act.category === selectedCategory;
    const matchesSearch =
      act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.description && act.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      act.requiredEquipment.some((eq) => eq.toLowerCase().includes(searchQuery.toLowerCase())) ||
      act.requiredSupplies.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <span>Activity Repository</span>
              <span className="text-xs px-2 py-0.2 rounded-full bg-stone-100 text-stone-600 font-semibold">
                {activities.length} Total
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              Browse activities and assign them to any day on the timeline.
            </p>
          </div>
        </div>

        <button
          id="create-activity-btn"
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Activity</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search activities, gear, or supplies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-stone-400 transition-all"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 border ${
                selectedCategory === cat.id
                  ? 'bg-stone-800 text-white border-stone-800 font-semibold'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto p-0.5 custom-scrollbar">
        {filteredActivities.map((act) => {
          const isPlacedOnCurrentDay = placedIdsOnCurrentDay.has(act.id);
          return (
            <div key={act.id} className="relative">
              {isPlacedOnCurrentDay && (
                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-700 text-white shadow-2xs">
                  Assigned
                </div>
              )}
              <ActivityCardItem
                activity={act}
                isOnTimeline={false}
                teachers={teachers}
                onEdit={() => onEditActivity(act)}
                onAddToTimeline={(targetDayId) => onAddToTimeline(act.id, targetDayId)}
                onViewOnMap={onViewOnMap}
                availableDays={days}
              />
            </div>
          );
        })}

        {filteredActivities.length === 0 && (
          <div className="col-span-full py-10 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200 p-6">
            <Compass className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-60" />
            <h4 className="text-xs font-bold text-stone-700">No matching activities found</h4>
            <p className="text-xs text-stone-500 mt-0.5 max-w-sm mx-auto">
              Try adjusting your search terms or create a new activity card.
            </p>
            <button
              type="button"
              onClick={onCreateNew}
              className="mt-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
            >
              + Create Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
