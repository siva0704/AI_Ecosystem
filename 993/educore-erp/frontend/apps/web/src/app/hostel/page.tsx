'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';
import { API_BASE } from '@/lib/types/auth';

interface Room {
  id: string;
  roomNumber: string;
  block: string;
  capacity: number;
  occupied: number;
  roomType: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
}

interface Allocation {
  id: string;
  roomId: string;
  studentId: string;
  checkInDate: string;
  checkOutDate: string | null;
  status: 'ACTIVE' | 'CHECKED_OUT';
  roomNumber: string;
  block: string;
  studentFirstName: string;
  studentLastName: string;
  rollNumber: string;
}

export default function HostelDashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('educore_token');
      
      const rRes = await fetch(`${API_BASE}/api/hostel/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rData = await rRes.json();
      if (rData.success) setRooms(rData.data);

      const aRes = await fetch(`${API_BASE}/api/hostel/allocations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const aData = await aRes.json();
      if (aData.success) setAllocations(aData.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      const token = localStorage.getItem('educore_token');
      const sRes = await fetch(`${API_BASE}/api/students?limit=20&search=${searchStudent}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sData = await sRes.json();
      if (sData.success) setStudents(sData.data);
    };
    const timer = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timer);
  }, [searchStudent]);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !selectedStudent) return;
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/hostel/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          studentId: selectedStudent.id,
          checkInDate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Allocated room successfully.` });
        setSelectedRoom(null);
        setSelectedStudent(null);
        loadData(); // refresh
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to allocate room' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (id: string) => {
    if (!confirm('Are you sure you want to checkout this student?')) return;
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/hostel/allocate/${id}/checkout`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Checkout successful.' });
        loadData(); // refresh
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to checkout' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell pageTitle="Hostel Management" requiredRole="HOSTEL_WARDEN">
      <div className="space-y-6 max-w-6xl mx-auto fade-in-up">
        {message && <AlertBanner type={message.type} message={message.text} />}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Panel 1: Allocation Form */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Room Allocation</h3>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1.5 font-medium">Select Available Room</label>
                <div className="max-h-[150px] overflow-y-auto space-y-1.5">
                  {rooms.filter(r => r.occupied < r.capacity).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoom(r)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition border ${
                        selectedRoom?.id === r.id ? 'bg-indigo-500/20 border-indigo-500/30 text-white' : 'bg-slate-800/40 hover:bg-slate-800/80 border-transparent text-slate-300'
                      }`}
                    >
                      Block {r.block} - Room {r.roomNumber} ({r.occupied}/{r.capacity})
                    </button>
                  ))}
                  {rooms.filter(r => r.occupied < r.capacity).length === 0 && (
                    <div className="text-slate-500 text-xs p-2">No available rooms.</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1.5 font-medium">Select Student</label>
                <input
                  type="text"
                  placeholder="🔍 Type Student Name..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 mb-2"
                />
                <div className="max-h-[120px] overflow-y-auto space-y-1.5">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStudent(s)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition border ${
                        selectedStudent?.id === s.id ? 'bg-indigo-500/20 border-indigo-500/30 text-white' : 'bg-slate-800/40 hover:bg-slate-800/80 border-transparent text-slate-300'
                      }`}
                    >
                      {s.firstName} {s.lastName} ({s.rollNumber})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1.5 font-medium">Check-In Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedRoom || !selectedStudent}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-sm py-3 rounded-xl transition cursor-pointer flex items-center justify-center"
              >
                {loading ? 'Processing...' : 'Allocate Room'}
              </button>
            </form>
          </div>

          {/* Panel 2 & 3: Allocation Log */}
          <div className="md:col-span-2 glass rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Hostel Allocations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 text-xs uppercase">
                    <th className="py-2.5">Room</th>
                    <th className="py-2.5">Student</th>
                    <th className="py-2.5">Check In</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allocations.map((alloc) => (
                    <tr key={alloc.id} className="text-xs text-slate-300 hover:bg-slate-900/10">
                      <td className="py-3 font-medium text-slate-200">B{alloc.block}-{alloc.roomNumber}</td>
                      <td className="py-3 font-medium text-slate-200">{alloc.studentFirstName} {alloc.studentLastName} ({alloc.rollNumber})</td>
                      <td className="py-3">{alloc.checkInDate}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          alloc.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                        }`}>{alloc.status.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3 text-right">
                        {alloc.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleCheckout(alloc.id)}
                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2.5 py-1 rounded transition text-[10px]"
                          >
                            Checkout
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allocations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No allocations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
