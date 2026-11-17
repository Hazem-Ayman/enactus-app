'use client';

import { useState, useEffect } from 'react';
import { 
  getAllMembers, 
  submitFeedback, 
  getReceivedFeedback, 
  flagFeedback,
  submitSessionFeedback
} from '@/lib/firestore';
import { Member, Feedback } from '@/types';
import Avatar from '@/components/Avatar';
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
  EyeOff
} from 'lucide-react';

export default function FeedbackPage() {
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'peer' | 'inbox' | 'session'>('peer');

  // Members list for giving peer feedback
  const [members, setMembers] = useState<Member[]>([]);
  const [toMemberId, setToMemberId] = useState('');
  const [star1, setStar1] = useState('');
  const [star2, setStar2] = useState('');
  const [wish, setWish] = useState('');

  // Inbox list for received peer feedback
  const [inboxList, setInboxList] = useState<Feedback[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // Session & Coordinator Evaluation Form State
  const [sessionRating, setSessionRating] = useState<number>(5);
  const [coordinatorRating, setCoordinatorRating] = useState<number>(5);
  const [keyTakeaway, setKeyTakeaway] = useState('');
  const [improvementWish, setImprovementWish] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load current member from localStorage
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

  const handleTabChange = (tab: 'peer' | 'inbox' | 'session') => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
    if (tab === 'inbox' && currentMember) {
      loadInbox(currentMember.id);
    }
  };

  // Submit Peer Feedback
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

  // Submit Session & Coordinator Feedback
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

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquareHeart className="w-5 h-5 text-amber-400" />
          Feedback Center
        </h1>
        <p className="text-xs text-slate-400">
          Peer critique & session evaluations for continuous improvement
        </p>
      </div>

      {/* 3 Tabs in the Pill Bar */}
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
                .filter((m) => m.id !== currentMember?.id)
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
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting & Awarding Points...' : 'Send Feedback (+5 pts)'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: SESSION & COORDINATOR EVALUATION */}
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

          {/* Session Rating (1-5 Stars) */}
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
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
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

          {/* Coordinator Rating (1-5 Stars) */}
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
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
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

          {/* What went well */}
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

          {/* What could improve */}
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
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>
              {submitting ? 'Submitting...' : 'Send Feedback (+5 pts)'}
            </span>
          </button>
        </form>
      )}

      {/* TAB 3: INBOX */}
      {activeTab === 'inbox' && (
        <div className="space-y-3">
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
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={item.fromMemberName} size="sm" />
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

                  {/* Flag Button */}
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

                {/* Stars Content */}
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
    </div>
  );
}
