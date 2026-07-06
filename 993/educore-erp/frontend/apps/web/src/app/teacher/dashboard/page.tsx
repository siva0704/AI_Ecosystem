'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, QuickAction, AlertBanner } from '@/components/ui/DashboardWidgets';

interface TeacherStats {
  classesToday: number;
  studentsPresent: string;
  assignmentsDue: number;
  pendingGrading: number;
  attendanceMarked: boolean;
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const token = localStorage.getItem('educore_token');
        const res = await fetch('http://localhost:4000/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <DashboardShell pageTitle="My Classroom" requiredRole="TEACHER">
      <div className="space-y-6 fade-in-up">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading classroom state...</div>
        ) : (
          <>
            {stats?.attendanceMarked ? (
              <AlertBanner type="success" message="✓ Attendance for Class 10-A has been marked today." />
            ) : (
              <AlertBanner type="warning" message="⚠ Attendance for Class 10-A not yet marked today. Please mark before 10:30 AM." />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Classes Today" value={stats?.classesToday ?? 4} icon="🏫" color="green" />
              <StatCard label="Students Present" value={stats?.studentsPresent ?? '0 / 42'} icon="✅" color="cyan" />
              <StatCard label="Pending Grading" value={stats?.pendingGrading ?? 14} icon="📊" color="amber" />
              <StatCard label="Assignments Due" value={stats?.assignmentsDue ?? 2} icon="📝" color="pink" />
            </div>
          </>
        )}

        <div>
          <h2 className="text-white font-semibold text-base mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <QuickAction label="Mark Attendance" icon="✅" href="/teacher/attendance" />
            <QuickAction label="New Assignment" icon="📝" href="/teacher/assignments" />
            <QuickAction label="Enter Grades" icon="📊" href="/teacher/gradebook" />
            <QuickAction label="View Timetable" icon="🗓️" href="/teacher/timetable" />
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Today&apos;s Schedule</h2>
          <div className="space-y-2">
            {[
              ['08:00 AM', 'Mathematics', 'Class 10-A', '🟢 Done'],
              ['10:00 AM', 'Mathematics', 'Class 10-B', '🟡 Next'],
              ['12:00 PM', 'Physics', 'Class 11-A', '⚪ Upcoming'],
              ['02:00 PM', 'Mathematics Lab', 'Class 10-A', '⚪ Upcoming'],
            ].map(([time, subject, cls, status]) => (
              <div key={time} className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 text-xs font-mono w-20">{time}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{subject}</p>
                  <p className="text-slate-400 text-xs">{cls}</p>
                </div>
                <span className="text-xs">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
