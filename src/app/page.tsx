'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  findMemberByEmailAndId,
  createMember,
  getMemberById,
  getAllMembers,
  updateMemberAvatar,
  getMemberPointHistory,
  getMemberBuddies,
  connectBuddies,
  getLatestSavedGroups
} from '@/lib/firestore';
import { Member, AvatarConfig, PointEvent, SavedGroup } from '@/types';
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
  Palette,
  Shield,
  Lock,
  History,
  Users,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  CalendarCheck,
  MessageSquareHeart,
  TrendingUp
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
  const [loginPassword, setLoginPassword] = useState('');

  // Pop-up Avatar & Permanent ID Modal
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [newMemberCreated, setNewMemberCreated] = useState<Member | null>(null);

  // Priority 4 Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [pointHistory, setPointHistory] = useState<PointEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [showBuddyModal, setShowBuddyModal] = useState(false);
  const [buddyInputId, setBuddyInputId] = useState('');
  const [buddyList, setBuddyList] = useState<{ id: string; name: string }[]>([]);
  const [buddyMsg, setBuddyMsg] = useState<{ text: string; error: boolean } | null>(null);

  const [myGroup, setMyGroup] = useState<{ teamNumber: number; peers: { id: string; name: string }[] } | null>(null);

  // Admin Dashboard Quick Stats
  const [allMembers, setAllMembers] = useState<Member[]>([]);

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
            setAllMembers(all);
            const index = all.findIndex((m) => m.id === fresh.id);
            if (index !== -1) setRank(index + 1);
            loadUserExtras(fresh.id);
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

  const loadUserExtras = async (memberId: string) => {
    // Load buddies
    const buddies = await getMemberBuddies(memberId);
    setBuddyList(buddies);

    // Load saved group for this session
    const saved = await getLatestSavedGroups();
    if (saved) {
      for (const g of saved.groups) {
        const found = g.members.find((m) => m.id === memberId);
        if (found) {
          setMyGroup({
            teamNumber: g.teamNumber,
            peers: g.members.filter((m) => m.id !== memberId),
          });
          break;
        }
      }
    }
  };

  const handleOpenPointHistory = async () => {
    if (!currentMember) return;
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const history = await getMemberPointHistory(currentMember.id);
      setPointHistory(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleConnectBuddy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember || !buddyInputId.trim()) return;

    setBuddyMsg(null);
    try {
      const res = await connectBuddies(
        { id: currentMember.id, name: currentMember.name },
        buddyInputId
      );
      if (res.success) {
        setBuddyMsg({ text: res.message, error: false });
        setBuddyInputId('');
        confetti({ particleCount: 70, spread: 60 });
        const freshBuddies = await getMemberBuddies(currentMember.id);
        setBuddyList(freshBuddies);
        // Refresh points
        const fresh = await getMemberById(currentMember.id);
        if (fresh) setCurrentMember(fresh);
      } else {
        setBuddyMsg({ text: res.message, error: true });
      }
    } catch (err: any) {
      setBuddyMsg({ text: err.message, error: true });
    }
  };

  // Handle Sign-Up (Name + Email only)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
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

    if (loginId.trim().toUpperCase() === 'ENC-2302' && !loginPassword.trim()) {
      setErrorMsg('Please enter your Coordinator Admin password.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const found = await findMemberByEmailAndId(loginEmail, loginId, loginPassword);
      if (!found) {
        setErrorMsg('Invalid credentials. Please verify your email, ID, or password.');
      } else {
        localStorage.setItem('enactus_member', JSON.stringify(found));
        if (found.role === 'admin' || found.id === 'ENC-2302') {
          sessionStorage.setItem('enactus_admin_auth', 'true');
        }
        setCurrentMember(found);
        loadUserExtras(found.id);
        const all = await getAllMembers();
        setAllMembers(all);
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
    sessionStorage.removeItem('enactus_admin_auth');
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

  // --- SPECIAL COORDINATOR ADMIN VIEW ---
  // If logged in as admin (ENC-2302), show dedicated Coordinator Command Center
  if (currentMember && (currentMember.role === 'admin' || currentMember.id === 'ENC-2302')) {
    return (
      <div className="space-y-6 pb-6">
        {/* Top Coordinator Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-black text-yellow-400 uppercase tracking-wider">
              Coordinator Portal • Hazem
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Coordinator Hero Banner */}
        <div className="p-5 bg-gradient-to-br from-yellow-500/20 via-amber-600/10 to-slate-900 border-2 border-yellow-400/40 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 text-slate-950 rounded-2xl shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Presentations Command Center</h1>
              <p className="text-xs text-yellow-300/80 font-mono">Coordinator ID: ENC-2302</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Welcome Hazem! From here you run live presentation sessions, review all peer & coordinator feedback, assign attendance streaks, and manage guidelines.
          </p>
        </div>

        {/* 4 Direct Coordinator Action Tiles */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/admin"
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex flex-col items-start gap-2 group transition-all"
          >
            <div className="p-2.5 rounded-xl bg-yellow-400/10 text-yellow-400 group-hover:bg-yellow-400 group-hover:text-slate-950 transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors">
                Manual Points
              </h3>
              <p className="text-[10px] text-slate-400">Award or deduct live session points</p>
            </div>
          </Link>

          <Link
            href="/admin"
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex flex-col items-start gap-2 group transition-all"
          >
            <div className="p-2.5 rounded-xl bg-emerald-400/10 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-colors">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                Sessions & Streaks
              </h3>
              <p className="text-[10px] text-slate-400">Mark attendance & fire bonuses</p>
            </div>
          </Link>

          <Link
            href="/feedback"
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex flex-col items-start gap-2 group transition-all"
          >
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                Feedback Moderation
              </h3>
              <p className="text-[10px] text-slate-400">Read all peer & coordinator feedback</p>
            </div>
          </Link>

          <Link
            href="/leaderboard"
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex flex-col items-start gap-2 group transition-all"
          >
            <div className="p-2.5 rounded-xl bg-cyan-400/10 text-cyan-400 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                Live Leaderboard
              </h3>
              <p className="text-[10px] text-slate-400">Inspect rankings, IDs & streaks</p>
            </div>
          </Link>
        </div>

        {/* Member Directory Overview */}
        <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-yellow-400" />
              <span>Registered Members ({allMembers.filter(m => m.id !== 'ENC-2302').length})</span>
            </h3>
            <Link
              href="/admin"
              className="px-2.5 py-1 bg-yellow-400 text-slate-950 font-black rounded-lg text-xs hover:bg-yellow-300 transition-colors"
            >
              Open Members & CSV Tools →
            </Link>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {allMembers
              .filter(m => m.id !== 'ENC-2302')
              .map(m => (
                <div key={m.id} className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <BotAvatar config={m.avatar} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white block">{m.name}</span>
                        {m.titleBadge && (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                            🎖️ {m.titleBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-yellow-400 font-mono">ID: {m.id}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-yellow-400">{m.totalPoints || 0} pts</span>
                    <span className="text-[10px] text-slate-500 block">Streak: 🔥 {m.streak || 0}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // --- REGULAR MEMBER HOME VIEW ---
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

        {/* Member Profile Card with Character Face & ID */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/60 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <BotAvatar config={currentMember.avatar} size="lg" />
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
                  {currentMember.name}
                </h1>
                {currentMember.titleBadge && (
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                    🎖️ {currentMember.titleBadge}
                  </span>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700 text-yellow-400 font-bold">
                    ID: {currentMember.id}
                  </span>
                  <span className="text-[10px] text-slate-400">Presentations</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setNewMemberCreated(currentMember);
                setShowCustomizer(true);
              }}
              className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Customize Character"
            >
              <Palette className="w-4 h-4 text-yellow-400" />
            </button>
          </div>

          {/* Points & Rank Grid (Tap points to see History - Priority 4) */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
            <div
              onClick={handleOpenPointHistory}
              className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50 cursor-pointer hover:border-yellow-400/50 transition-colors group relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Total Points
                </span>
                <History className="w-3.5 h-3.5 text-slate-500 group-hover:text-yellow-400" />
              </div>
              <div className="text-2xl font-black text-yellow-400 mt-1">
                {currentMember.totalPoints ?? 0}
              </div>
              <span className="text-[9px] text-yellow-400/70 block mt-0.5 font-medium">Tap for history →</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Current Rank
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {rank ? `#${rank}` : '--'}
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">Live standing</span>
            </div>
          </div>

          {/* Session Attendance Streak Track (Priority 2) */}
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

            <div className="flex items-center justify-between pt-1">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isEarned = streakCount >= num;
                const bonusPoints = num * 5;

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
              Earn an extra bonus (+5, +10, +15, +20...) for every session attended on time!
            </p>
          </div>

          {/* Priority 4: Saved Session Group Tile (if assigned) */}
          {myGroup && (
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Users className="w-4 h-4" />
                <span>My Team for Today (Team {myGroup.teamNumber})</span>
              </div>
              <p className="text-xs text-slate-200">
                Teammates: <strong>{myGroup.peers.map(p => p.name).join(', ') || 'Solo'}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Quick Action Navigation */}
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

        {/* Priority 4: MODAL 1 - Point History Breakdown */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-bold text-sm text-white">Points History Log</h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {loadingHistory ? (
                  <p className="text-center py-8 text-xs text-slate-400">Loading history...</p>
                ) : pointHistory.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">No point events recorded yet.</p>
                ) : (
                  pointHistory.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white block">{event.reason}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(event.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span
                        className={`font-black text-sm ${event.amount >= 0 ? 'text-yellow-400' : 'text-rose-400'
                          }`}
                      >
                        {event.amount >= 0 ? `+${event.amount}` : event.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Priority 4: MODAL 2 - Buddy System with ID / QR */}
        {showBuddyModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Presentation Buddies</h3>
                </div>
                <button
                  onClick={() => setShowBuddyModal(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              {/* Your Personal ID Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Your Personal Member ID
                </span>
                <div className="font-mono text-2xl font-black text-yellow-400 tracking-widest">
                  {currentMember.id}
                </div>
                <p className="text-[11px] text-slate-400">
                  Show this ID to a fellow member to connect and both earn <strong>+15 points</strong>!
                </p>
              </div>

              {/* Connect with Buddy Form */}
              <form onSubmit={handleConnectBuddy} className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-300">
                  Enter Peer's Member ID (e.g. EN-8492)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={buddyInputId}
                    onChange={(e) => setBuddyInputId(e.target.value.toUpperCase())}
                    placeholder="EN-XXXX"
                    className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all"
                  >
                    Connect
                  </button>
                </div>

                {buddyMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${buddyMsg.error
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                      : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      }`}
                  >
                    {buddyMsg.error ? (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{buddyMsg.text}</span>
                  </div>
                )}
              </form>

              {/* Connected Buddies List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300">
                  My Connected Buddies ({buddyList.length})
                </h4>
                {buddyList.length === 0 ? (
                  <p className="text-xs text-slate-500">No buddies connected yet. Meet someone today!</p>
                ) : (
                  <div className="space-y-1.5">
                    {buddyList.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-white">{b.name}</span>
                        <span className="text-[10px] text-yellow-400 font-mono">{b.id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
          Presentations Committee Platform & Peer Education
        </p>
      </div>

      {/* Switcher Tab */}
      <div className="grid grid-cols-2 gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
          className={`py-2 rounded-lg transition-all ${authMode === 'signup'
            ? 'bg-yellow-400 text-slate-950 shadow-sm'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          New Member (Sign Up)
        </button>
        <button
          onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
          className={`py-2 rounded-lg transition-all ${authMode === 'login'
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
              placeholder="Enter your email"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
              <span>Permanent Member ID (or Coordinator ID)</span>
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value.toUpperCase())}
              placeholder="EN-XXXX (or ENC-2302)"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          {/* Conditional Admin Password Field */}
          {loginId.trim().toUpperCase() === 'ENC-2302' && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-xs text-yellow-400 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Coordinator Password</span>
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter coordinator secret password"
                className="w-full px-3.5 py-2.5 bg-slate-900 border-2 border-yellow-400/50 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>
              {submitting
                ? 'Authenticating...'
                : loginId.trim().toUpperCase() === 'ENC-2302'
                  ? 'Sign In as Coordinator'
                  : 'Sign In with Email & ID'}
            </span>
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
