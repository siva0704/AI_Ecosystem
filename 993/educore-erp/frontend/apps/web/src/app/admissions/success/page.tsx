'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const params = useSearchParams();
  const code = params.get('code') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-lg">EC</div>
          <div>
            <div className="font-bold text-white">EduCore ERP</div>
            <div className="text-xs text-indigo-300">Greenfield Academy</div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full text-center">
          {/* Success Animation */}
          <div className="w-28 h-28 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-green-500/10">
            <span className="text-6xl">🎉</span>
          </div>

          <h1 className="text-3xl font-bold mb-3">Application Submitted!</h1>
          <p className="text-slate-400 text-lg mb-10">
            Your application has been received. We will review it and contact you at the email provided.
          </p>

          {/* App Code Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8">
            <p className="text-sm text-slate-400 mb-2">Your Application Code</p>
            <div className="text-4xl font-mono font-bold tracking-widest text-green-300 mb-3">{code}</div>
            <p className="text-xs text-slate-500">Save this code to track your application status</p>
          </div>

          {/* What's Next */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left mb-8">
            <h2 className="font-semibold mb-4 text-sm text-slate-300 uppercase tracking-wider">What happens next?</h2>
            <div className="space-y-3">
              {[
                { icon: '📄', text: 'Prepare your documents: mark sheet, transfer certificate, ID proof, and passport photo' },
                { icon: '📧', text: 'Check your email for confirmation and document submission instructions' },
                { icon: '🔍', text: 'Track your application status anytime using your Application Code' },
                { icon: '✅', text: 'Once documents are verified, our admissions team will contact you for next steps' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-lg mt-0.5">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`/admissions/status?id=${code}`}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-lg shadow-indigo-500/20">
              🔍 Track My Application
            </a>
            <a href="/admissions"
              className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition border border-white/10">
              Submit Another Application
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdmissionsSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
