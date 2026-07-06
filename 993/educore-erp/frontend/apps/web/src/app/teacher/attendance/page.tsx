'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  grade: string;
  section: string;
}

export default function TeacherAttendancePage() {
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch students for class
  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const token = localStorage.getItem('educore_token');
        const res = await fetch(`http://localhost:4000/api/students?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          // Filter by selected class (grade and section)
          const [grade, section] = selectedClass.split('-');
          const filtered = data.data.filter((s: Student) => s.grade === grade && s.section === section);
          setStudents(filtered);
          
          // Initialise attendance as all PRESENT
          const initial: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
          filtered.forEach((s: Student) => {
            initial[s.id] = 'PRESENT';
          });
          setAttendance(initial);
        }
      } catch (err) {
        console.error('Failed to fetch students:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [selectedClass]);

  const toggleStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleNoteChange = (studentId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      classId: `cls-${selectedClass.toLowerCase().replace('-', '')}`,
      date,
      records: Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
        note: notes[studentId] || undefined,
      })),
    };

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch('http://localhost:4000/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: `Attendance successfully marked for ${payload.records.length} students.` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to submit attendance.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Quick statistics
  const totalStudents = students.length;
  const presentCount = Object.values(attendance).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(attendance).filter((s) => s === 'LATE').length;

  return (
    <DashboardShell pageTitle="Attendance Capture" requiredRole="TEACHER">
      <div className="space-y-6 max-w-5xl mx-auto fade-in-up">
        {message && <AlertBanner type={message.type} message={message.text} />}

        {/* Configuration Bar */}
        <div className="glass rounded-2xl p-5 flex flex-wrap gap-4 items-end justify-between">
          <div className="flex gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 w-40"
              >
                <option value="10-A">Class 10 A</option>
                <option value="10-B">Class 10 B</option>
                <option value="9-A">Class 9 A</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">Session Date</label>
              <input
                type="date"
                value={date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 w-44"
              />
            </div>
          </div>

          <div className="flex gap-3 text-xs">
            <span className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl text-green-400 font-medium">
              Present: {presentCount}
            </span>
            <span className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl text-red-400 font-medium">
              Absent: {absentCount}
            </span>
            <span className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-amber-400 font-medium">
              Late: {lateCount}
            </span>
          </div>
        </div>

        {/* Student List Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass rounded-2xl overflow-hidden border border-slate-800">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400 text-sm">Loading classroom roster...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-20 text-center text-slate-400 text-sm">
                No students enrolled in Class {selectedClass}.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <div className="col-span-2">Roll No</div>
                  <div className="col-span-4">Student Name</div>
                  <div className="col-span-3 text-center">Status</div>
                  <div className="col-span-3">Remarks / Reason</div>
                </div>

                {students.map((student) => {
                  const status = attendance[student.id] || 'PRESENT';
                  return (
                    <div
                      key={student.id}
                      className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
                        status === 'ABSENT' ? 'bg-red-950/10' : status === 'LATE' ? 'bg-amber-950/10' : 'hover:bg-slate-900/20'
                      }`}
                    >
                      <div className="col-span-2 text-slate-300 font-mono text-sm">{student.rollNumber}</div>
                      <div className="col-span-4 font-medium text-white">
                        {student.firstName} {student.lastName}
                      </div>

                      {/* Attendance Toggles (UX Spec: ≤3 taps to complete) */}
                      <div className="col-span-3 flex justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'PRESENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            status === 'PRESENT'
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'ABSENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            status === 'ABSENT'
                              ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'LATE')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            status === 'LATE'
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          L
                        </button>
                      </div>

                      {/* Reason/Note */}
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder={status === 'ABSENT' ? 'e.g. Sick, Family event' : 'Optional note'}
                          value={notes[student.id] || ''}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          className="w-full bg-slate-900/60 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving || students.length === 0}
              className="bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition shadow-lg hover:shadow-green-500/10 cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Attendance...
                </>
              ) : (
                'Submit Attendance'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
