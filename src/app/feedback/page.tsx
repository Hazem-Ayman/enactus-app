'use client';

import { useState, useEffect } from 'react';
import { 
  getAllMembers, 
  submitFeedback, 
  getReceivedFeedback, 
  flagFeedback 
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
  MessageSquareHeart
} from 'lucide-react';

export default function FeedbackPage() {
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'give' | 'inbox'>('give');

  // Members list for giving feedback
  const [members, setMembers] = useState<Member[]>([]);
  const [toMemberId, setToMemberId] = useState('');
  const [star1, setStar1] = useState('');
  const [star2, setStar2] = useState('');
  const [wish, setWish] = useState('');

  // Inbox list for received feedback
  const [inboxList, setInboxList] = useState<Feedback[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

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

  // Switch tabs
  const handleTabChange = (tab: 'give' | 'inbox') => {
    setActiveTab(tab);
    if (tab === 'inbox' && currentMember) {
      loadInbox(currentMember.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit feedback.');
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
          2 Stars & 1 Wish
        </h1>
        <p className="text-xs text-slate-400">
          Peer feedback culture • Earn +5 pts for every feedback given
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => handleTabChange('give')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'give'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Give Feedback</span>
        </button>
        <button
          onClick={() => handleTabChange('inbox')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'inbox'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>My Feedback Received</span>
        </button>
      </div>

      {/* TAB 1: GIVE FEEDBACK */}
      {activeTab === 'give' && (
        <div className="space-y-4">
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

          <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-3xl space-y-4">
            {/* Target Member Picker */}
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

            {/* Star 1 */}
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

            {/* Star 2 */}
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

            {/* Wish */}
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
        </div>
      )}

      {/* TAB 2: INBOX */}
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

                  {/* Wish Content */}
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
