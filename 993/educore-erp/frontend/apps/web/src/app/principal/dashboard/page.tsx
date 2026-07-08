'use client';
import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, AlertBanner } from '@/components/ui/DashboardWidgets';

export default function PrincipalDashboard() {
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, excused: 0 });
  
  useEffect(() => {
    async function fetchAttendance() {
      try {
        const token = localStorage.getItem('educore_token');
        const res = await fetch(`http://localhost:4000/api/attendance/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setAttendanceStats({
            present: data.data.PRESENT || 0,
            absent: data.data.ABSENT || 0,
            late: data.data.LATE || 0,
            excused: data.data.EXCUSED || 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch attendance summary', err);
      }
    }
    fetchAttendance();
  }, []);

  const total = attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.excused;
  const avgAttendance = total > 0 ? Math.round((attendanceStats.present / total) * 100) + '%' : 'N/A';

  return (
    <DashboardShell pageTitle="Principal's Overview" requiredRole="PRINCIPAL">
      <div className="space-y-6 fade-in-up">
        <AlertBanner type="info" message="3 approval requests pending your review — field trip consent and 2 leave applications." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Classes Running" value="42" icon="🏫" color="indigo" />
          <StatCard label="Overall Attendance" value={avgAttendance} icon="✅" color="green" />
          <StatCard label="Total Absent" value={attendanceStats.absent.toString()} icon="❌" color="red" />
          <StatCard label="Upcoming Exams" value="2" icon="✏️" color="purple" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Department Attendance Today</h2>
          <div className="space-y-2">
            {[['Science', '94%'], ['Commerce', '97%'], ['Arts', '89%'], ['Engineering', '92%']].map(([d, a]) => (
              <div key={d} className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl">
                <span className="text-white text-sm flex-1">{d}</span>
                <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: a }} />
                </div>
                <span className="text-slate-300 text-xs w-10 text-right">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
