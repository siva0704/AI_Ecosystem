'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available_copies: number;
}

interface Transaction {
  id: string;
  book_id: string;
  student_id: string;
  due_date: string;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
}

export default function LibraryTransactionsPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [searchBook, setSearchBook] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks return window
    return d.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch lists
  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem('educore_token');
        
        // Books
        const bRes = await fetch(`http://localhost:4000/api/library/books?search=${searchBook}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bData = await bRes.json();
        if (bData.success) setBooks(bData.data);

        // Students
        const sRes = await fetch(`http://localhost:4000/api/students?limit=20&search=${searchStudent}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sData = await sRes.json();
        if (sData.success) setStudents(sData.data);

        // Transactions
        const tRes = await fetch('http://localhost:4000/api/library/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tData = await tRes.json();
        if (tData.success) setTransactions(tData.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [searchBook, searchStudent]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !selectedStudent) return;
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch('http://localhost:4000/api/library/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: selectedBook.id,
          studentId: selectedStudent.id,
          dueDate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Issued "${selectedBook.title}" successfully.` });
        setSelectedBook(null);
        setSelectedStudent(null);
        // Refresh transactions list
        const updated = await fetch('http://localhost:4000/api/library/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedData = await updated.json();
        if (updatedData.success) setTransactions(updatedData.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to issue book' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (txnId: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`http://localhost:4000/api/library/return/${txnId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Book returned successfully to inventory.' });
        // Refresh transactions list
        const updated = await fetch('http://localhost:4000/api/library/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedData = await updated.json();
        if (updatedData.success) setTransactions(updatedData.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to return book' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell pageTitle="Library Desk — Issue & Return Station" requiredRole="LIBRARIAN">
      <div className="space-y-6 max-w-6xl mx-auto fade-in-up">
        {message && <AlertBanner type={message.type} message={message.text} />}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Panel 1: Circulation Setup Form */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Issue Book Station</h3>
            <form onSubmit={handleIssue} className="space-y-4">
              {/* Search Book */}
              <div>
                <label className="block text-slate-400 text-xs mb-1.5 font-medium">Select Book</label>
                <input
                  type="text"
                  placeholder="🔍 Type ISBN or Title..."
                  value={searchBook}
                  onChange={(e) => setSearchBook(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-violet-500 mb-2"
                />
                <div className="max-h-[120px] overflow-y-auto space-y-1.5">
                  {books.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBook(b)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition border ${
                        selectedBook?.id === b.id ? 'bg-violet-500/20 border-violet-500/30 text-white' : 'bg-slate-800/40 hover:bg-slate-800/80 border-transparent text-slate-300'
                      }`}
                    >
                      {b.title} ({b.available_copies} left)
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Student */}
              <div>
                <label className="block text-slate-400 text-xs mb-1.5 font-medium">Borrowing Student</label>
                <input
                  type="text"
                  placeholder="🔍 Type Student Name..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-violet-500 mb-2"
                />
                <div className="max-h-[120px] overflow-y-auto space-y-1.5">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStudent(s)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition border ${
                        selectedStudent?.id === s.id ? 'bg-violet-500/20 border-violet-500/30 text-white' : 'bg-slate-800/40 hover:bg-slate-800/80 border-transparent text-slate-300'
                      }`}
                    >
                      {s.firstName} {s.lastName} ({s.rollNumber})
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-slate-400 text-xs mb-1.5 font-medium">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedBook || !selectedStudent}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 text-white font-semibold text-sm py-3 rounded-xl transition cursor-pointer flex items-center justify-center"
              >
                {loading ? 'Processing...' : 'Issue Book'}
              </button>
            </form>
          </div>

          {/* Panel 2 & 3: Circulation Log & Overdue returns */}
          <div className="md:col-span-2 glass rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Active Issue Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 text-xs uppercase">
                    <th className="py-2.5">Book ID</th>
                    <th className="py-2.5">Borrower ID</th>
                    <th className="py-2.5">Due Date</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="text-xs text-slate-300 hover:bg-slate-900/10">
                      <td className="py-3 font-mono text-[11px] truncate max-w-[100px]">{txn.book_id}</td>
                      <td className="py-3 font-mono text-[11px] truncate max-w-[100px]">{txn.student_id}</td>
                      <td className="py-3">{txn.due_date}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          txn.status === 'RETURNED' ? 'bg-green-500/20 text-green-400' : txn.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-violet-500/20 text-violet-400'
                        }`}>{txn.status}</span>
                      </td>
                      <td className="py-3 text-right">
                        {txn.status !== 'RETURNED' && (
                          <button
                            onClick={() => handleReturn(txn.id)}
                            className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-2.5 py-1 rounded transition text-[10px]"
                          >
                            Return Book
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
