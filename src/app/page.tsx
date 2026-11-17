'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  findMembersByName, 
  createMember, 
  getMemberById, 
  getAllMembers 
} from '@/lib/firestore';
import { Member, Committee } from '@/types';
import Avatar from '@/components/Avatar';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  BookOpen, 
  Award, 
  Sparkles, 
  ArrowRight, 
  LogOut, 
  UserPlus, 
  LogIn,
  Star
} from 'lucide-react';

export default function HomePage() {
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  // Sign up Form
  const [name, setName] = useState('');
  const [committee, setCommittee] = useState<Committee>('Presentations');
  const [level, setLevel] = useState<number>(3);
  const [goal, setGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login Ambiguity List (if multiple members share name)
  const [duplicateMembers, setDuplicateMembers] = useState<Member[]>([]);

  // Check Local Session on mount
  useEffect(() => {
    async function loadSession() {
      const saved = localStorage.getItem('enactus_member');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Refetch fresh data from Firestore
          const fresh = await getMemberById(parsed.id);
          if (fresh) {
            setCurrentMember(fresh);
            // compute rank
            const all = await getAllMembers();
            const index = all.findIndex((m) => m.id === fresh.id);
            if (index !== -1) setRank(index + 1);
          } else {
            setCurrentMember(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    }
    loadSession();
  }, []);

  // Handle Sign-Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const newMember = await createMember({
        name,
        committee,
        level,
        goal,
      });

      localStorage.setItem('enactus_member', JSON.stringify(newMember));
      setCurrentMember(newMember);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to sign up. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Login by Name
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setDuplicateMembers([]);

    try {
      const matches = await findMembersByName(name);
      if (matches.length === 0) {
        setErrorMsg('No member found with that name. Please check spelling or sign up.');
      } else if (matches.length === 1) {
        const found = matches[0];
        localStorage.setItem('enactus_member', JSON.stringify(found));
        setCurrentMember(found);
      } else {
        // Multiple matches: show choice
        setDuplicateMembers(matches);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to login. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDuplicate = (member: Member) => {
    localStorage.setItem('enactus_member', JSON.stringify(member));
    setCurrentMember(member);
    setDuplicateMembers([]);
  };

  const handleSignOut = () => {
    localStorage.removeItem('enactus_member');
    setCurrentMember(null);
    setRank(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-xs">
        Loading Enactus Beta...
      </div>
    );
  }

  // --- LOGGED IN VIEW ---
  if (currentMember) {
    return (
      <div className="space-y-6 pb-6">
        {/* Top Bar with Sign Out */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-400">Beta Member</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch</span>
          </button>
        </div>

        {/* Member Profile Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/60 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={currentMember.name} size="lg" />
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
                {currentMember.name}
              </h1>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 text-[11px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full">
                {currentMember.committee}
              </span>
            </div>
          </div>

          {/* Points & Rank Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Points
              </span>
              <div className="text-2xl font-black text-yellow-400 mt-1">
                {currentMember.totalPoints ?? 0}
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Current Rank
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {rank ? `#${rank}` : '--'}
              </div>
            </div>
          </div>

          {/* Goal preview if available */}
          {currentMember.goal && (
            <div className="text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-300 font-semibold block mb-0.5">My Goal:</span>
              "{currentMember.goal}"
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-2">
          <Link
            href="/leaderboard"
            className="flex items-center justify-between p-4 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-400/10 text-yellow-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">
                  Check Leaderboard
                </h3>
                <p className="text-[11px] text-slate-400">See your ranking across committees</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-400 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/guidelines"
            className="flex items-center justify-between p-4 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-400/10 text-blue-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  Beta Guidelines
                </h3>
                <p className="text-[11px] text-slate-400">Points rules, feedback & session guide</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  // --- SIGN UP & LOGIN VIEW (FOR NEW / LOGGED OUT VISITORS) ---
  return (
    <div className="space-y-6 pb-6">
      {/* App Brand Header */}
      <div className="text-center space-y-1 pt-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 font-black text-xl mb-2 shadow-lg shadow-yellow-500/20">
          E
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">
          Enactus AU Presentations
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Presentations Committee Beta Platform
        </p>
      </div>

      {/* Switcher Tab */}
      <div className="grid grid-cols-2 gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => { setAuthMode('signup'); setErrorMsg(''); setDuplicateMembers([]); }}
          className={`py-2 rounded-lg transition-all ${
            authMode === 'signup'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          New Member (Sign Up)
        </button>
        <button
          onClick={() => { setAuthMode('login'); setErrorMsg(''); setDuplicateMembers([]); }}
          className={`py-2 rounded-lg transition-all ${
            authMode === 'login'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Already Signed Up
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Multiple Names Disambiguation List */}
      {duplicateMembers.length > 0 && (
        <div className="bg-slate-800/90 border border-yellow-500/40 p-4 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-yellow-400">
            Multiple members found with this name. Select yours:
          </p>
          <div className="space-y-2">
            {duplicateMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelectDuplicate(m)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-left hover:border-yellow-400 transition-colors"
              >
                <div>
                  <span className="font-semibold text-xs text-white block">{m.name}</span>
                  <span className="text-[10px] text-slate-400">{m.committee} • Level {m.level}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-yellow-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SIGN UP FORM */}
      {authMode === 'signup' && (
        <form onSubmit={handleSignUp} className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-3xl space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mariam Ahmed"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          {/* Committee - Preset to Presentations */}
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Committee</label>
            <div className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-xl text-xs text-yellow-400 font-semibold flex items-center justify-between">
              <span>Presentations Committee</span>
              <span className="text-[10px] bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">Beta</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-300 font-semibold">
                Self-rated Level (1 to 5) *
              </label>
              <span className="text-xs font-bold text-yellow-400">Level {level}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full accent-yellow-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Beginner (1)</span>
              <span>Advanced (5)</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">
              What do you want to improve most?
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Public speaking confidence, stage presence, speech structuring..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>{submitting ? 'Creating Profile...' : 'Join Beta App'}</span>
          </button>
        </form>
      )}

      {/* LOGIN BY NAME FORM */}
      {authMode === 'login' && (
        <form onSubmit={handleLogin} className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-3xl space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Your Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your exact registered name"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            <span>{submitting ? 'Searching...' : 'Continue to My Profile'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
