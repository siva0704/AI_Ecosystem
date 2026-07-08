'use client';
import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/DashboardWidgets';

export default function HODDashboard() {
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
    <DashboardShell pageTitle="Department Head" requiredRole="HOD">
      <div className="space-y-6 fade-in-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Department Staff" value="18" icon="👥" color="cyan" />
          <StatCard label="Subjects" value="12" icon="📖" color="indigo" />
          <StatCard label="Avg Attendance" value={avgAttendance} icon="✅" color="green" />
          <StatCard label="Total Absent" value={attendanceStats.absent.toString()} icon="❌" color="red" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Subject Performance</h2>
          <div className="space-y-2">
            {[['Mathematics', '82%', '28 teachers'], ['Physics', '78%', '12 teachers'], ['Chemistry', '85%', '10 teachers']].map(([sub, avg, staff]) => (
              <div key={sub} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="flex-1"><p className="text-white text-sm">{sub}</p><p className="text-slate-400 text-xs">{staff}</p></div>
                <span className="text-cyan-400 font-semibold text-sm">{avg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
