import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  AlertTriangle, 
  HeartPulse, 
  Utensils, 
  Phone, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Filter, 
  ArrowLeftRight, 
  CheckCircle2, 
  FileText,
  ShieldCheck,
  ChevronRight,
  Info,
  Sparkles,
  MapPin,
  Database
} from 'lucide-react';
import { StudentGroup, StudentProfile, TeacherChaperone, ActivityCard, TripProject } from '../types';
import { FirebaseClassListModal } from './FirebaseClassListModal';

interface StudentGroupsViewProps {
  project: TripProject;
  onUpdateStudents: (students: StudentProfile[]) => void;
  onUpdateStudentGroups: (groups: StudentGroup[]) => void;
  onUpdateActivities?: (activities: ActivityCard[]) => void;
}

export const StudentGroupsView: React.FC<StudentGroupsViewProps> = ({
  project,
  onUpdateStudents,
  onUpdateStudentGroups,
}) => {
  const groups = project.studentGroups || [];
  const students = project.students || [];
  const teachers = project.teachers || [];

  const [activeFilter, setActiveFilter] = useState<'all' | 'group-1' | 'group-2' | 'alerts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null);
  const [targetGroupForNewStudent, setTargetGroupForNewStudent] = useState<string>('group-1');
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Form states for student modal
  const [formName, setFormName] = useState('');
  const [formGroupId, setFormGroupId] = useState('group-1');
  const [formGrade, setFormGrade] = useState('8th Grade');
  const [formHouse, setFormHouse] = useState('');
  const [formAllergies, setFormAllergies] = useState('');
  const [formMedical, setFormMedical] = useState('');
  const [formDietary, setFormDietary] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formObservations, setFormObservations] = useState('');
  const [formMedicalClearance, setFormMedicalClearance] = useState(true);
  const [formParentConsent, setFormParentConsent] = useState(true);

  // Form states for group edit modal
  const [groupName, setGroupName] = useState('');
  const [groupArrivalTime, setGroupArrivalTime] = useState('');
  const [groupArrivalDate, setGroupArrivalDate] = useState('');
  const [groupDepartureTime, setGroupDepartureTime] = useState('');
  const [groupDepartureDate, setGroupDepartureDate] = useState('');
  const [groupLeadTeacherId, setGroupLeadTeacherId] = useState('');
  const [groupNotes, setGroupNotes] = useState('');

  // Quick stats
  const group1Students = students.filter((s) => s.groupId === 'group-1');
  const group2Students = students.filter((s) => s.groupId === 'group-2');
  const studentsWithAlerts = students.filter(
    (s) => (s.allergies && s.allergies !== 'None') || (s.medicalRequirements && s.medicalRequirements !== 'None') || (s.dietaryRequirements && s.dietaryRequirements !== 'None')
  );
  const clearedCount = students.filter((s) => s.medicalClearanceReceived && s.parentConsentReceived).length;

  // Filtered student list
  const filteredStudents = students.filter((student) => {
    // Group filter
    if (activeFilter === 'group-1' && student.groupId !== 'group-1') return false;
    if (activeFilter === 'group-2' && student.groupId !== 'group-2') return false;
    if (activeFilter === 'alerts') {
      const hasAllergy = student.allergies && student.allergies !== 'None';
      const hasMed = student.medicalRequirements && student.medicalRequirements !== 'None';
      const hasDiet = student.dietaryRequirements && student.dietaryRequirements !== 'None';
      if (!hasAllergy && !hasMed && !hasDiet) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = student.name.toLowerCase().includes(q);
      const matchAllergy = (student.allergies || '').toLowerCase().includes(q);
      const matchMed = (student.medicalRequirements || '').toLowerCase().includes(q);
      const matchObs = (student.observations || '').toLowerCase().includes(q);
      const matchContact = (student.emergencyContactName || '').toLowerCase().includes(q);
      return matchName || matchAllergy || matchMed || matchObs || matchContact;
    }

    return true;
  });

  // Open create student modal
  const handleOpenCreateStudent = (defaultGroup: string = 'group-1') => {
    setEditingStudent(null);
    setFormName('');
    setFormGroupId(defaultGroup);
    setFormGrade('8th Grade');
    setFormHouse('');
    setFormAllergies('');
    setFormMedical('');
    setFormDietary('');
    setFormContactName('');
    setFormContactPhone('');
    setFormObservations('');
    setFormMedicalClearance(true);
    setFormParentConsent(true);
    setIsCreatingStudent(true);
  };

  // Open edit student modal
  const handleOpenEditStudent = (s: StudentProfile) => {
    setEditingStudent(s);
    setFormName(s.name);
    setFormGroupId(s.groupId);
    setFormGrade(s.grade || '8th Grade');
    setFormHouse(s.house || '');
    setFormAllergies(s.allergies || '');
    setFormMedical(s.medicalRequirements || '');
    setFormDietary(s.dietaryRequirements || '');
    setFormContactName(s.emergencyContactName || '');
    setFormContactPhone(s.emergencyContactPhone || '');
    setFormObservations(s.observations || '');
    setFormMedicalClearance(s.medicalClearanceReceived);
    setFormParentConsent(s.parentConsentReceived);
    setIsCreatingStudent(true);
  };

  // Save student
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingStudent) {
      const updated = students.map((s) =>
        s.id === editingStudent.id
          ? {
              ...s,
              name: formName.trim(),
              groupId: formGroupId,
              grade: formGrade.trim() || undefined,
              house: formHouse.trim() || undefined,
              allergies: formAllergies.trim() || 'None',
              medicalRequirements: formMedical.trim() || 'None',
              dietaryRequirements: formDietary.trim() || 'None',
              emergencyContactName: formContactName.trim() || undefined,
              emergencyContactPhone: formContactPhone.trim() || undefined,
              observations: formObservations.trim() || undefined,
              medicalClearanceReceived: formMedicalClearance,
              parentConsentReceived: formParentConsent,
            }
          : s
      );
      onUpdateStudents(updated);
    } else {
      const newStudent: StudentProfile = {
        id: `stu-${Date.now()}`,
        name: formName.trim(),
        groupId: formGroupId,
        grade: formGrade.trim() || undefined,
        house: formHouse.trim() || undefined,
        allergies: formAllergies.trim() || 'None',
        medicalRequirements: formMedical.trim() || 'None',
        dietaryRequirements: formDietary.trim() || 'None',
        emergencyContactName: formContactName.trim() || undefined,
        emergencyContactPhone: formContactPhone.trim() || undefined,
        observations: formObservations.trim() || undefined,
        medicalClearanceReceived: formMedicalClearance,
        parentConsentReceived: formParentConsent,
      };
      onUpdateStudents([...students, newStudent]);
    }

    setIsCreatingStudent(false);
    setEditingStudent(null);
  };

  // Quick switch group for a student
  const handleToggleStudentGroup = (studentId: string) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          groupId: s.groupId === 'group-1' ? 'group-2' : 'group-1',
        };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  // Delete student
  const handleDeleteStudent = (studentId: string) => {
    if (confirm('Are you sure you want to remove this student from the expedition manifest?')) {
      onUpdateStudents(students.filter((s) => s.id !== studentId));
    }
  };

  // Open edit group modal
  const handleOpenEditGroup = (g: StudentGroup) => {
    setEditingGroup(g);
    setGroupName(g.name);
    setGroupArrivalDate(g.arrivalDate);
    setGroupArrivalTime(g.arrivalTime);
    setGroupDepartureDate(g.departureDate);
    setGroupDepartureTime(g.departureTime);
    setGroupLeadTeacherId(g.leadTeacherId || '');
    setGroupNotes(g.notes || '');
  };

  // Save group edits
  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !groupName.trim()) return;

    const updated = groups.map((g) =>
      g.id === editingGroup.id
        ? {
            ...g,
            name: groupName.trim(),
            arrivalDate: groupArrivalDate,
            arrivalTime: groupArrivalTime,
            departureDate: groupDepartureDate,
            departureTime: groupDepartureTime,
            leadTeacherId: groupLeadTeacherId || undefined,
            notes: groupNotes.trim() || undefined,
          }
        : g
    );
    onUpdateStudentGroups(updated);
    setEditingGroup(null);
  };

  // Helper to format 24h to 12h
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return timeStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const group1 = groups.find((g) => g.id === 'group-1') || {
    id: 'group-1',
    name: 'Grupo 1 - Avanzada (Alpha Wave)',
    badgeColor: 'emerald' as const,
    arrivalDate: '2026-10-28',
    arrivalTime: '08:30',
    departureDate: '2026-10-30',
    departureTime: '12:00',
    notes: 'Arrives first on Day 1 morning.',
  };

  const group2 = groups.find((g) => g.id === 'group-2') || {
    id: 'group-2',
    name: 'Grupo 2 - Continuación (Bravo Wave)',
    badgeColor: 'amber' as const,
    arrivalDate: '2026-10-28',
    arrivalTime: '13:30',
    departureDate: '2026-10-30',
    departureTime: '15:30',
    notes: 'Arrives early afternoon on Day 1.',
  };

  const group1Lead = teachers.find((t) => t.id === group1.leadTeacherId);
  const group2Lead = teachers.find((t) => t.id === group2.leadTeacherId);

  // Group activities count
  const group1Activities = project.activities.filter((a) => a.assignedGroup === 'group-1').length;
  const group2Activities = project.activities.filter((a) => a.assignedGroup === 'group-2').length;
  const sharedActivities = project.activities.filter((a) => a.assignedGroup === 'all' || !a.assignedGroup).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>Student Cohorts & Roster</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              2 Staggered Groups
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Manage the two arriving waves of students, assign individual cohorts, record medical/allergy requirements, 
            and track detailed teacher observations for each student.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFirebaseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
          >
            <Database className="w-4 h-4" />
            <span>SCIS Firebase Class Lists</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreateStudent('group-1')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* 2-GROUP STAGGERED ARRIVAL COMPARISON BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GROUP 1 CARD */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full pointer-events-none -z-0"></div>
          <div className="relative z-10 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase tracking-wide border border-emerald-300">
                  <Clock className="w-3 h-3 text-emerald-700" /> Arrives 1st (Morning Wave)
                </span>
                <h3 className="text-base font-extrabold text-stone-900 mt-1">
                  {group1.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEditGroup(group1)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Edit Group 1 Schedule"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Arrival & Departure timing */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Arrival Time</span>
                <div className="font-extrabold text-stone-800 text-sm flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{formatTime(group1.arrivalTime)}</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium">{group1.arrivalDate}</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-600 uppercase block">Departure Time</span>
                <div className="font-extrabold text-stone-800 text-sm flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  <span>{formatTime(group1.departureTime)}</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium">{group1.departureDate}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800">{group1Students.length} Students</span>
                <span className="text-stone-300">•</span>
                <span className="text-stone-500">{group1Activities} dedicated quests</span>
              </div>
              {group1Lead && (
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Lead: {group1Lead.name}
                </span>
              )}
            </div>

            {group1.notes && (
              <p className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100 leading-relaxed">
                {group1.notes}
              </p>
            )}
          </div>
        </div>

        {/* GROUP 2 CARD */}
        <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full pointer-events-none -z-0"></div>
          <div className="relative z-10 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black text-[10px] uppercase tracking-wide border border-amber-300">
                  <Clock className="w-3 h-3 text-amber-700" /> Arrives 2nd (Afternoon Wave)
                </span>
                <h3 className="text-base font-extrabold text-stone-900 mt-1">
                  {group2.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEditGroup(group2)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Edit Group 2 Schedule"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Arrival & Departure timing */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Arrival Time</span>
                <div className="font-extrabold text-stone-800 text-sm flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{formatTime(group2.arrivalTime)}</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium">{group2.arrivalDate}</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-600 uppercase block">Departure Time</span>
                <div className="font-extrabold text-stone-800 text-sm flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  <span>{formatTime(group2.departureTime)}</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium">{group2.departureDate}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800">{group2Students.length} Students</span>
                <span className="text-stone-300">•</span>
                <span className="text-stone-500">{group2Activities} dedicated quests</span>
              </div>
              {group2Lead && (
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Lead: {group2Lead.name}
                </span>
              )}
            </div>

            {group2.notes && (
              <p className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100 leading-relaxed">
                {group2.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SHARED OVERLAP HIGHLIGHT CALLOUT */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-stone-50 to-amber-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-800 text-stone-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="font-bold text-stone-900 block">
              Joint Activities & Overlap Window
            </span>
            <span className="text-stone-600">
              {sharedActivities} shared activities where Group 1 and Group 2 unite at Basecamp (Night 1 fireside stargazing, Day 2 teamwork challenge, meals & closing ceremony).
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-md bg-white border border-stone-200 text-stone-700 font-bold text-[11px]">
            {studentsWithAlerts.length} Medical / Allergy Alerts
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
            {clearedCount}/{students.length} Fully Cleared
          </span>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, allergies, medication, or notes..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === 'all'
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Students ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('group-1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeFilter === 'group-1'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Group 1 ({group1Students.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('group-2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeFilter === 'group-2'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Group 2 ({group2Students.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('alerts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeFilter === 'alerts'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Alerts ({studentsWithAlerts.length})</span>
          </button>
        </div>
      </div>

      {/* STUDENT ROSTER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => {
            const isGroup1 = student.groupId === 'group-1';
            const hasAllergies = student.allergies && student.allergies !== 'None';
            const hasMedical = student.medicalRequirements && student.medicalRequirements !== 'None';
            const hasDietary = student.dietaryRequirements && student.dietaryRequirements !== 'None';

            return (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Card Header: Name + Group Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">
                        {student.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-stone-500 font-medium">
                          {student.grade || '8th Grade'}
                        </span>
                        {student.house && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                            {student.house}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStudentGroup(student.id)}
                      title={`Click to switch to ${isGroup1 ? 'Group 2' : 'Group 1'}`}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                        isGroup1
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span>{isGroup1 ? 'Group 1 (Alpha)' : 'Group 2 (Bravo)'}</span>
                      <ArrowLeftRight className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </div>

                  {/* Medical & Allergy Badges */}
                  <div className="mt-2.5 space-y-1.5 text-xs">
                    {hasAllergies && (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-1.5 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Allergy:</strong> {student.allergies}
                        </div>
                      </div>
                    )}

                    {hasMedical && (
                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-1.5 text-[11px]">
                        <HeartPulse className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Medical:</strong> {student.medicalRequirements}
                        </div>
                      </div>
                    )}

                    {hasDietary && (
                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-1.5 text-[11px]">
                        <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Diet:</strong> {student.dietaryRequirements}
                        </div>
                      </div>
                    )}

                    {/* Teacher Observations & Notes */}
                    {student.observations && (
                      <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 text-[11px] leading-relaxed">
                        <span className="font-bold text-stone-900 block mb-0.5">Observations:</span>
                        {student.observations}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Emergency Contact & Action Buttons */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <div>
                    {student.emergencyContactName ? (
                      <div className="flex items-center gap-1 truncate max-w-[170px]" title={`${student.emergencyContactName} ${student.emergencyContactPhone || ''}`}>
                        <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{student.emergencyContactName}</span>
                      </div>
                    ) : (
                      <span className="text-stone-400 italic">No contact listed</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditStudent(student)}
                      className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                      title="Edit student"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition-colors"
                      title="Delete student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-stone-200 p-8">
            <Users className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <h4 className="font-bold text-stone-800 text-sm">No students found</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No students matching "${searchQuery}". Try clearing the search query.`
                : 'No students assigned to this group yet. Click below to add a student.'}
            </p>
            <button
              type="button"
              onClick={() => handleOpenCreateStudent(activeFilter === 'group-2' ? 'group-2' : 'group-1')}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
            >
              + Add Student
            </button>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT STUDENT */}
      {isCreatingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-700" />
                <span>{editingStudent ? 'Edit Student Profile' : 'Add New Student to Expedition'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingStudent(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 space-y-4 text-xs">
              {/* Name & Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sofia Quispe"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Group Assignment *
                  </label>
                  <select
                    value={formGroupId}
                    onChange={(e) => setFormGroupId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="group-1">Group 1 - First Wave (Alpha)</option>
                    <option value="group-2">Group 2 - Second Wave (Bravo)</option>
                  </select>
                </div>
              </div>

              {/* Grade / Room and SCIS House */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Grade / Classroom
                  </label>
                  <input
                    type="text"
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    placeholder="e.g. 8th Grade - Room A or 4sA"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    SCIS House
                  </label>
                  <select
                    value={formHouse}
                    onChange={(e) => setFormHouse(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none capitalize"
                  >
                    <option value="">No House / Unassigned</option>
                    <option value="centaurs">Centaurs</option>
                    <option value="pegasus">Pegasus</option>
                    <option value="titans">Titans</option>
                    <option value="unicorns">Unicorns</option>
                  </select>
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="font-bold text-stone-700 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5" /> Allergies (Critical)
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">Leave blank or "None" if none</span>
                </label>
                <input
                  type="text"
                  value={formAllergies}
                  onChange={(e) => setFormAllergies(e.target.value)}
                  placeholder="e.g. Severe Peanut Allergy (Carries EpiPen) or Bee stings"
                  className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Peanuts (EpiPen)', 'Bee Stings', 'Tree Nuts', 'Latex', 'Penicillin', 'None'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormAllergies(preset)}
                      className="text-[10px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medical Requirements & Dietary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-blue-600" /> Medical Requirements
                  </label>
                  <input
                    type="text"
                    value={formMedical}
                    onChange={(e) => setFormMedical(e.target.value)}
                    placeholder="e.g. Asthma inhaler before hikes"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" /> Dietary Restrictions
                  </label>
                  <input
                    type="text"
                    value={formDietary}
                    onChange={(e) => setFormDietary(e.target.value)}
                    placeholder="e.g. Vegetarian, Gluten-Free, Halal"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    placeholder="e.g. Laura Fernandez (Mother)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    placeholder="e.g. +591 7102-3344"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Specific Observations & Notes */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Specific Requirements & Teacher Observations
                </label>
                <textarea
                  rows={3}
                  value={formObservations}
                  onChange={(e) => setFormObservations(e.target.value)}
                  placeholder="Record behavioral notes, tent partner preferences, swimming comfort level, leadership strengths, or night patrol needs..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Authorizations */}
              <div className="flex items-center gap-6 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formMedicalClearance}
                    onChange={(e) => setFormMedicalClearance(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                  />
                  <span className="font-semibold text-stone-800">Medical Clearance Received</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formParentConsent}
                    onChange={(e) => setFormParentConsent(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                  />
                  <span className="font-semibold text-stone-800">Parent Consent Form Signed</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingStudent(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                >
                  {editingStudent ? 'Save Changes' : 'Add Student to Manifest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT GROUP SCHEDULE */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-base">
                Edit {editingGroup.id === 'group-1' ? 'Group 1' : 'Group 2'} Schedule
              </h3>
              <button
                type="button"
                onClick={() => setEditingGroup(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Cohort Name *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold text-xs focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    value={groupArrivalDate}
                    onChange={(e) => setGroupArrivalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Arrival Time
                  </label>
                  <input
                    type="time"
                    value={groupArrivalTime}
                    onChange={(e) => setGroupArrivalTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={groupDepartureDate}
                    onChange={(e) => setGroupDepartureDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={groupDepartureTime}
                    onChange={(e) => setGroupDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Lead Chaperone / Teacher
                </label>
                <select
                  value={groupLeadTeacherId}
                  onChange={(e) => setGroupLeadTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                >
                  <option value="">Unassigned</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Wave Notes & Instructions
                </label>
                <textarea
                  rows={2}
                  value={groupNotes}
                  onChange={(e) => setGroupNotes(e.target.value)}
                  placeholder="Notes on arrival bus, luggage drop, and initial activities..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                >
                  Update Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Firebase SCIS Class Lists Modal */}
      <FirebaseClassListModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        existingStudents={students}
        onImportStudents={(newProfiles) => {
          onUpdateStudents([...students, ...newProfiles]);
        }}
      />
    </div>
  );
};
