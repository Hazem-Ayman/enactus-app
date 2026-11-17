'use client';

import { useState, useEffect } from 'react';
import { 
  getAllMembers, 
  addPointEvent, 
  saveSessionGroups, 
  broadcastPickerState, 
  broadcastGroupsState, 
  getSectionToggles, 
  updateSectionToggles, 
  SectionToggles 
} from '@/lib/firestore';
import { Member } from '@/types';
import BotAvatar from '@/components/BotAvatar';
import confetti from 'canvas-confetti';
import { 
  PlusCircle, 
  Shuffle, 
  Users, 
  Sparkles, 
  Award, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Gamepad2,
  MessageSquareHeart
} from 'lucide-react';

export default function AdminContent() {
  // Only 3 Tabs on Home: Points, Picker, Toggles
  const [activeTab, setActiveTab] = useState<'points' | 'picker' | 'toggles'>('points');

  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  // Manual Points State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [pointsAmount, setPointsAmount] = useState<number | ''>('');
  const [pointsReason, setPointsReason] = useState('');
  const [pointsSubmitting, setPointsSubmitting] = useState(false);
  const [pointsSuccessMsg, setPointsSuccessMsg] = useState('');
  const [pointsSearch, setPointsSearch] = useState('');

  // Picker State
  const [presentMemberIds, setPresentMemberIds] = useState<Set<string>>(new Set());
  const [pickerSearch, setPickerSearch] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPickerMember, setSelectedPickerMember] = useState<Member | null>(null);
  const [groupSize, setGroupSize] = useState<number>(3);
  const [generatedGroups, setGeneratedGroups] = useState<Member[][]>([]);
  const [groupsSavedMsg, setGroupsSavedMsg] = useState('');

  // Section Toggles State
  const [toggles, setToggles] = useState<SectionToggles>({
    feedbackEnabled: true,
    gameCenterEnabled: true,
  });
  const [togglesMsg, setTogglesMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allMembers = await getAllMembers();
      setMembers(allMembers);

      if (presentMemberIds.size === 0) {
        setPresentMemberIds(new Set(allMembers.filter((m) => m.id !== 'ENC-2302').map((m) => m.id)));
      }
      const t = await getSectionToggles();
      setToggles(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Section
  const handleToggle = async (key: keyof SectionToggles) => {
    const updated = { ...toggles, [key]: !toggles[key] };
    setToggles(updated);
    try {
      await updateSectionToggles(updated);
      setTogglesMsg('Navigation updated live for all members!');
      setTimeout(() => setTogglesMsg(''), 3000);
    } catch (err: any) {
      alert('Error updating toggles: ' + err.message);
    }
  };

  // Add Points (Independent Search / Direct Selection)
  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find target member either from selectedMemberId or from pointsSearch string
    let targetMember = members.find((m) => m.id === selectedMemberId);
    if (!targetMember && pointsSearch.trim()) {
      const q = pointsSearch.trim().toLowerCase();
      targetMember = members.find(
        (m) =>
          m.id !== 'ENC-2302' &&
          (m.name.toLowerCase() === q ||
            m.id.toLowerCase() === q ||
            m.name.toLowerCase().includes(q))
      );
    }

    if (!targetMember) {
      alert('Please search or select a member first!');
      return;
    }

    if (pointsAmount === '' || !pointsReason.trim()) {
      alert('Please enter both point amount and a reason.');
      return;
    }

    setPointsSubmitting(true);
    setPointsSuccessMsg('');

    try {
      await addPointEvent(
        targetMember.id,
        targetMember.name,
        Number(pointsAmount),
        pointsReason
      );

      setPointsSuccessMsg(`Awarded ${pointsAmount} pts to ${targetMember.name}!`);
      setPointsAmount('');
      setPointsReason('');
      setSelectedMemberId('');
      setPointsSearch('');
      await loadData();
      setTimeout(() => setPointsSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Error adding points: ' + err.message);
    } finally {
      setPointsSubmitting(false);
    }
  };

  // Live Broadcast Random Picker to All Members
  const handleRandomPick = async () => {
    if (presentMembersList.length === 0) {
      alert('Please check at least one present member first!');
      return;
    }
    setIsSpinning(true);
    setSelectedPickerMember(null);

    // Initial broadcast: start spinning
    await broadcastPickerState({
      isSpinning: true,
      selectedMember: null,
      timestamp: Date.now(),
    });

    let counter = 0;
    const interval = setInterval(async () => {
      const randomIndex = Math.floor(Math.random() * presentMembersList.length);
      const chosen = presentMembersList[randomIndex];
      setSelectedPickerMember(chosen);
      counter++;

      if (counter > 15) {
        clearInterval(interval);
        setIsSpinning(false);
        // Final broadcast: result chosen
        await broadcastPickerState({
          isSpinning: false,
          selectedMember: chosen,
          timestamp: Date.now(),
        });
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    }, 120);
  };

  // Live Broadcast Random Groups to All Members
  const handleGenerateGroups = async () => {
    if (presentMembersList.length < 2) {
      alert('Need at least 2 present members to form groups!');
      return;
    }

    // 1. Live broadcast to all screens: Shuffling animation
    await broadcastGroupsState({
      isShuffling: true,
      groups: [],
      timestamp: Date.now(),
    });

    const shuffled = [...presentMembersList].sort(() => Math.random() - 0.5);
    const groups: Member[][] = [];
    for (let i = 0; i < shuffled.length; i += groupSize) {
      groups.push(shuffled.slice(i, i + groupSize));
    }
    setGeneratedGroups(groups);

    const payload = groups.map((group, idx) => ({
      teamNumber: idx + 1,
      members: group.map((m) => ({ id: m.id, name: m.name })),
    }));

    // 2. Broadcast final teams after 1.2s delay for suspense
    setTimeout(async () => {
      await broadcastGroupsState({
        isShuffling: false,
        groups: payload,
        timestamp: Date.now(),
      });
      await saveSessionGroups("Today's Session Teams", payload);
      setGroupsSavedMsg('Teams broadcasted live to all member devices & saved!');
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setGroupsSavedMsg(''), 5000);
    }, 1200);
  };

  const handleSaveSessionGroups = async () => {
    if (generatedGroups.length === 0) return;
    try {
      const payload = generatedGroups.map((group, idx) => ({
        teamNumber: idx + 1,
        members: group.map((m) => ({ id: m.id, name: m.name })),
      }));
      await broadcastGroupsState({
        isShuffling: false,
        groups: payload,
        timestamp: Date.now(),
      });
      await saveSessionGroups("Today's Session Teams", payload);
      setGroupsSavedMsg('Teams re-broadcasted live to all member screens!');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      setTimeout(() => setGroupsSavedMsg(''), 4000);
    } catch (err: any) {
      alert('Error saving groups: ' + err.message);
    }
  };

  const toggleAttendance = (id: string) => {
    setPresentMemberIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  };

  const filteredPickerMembers = members
    .filter((m) => m.id !== 'ENC-2302')
    .filter((m) => m.name.toLowerCase().includes(pickerSearch.toLowerCase()));

  const presentMembersList = members
    .filter((m) => m.id !== 'ENC-2302')
    .filter((m) => presentMemberIds.has(m.id));

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const filteredPointsMembers = members
    .filter((m) => m.id !== 'ENC-2302')
    .filter((m) => {
      if (!pointsSearch.trim()) return true;
      const q = pointsSearch.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    });

  return (
    <div className="space-y-4">
      {/* 3 Clean Action Tabs: Points, Picker, Toggles */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl text-xs font-semibold shadow-inner border border-slate-700/60">
        <button
          onClick={() => setActiveTab('points')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'points'
              ? 'bg-yellow-400 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Points</span>
        </button>

        <button
          onClick={() => setActiveTab('picker')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'picker'
              ? 'bg-yellow-400 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Picker</span>
        </button>

        <button
          onClick={() => setActiveTab('toggles')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'toggles'
              ? 'bg-yellow-400 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Toggles</span>
        </button>
      </div>

      {/* --- TAB 1: MANUAL POINTS --- */}
      {activeTab === 'points' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-yellow-400" />
            <span>Award or Deduct Points</span>
          </h2>

          {pointsSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-medium">
              {pointsSuccessMsg}
            </div>
          )}

          <form onSubmit={handleAddPoints} className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-bold">Select Member</label>
                {selectedMember && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberId('');
                      setPointsSearch('');
                    }}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {selectedMember ? (
                <div className="p-3 bg-yellow-400/10 border-2 border-yellow-400/80 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BotAvatar config={selectedMember.avatar} size="sm" />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-white block truncate">{selectedMember.name}</span>
                      <span className="text-[10px] text-yellow-300 font-mono">
                        {selectedMember.id} • {selectedMember.totalPoints || 0} pts (🔥 {selectedMember.streak || 0})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberId('');
                      setPointsSearch('');
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Change ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Search member name or ID (or tap below)..."
                    value={pointsSearch}
                    onChange={(e) => setPointsSearch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />

                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    {filteredPointsMembers.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-2">
                        No members matching &quot;{pointsSearch}&quot;
                      </p>
                    ) : (
                      filteredPointsMembers.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMemberId(m.id);
                            setPointsSearch('');
                          }}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-yellow-400/15 hover:border-yellow-400/50 border border-transparent cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <BotAvatar config={m.avatar} size="sm" />
                            <span className="text-xs font-bold text-white truncate">{m.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                            {m.id} • {m.totalPoints || 0} pts
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
                <div className="flex gap-1">
                  {[5, 10, 20].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setPointsAmount(preset)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-yellow-400 rounded-lg border border-slate-700 cursor-pointer"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Reason</label>
              <input
                type="text"
                placeholder="e.g. Great presentation opening, Active participation"
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={pointsSubmitting}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md mt-2 cursor-pointer"
            >
              {pointsSubmitting ? 'Applying...' : 'Apply Points Event'}
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 2: SESSION PICKER & REAL-TIME BROADCAST --- */}
      {activeTab === 'picker' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRandomPick}
              disabled={isSpinning || presentMembersList.length === 0}
              className="p-3.5 bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl flex flex-col items-center justify-center gap-1 shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs">
                {isSpinning ? 'Broadcasting Spin...' : 'Random Pick (Live Pop-up)'}
              </span>
            </button>

            <button
              onClick={handleGenerateGroups}
              disabled={presentMembersList.length < 2}
              className="p-3.5 bg-gradient-to-br from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-bold rounded-2xl flex flex-col items-center justify-center gap-1 shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Random Groups (Live Pop-up)</span>
            </button>
          </div>

          {selectedPickerMember && (
            <div className="p-4 bg-yellow-500/10 border-2 border-yellow-400 rounded-2xl text-center space-y-2 animate-bounce-short">
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                🎉 Selected Participant (Broadcasted to All Screens)
              </span>
              <div className="flex items-center justify-center gap-3">
                <BotAvatar config={selectedPickerMember.avatar} size="lg" />
                <div className="text-left">
                  <h3 className="font-extrabold text-base text-white">
                    {selectedPickerMember.name}
                  </h3>
                  <p className="text-xs text-yellow-300 font-medium">
                    {selectedPickerMember.id}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-300 font-medium">Group Size:</span>
            <div className="flex items-center gap-2">
              {[2, 3, 4, 5].map((size) => (
                <button
                  key={size}
                  onClick={() => setGroupSize(size)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

          {generatedGroups.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Shuffled Groups ({generatedGroups.length})
                </h3>
                <button
                  type="button"
                  onClick={handleSaveSessionGroups}
                  className="px-3 py-1 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Broadcast / Save Teams 📢
                </button>
              </div>

              {groupsSavedMsg && (
                <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs rounded-xl font-medium">
                  {groupsSavedMsg}
                </div>
              )}

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

          {/* Member Selection Pool for Picker & Groups */}
          <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">Present Members Pool</h3>
                <p className="text-[10px] text-slate-400">
                  {presentMemberIds.size} of {filteredPickerMembers.length} checked
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const ids = filteredPickerMembers.map((m) => m.id);
                    setPresentMemberIds((prev) => new Set([...Array.from(prev), ...ids]));
                  }}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-medium cursor-pointer"
                >
                  Check All
                </button>
                <button
                  onClick={() => {
                    setPresentMemberIds(new Set());
                  }}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-medium cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Search member name..."
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
            />

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {filteredPickerMembers.map((m) => {
                const isChecked = presentMemberIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleAttendance(m.id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${isChecked
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
                    <span className="text-[10px] text-slate-500">{m.id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: FEATURE SECTION TOGGLES --- */}
      {activeTab === 'toggles' && (
        <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-yellow-400" />
              <span>Section Visibility Toggles</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Instantly enable or disable entire sections of the app for all members in real-time.
            </p>
          </div>

          {togglesMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{togglesMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Toggle 1: Feedback Center */}
            <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Feedback Center</h4>
                  <p className="text-[10px] text-slate-400">
                    Peer 2 Stars & 1 Wish + Session coordinator reviews
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle('feedbackEnabled')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  toggles.feedbackEnabled
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-500 bg-slate-800'
                }`}
              >
                {toggles.feedbackEnabled ? (
                  <ToggleRight className="w-6 h-6" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Toggle 2: Presentations Game Center */}
            <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white">Presentations Game Center</h4>
                    <span className="px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider bg-indigo-500 text-white rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Live speaking mini-games & impromptu challenges
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle('gameCenterEnabled')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  toggles.gameCenterEnabled
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-500 bg-slate-800'
                }`}
              >
                {toggles.gameCenterEnabled ? (
                  <ToggleRight className="w-6 h-6" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
