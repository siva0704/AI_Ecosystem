'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { API_BASE } from '@/lib/types/auth';
import { AlertBanner } from '@/components/ui/DashboardWidgets';

interface ClassData {
  id: string;
  grade: string;
  section: string;
  studentCount?: number;
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const token = localStorage.getItem('educore_token');
        const res = await fetch(`${API_BASE}/api/academic/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          // Add mock student count since API doesn't return it yet
          const enhancedClasses = data.data.map((c: any) => ({
            ...c,
            studentCount: Math.floor(Math.random() * 15) + 20, // 20-35 students
          }));
          setClasses(enhancedClasses);
        }
      } catch (err) {
        console.error('Failed to fetch classes', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, []);

  return (
    <DashboardShell pageTitle="My Assigned Classes" requiredRole="TEACHER">
      <div className="space-y-6 fade-in-up">
        
        <AlertBanner type="info" message="These are the classes where you are marked as the Class Teacher. Subject-specific assignments will appear in the Timetable section." />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="text-slate-400">Loading your classes...</div>
          ) : classes.length === 0 ? (
            <div className="text-slate-400">You have no assigned classes.</div>
          ) : (
            classes.map((c) => (
              <div key={c.id} className="glass p-6 rounded-2xl flex flex-col group hover:border-green-500/30 transition border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                  <span className="text-6xl">🏫</span>
                </div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center text-xl font-bold">
                    {c.grade}
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-bold">Class {c.grade}-{c.section}</h3>
                    <p className="text-slate-400 text-sm">Academic Year 2026-27</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                    <p className="text-slate-500 text-xs mb-1">Students</p>
                    <p className="text-white font-semibold">{c.studentCount}</p>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                    <p className="text-slate-500 text-xs mb-1">Today's Attendance</p>
                    <p className="text-amber-400 font-semibold text-sm mt-0.5">Pending</p>
                  </div>
                </div>

                <div className="mt-auto relative z-10">
                  <a href={`/teacher/attendance?classId=${c.id}`} className="w-full block text-center bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-white text-sm font-medium py-2.5 rounded-xl transition border border-white/10 hover:border-green-500/30">
                    Mark Attendance
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
