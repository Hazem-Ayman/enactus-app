'use client';

import { useState, useEffect } from 'react';
import { 
  getAllMembers, 
  submitFeedback, 
  submitSessionFeedback,
  getAllFeedbackForAdmin,
  getAllSessionFeedback,
  deleteFeedbackItem,
  deleteSessionFeedbackItem
} from '@/lib/firestore';
import { Member, Feedback, SessionFeedback } from '@/types';
import confetti from 'canvas-confetti';
import { 
  Star, 
  Sparkles, 
  Send, 
  Flag, 
  CheckCircle2, 
  AlertCircle,
  MessageSquareHeart,
  Presentation,
  ShieldCheck,
  EyeOff,
  Trash2,
  UserCheck
} from 'lucide-react';

export default function FeedbackPage() {
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Tabs for regular members: only 2 write tabs (no reading feedback)
  const [activeTab, setActiveTab] = useState<'peer' | 'session'>('peer');

  // Subtabs for admin account: 'all-session' | 'all-peer'
  const [adminTab, setAdminTab] = useState<'all-session' | 'all-peer'>('all-session');

  // Members list for giving peer feedback
  const [members, setMembers] = useState<Member[]>([]);
  const [toMemberId, setToMemberId] = useState('');
  const [star1, setStar1] = useState('');
  const [star2, setStar2] = useState('');
  const [wish, setWish] = useState('');

  // Admin Oversight Lists (Loaded ONLY if logged in as admin)
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

  // Check login & admin role on mount
  useEffect(() => {
    const saved = localStorage.getItem('enactus_member');
    const adminSession = sessionStorage.getItem('enactus_admin_auth');
    if (saved) {
      try {
        const parsed: Member = JSON.parse(saved);
        setCurrentMember(parsed);
        if (parsed.id === 'ENC-2302' || parsed.role === 'admin' || adminSession === 'true') {
          setIsAdmin(true);
          loadAdminFeed();
        }
      } catch (e) {
        console.error(e);
      }
    } else if (adminSession === 'true') {
      setIsAdmin(true);
      loadAdminFeed();
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

  // Load admin feeds only for admin account
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
      console.error('Error loading admin feed:', err);
    } finally {
      setLoadingAdmin(false);
    }
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

      setSuccessMsg(`Feedback sent to ${targetMember.name}! You earned +5 points! ⭐`);
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
        'Thank you! Your feedback has been submitted, and +5 bonus points were added to your profile! ⭐'
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

  // Summary Metrics for Admin
  const totalSessionReviews = allSessionFeedbackList.length;
  const avgSessionRating = totalSessionReviews > 0
    ? (allSessionFeedbackList.reduce((acc, curr) => acc + (curr.sessionRating || 5), 0) / totalSessionReviews).toFixed(1)
    : '5.0';
  const avgCoordinatorRating = totalSessionReviews > 0
    ? (allSessionFeedbackList.reduce((acc, curr) => acc + (curr.coordinatorRating || 5), 0) / totalSessionReviews).toFixed(1)
    : '5.0';

  // ==========================================
  // VIEW A: ADMIN ACCOUNT VIEW
  // (Admin automatically sees everything directly without pressing any button)
  // ==========================================
  if (isAdmin) {
    return (
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <img src="/enactus-icon.png" alt="Enactus" className="w-6 h-6 object-contain" />
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                <span>Coordinator Feedback Portal</span>
              </h1>
              <p className="text-[10px] text-slate-400">
                Live oversight of all session evaluations & peer critiques
              </p>
            </div>
          </div>

          <button
            onClick={loadAdminFeed}
            className="text-xs text-yellow-400 hover:underline px-2 py-1 font-semibold"
          >
            Refresh
          </button>
        </div>

        {/* 2 Coordinator Oversight Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setAdminTab('all-session')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
              <p className="text-center py-8 text-xs text-slate-400">Loading evaluations...</p>
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
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-700 cursor-pointer"
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
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-700 cursor-pointer"
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
  // VIEW B: REGULAR MEMBER VIEW
  // (Members can ONLY WRITE feedback. They CANNOT read any feedback)
  // ==========================================
  return (
    <div className="space-y-4 pb-6">
      {/* Clean Member Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <img src="/enactus-icon.png" alt="Enactus" className="w-7 h-7 object-contain" />
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-amber-400" />
            <span>Feedback Center</span>
          </h1>
          <p className="text-[10px] text-slate-400">
            Submit peer critique & session evaluations • Earn +5 pts
          </p>
        </div>
      </div>

      {/* 2 Write-Only Tabs for Members */}
      <div className="grid grid-cols-2 gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => { setActiveTab('peer'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'peer'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Peer (2★1W)</span>
        </button>

        <button
          onClick={() => { setActiveTab('session'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'session'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Presentation className="w-3.5 h-3.5" />
          <span>Session & Lead</span>
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

      {/* TAB 1: WRITE PEER FEEDBACK (2 STARS & 1 WISH) */}
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

      {/* TAB 2: WRITE SESSION & COORDINATOR EVALUATION */}
      {activeTab === 'session' && (
        <form onSubmit={handleSessionSubmit} className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-3xl space-y-4">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/60 space-y-1">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Presentation className="w-4 h-4" />
              <span>Session & Coordinator Evaluation</span>
            </span>
            <p className="text-[11px] text-slate-400">
              Help your coordinator make every session more valuable and engaging.
            </p>
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
                    ? 'Your name is completely hidden from the coordinator'
                    : 'Coordinator will see who sent this'}
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
              {submitting ? 'Submitting...' : 'Send Feedback (+5 pts)'}
            </span>
          </button>
        </form>
      )}
    </div>
  );
}
