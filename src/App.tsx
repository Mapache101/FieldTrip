import React, { useState, useEffect } from 'react';
import { TripProject, ActivityCard, MasterSupplyItem, StudentRequiredItem, TeacherChaperone, ProjectMilestone, StudentGroup, StudentProfile } from './types';
import { INITIAL_PROJECT } from './data/initialTripData';
import { decodeProjectFromUrlHash } from './utils/tripHelpers';
import { Header } from './components/Header';
import { TimelineBoard } from './components/TimelineBoard';
import { DeskBoardView } from './components/DeskBoardView';
import { ActivityBank } from './components/ActivityBank';
import { MapView } from './components/MapView';
import { StudentGroupsView } from './components/StudentGroupsView';
import { SuppliesView } from './components/SuppliesView';
import { TeachersView } from './components/TeachersView';
import { CalendarView } from './components/CalendarView';
import { ActivityModal } from './components/ActivityModal';
import { TripSettingsModal } from './components/TripSettingsModal';
import { ShareModal } from './components/ShareModal';
import { PrintSummary } from './components/PrintSummary';
import { NewPlanModal } from './components/NewPlanModal';

const STORAGE_KEY = 'CAMPQUEST_TRIP_PROJECT_V2';

export default function App() {
  // Initialize project state from URL hash first, then localStorage, then initial mock data
  const [project, setProject] = useState<TripProject>(() => {
    const fromUrl = decodeProjectFromUrlHash();
    if (fromUrl) return fromUrl;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tripName && Array.isArray(parsed.days)) {
          if (
            parsed.tripName.includes('Pine Ridge') ||
            parsed.tripName === 'Pine Ridge 8th Grade Wilderness Expedition'
          ) {
            parsed.tripName = '8th Grade Wilderness Expedition';
          }
          if (!parsed.studentGroups || parsed.studentGroups.length === 0) {
            parsed.studentGroups = INITIAL_PROJECT.studentGroups;
          }
          if (!parsed.students || parsed.students.length === 0) {
            parsed.students = INITIAL_PROJECT.students;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }

    return INITIAL_PROJECT;
  });

  // Automatically migrate legacy/Pine Ridge trip names to 8th Grade Wilderness Expedition
  useEffect(() => {
    if (
      project.tripName.includes('Pine Ridge') ||
      project.tripName === 'Pine Ridge 8th Grade Wilderness Expedition'
    ) {
      setProject((prev) => ({
        ...prev,
        tripName: '8th Grade Wilderness Expedition',
      }));
    }
  }, [project.tripName]);

  // Active view tab (includes timeline, direct tabletop desk, interactive map, student groups, etc.)
  const [activeTab, setActiveTab] = useState<'timeline' | 'desk' | 'map' | 'students' | 'supplies' | 'teachers' | 'calendar'>('timeline');

  // Active day selection for timeline
  const [activeDayId, setActiveDayId] = useState<string>(() => project.days[0]?.id || 'day-1');

  // Map focus state
  const [focusedActivityId, setFocusedActivityId] = useState<string | null>(null);

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityCard | null>(null);
  const [defaultLocationForModal, setDefaultLocationForModal] = useState<{ lat: number; lng: number; locationName?: string } | null>(null);
  const [targetDayForModal, setTargetDayForModal] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'none' | 'all' | 'student-packing'>('none');

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, [project]);

  // Ensure activeDayId exists
  useEffect(() => {
    if (!project.days.some((d) => d.id === activeDayId)) {
      setActiveDayId(project.days[0]?.id || 'day-1');
    }
  }, [project.days, activeDayId]);

  // Handler: Move activity within the same day
  const handleMoveActivityInDay = (dayId: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setProject((prev) => {
      const updatedDays = prev.days.map((day) => {
        if (day.id !== dayId) return day;
        const newIds = [...day.activityIds];
        const [movedId] = newIds.splice(fromIndex, 1);
        const clampedTarget = Math.max(0, Math.min(newIds.length, toIndex));
        newIds.splice(clampedTarget, 0, movedId);
        return { ...day, activityIds: newIds };
      });
      return { ...prev, days: updatedDays, lastSavedAt: new Date().toISOString() };
    });
  };

  // Handler: Move activity across different days with drag & drop
  const handleMoveActivityAcrossDays = (
    sourceDayId: string,
    fromIndex: number,
    targetDayId: string,
    toIndex: number
  ) => {
    setProject((prev) => {
      const sourceDay = prev.days.find((d) => d.id === sourceDayId);
      if (!sourceDay || !sourceDay.activityIds[fromIndex]) return prev;
      const movedId = sourceDay.activityIds[fromIndex];

      const updatedDays = prev.days.map((day) => {
        if (day.id === sourceDayId) {
          return {
            ...day,
            activityIds: day.activityIds.filter((_, idx) => idx !== fromIndex),
          };
        }
        if (day.id === targetDayId) {
          const newIds = day.activityIds.filter((id) => id !== movedId);
          const clampedTarget = Math.max(0, Math.min(newIds.length, toIndex));
          newIds.splice(clampedTarget, 0, movedId);
          return {
            ...day,
            activityIds: newIds,
          };
        }
        return day;
      });

      return { ...prev, days: updatedDays, lastSavedAt: new Date().toISOString() };
    });
  };

  // Handler: Add activity to a specific slot index on a day
  const handleAddActivityToDayAt = (
    activityId: string,
    targetDayId: string,
    targetIndex?: number
  ) => {
    setProject((prev) => {
      const updatedDays = prev.days.map((day) => {
        if (day.id !== targetDayId) {
          // Remove from other day if it exists there
          return {
            ...day,
            activityIds: day.activityIds.filter((id) => id !== activityId),
          };
        }
        const newIds = day.activityIds.filter((id) => id !== activityId);
        const insertIndex = targetIndex !== undefined ? Math.max(0, Math.min(newIds.length, targetIndex)) : newIds.length;
        newIds.splice(insertIndex, 0, activityId);
        return { ...day, activityIds: newIds };
      });
      return { ...prev, days: updatedDays, lastSavedAt: new Date().toISOString() };
    });
  };

  // Handler: Remove activity from a day's timeline (back to bank)
  const handleRemoveFromTimeline = (dayId: string, activityId: string) => {
    setProject((prev) => {
      const updatedDays = prev.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          activityIds: day.activityIds.filter((id) => id !== activityId),
        };
      });
      return { ...prev, days: updatedDays, lastSavedAt: new Date().toISOString() };
    });
  };

  // Handler: Place activity on a day's timeline (end of day)
  const handleAddToTimeline = (activityId: string, targetDayId: string) => {
    handleAddActivityToDayAt(activityId, targetDayId);
  };

  // Handler: Save (create or edit) an activity
  const handleSaveActivity = (activityToSave: ActivityCard) => {
    setProject((prev) => {
      const existingIdx = prev.activities.findIndex((a) => a.id === activityToSave.id);
      let newActivities: ActivityCard[];
      if (existingIdx >= 0) {
        newActivities = prev.activities.map((a) =>
          a.id === activityToSave.id ? activityToSave : a
        );
      } else {
        newActivities = [...prev.activities, activityToSave];
      }

      // If new activity and targetDayForModal was set, add to that day's trail
      let updatedDays = prev.days;
      if (existingIdx === -1 && targetDayForModal) {
        updatedDays = prev.days.map((day) => {
          if (day.id === targetDayForModal) {
            return { ...day, activityIds: [...day.activityIds, activityToSave.id] };
          }
          return day;
        });
      }

      return {
        ...prev,
        activities: newActivities,
        days: updatedDays,
        lastSavedAt: new Date().toISOString(),
      };
    });
    setTargetDayForModal(null);
    setDefaultLocationForModal(null);
  };

  // Handler: Delete activity completely
  const handleDeleteActivity = (activityId: string) => {
    setProject((prev) => {
      return {
        ...prev,
        activities: prev.activities.filter((a) => a.id !== activityId),
        days: prev.days.map((day) => ({
          ...day,
          activityIds: day.activityIds.filter((id) => id !== activityId),
        })),
        lastSavedAt: new Date().toISOString(),
      };
    });
  };

  // Handler: Update Day Start Time
  const handleUpdateDayStartTime = (dayId: string, newTime: string) => {
    setProject((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.id === dayId ? { ...d, startTime: newTime } : d)),
      lastSavedAt: new Date().toISOString(),
    }));
  };

  // Handler: Update Master Supplies
  const handleUpdateSupplies = (newSupplies: MasterSupplyItem[]) => {
    setProject((prev) => ({
      ...prev,
      supplies: newSupplies,
      lastSavedAt: new Date().toISOString(),
    }));
  };

  // Handler: Update Student Items
  const handleUpdateStudentItems = (newItems: StudentRequiredItem[]) => {
    setProject((prev) => ({
      ...prev,
      studentItems: newItems,
      lastSavedAt: new Date().toISOString(),
    }));
  };

  // Handler: Update Teachers
  const handleUpdateTeachers = (newTeachers: TeacherChaperone[]) => {
    setProject((prev) => ({
      ...prev,
      teachers: newTeachers,
      lastSavedAt: new Date().toISOString(),
    }));
  };

  // Handler: Update Student Profiles
  const handleUpdateStudents = (newStudents: StudentProfile[]) => {
    setProject((prev) => ({
      ...prev,
      students: newStudents,
      lastSavedAt: new Date().toISOString(),
    }));
  };

  // Handler: Update Student Cohort Groups
  const handleUpdateStudentGroups = (newGroups: StudentGroup[]) => {
    setProject((prev) => ({
      ...prev,
      studentGroups: newGroups,
      lastSavedAt: new Date().toISOString(),
    }));
  };

  // Handler: Update Milestones
  const handleUpdateMilestones = (newMilestones: ProjectMilestone[]) => {
    setProject((prev) => ({
      ...prev,
      milestones: newMilestones,
      lastSavedAt: new Date().toISOString(),
    }));
  };

  // Handler: Update Pawn Token
  const handleUpdatePawn = (pawn: TripProject['selectedPawn']) => {
    setProject((prev) => ({
      ...prev,
      selectedPawn: pawn,
    }));
  };

  // Handler: Reset to sample data
  const handleResetToSampleData = () => {
    setProject(INITIAL_PROJECT);
    localStorage.removeItem(STORAGE_KEY);
    setActiveDayId('day-1');
  };

  // Handler: Jump to Map from Activity Card
  const handleViewOnMap = (activityId: string) => {
    setFocusedActivityId(activityId);
    setActiveTab('map');
  };

  // Handler: Create activity from map location click
  const handleCreateActivityAtLocation = (coords: { lat: number; lng: number }, locationName: string) => {
    setDefaultLocationForModal({ ...coords, locationName });
    setEditingActivity(null);
    setTargetDayForModal(project.days[0]?.id || null);
    setIsActivityModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50/70 flex flex-col selection:bg-emerald-600 selection:text-white pb-16">
      {/* Top Navigation Header */}
      <Header
        project={project}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'map') {
            setFocusedActivityId(null);
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onPrint={() => setPrintMode('all')}
        onOpenNewPlan={() => setIsNewPlanOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {/* VIEW 1: HORIZONTAL STACKED TIMELINE BOARD & ACTIVITY BANK */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {/* The Horizontal Stacked Timeline: Each day is horizontal, next day below it */}
            <TimelineBoard
              project={project}
              activeDayId={activeDayId}
              onSelectDay={setActiveDayId}
              onMoveActivityInDay={handleMoveActivityInDay}
              onMoveActivityAcrossDays={handleMoveActivityAcrossDays}
              onAddActivityToDayAt={handleAddActivityToDayAt}
              onRemoveFromTimeline={handleRemoveFromTimeline}
              onOpenCreateActivity={(targetDayId) => {
                setEditingActivity(null);
                setDefaultLocationForModal(null);
                setTargetDayForModal(targetDayId || activeDayId);
                setIsActivityModalOpen(true);
              }}
              onEditActivity={(act) => {
                setEditingActivity(act);
                setDefaultLocationForModal(null);
                setTargetDayForModal(null);
                setIsActivityModalOpen(true);
              }}
              onUpdateDayStartTime={handleUpdateDayStartTime}
              onViewOnMap={handleViewOnMap}
              onSwitchToDeskMode={() => setActiveTab('desk')}
            />

            {/* The Activity Deck & Quest Bank Drawer */}
            <ActivityBank
              activities={project.activities}
              days={project.days}
              activeDayId={activeDayId}
              teachers={project.teachers}
              onCreateNew={() => {
                setEditingActivity(null);
                setDefaultLocationForModal(null);
                setTargetDayForModal(activeDayId);
                setIsActivityModalOpen(true);
              }}
              onEditActivity={(act) => {
                setEditingActivity(act);
                setDefaultLocationForModal(null);
                setTargetDayForModal(null);
                setIsActivityModalOpen(true);
              }}
              onAddToTimeline={handleAddToTimeline}
              onViewOnMap={handleViewOnMap}
            />
          </div>
        )}

        {/* VIEW 2: TABLETOP PLANNING DESK (desk.html Freeform Card Physics) */}
        {activeTab === 'desk' && (
          <DeskBoardView
            project={project}
            onMoveActivityInDay={handleMoveActivityInDay}
            onMoveActivityAcrossDays={handleMoveActivityAcrossDays}
            onAddActivityToDayAt={handleAddActivityToDayAt}
            onRemoveFromTimeline={handleRemoveFromTimeline}
            onOpenCreateActivity={(targetDayId) => {
              setEditingActivity(null);
              setDefaultLocationForModal(null);
              setTargetDayForModal(targetDayId || activeDayId);
              setIsActivityModalOpen(true);
            }}
            onEditActivity={(act) => {
              setEditingActivity(act);
              setDefaultLocationForModal(null);
              setTargetDayForModal(null);
              setIsActivityModalOpen(true);
            }}
            onUpdateDayStartTime={handleUpdateDayStartTime}
            onViewOnMap={handleViewOnMap}
          />
        )}

        {/* VIEW 3: INTERACTIVE GEOLOCATION MAP (PALERMO, SANTA CRUZ) */}
        {activeTab === 'map' && (
          <MapView
            project={project}
            onEditActivity={(act) => {
              setEditingActivity(act);
              setDefaultLocationForModal(null);
              setTargetDayForModal(null);
              setIsActivityModalOpen(true);
            }}
            onCreateActivityAtLocation={handleCreateActivityAtLocation}
            focusedActivityId={focusedActivityId}
          />
        )}

        {/* VIEW 4: STUDENT GROUPS & ROSTERS (2 COHORTS, ALLERGIES & OBSERVATIONS) */}
        {activeTab === 'students' && (
          <StudentGroupsView
            project={project}
            onUpdateStudents={handleUpdateStudents}
            onUpdateStudentGroups={handleUpdateStudentGroups}
          />
        )}

        {/* VIEW 5: GEAR & SUPPLIES MANIFEST */}
        {activeTab === 'supplies' && (
          <SuppliesView
            project={project}
            onUpdateSupplies={handleUpdateSupplies}
            onUpdateStudentItems={handleUpdateStudentItems}
            onPrintPackingSlip={() => setPrintMode('student-packing')}
          />
        )}

        {/* VIEW 4: TEACHER CHAPERONES & DUTIES */}
        {activeTab === 'teachers' && (
          <TeachersView
            project={project}
            onUpdateTeachers={handleUpdateTeachers}
            onOpenActivity={(actId) => {
              const act = project.activities.find((a) => a.id === actId);
              if (act) {
                setEditingActivity(act);
                setIsActivityModalOpen(true);
              }
            }}
          />
        )}

        {/* VIEW 5: PROJECT MILESTONES & CALENDAR */}
        {activeTab === 'calendar' && (
          <CalendarView
            project={project}
            onUpdateMilestones={handleUpdateMilestones}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Activity Create/Edit Modal Form */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setEditingActivity(null);
          setDefaultLocationForModal(null);
          setTargetDayForModal(null);
        }}
        onSave={handleSaveActivity}
        onDelete={handleDeleteActivity}
        initialData={editingActivity}
        teachers={project.teachers}
        defaultLocation={defaultLocationForModal}
      />

      {/* Trip Configuration & Days Settings Modal */}
      <TripSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        project={project}
        onSave={(updated) => setProject((prev) => ({ ...prev, ...updated }))}
        onResetToSampleData={handleResetToSampleData}
      />

      {/* Share & GitHub / Cloudflare Pages Guide Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        project={project}
        onImportProject={(imported) => setProject(imported)}
      />

      {/* Start New Plan Modal */}
      <NewPlanModal
        isOpen={isNewPlanOpen}
        onClose={() => setIsNewPlanOpen(false)}
        onCreateNewPlan={(newProject) => {
          setProject(newProject);
          setActiveDayId(newProject.days[0]?.id || 'day-1');
          setActiveTab('timeline');
        }}
      />

      {/* Printable Document Modal */}
      {printMode !== 'none' && (
        <PrintSummary
          project={project}
          mode={printMode}
          onClose={() => setPrintMode('none')}
        />
      )}
    </div>
  );
}
