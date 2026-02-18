'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// BYPASS LOGIN - Demo Mode
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect automatico alla dashboard dopo 1 secondo
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl text-center">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-900">AROS Voice</h2>
        <p className="mt-2 text-slate-600">Accesso Demo Mode...</p>
        <div className="mt-4 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-4 text-sm text-slate-500">Reindirizzamento al gestionale...</p>
      </div>
    </div>
  );
}
