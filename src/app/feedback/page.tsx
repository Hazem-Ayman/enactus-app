'use client';

import { useState, useEffect } from 'react';
import { 
  getAllMembers, 
  submitFeedback, 
  getReceivedFeedback, 
  flagFeedback,
  submitSessionFeedback,
  getAllFeedbackForAdmin,
  getAllSessionFeedback,
  deleteFeedbackItem,
  deleteSessionFeedbackItem
} from '@/lib/firestore';
import { Member, Feedback, SessionFeedback } from '@/types';
import DiceBearAvatar from '@/components/DiceBearAvatar';
import confetti from 'canvas-confetti';
import { 
  Star, 
  Sparkles, 
  Send, 
  Inbox, 
  Flag, 
  CheckCircle2, 
  AlertCircle,
  MessageSquareHeart,
  Presentation,
  ShieldCheck,
  EyeOff,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  X,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function FeedbackPage() {
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  
  // Coordinator Authentication & Secret View State
  const [isCoordinatorUnlocked, setIsCoordinatorUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Tabs for regular members / safe view: 'peer' | 'session' | 'inbox'
  const [activeTab, setActiveTab] = useState<'peer' | 'session' | 'inbox'>('peer');

  // Subtabs inside coordinator unlocked view: 'all-session' | 'all-peer'
  const [adminTab, setAdminTab] = useState<'all-session' | 'all-peer'>('all-session');

  // Members list for giving peer feedback
  const [members, setMembers] = useState<Member[]>([]);
  const [toMemberId, setToMemberId] = useState('');
  const [star1, setStar1] = useState('');
  const [star2, setStar2] = useState('');
  const [wish, setWish] = useState('');

  // Inbox list for received peer feedback (members)
  const [inboxList, setInboxList] = useState<Feedback[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // Coordinator Confidential Lists (Loaded ONLY when coordinator unlocks)
  const [allFeedbackList, setAllFeedbackList] = useState<Feedback[]>([]);
  const [allSessionFeedbackList, setAllSessionFeedbackList] = useState<SessionFeedback[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Session & Coordinator Evaluation Form State (members)
  const [sessionRating, setSessionRating] = useState<number>(5);
  const [coordinatorRating, setCoordinatorRating] = useState<number>(5);
  const [keyTakeaway, setKeyTakeaway] = useState('');
  const [improvementWish, setImprovementWish] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load current member on mount
  useEffect(() => {
    const saved = localStorage.getItem('enactus_member');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentMember(parsed);
      } catch (e) {
        console.error(e);
      }
    }
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Securely load coordinator feeds ONLY upon unlocking
  const loadAdminFeed = async () => {
    setLoadingAdmin(true);
    try {
      const [peerList, sessionList] = await Promise.all([
        getAllFeedbackForAdmin(),
        getAllSessionFeedback(),
      ]);
      setAllFeedbackList(peerList);
      setAllSessionFeedbackList(sessionList);
    } catch (err) {
      console.error('Error loading confidential coordinator feed:', err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const loadInbox = async (memberId: string) => {
    setLoadingInbox(true);
    try {
      const feedback = await getReceivedFeedback(memberId);
      setInboxList(feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInbox(false);
    }
  };

  const handleTabChange = (tab: 'peer' | 'session' | 'inbox') => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
    if (tab === 'inbox' && currentMember) {
      loadInbox(currentMember.id);
    }
  };

  // Open Coordinator Portal: check existing session or ask for password
  const handleOpenCoordinatorPortal = () => {
    const hasAdminSession = sessionStorage.getItem('enactus_admin_auth') === 'true';
    if (hasAdminSession) {
      setIsCoordinatorUnlocked(true);
      loadAdminFeed();
    } else {
      setShowPasswordModal(true);
      setPasswordError('');
      setPasswordInput('');
    }
  };

  // Verify Coordinator Password
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = '23022006Ha#';
    if (passwordInput.trim() === correctPass) {
      sessionStorage.setItem('enactus_admin_auth', 'true');
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
      setIsCoordinatorUnlocked(true);
      loadAdminFeed();
    } else {
      setPasswordError('Incorrect coordinator password. Access denied.');
    }
  };

  // Lock and return to Safe Member View immediately
  const handleLockCoordinatorView = () => {
    setIsCoordinatorUnlocked(false);
    setAllFeedbackList([]);
    setAllSessionFeedbackList([]);
  };

  // Submit Peer Feedback (Member only)
  const handlePeerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) {
      setErrorMsg('Please log in or sign up on the Home screen first.');
      return;
    }
    if (!toMemberId || !star1.trim() || !star2.trim() || !wish.trim()) {
      setErrorMsg('Please fill out both stars and the wish.');
      return;
    }
    if (toMemberId === currentMember.id) {
      setErrorMsg('You cannot submit feedback to yourself.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const targetMember = members.find((m) => m.id === toMemberId);
      if (!targetMember) throw new Error('Selected member not found');

      await submitFeedback({
        fromMemberId: currentMember.id,
        fromMemberName: currentMember.name,
        toMemberId: targetMember.id,
        toMemberName: targetMember.name,
        star1,
        star2,
        wish,
      });

      setSuccessMsg(`Feedback sent privately to ${targetMember.name}! You earned +5 points! ⭐`);
      setStar1('');
      setStar2('');
      setWish('');
      setToMemberId('');

      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Session Evaluation (Member only)
  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyTakeaway.trim() || !improvementWish.trim()) {
      setErrorMsg('Please share both what you liked and what can be improved.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await submitSessionFeedback({
        memberId: currentMember?.id,
        memberName: currentMember?.name,
        isAnonymous,
        sessionRating,
        coordinatorRating,
        keyTakeaway,
        improvementWish,
      });

      setSuccessMsg(
        'Thank you! Your evaluation is securely recorded for the coordinator only, and +5 bonus points were added! ⭐'
      );
      setKeyTakeaway('');
      setImprovementWish('');

      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Actions: Delete inappropriate peer feedback
  const handleDeletePeerFeedback = async (id: string) => {
    const confirmDelete = window.confirm('Delete this peer feedback entry permanently?');
    if (!confirmDelete) return;
    try {
      await deleteFeedbackItem(id);
      setAllFeedbackList((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSessionFeedback = async (id: string) => {
    const confirmDelete = window.confirm('Delete this session evaluation entry permanently?');
    if (!confirmDelete) return;
    try {
      await deleteSessionFeedbackItem(id);
      setAllSessionFeedbackList((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Member Action: Flag feedback
  const handleFlag = async (item: Feedback) => {
    const confirmFlag = window.confirm(
      'Flag this feedback for coordinator review? Coordinators will inspect it.'
    );
    if (!confirmFlag) return;

    try {
      await flagFeedback(item.id, true);
      setInboxList((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, flagged: true } : f))
      );
      alert('Feedback has been flagged for coordinator review.');
    } catch (err) {
      console.error(err);
    }
  };

  // Summary Metrics for Coordinator
  const totalSessionReviews = allSessionFeedbackList.length;
  const avgSessionRating = totalSessionReviews > 0
    ? (allSessionFeedbackList.reduce((acc, curr) => acc + (curr.sessionRating || 5), 0) / totalSessionReviews).toFixed(1)
    : '5.0';
  const avgCoordinatorRating = totalSessionReviews > 0
    ? (allSessionFeedbackList.reduce((acc, curr) => acc + (curr.coordinatorRating || 5), 0) / totalSessionReviews).toFixed(1)
    : '5.0';

  // ==========================================
  // VIEW A: COORDINATOR CONFIDENTIAL OVERSIGHT VIEW
  // (Only visible when unlocked with Coordinator Secret Password)
  // ==========================================
  if (isCoordinatorUnlocked) {
    return (
      <div className="space-y-4 pb-8">
        {/* Header with Lock Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <img src="/enactus-icon.png" alt="Enactus" className="w-6 h-6 object-contain" />
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                <span>Coordinator Confidential Portal</span>
              </h1>
              <p className="text-[10px] text-slate-400">
                Private session & coordinator evaluations • Only you see this
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminFeed}
              className="text-xs text-yellow-400 hover:underline px-2 py-1"
            >
              Refresh
            </button>
            <button
              onClick={handleLockCoordinatorView}
              className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              title="Lock and hide confidential view"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock & Hide</span>
            </button>
          </div>
        </div>

        {/* 2 Coordinator Oversight Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setAdminTab('all-session')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              adminTab === 'all-session'
                ? 'bg-yellow-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>Session & Lead ({allSessionFeedbackList.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('all-peer')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              adminTab === 'all-peer'
                ? 'bg-yellow-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquareHeart className="w-4 h-4" />
            <span>Peer Critiques ({allFeedbackList.length})</span>
          </button>
        </div>

        {/* SUBTAB 1: ALL SESSION & COORDINATOR EVALUATIONS */}
        {adminTab === 'all-session' && (
          <div className="space-y-3">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-medium">Session Score</span>
                <span className="text-base font-black text-amber-400 flex items-center justify-center gap-1">
                  ★ {avgSessionRating}
                </span>
                <span className="text-[9px] text-slate-500">out of 5.0</span>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-medium">Lead Support</span>
                <span className="text-base font-black text-yellow-400 flex items-center justify-center gap-1">
                  ★ {avgCoordinatorRating}
                </span>
                <span className="text-[9px] text-slate-500">out of 5.0</span>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-medium">Total Reviews</span>
                <span className="text-base font-black text-white flex items-center justify-center gap-1">
                  {totalSessionReviews}
                </span>
                <span className="text-[9px] text-slate-500">feedbacks</span>
              </div>
            </div>

            {loadingAdmin ? (
              <p className="text-center py-8 text-xs text-slate-400">Loading confidential evaluations...</p>
            ) : allSessionFeedbackList.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700/60 text-slate-400 text-xs">
                No session evaluations submitted yet.
              </div>
            ) : (
              allSessionFeedbackList.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-800/70 border border-slate-700/80 rounded-2xl space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs border-b border-slate-700/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white flex items-center gap-1">
                        {item.isAnonymous ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>Anonymous Member</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{item.memberName}</span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5 text-[10px]">
                        <span className="text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                          Session: {item.sessionRating}★
                        </span>
                        <span className="text-yellow-400 font-bold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                          Lead: {item.coordinatorRating}★
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSessionFeedback(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-700"
                        title="Delete evaluation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1.5 text-slate-300">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      <strong className="text-emerald-400 block mb-0.5 font-semibold">
                        💡 Most Helpful / Liked:
                      </strong>
                      <p className="text-slate-200">{item.keyTakeaway}</p>
                    </div>
                    <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20">
                      <strong className="text-sky-400 block mb-0.5 font-semibold">
                        ✨ Suggestion / Improvement for Coordinator:
                      </strong>
                      <p className="text-slate-200">{item.improvementWish}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUBTAB 2: ALL PEER FEEDBACK MODERATION */}
        {adminTab === 'all-peer' && (
          <div className="space-y-2.5">
            {loadingAdmin ? (
              <p className="text-center py-8 text-xs text-slate-400">Loading peer critiques...</p>
            ) : allFeedbackList.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700/60 text-slate-400 text-xs">
                No peer feedback submitted yet.
              </div>
            ) : (
              allFeedbackList.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
                    item.flagged
                      ? 'bg-rose-500/10 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
                      : 'bg-slate-800/60 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs border-b border-slate-700/50 pb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-amber-400">{item.fromMemberName}</span>
                      <span className="text-slate-500">→</span>
                      <span className="font-bold text-white">{item.toMemberName}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.flagged && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white flex items-center gap-1">
                          <Flag className="w-3 h-3 fill-white" /> FLAGGED
                        </span>
                      )}
                      <button
                        onClick={() => handleDeletePeerFeedback(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-700"
                        title="Delete this feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1.5 text-slate-300">
                    <p className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <strong className="text-amber-400 block mb-0.5">⭐ Star 1:</strong>
                      {item.star1}
                    </p>
                    <p className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <strong className="text-amber-400 block mb-0.5">⭐ Star 2:</strong>
                      {item.star2}
                    </p>
                    <p className="bg-sky-500/10 p-2 rounded-xl border border-sky-500/20">
                      <strong className="text-sky-400 block mb-0.5">✨ Wish:</strong>
                      {item.wish}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW B: SAFE DEFAULT MEMBER FEEDBACK VIEW
  // (Always the default; zero exposure of session reviews or other members' critiques)
  // ==========================================
  return (
    <div className="space-y-4 pb-6">
      {/* Header with Safe Mode info & Coordinator Portal button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <img src="/enactus-icon.png" alt="Enactus" className="w-7 h-7 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-amber-400" />
              <span>Feedback Center</span>
            </h1>
            <p className="text-[10px] text-slate-400">
              Presentations peer critiques & confidential session evaluations
            </p>
          </div>
        </div>

        {/* Discrete Coordinator Secret Unlock Button */}
        <button
          onClick={handleOpenCoordinatorPortal}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-yellow-400 border border-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          title="Coordinator Secret Access to view Session Evaluations"
        >
          <Lock className="w-3.5 h-3.5 text-yellow-400" />
          <span>Coordinator View</span>
        </button>
      </div>

      {/* 3 Safe Tabs in the Pill Bar for Members */}
      <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => handleTabChange('peer')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 truncate ${
            activeTab === 'peer'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Peer (2★1W)</span>
        </button>

        <button
          onClick={() => handleTabChange('session')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 truncate ${
            activeTab === 'session'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Presentation className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Session & Lead</span>
        </button>

        <button
          onClick={() => handleTabChange('inbox')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 truncate ${
            activeTab === 'inbox'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Inbox className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">My Received</span>
        </button>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: PEER FEEDBACK (2 STARS & 1 WISH) */}
      {activeTab === 'peer' && (
        <form onSubmit={handlePeerSubmit} className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-3xl space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">
              Who are you giving feedback to? *
            </label>
            <select
              value={toMemberId}
              onChange={(e) => setToMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            >
              <option value="">-- Choose a presenter --</option>
              {members
                .filter((m) => m.id !== currentMember?.id && m.id !== 'ENC-2302')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>Star 1: What was one strong positive? *</span>
            </label>
            <textarea
              value={star1}
              onChange={(e) => setStar1(e.target.value)}
              placeholder="e.g. Great opening hook, strong eye contact..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>Star 2: What else did they do well? *</span>
            </label>
            <textarea
              value={star2}
              onChange={(e) => setStar2(e.target.value)}
              placeholder="e.g. Clear body language, smooth slide transitions..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-sky-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Wish: One specific area to improve *</span>
            </label>
            <textarea
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder="e.g. Slow down slightly in the conclusion, practice pause breaks..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting & Awarding Points...' : 'Send Feedback (+5 pts)'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: SESSION & COORDINATOR EVALUATION (Strictly Private to Coordinator) */}
      {activeTab === 'session' && (
        <form onSubmit={handleSessionSubmit} className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-3xl space-y-4">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/60 space-y-1">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Presentation className="w-4 h-4" />
              <span>Session & Coordinator Evaluation</span>
            </span>
            <p className="text-[11px] text-slate-400">
              Help your coordinator improve every session.
            </p>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-[10px] font-semibold mt-1">
              <Lock className="w-3 h-3 text-yellow-400" />
              <span>Confidential: Only the coordinator can read this evaluation</span>
            </div>
          </div>

          {/* Session Rating */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-300 font-semibold">Session Value & Content</label>
              <span className="text-xs font-bold text-amber-400">{sessionRating} / 5 ⭐</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setSessionRating(star)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    sessionRating >= star
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  ★ {star}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinator Rating */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-300 font-semibold">Coordinator Facilitation & Support</label>
              <span className="text-xs font-bold text-yellow-400">{coordinatorRating} / 5 ⭐</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setCoordinatorRating(star)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    coordinatorRating >= star
                      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  ★ {star}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-emerald-400 font-semibold">
              What was most helpful or engaging about today? *
            </label>
            <textarea
              value={keyTakeaway}
              onChange={(e) => setKeyTakeaway(e.target.value)}
              placeholder="e.g. The live speech exercises, clear feedback, practical examples..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-sky-400 font-semibold">
              What can the coordinator improve next time? *
            </label>
            <textarea
              value={improvementWish}
              onChange={(e) => setImprovementWish(e.target.value)}
              placeholder="e.g. More time for individual practice, slower pacing on stage tips..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          {/* Anonymous Toggle */}
          <div
            onClick={() => setIsAnonymous(!isAnonymous)}
            className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <EyeOff className={`w-4 h-4 ${isAnonymous ? 'text-amber-400' : 'text-slate-500'}`} />
              <div>
                <span className="text-xs font-semibold text-white block">Submit Anonymously</span>
                <span className="text-[10px] text-slate-400">
                  {isAnonymous
                    ? 'Your name will not be shown to the coordinator'
                    : 'Coordinator will see your name'}
                </span>
              </div>
            </div>
            <div
              className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                isAnonymous ? 'bg-amber-400' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-slate-950 w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                  isAnonymous ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>
              {submitting ? 'Submitting...' : 'Send Evaluation (+5 pts)'}
            </span>
          </button>
        </form>
      )}

      {/* TAB 3: INBOX (Strictly Private to the Recipient Member) */}
      {activeTab === 'inbox' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-300">Your Received Peer Feedback</span>
            <span className="text-[10px] text-yellow-400/90 font-medium flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
              <Lock className="w-2.5 h-2.5" />
              <span>Private to you</span>
            </span>
          </div>

          {!currentMember ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Please sign up or log in first on the Home screen to view your feedback.
            </div>
          ) : loadingInbox ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Loading your feedback feed...
            </div>
          ) : inboxList.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-1">
              <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No feedback received yet</p>
              <p className="text-[11px] text-slate-500">
                Feedback given by your peers after your presentation will appear here privately.
              </p>
            </div>
          ) : (
            inboxList.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DiceBearAvatar name={item.fromMemberName} size="sm" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        From: {item.fromMemberName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFlag(item)}
                    disabled={item.flagged}
                    title="Flag unfair feedback to coordinator"
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                      item.flagged
                        ? 'text-rose-400 bg-rose-500/10'
                        : 'text-slate-500 hover:text-rose-400 hover:bg-slate-700'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span className="text-[10px]">
                      {item.flagged ? 'Flagged' : 'Flag'}
                    </span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <span className="text-amber-400 font-bold block text-[11px] mb-1">
                      ⭐ Star 1
                    </span>
                    <p className="text-slate-200 text-xs">{item.star1}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <span className="text-amber-400 font-bold block text-[11px] mb-1">
                      ⭐ Star 2
                    </span>
                    <p className="text-slate-200 text-xs">{item.star2}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs">
                    <span className="text-sky-400 font-bold block text-[11px] mb-1">
                      ✨ 1 Wish
                    </span>
                    <p className="text-slate-200 text-xs">{item.wish}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* COORDINATOR SECRET PASSWORD AUTHENTICATION MODAL */}
      {/* ========================================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Coordinator Verification</h3>
                <p className="text-[10px] text-slate-400">
                  Enter coordinator password to view private evaluations
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Coordinator Secret Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter secret password..."
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
