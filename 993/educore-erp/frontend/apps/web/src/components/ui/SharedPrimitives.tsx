'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// ─── Badge Component ─────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'indigo' | 'green' | 'amber' | 'red' | 'purple' | 'cyan' | 'pink' | 'orange' | 'slate';
  className?: string;
}

const BADGE_STYLES = {
  indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  green:  'bg-green-500/10 border-green-500/30 text-green-400',
  amber:  'bg-amber-500/10 border-amber-500/30 text-amber-400',
  red:    'bg-red-500/10 border-red-500/30 text-red-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  cyan:   'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  pink:   'bg-pink-500/10 border-pink-500/30 text-pink-400',
  orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  slate:  'bg-slate-500/10 border-slate-500/30 text-slate-400',
};

export function Badge({ children, variant = 'indigo', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', BADGE_STYLES[variant], className)}>
      {children}
    </span>
  );
}

// ─── Form Inputs ─────────────────────────────────────────────────────────────
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        <label className="block text-slate-400 text-xs font-medium">{label}</label>
        <input
          ref={ref}
          className={cn(
            'w-full bg-slate-900 border text-white rounded-xl px-4 py-2.5 text-sm transition focus:outline-none',
            error ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-indigo-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);
FormInput.displayName = 'FormInput';

// ─── Search Bar with Keyboard Shortcut ───────────────────────────────────────
interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
}

export function SearchBar({ placeholder = 'Search...', value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-800 border border-slate-750 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-mono pointer-events-none select-none">
        <span>⌘</span><span>K</span>
      </div>
    </div>
  );
}

// ─── Modal Dialog ────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass max-w-lg w-full rounded-2xl p-6 border border-slate-700/80 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-white font-bold text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Data Table with Sorting and Filter ──────────────────────────────────────
interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: keyof T;
}

export function DataTable<T extends Record<string, any>>({ columns, data, searchKey }: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filtered = data.filter((row) => {
    if (!searchKey) return true;
    const val = row[searchKey];
    return String(val).toLowerCase().includes(search.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      {searchKey && (
        <SearchBar placeholder={`Search table by ${String(searchKey)}...`} value={search} onChange={setSearch} />
      )}
      <div className="glass rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-850 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={cn('p-4', col.sortable && 'cursor-pointer select-none hover:text-white transition-colors')}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable && sortKey === col.key && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-slate-500 text-sm">
                  No records matching the search criteria.
                </td>
              </tr>
            ) : (
              sorted.map((row, idx) => (
                <tr key={idx} className="text-xs text-slate-300 hover:bg-slate-900/10 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="p-4">
                      {col.render ? col.render(row) : String(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
