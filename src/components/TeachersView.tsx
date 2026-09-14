import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Phone, 
  Mail, 
  Award, 
  Clock, 
  Compass, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Edit3,
  Calendar,
  X
} from 'lucide-react';
import { TeacherChaperone, TripProject } from '../types';

interface TeachersViewProps {
  project: TripProject;
  onUpdateTeachers: (teachers: TeacherChaperone[]) => void;
  onOpenActivity: (actId: string) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  project,
  onUpdateTeachers,
  onOpenActivity,
}) => {
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherChaperone | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [certs, setCerts] = useState<string[]>([]);
  const [newCert, setNewCert] = useState('');
  const [isLead, setIsLead] = useState(false);
  const [notes, setNotes] = useState('');

  // Ratio calculation
  const totalStudents = project.expectedStudents || 40;
  const totalTeachers = project.teachers.length;
  const ratio = totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : 'N/A';
  const isRatioSafe = totalTeachers > 0 && totalStudents / totalTeachers <= 10;

  const openEditModal = (t: TeacherChaperone) => {
    setEditingTeacher(t);
    setName(t.name);
    setRole(t.role);
    setPhone(t.phone);
    setEmail(t.email);
    setCerts(t.certifications || []);
    setIsLead(!!t.isLeadCoordinator);
    setNotes(t.notes || '');
    setIsAddingTeacher(true);
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setName('');
    setRole('Chaperone & Subject Teacher');
    setPhone('');
    setEmail('');
    setCerts(['CPR & AED']);
    setIsLead(false);
    setNotes('');
    setIsAddingTeacher(true);
  };

  const handleAddCert = () => {
    const trimmed = newCert.trim();
    if (trimmed && !certs.includes(trimmed)) {
      setCerts([...certs, trimmed]);
      setNewCert('');
    }
  };

  const handleRemoveCert = (cert: string) => {
    setCerts(certs.filter((c) => c !== cert));
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const teacherObj: TeacherChaperone = {
      id: editingTeacher?.id || `t-${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'Trip Chaperone',
      phone: phone.trim(),
      email: email.trim(),
      certifications: certs,
      isLeadCoordinator: isLead,
      notes: notes.trim() || undefined,
    };

    if (editingTeacher) {
      onUpdateTeachers(
        project.teachers.map((t) => (t.id === editingTeacher.id ? teacherObj : t))
      );
    } else {
      onUpdateTeachers([...project.teachers, teacherObj]);
    }

    setIsAddingTeacher(false);
    setEditingTeacher(null);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm('Are you sure you want to remove this chaperone from the trip?')) {
      onUpdateTeachers(project.teachers.filter((t) => t.id !== id));
    }
  };

  // Find activities assigned to each teacher
  const getTeacherAssignments = (teacherId: string) => {
    const leading = project.activities.filter((a) => a.leadTeacherId === teacherId);
    const assisting = project.activities.filter((a) => a.assistantTeacherIds?.includes(teacherId));
    return { leading, assisting };
  };

  return (
    <div className="space-y-6">
      {/* Supervisory Ratio & Safety Header */}
      <div className="bg-amber-100/60 rounded-3xl border-2 border-amber-300/80 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-700 text-amber-50 flex items-center justify-center font-bold shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-stone-900 tracking-tight">
                Teacher Chaperones & Activity Duties
              </h2>
              <p className="text-xs text-stone-600 font-medium">
                Manage staff attending the expedition, supervisory ratios, and activity responsibilities
              </p>
            </div>
          </div>

          <button
            id="add-teacher-btn"
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chaperone</span>
          </button>
        </div>

        {/* Supervision Ratio Metric Box */}
        <div className="mt-4 pt-3 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200">
            <span className="text-[10px] font-black uppercase text-stone-500 block">Attending Chaperones</span>
            <div className="text-xl font-black font-display text-stone-900 mt-0.5">
              {totalTeachers} Staff Members
            </div>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200">
            <span className="text-[10px] font-black uppercase text-stone-500 block">Expected Students</span>
            <div className="text-xl font-black font-display text-stone-900 mt-0.5">
              {totalStudents} Campers
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            isRatioSafe ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase block">Supervisory Ratio</span>
              {isRatioSafe ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div className="text-xl font-black font-display mt-0.5">
              1 : {ratio} {!isRatioSafe && <span className="text-xs font-bold text-rose-700 ml-1.5">(Requires More Staff)</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Chaperones Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {project.teachers.map((t) => {
          const { leading, assisting } = getTeacherAssignments(t.id);
          return (
            <div
              key={t.id}
              className="bg-white rounded-3xl border-2 border-amber-200 p-5 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black font-display text-stone-900">
                        {t.name}
                      </h3>
                      {t.isLeadCoordinator && (
                        <span className="text-[10px] font-black uppercase bg-amber-600 text-white px-2 py-0.5 rounded-full">
                          Trip Lead
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-900 font-bold mt-0.5">
                      {t.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-amber-100 rounded-lg"
                      title="Edit chaperone details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeacher(t.id)}
                      className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      title="Remove chaperone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact details */}
                <div className="mt-3 space-y-1 text-xs text-stone-600">
                  {t.phone && (
                    <div className="flex items-center gap-2 font-medium">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{t.phone}</span>
                    </div>
                  )}
                  {t.email && (
                    <div className="flex items-center gap-2 font-medium">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span className="truncate">{t.email}</span>
                    </div>
                  )}
                </div>

                {/* Certifications badges */}
                {t.certifications && t.certifications.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-black uppercase text-stone-400 block mb-1">
                      Safety Qualifications:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {t.certifications.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          <Award className="w-3 h-3 text-emerald-600" />
                          <span>{c}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {t.notes && (
                  <p className="mt-2.5 text-xs text-stone-500 italic bg-amber-50/70 p-2 rounded-xl border border-amber-100 font-medium">
                    "{t.notes}"
                  </p>
                )}
              </div>

              {/* Activity Responsibilities footer */}
              <div className="mt-4 pt-3 border-t border-amber-100 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-stone-800 text-[11px] uppercase tracking-wider">
                    Activity Assignments:
                  </span>
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                    {leading.length} Lead • {assisting.length} Assist
                  </span>
                </div>

                <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                  {leading.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => onOpenActivity(a.id)}
                      className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 cursor-pointer text-[11px] font-bold text-amber-950 flex items-center justify-between transition-colors"
                    >
                      <span className="truncate">⭐ {a.name}</span>
                      <span className="text-[10px] text-amber-800 font-extrabold shrink-0">
                        {a.durationMinutes}m
                      </span>
                    </div>
                  ))}

                  {assisting.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => onOpenActivity(a.id)}
                      className="p-1 rounded-lg hover:bg-stone-50 cursor-pointer text-[11px] text-stone-600 font-medium flex items-center justify-between transition-colors"
                    >
                      <span className="truncate">🤝 {a.name}</span>
                    </div>
                  ))}

                  {leading.length === 0 && assisting.length === 0 && (
                    <span className="text-[11px] text-stone-400 italic block py-1">
                      No activities assigned yet
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Chaperone Modal */}
      {isAddingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-amber-50 rounded-3xl border-3 border-amber-800/80 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="bg-amber-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-black font-display">
                {editingTeacher ? 'Edit Chaperone Record' : 'Add Teacher Chaperone'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingTeacher(false)}
                className="text-amber-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Full Name & Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Smith, Coach Davis..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 font-bold text-stone-800 text-sm outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  School Role & Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8th Grade Science, Camp Medic, P.E. Dept..."
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-stone-800 outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-medium text-stone-800 outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="teacher@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-medium text-stone-800 outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Certifications Tagging */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Safety & Wilderness Certifications
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {certs.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(c)}
                        className="hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add cert (e.g. Lifeguard, WFA, CPR)..."
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCert();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCert}
                    className="px-3 py-1.5 rounded-xl bg-amber-700 text-white text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isLead}
                    onChange={(e) => setIsLead(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span>Designate as Lead Trip Coordinator</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Notes / Specialized Duties
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Stationed at Lake Dock; carries primary EpiPen box."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-medium text-stone-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setIsAddingTeacher(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-amber-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase bg-amber-700 text-white hover:bg-amber-800 shadow-xs"
                >
                  Save Chaperone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
