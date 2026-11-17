'use client';

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import AdminContent from '@/components/AdminContent';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Check saved admin session in sessionStorage or localStorage
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('enactus_admin_auth');
    const member = localStorage.getItem('enactus_member');
    if (savedAuth === 'true' || (member && JSON.parse(member).id === 'ENC-2302')) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = '23022006Ha#';
    if (passwordInput === correctPass) {
      setIsAuthenticated(true);
      sessionStorage.setItem('enactus_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect admin password. Try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
          <Lock className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-white">Coordinators Access</h1>
          <p className="text-xs text-slate-400">Enter your coordinator password</p>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Coordinator Password"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
          />

          {authError && (
            <p className="text-rose-400 text-xs text-center">{authError}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md"
          >
            Unlock Admin Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-base font-bold text-white">Admin Dashboard</h1>
      </div>
      <AdminContent />
    </div>
  );
}
