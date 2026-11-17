'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  findMemberByEmailAndId, 
  createMember, 
  getMemberById, 
  getAllMembers,
  updateMemberAvatar
} from '@/lib/firestore';
import { Member, AvatarConfig } from '@/types';
import BotAvatar from '@/components/BotAvatar';
import AvatarCustomizer from '@/components/AvatarCustomizer';
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
  Star,
  Flame,
  KeyRound,
  Mail,
  User,
  Palette
} from 'lucide-react';

export default function HomePage() {
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Mode: 'signup' | 'login'
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');

  // Sign up Form: Name + Email only
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Login Form: Email + ID
  const [loginEmail, setLoginEmail] = useState('');
  const [loginId, setLoginId] = useState('');

  // Pop-up Avatar & Permanent ID Modal
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [newMemberCreated, setNewMemberCreated] = useState<Member | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check Local Session on mount
  useEffect(() => {
    async function loadSession() {
      const saved = localStorage.getItem('enactus_member');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const fresh = await getMemberById(parsed.id);
          if (fresh) {
            setCurrentMember(fresh);
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

  // Handle Sign-Up (Name + Email only)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      // Create member with default bot avatar config
      const defaultAvatar: AvatarConfig = {
        type: 'robot',
        color: 'blue',
        shape: 'rounded',
        accessory: 'antenna',
      };

      const newMember = await createMember({
        name,
        email,
        avatar: defaultAvatar,
      });

      // Show Customizer Popup with their Permanent ID
      setNewMemberCreated(newMember);
      setShowCustomizer(true);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to sign up. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Complete Avatar Customization
  const handleCompleteCustomization = async (avatar: AvatarConfig) => {
    if (!newMemberCreated) return;

    try {
      await updateMemberAvatar(newMemberCreated.id, avatar);
      const updated = { ...newMemberCreated, avatar };
      localStorage.setItem('enactus_member', JSON.stringify(updated));
      setCurrentMember(updated);
      setShowCustomizer(false);
      setNewMemberCreated(null);
    } catch (err) {
      console.error(err);
      setShowCustomizer(false);
    }
  };

  // Handle Sign-In with Email and ID
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginId.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const found = await findMemberByEmailAndId(loginEmail, loginId);
      if (!found) {
        setErrorMsg('Invalid email or Member ID. Please double-check both.');
      } else {
        localStorage.setItem('enactus_member', JSON.stringify(found));
        setCurrentMember(found);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to sign in. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('enactus_member');
    setCurrentMember(null);
    setRank(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-xs">
        Loading Enactus Presentations...
      </div>
    );
  }

  // --- LOGGED IN HOME VIEW ---
  if (currentMember) {
    const streakCount = currentMember.streak || 0;

    return (
      <div className="space-y-6 pb-6">
        {/* Top Bar with Switch Account */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-400">Presentations Member</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch</span>
          </button>
        </div>

        {/* Member Profile Card with Robot Avatar & ID */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/60 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <BotAvatar config={currentMember.avatar} size="lg" />
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
                  {currentMember.name}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700 text-yellow-400 font-bold">
                    ID: {currentMember.id}
                  </span>
                  <span className="text-[10px] text-slate-400">Presentations</span>
                </div>
              </div>
            </div>

            {/* Quick edit bot button */}
            <button
              onClick={() => {
                setNewMemberCreated(currentMember);
                setShowCustomizer(true);
              }}
              className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Customize Avatar"
            >
              <Palette className="w-4 h-4 text-yellow-400" />
            </button>
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

          {/* Priority 2: Session Streak Display (Star Design) */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400">
                <Flame className="w-4 h-4 fill-yellow-400 text-yellow-400 animate-bounce" />
                <span>Session Attendance Streak</span>
              </div>
              <span className="text-xs font-black text-white">
                {streakCount} {streakCount === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>

            {/* Visual Star Track for Attendance with bonus for EVERY session */}
            <div className="flex items-center justify-between pt-1">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isEarned = streakCount >= num;
                const bonusPoints = num * 5; // Streak bonus increases every session

                return (
                  <div key={num} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                        isEarned
                          ? 'bg-yellow-400 border-yellow-300 text-slate-950 font-black shadow-md shadow-yellow-500/30 scale-105'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {isEarned ? (
                        <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                      ) : (
                        <span className="text-[10px] font-bold">{num}</span>
                      )}
                    </div>
                    <span className={`text-[8px] font-bold ${isEarned ? 'text-amber-400' : 'text-slate-500'}`}>
                      +{bonusPoints}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Earn an extra bonus (+5, +10, +15, +20...) for <strong>every consecutive session</strong> attended on time!
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-2">
          <Link
            href="/feedback"
            className="flex items-center justify-between p-4 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Feedback Center
                </h3>
                <p className="text-[11px] text-slate-400">2 Stars & 1 Wish • Session evaluation (+5 pts)</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
          </Link>

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
                <p className="text-[11px] text-slate-400">See your ranking and live standings</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Customizer Modal if Triggered */}
        {showCustomizer && newMemberCreated && (
          <AvatarCustomizer
            memberId={newMemberCreated.id}
            initialConfig={newMemberCreated.avatar}
            onComplete={handleCompleteCustomization}
          />
        )}
      </div>
    );
  }

  // --- SIGN UP & LOGIN VIEW (FOR LOGGED OUT VISITORS) ---
  return (
    <div className="space-y-6 pb-6">
      {/* App Header */}
      <div className="text-center space-y-1 pt-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 font-black text-xl mb-2 shadow-lg shadow-yellow-500/20">
          E
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">
          Enactus AU Presentations
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Presentations Committee Platform & Session Streaks
        </p>
      </div>

      {/* Switcher Tab */}
      <div className="grid grid-cols-2 gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
          className={`py-2 rounded-lg transition-all ${
            authMode === 'signup'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          New Member (Sign Up)
        </button>
        <button
          onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
          className={`py-2 rounded-lg transition-all ${
            authMode === 'login'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign In (Email + ID)
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* SIGN UP FORM (Name + Email Only) */}
      {authMode === 'signup' && (
        <form onSubmit={handleSignUp} className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-3xl space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-yellow-400" />
              <span>Full Name *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mariam Ahmed"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-yellow-400" />
              <span>Email Address *</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mariam@gmail.com"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{submitting ? 'Generating Your ID...' : 'Sign Up & Pick Character'}</span>
          </button>
        </form>
      )}

      {/* SIGN IN FORM (Email + ID) */}
      {authMode === 'login' && (
        <form onSubmit={handleLogin} className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-3xl space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-yellow-400" />
              <span>Your Email</span>
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
              <span>Permanent Member ID (e.g. EN-7492)</span>
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value.toUpperCase())}
              placeholder="EN-XXXX"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{submitting ? 'Authenticating...' : 'Sign In with Email & ID'}</span>
          </button>
        </form>
      )}

      {/* Pop-up Customizer Modal */}
      {showCustomizer && newMemberCreated && (
        <AvatarCustomizer
          memberId={newMemberCreated.id}
          initialConfig={newMemberCreated.avatar}
          onComplete={handleCompleteCustomization}
        />
      )}
    </div>
  );
}
