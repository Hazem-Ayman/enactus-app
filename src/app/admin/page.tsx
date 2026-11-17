'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAllMembers, 
  addPointEvent, 
  createMember 
} from '@/lib/firestore';
import { Member, Committee } from '@/types';
import Avatar from '@/components/Avatar';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  Lock, 
  PlusCircle, 
  Shuffle, 
  Users, 
  Sparkles, 
  Search, 
  Award, 
  CheckSquare, 
  Square,
  LogOut
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Tab: 'points' | 'picker'
  const [activeTab, setActiveTab] = useState<'points' | 'picker'>('points');

  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  // Manual Points Form State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [pointsAmount, setPointsAmount] = useState<number | ''>('');
  const [pointsReason, setPointsReason] = useState('');
  const [pointsSubmitting, setPointsSubmitting] = useState(false);
  const [pointsSuccessMsg, setPointsSuccessMsg] = useState('');
  const [pointsSearch, setPointsSearch] = useState('');

  // Picker State
  const [presentMemberIds, setPresentMemberIds] = useState<Set<string>>(new Set());
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerFilter, setPickerFilter] = useState<'All' | Committee>('All');
  
  // Random Picker Single Result
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPickerMember, setSelectedPickerMember] = useState<Member | null>(null);

  // Random Groups Result
  const [groupSize, setGroupSize] = useState<number>(3);
  const [generatedGroups, setGeneratedGroups] = useState<Member[][]>([]);

  // Check saved admin session in sessionStorage
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('enactus_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadMembers();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = process.env.NEXT_PUBLIC_ADMIN_SECRET_PASSWORD || 'enactus2026admin';
    if (passwordInput === correctPass) {
      setIsAuthenticated(true);
      sessionStorage.setItem('enactus_admin_auth', 'true');
      setAuthError('');
      loadMembers();
    } else {
      setAuthError('Incorrect admin password. Try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('enactus_admin_auth');
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers: Manual Points ---
  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || pointsAmount === '' || !pointsReason.trim()) return;

    setPointsSubmitting(true);
    setPointsSuccessMsg('');

    try {
      const targetMember = members.find((m) => m.id === selectedMemberId);
      if (!targetMember) throw new Error('Member not found');

      await addPointEvent(
        selectedMemberId,
        targetMember.name,
        Number(pointsAmount),
        pointsReason
      );

      setPointsSuccessMsg(`Successfully awarded ${pointsAmount} pts to ${targetMember.name}!`);
      setPointsAmount('');
      setPointsReason('');

      // Refresh list to update cached point counts
      await loadMembers();

      setTimeout(() => setPointsSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Error adding points: ' + err.message);
    } finally {
      setPointsSubmitting(false);
    }
  };

  // --- Handlers: Picker & Attendance ---
  const toggleAttendance = (id: string) => {
    setPresentMemberIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const selectAllFiltered = () => {
    const ids = filteredPickerMembers.map((m) => m.id);
    setPresentMemberIds((prev) => new Set([...Array.from(prev), ...ids]));
  };

  const unselectAllFiltered = () => {
    const idsToFilter = new Set(filteredPickerMembers.map((m) => m.id));
    setPresentMemberIds((prev) => new Set([...Array.from(prev)].filter((id) => !idsToFilter.has(id))));
  };

  const filteredPickerMembers = members.filter((m) => {
    const matchName = m.name.toLowerCase().includes(pickerSearch.toLowerCase());
    const matchFilter = pickerFilter === 'All' ? true : m.committee === pickerFilter;
    return matchName && matchFilter;
  });

  const presentMembersList = members.filter((m) => presentMemberIds.has(m.id));

  // 1. Pick Random Speaker / Participant
  const handleRandomPick = () => {
    if (presentMembersList.length === 0) {
      alert('Please check at least one present member first!');
      return;
    }

    setIsSpinning(true);
    setSelectedPickerMember(null);

    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * presentMembersList.length);
      setSelectedPickerMember(presentMembersList[randomIndex]);
      counter++;

      if (counter > 15) {
        clearInterval(interval);
        setIsSpinning(false);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }, 100);
  };

  // 2. Random Groups Generator
  const handleGenerateGroups = () => {
    if (presentMembersList.length < 2) {
      alert('Need at least 2 present members to form groups!');
      return;
    }

    // Shuffle present members
    const shuffled = [...presentMembersList].sort(() => Math.random() - 0.5);
    const groups: Member[][] = [];

    for (let i = 0; i < shuffled.length; i += groupSize) {
      groups.push(shuffled.slice(i, i + groupSize));
    }

    setGeneratedGroups(groups);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  // If not authenticated, show secret password gate
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
          <Lock className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-white">Coordinators Access</h1>
          <p className="text-xs text-slate-400">Enter the admin secret password to manage session</p>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Admin Password"
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
      {/* Top Header with Logout */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-yellow-400" />
          <span className="font-bold text-sm text-white">Admin Dashboard</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Admin Nav Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('points')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'points'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Manual Points</span>
        </button>
        <button
          onClick={() => setActiveTab('picker')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'picker'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Session Picker</span>
        </button>
      </div>

      {/* --- TAB 1: MANUAL POINTS --- */}
      {activeTab === 'points' && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-yellow-400" />
              Award or Deduct Points
            </h2>

            {pointsSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-medium">
                {pointsSuccessMsg}
              </div>
            )}

            <form onSubmit={handleAddPoints} className="space-y-3">
              {/* Member Selector with live search */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Select Member</label>
                <input
                  type="text"
                  placeholder="Type to filter member names..."
                  value={pointsSearch}
                  onChange={(e) => setPointsSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white mb-2"
                />

                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                >
                  <option value="">-- Choose a member --</option>
                  {members
                    .filter((m) => m.name.toLowerCase().includes(pointsSearch.toLowerCase()))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.committee}) - {m.totalPoints || 0} pts
                      </option>
                    ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">
                  Points (use negative like -5 for deduction)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 10 or -5"
                    className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex gap-1">
                    {[5, 10, 20].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setPointsAmount(preset)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-yellow-400 rounded-lg border border-slate-700"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Reason</label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="e.g. Great presentation opening, Active participation"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={pointsSubmitting}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md mt-2"
              >
                {pointsSubmitting ? 'Saving Event...' : 'Apply Points Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 2: SESSION PICKER & GROUPS --- */}
      {activeTab === 'picker' && (
        <div className="space-y-4">
          {/* Action Boxes: Random Picker & Groups */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRandomPick}
              disabled={isSpinning || presentMembersList.length === 0}
              className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl flex flex-col items-center justify-center gap-1 shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs">
                {isSpinning ? 'Spinning...' : 'Random Pick'}
              </span>
            </button>

            <button
              onClick={handleGenerateGroups}
              disabled={presentMembersList.length < 2}
              className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-bold rounded-2xl flex flex-col items-center justify-center gap-1 shadow-md disabled:opacity-50"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Random Groups</span>
            </button>
          </div>

          {/* Single Pick Highlight Modal / Card */}
          {selectedPickerMember && (
            <div className="p-4 bg-yellow-500/10 border-2 border-yellow-400 rounded-2xl text-center space-y-2 animate-bounce-short">
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                🎉 Selected Participant
              </span>
              <div className="flex items-center justify-center gap-3">
                <Avatar name={selectedPickerMember.name} size="lg" />
                <div className="text-left">
                  <h3 className="font-extrabold text-base text-white">
                    {selectedPickerMember.name}
                  </h3>
                  <p className="text-xs text-yellow-300 font-medium">
                    {selectedPickerMember.committee}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Group Size Selector */}
          <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-300 font-medium">Group Size:</span>
            <div className="flex items-center gap-2">
              {[2, 3, 4, 5].map((size) => (
                <button
                  key={size}
                  onClick={() => setGroupSize(size)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    groupSize === size
                      ? 'bg-yellow-400 text-slate-950 shadow-sm'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Groups Display */}
          {generatedGroups.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Shuffled Groups ({generatedGroups.length})
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {generatedGroups.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2"
                  >
                    <div className="text-xs font-bold text-yellow-400">
                      Team {gIdx + 1}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.map((m) => (
                        <span
                          key={m.id}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg flex items-center gap-1.5 font-medium"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Present Attendance Checklist */}
          <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">Present Today</h3>
                <p className="text-[10px] text-slate-400">
                  {presentMembersList.length} of {members.length} checked
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={selectAllFiltered}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-medium"
                >
                  Check All
                </button>
                <button
                  onClick={unselectAllFiltered}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search member name..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />

              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl text-[10px] font-medium">
                {(['All', 'Presentations', 'Social Media Design'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPickerFilter(filter)}
                    className={`py-1.5 rounded-lg text-center truncate ${
                      pickerFilter === filter
                        ? 'bg-yellow-400 text-slate-950 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {filter === 'Social Media Design' ? 'Design' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Members Checklist */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {filteredPickerMembers.map((m) => {
                const isChecked = presentMemberIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleAttendance(m.id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                      <span className="text-xs font-medium text-white">{m.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{m.committee}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
