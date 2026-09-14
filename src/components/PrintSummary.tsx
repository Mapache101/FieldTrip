import React from 'react';
import { TripProject } from '../types';
import { computeTimelineSlots, formatTime12h } from '../utils/tripHelpers';

interface PrintSummaryProps {
  project: TripProject;
  mode?: 'all' | 'student-packing';
  onClose: () => void;
}

export const PrintSummary: React.FC<PrintSummaryProps> = ({
  project,
  mode = 'all',
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-white p-6 sm:p-10 overflow-y-auto print:p-0">
      {/* Print Control Bar (Hidden during actual print) */}
      <div className="no-print max-w-4xl mx-auto mb-8 pb-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            {mode === 'student-packing' ? 'Student Packing Slip Preview' : 'Expedition Binder Document'}
          </h2>
          <p className="text-xs text-stone-500">
            Click Print to generate a clean PDF or physical handout
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-stone-300 text-stone-700 hover:bg-stone-100"
          >
            Back to Planner
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase bg-amber-700 text-white hover:bg-amber-800 shadow-md"
          >
            🖨️ Print Document
          </button>
        </div>
      </div>

      {/* Actual Printable Document Body */}
      <div className="max-w-4xl mx-auto space-y-8 text-stone-900 font-sans">
        {/* Document Header */}
        <div className="border-b-2 border-stone-900 pb-4 flex justify-between items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
              Oakridge Middle School • Outdoor Education Program
            </span>
            <h1 className="text-2xl font-black font-display tracking-tight text-stone-900">
              {project.tripName}
            </h1>
            <p className="text-sm font-semibold text-stone-700 mt-1">
              📍 {project.destination}
            </p>
          </div>
          <div className="text-right text-xs text-stone-600 font-medium">
            <div><strong>Dates:</strong> {project.startDate} to {project.endDate}</div>
            <div><strong>Campers:</strong> {project.expectedStudents} Students</div>
            <div><strong>Staff:</strong> {project.teachers.length} Chaperones</div>
          </div>
        </div>

        {/* ================= SECTION 1: ITINERARY (If mode == 'all') ================= */}
        {mode === 'all' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black font-display border-b border-stone-300 pb-1 uppercase tracking-wider">
              Expedition Trail Schedule & Activity Flow
            </h2>

            {project.days.map((day) => {
              const slots = computeTimelineSlots(day, project.activities);
              return (
                <div key={day.id} className="space-y-2">
                  <div className="bg-stone-100 p-2 rounded-lg flex justify-between items-center text-xs font-bold">
                    <span className="text-sm font-black">{day.title} ({day.dateStr})</span>
                    <span>Departure: {formatTime12h(day.startTime)}</span>
                  </div>

                  <div className="border rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-stone-50 border-b text-[11px] font-bold text-stone-600 uppercase">
                        <tr>
                          <th className="p-2 w-28">Time</th>
                          <th className="p-2">Activity Quest</th>
                          <th className="p-2 w-32">Lead Staff</th>
                          <th className="p-2">Gear / Student Items</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {slots.map((s) => {
                          const lead = project.teachers.find((t) => t.id === s.activity.leadTeacherId);
                          return (
                            <tr key={s.activity.id} className="hover:bg-stone-50">
                              <td className="p-2 font-mono font-bold whitespace-nowrap">
                                {formatTime12h(s.startTime)} - {formatTime12h(s.endTime)}
                              </td>
                              <td className="p-2 font-bold text-stone-900">
                                {s.activity.name}
                                <span className="block text-[11px] text-stone-500 font-normal">
                                  {s.activity.description}
                                </span>
                              </td>
                              <td className="p-2 text-stone-700 font-semibold">
                                {lead ? lead.name : 'TBD'}
                              </td>
                              <td className="p-2 text-stone-600 text-[11px]">
                                {s.activity.studentItemNeeded || s.activity.requiredEquipment.slice(0, 3).join(', ')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= SECTION 2: STUDENT PACKING CHECKLIST ================= */}
        <div className="space-y-4 page-break-before">
          <div className="flex justify-between items-baseline border-b border-stone-300 pb-1">
            <h2 className="text-lg font-black font-display uppercase tracking-wider">
              Student Packing Checklist & Parent Instructions
            </h2>
            <span className="text-xs font-bold text-stone-500">
              Late October 2026 Climate (Expected Lows: ~36°F)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {project.studentItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 border rounded-lg flex items-start gap-2.5"
              >
                <div className="w-4 h-4 border-2 border-stone-400 rounded-sm shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span>{item.name}</span>
                    {item.isRequired && (
                      <span className="text-[10px] font-extrabold uppercase bg-stone-100 text-stone-800 px-1.5 py-0.2 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-[11px] text-stone-500 mt-0.5">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= SECTION 3: CHAPERONES ROSTER (If mode == 'all') ================= */}
        {mode === 'all' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black font-display border-b border-stone-300 pb-1 uppercase tracking-wider">
              Teacher Chaperone Roster & Emergency Contacts
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {project.teachers.map((t) => (
                <div key={t.id} className="p-3 border rounded-lg space-y-1">
                  <div className="font-bold text-sm text-stone-900">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-stone-600 font-semibold">
                    {t.role}
                  </div>
                  <div className="font-mono text-[11px] text-stone-700">
                    📞 {t.phone}
                  </div>
                  {t.certifications && (
                    <div className="text-[10px] text-stone-500 font-medium pt-1">
                      {t.certifications.join(' • ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
