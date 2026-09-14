import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Database,
  Search,
  CheckSquare,
  Square,
  Users,
  Shield,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { SCISStudentFirebase, subscribeSCISStudents } from '../firebase';
import { StudentProfile } from '../types';

interface FirebaseClassListModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStudents: StudentProfile[];
  onImportStudents: (newProfiles: StudentProfile[]) => void;
}

export const FirebaseClassListModal: React.FC<FirebaseClassListModalProps> = ({
  isOpen,
  onClose,
  existingStudents,
  onImportStudents,
}) => {
  const [firebaseStudents, setFirebaseStudents] = useState<SCISStudentFirebase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedHouse, setSelectedHouse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetGroup, setTargetGroup] = useState<'group-1' | 'group-2' | 'balanced'>('balanced');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // Subscribe to real-time students collection
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeSCISStudents(
      (list) => {
        setFirebaseStudents(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setError('Could not connect to SCIS Firestore. Please check network permissions.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  // Set of already imported student names or IDs
  const existingNamesSet = useMemo(() => {
    return new Set(existingStudents.map((s) => s.name.toLowerCase().trim()));
  }, [existingStudents]);

  const existingFirebaseIdsSet = useMemo(() => {
    return new Set(existingStudents.map((s) => s.firebaseStudentId).filter(Boolean));
  }, [existingStudents]);

  // Available classes/grades in Firebase
  const availableGrades = useMemo(() => {
    const grades = new Set<string>();
    firebaseStudents.forEach((s) => {
      if (s.grade) grades.add(s.grade);
    });
    return Array.from(grades).sort();
  }, [firebaseStudents]);

  // Available houses
  const availableHouses = useMemo(() => {
    const houses = new Set<string>();
    firebaseStudents.forEach((s) => {
      if (s.house) houses.add(s.house);
    });
    return Array.from(houses).sort();
  }, [firebaseStudents]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return firebaseStudents.filter((s) => {
      if (selectedClass !== 'all' && s.grade !== selectedClass) return false;
      if (selectedHouse !== 'all' && s.house !== selectedHouse) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesGrade = s.grade.toLowerCase().includes(query);
        const matchesHouse = (s.house || '').toLowerCase().includes(query);
        if (!matchesName && !matchesGrade && !matchesHouse) return false;
      }
      return true;
    });
  }, [firebaseStudents, selectedClass, selectedHouse, searchQuery]);

  // Toggle selection
  const handleToggleStudent = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Select all visible (excluding already imported)
  const handleSelectAllVisible = () => {
    const next = new Set(selectedIds);
    filteredStudents.forEach((s) => {
      const isAlreadyImported =
        existingFirebaseIdsSet.has(s.id) || existingNamesSet.has(s.name.toLowerCase().trim());
      if (!isAlreadyImported) {
        next.add(s.id);
      }
    });
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Execute Import
  const handleImport = () => {
    if (selectedIds.size === 0) return;

    const selectedList = firebaseStudents.filter((s) => selectedIds.has(s.id));
    const newProfiles: StudentProfile[] = [];

    // Count existing in groups to balance if needed
    let group1Count = existingStudents.filter((s) => s.groupId === 'group-1').length;
    let group2Count = existingStudents.filter((s) => s.groupId === 'group-2').length;

    selectedList.forEach((s) => {
      let assignedGroupId: 'group-1' | 'group-2';
      if (targetGroup === 'group-1') {
        assignedGroupId = 'group-1';
      } else if (targetGroup === 'group-2') {
        assignedGroupId = 'group-2';
      } else {
        // Balanced 50/50 allocation
        if (group1Count <= group2Count) {
          assignedGroupId = 'group-1';
          group1Count++;
        } else {
          assignedGroupId = 'group-2';
          group2Count++;
        }
      }

      newProfiles.push({
        id: `stu-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        firebaseStudentId: s.id,
        name: s.name,
        grade: s.grade,
        house: s.house,
        groupId: assignedGroupId,
        allergies: '',
        medicalRequirements: '',
        dietaryRequirements: '',
        observations: `Imported from SCIS HousePoints Firebase roster (${s.grade}${s.house ? ` • House ${s.house}` : ''}).`,
        medicalClearanceReceived: true,
        parentConsentReceived: true,
      });
    });

    onImportStudents(newProfiles);
    setImportFeedback(`Successfully imported ${newProfiles.length} students into your trip cohorts!`);
    setSelectedIds(new Set());

    setTimeout(() => {
      setImportFeedback(null);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-stone-900 font-display">
                  SCIS Firebase Student Rosters
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Firestore Sync
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Direct access to class lists from <code className="bg-stone-200 px-1 py-0.5 rounded font-mono text-[11px]">scis-house-points</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters and Controls Bar */}
        <div className="p-4 border-b border-stone-200 bg-white grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Class Filter */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              Select Class / Grade
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full text-xs font-bold bg-stone-100 border border-stone-300 rounded-xl px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Grades ({firebaseStudents.length} Students)</option>
              {availableGrades.map((g) => {
                const count = firebaseStudents.filter((s) => s.grade === g).length;
                return (
                  <option key={g} value={g}>
                    Class {g} ({count} students)
                  </option>
                );
              })}
            </select>
          </div>

          {/* House Filter */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              Filter by House
            </label>
            <select
              value={selectedHouse}
              onChange={(e) => setSelectedHouse(e.target.value)}
              className="w-full text-xs font-bold bg-stone-100 border border-stone-300 rounded-xl px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              <option value="all">All Houses</option>
              {availableHouses.map((h) => (
                <option key={h} value={h} className="capitalize">
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="md:col-span-6">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              Search by Student Name
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Type student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-stone-100 border border-stone-300 rounded-xl pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Selection Action Bar */}
        <div className="px-6 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-indigo-950">
              {filteredStudents.length} students found
            </span>
            <span className="text-stone-400">|</span>
            <span className="font-semibold text-stone-600">
              <strong className="text-indigo-700">{selectedIds.size}</strong> selected for import
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] transition-colors"
            >
              Select All Visible
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 font-bold text-[11px] transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Feedback Alert if imported */}
        {importFeedback && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{importFeedback}</span>
          </div>
        )}

        {/* Students List Table Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <div className="text-sm font-bold text-stone-800">
                Fetching live student lists from Firebase...
              </div>
              <div className="text-xs text-stone-500">
                Reading collection <code className="text-indigo-600 font-mono">artifacts/scis-house-points/public/data/students</code>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
              <div className="text-sm font-bold">{error}</div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-stone-500 space-y-2">
              <Users className="w-8 h-8 text-stone-300 mx-auto" />
              <div className="text-sm font-bold text-stone-700">No students match your filter</div>
              <div className="text-xs text-stone-400">Try choosing a different class grade or clearing the search.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredStudents.map((s) => {
                const isSelected = selectedIds.has(s.id);
                const isAlreadyImported =
                  existingFirebaseIdsSet.has(s.id) || existingNamesSet.has(s.name.toLowerCase().trim());

                // House badge colors
                const houseColors: Record<string, string> = {
                  centaurs: 'bg-rose-100 text-rose-800 border-rose-200',
                  pegasus: 'bg-blue-100 text-blue-800 border-blue-200',
                  titans: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  unicorns: 'bg-purple-100 text-purple-800 border-purple-200',
                };
                const houseStyle = s.house ? houseColors[s.house.toLowerCase()] || 'bg-stone-100 text-stone-700 border-stone-200' : 'bg-stone-100 text-stone-700 border-stone-200';

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (!isAlreadyImported) handleToggleStudent(s.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isAlreadyImported
                        ? 'bg-stone-50/80 border-stone-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-200 cursor-pointer'
                        : 'bg-white border-stone-200 hover:border-indigo-300 hover:bg-stone-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-indigo-600 shrink-0">
                        {isAlreadyImported ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {s.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-stone-100 text-stone-700 border border-stone-200">
                            Class {s.grade}
                          </span>
                          {s.house && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border capitalize ${houseStyle}`}>
                              {s.house}
                            </span>
                          )}
                          {isAlreadyImported && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              Already in Trip
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer / Import Options */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Target Group Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-stone-700 whitespace-nowrap">
              Assign imported to:
            </span>
            <div className="flex items-center bg-white p-1 rounded-xl border border-stone-300 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTargetGroup('balanced')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  targetGroup === 'balanced'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
                title="Automatically alternate 50/50 between Group 1 and Group 2"
              >
                Balanced 50/50
              </button>
              <button
                type="button"
                onClick={() => setTargetGroup('group-1')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  targetGroup === 'group-1'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Group 1 (Alpha)
              </button>
              <button
                type="button"
                onClick={() => setTargetGroup('group-2')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  targetGroup === 'group-2'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Group 2 (Bravo)
              </button>
            </div>
          </div>

          {/* Import Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-black shadow-md shadow-indigo-200 transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Import {selectedIds.size} Selected Students</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
