'use client';

import { useState, useEffect } from 'react';
import { 
  getAllMembers, 
  addPointEvent, 
  createSession, 
  getAllSessions, 
  markAttendance,
  saveSessionGroups,
  getGuidelinesContent,
  updateGuidelinesContent,
  deleteGuidelinesContent,
  updateMemberProfile,
  deleteMember,
  broadcastPickerState,
  broadcastGroupsState,
  getSectionToggles,
  updateSectionToggles,
  SectionToggles
} from '@/lib/firestore';
import { Member, Session } from '@/types';
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
  CalendarCheck, 
  Flame, 
  CheckCircle2, 
  BookOpen, 
  Save, 
  Trash2, 
  Edit2, 
  Download,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  Gamepad2,
  MessageSquareHeart
} from 'lucide-react';

export default function AdminContent() {
  // Tabs: 'points' | 'sessions' | 'members' | 'picker' | 'guidelines' | 'toggles'
  const [activeTab, setActiveTab] = useState<'points' | 'sessions' | 'members' | 'picker' | 'guidelines' | 'toggles'>('points');

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

  // Sessions State
  const [sessionsList, setSessionsList] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState('');
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'present' | 'late' | 'absent' | 'excused'>>({});
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState('');

  // Member Edit & Delete State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [memberActionMsg, setMemberActionMsg] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Picker State
  const [presentMemberIds, setPresentMemberIds] = useState<Set<string>>(new Set());
  const [pickerSearch, setPickerSearch] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPickerMember, setSelectedPickerMember] = useState<Member | null>(null);
  const [groupSize, setGroupSize] = useState<number>(3);
  const [generatedGroups, setGeneratedGroups] = useState<Member[][]>([]);
  const [groupsSavedMsg, setGroupsSavedMsg] = useState('');

  // Guidelines State
  const [guidelinesText, setGuidelinesText] = useState('');
  const [guidelinesSaving, setGuidelinesSaving] = useState(false);
  const [guidelinesMsg, setGuidelinesMsg] = useState('');

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
      const data = await getAllMembers();
      setMembers(data);
      const sess = await getAllSessions();
      setSessionsList(sess);
      if (sess.length > 0 && !selectedSessionId) {
        setSelectedSessionId(sess[0].id);
      }
      const gGuide = await getGuidelinesContent();
      if (gGuide) setGuidelinesText(gGuide);
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

  // Export CSV (Fixed with direct Blob download for mobile & desktop)
  const handleExportCSV = () => {
    try {
      const exportable = members.filter((m) => m.id !== 'ENC-2302');
      const headers = ['Member ID', 'Full Name', 'Email', 'Total Points', 'Streak Sessions', 'Special Title', 'Joined Date'];
      
      const rows = exportable.map((m) => [
        `"${m.id}"`,
        `"${(m.name || '').replace(/"/g, '""')}"`,
        `"${(m.email || '').replace(/"/g, '""')}"`,
        m.totalPoints || 0,
        m.streak || 0,
        `"${(m.titleBadge || '').replace(/"/g, '""')}"`,
        `"${new Date(m.createdAt || Date.now()).toLocaleDateString()}"`,
      ]);

      const csvString = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `enactus_members_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error exporting CSV: ' + err.message);
    }
  };

  // Delete Member Confirmation Flow
  const handleDeleteMember = (m: Member) => {
    setMemberToDelete(m);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteMember(memberToDelete.id, (memberToDelete as any).docId);
      setMembers((prev) =>
        prev.filter(
          (item) =>
            item.id !== memberToDelete.id &&
            (item as any).docId !== (memberToDelete as any).docId
        )
      );
      setMemberActionMsg(`Deleted member ${memberToDelete.name}.`);
      setMemberToDelete(null);
      setTimeout(() => setMemberActionMsg(''), 4000);
    } catch (err: any) {
      alert('Error deleting member: ' + err.message);
    } finally {
      setDeleteLoading(false);
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

  // Create Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim() || !newSessionDate) return;

    try {
      const created = await createSession(newSessionTitle, newSessionDate);
      setSessionsList([created, ...sessionsList]);
      setSelectedSessionId(created.id);
      setNewSessionTitle('');
      setNewSessionDate('');
      alert(`Created ${created.title}!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!selectedSessionId) {
      alert('Please select or create a session first.');
      return;
    }

    setAttendanceSaving(true);
    setAttendanceSuccess('');

    try {
      const records = members.filter(m => m.id !== 'ENC-2302').map((m) => ({
        memberId: m.id,
        memberName: m.name,
        status: attendanceStatuses[m.id] || 'present',
      }));

      await markAttendance(selectedSessionId, records);
      setAttendanceSuccess('Attendance recorded! Streaks and points updated for all members! 🔥');
      await loadData();
      confetti({ particleCount: 70, spread: 70 });
    } catch (err: any) {
      alert('Error saving attendance: ' + err.message);
    } finally {
      setAttendanceSaving(false);
    }
  };

  // Open Member Edit Modal
  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setEditName(m.name || '');
    setEditEmail(m.email || '');
    setEditTitle(m.titleBadge || '');
  };

  // Save Member Edit
  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      await updateMemberProfile(editingMember.id, {
        name: editName,
        email: editEmail,
        titleBadge: editTitle,
      });
      setMemberActionMsg(`Updated ${editName}'s profile!`);
      setEditingMember(null);
      await loadData();
      setTimeout(() => setMemberActionMsg(''), 4000);
    } catch (err: any) {
      alert('Error updating member: ' + err.message);
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

  // Guidelines Handlers
  const handleSaveGuidelines = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuidelinesSaving(true);
    setGuidelinesMsg('');
    try {
      await updateGuidelinesContent(guidelinesText);
      setGuidelinesMsg('Guidelines updated live for all members!');
      setTimeout(() => setGuidelinesMsg(''), 4000);
    } catch (err: any) {
      alert('Error saving guidelines: ' + err.message);
    } finally {
      setGuidelinesSaving(false);
    }
  };

  const handleDeleteGuidelines = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete custom guidelines? It will revert to defaults.'
    );
    if (!confirmDelete) return;

    setGuidelinesSaving(true);
    try {
      await deleteGuidelinesContent();
      setGuidelinesText('');
      setGuidelinesMsg('Custom guidelines deleted successfully!');
      setTimeout(() => setGuidelinesMsg(''), 4000);
    } catch (err: any) {
      alert('Error deleting guidelines: ' + err.message);
    } finally {
      setGuidelinesSaving(false);
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
      {/* 6 Clean Action Tabs */}
      <div className="grid grid-cols-6 gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('points')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'points'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span className="truncate">Points</span>
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'sessions'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span className="truncate">Sessions</span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'members'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="truncate">Members</span>
        </button>
        <button
          onClick={() => setActiveTab('picker')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'picker'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span className="truncate">Picker</span>
        </button>
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'guidelines'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="truncate">Guide</span>
        </button>
        <button
          onClick={() => setActiveTab('toggles')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'toggles'
              ? 'bg-yellow-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="truncate">Toggles</span>
        </button>
      </div>

      {/* --- TAB 1: MANUAL POINTS --- */}
      {activeTab === 'points' && (
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
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-all"
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
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-yellow-400 rounded-lg border border-slate-700"
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
      )}

      {/* --- TAB 2: SESSIONS & ATTENDANCE --- */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <form
            onSubmit={handleCreateSession}
            className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3"
          >
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-yellow-400" />
              <span>Create New Presentations Session</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Session Title"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
              <input
                type="date"
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-yellow-400 font-bold rounded-xl text-xs transition-all"
            >
              + Create Session
            </button>
          </form>

          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Mark Attendance & Fire Streaks</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Present gives +10 pts + streak bonus, Late gives +5 pts flat
                </p>
              </div>

              {sessionsList.length > 0 && (
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-yellow-400 font-bold"
                >
                  {sessionsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.date})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {attendanceSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{attendanceSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {members
                .filter((m) => m.id !== 'ENC-2302')
                .map((m) => {
                  const currentStatus = attendanceStatuses[m.id] || 'present';
                  return (
                    <div
                      key={m.id}
                      className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BotAvatar config={m.avatar} size="sm" />
                        <div>
                          <span className="text-xs font-bold text-white block truncate">{m.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {m.id} • Streak: 🔥 {m.streak || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {(['present', 'late', 'absent', 'excused'] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              setAttendanceStatuses((prev) => ({ ...prev, [m.id]: status }))
                            }
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                              currentStatus === status
                                ? status === 'present'
                                  ? 'bg-emerald-500 text-slate-950 font-black'
                                  : status === 'late'
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : status === 'absent'
                                  ? 'bg-rose-500 text-white font-black'
                                  : 'bg-blue-500 text-white font-black'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {status[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={handleSaveAttendance}
              disabled={attendanceSaving || members.length === 0}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 mt-2"
            >
              <Flame className="w-4 h-4" />
              <span>{attendanceSaving ? 'Updating Streaks...' : 'Submit Attendance & Update Streaks 🔥'}</span>
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 3: MEMBERS DIRECTORY, BADGES & CSV --- */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-yellow-400" />
                <span>Presentations Members ({members.filter((m) => m.id !== 'ENC-2302').length})</span>
              </h3>
              <p className="text-[10px] text-slate-400">Edit profiles, grant awards & export data</p>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          {memberActionMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{memberActionMsg}</span>
            </div>
          )}

          {/* Edit Member Modal */}
          {editingMember && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveMemberEdit}
                className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3.5 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Edit Member ({editingMember.id})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-amber-400">
                    Special Title / Prestige Badge
                  </label>
                  <select
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="">-- No Badge Assigned --</option>
                    <option value="Most Improved Speaker">Most Improved Speaker</option>
                    <option value="Best Stage Presence">Best Stage Presence</option>
                    <option value="Most Consistent">Most Consistent</option>
                    <option value="Breakthrough Storyteller">Breakthrough Storyteller</option>
                    <option value="Audience Magnet">Audience Magnet</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-xl text-xs transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-3 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Delete Member Confirmation Modal */}
          {memberToDelete && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="max-w-xs w-full bg-slate-900 border border-rose-500/50 rounded-3xl p-5 space-y-4 shadow-2xl text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white">Permanently Delete Member?</h3>
                  <p className="text-xs text-slate-300">
                    Are you sure you want to delete <strong className="text-white">{memberToDelete.name}</strong> ({memberToDelete.id})?
                  </p>
                  <p className="text-[10px] text-rose-400">This action cannot be undone.</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={handleConfirmDelete}
                    className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={() => setMemberToDelete(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {members
              .filter((m) => m.id !== 'ENC-2302')
              .map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BotAvatar config={m.avatar} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white truncate">{m.name}</span>
                        {m.titleBadge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                            🎖️ {m.titleBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {m.id} • {m.email || 'No email registered'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(m)}
                      className="p-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-yellow-400 transition-colors cursor-pointer"
                      title="Edit Profile & Badge"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(m)}
                      className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                      title="Delete Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: SESSION PICKER & REAL-TIME BROADCAST --- */}
      {activeTab === 'picker' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRandomPick}
              disabled={isSpinning || presentMembersList.length === 0}
              className="p-3.5 bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl flex flex-col items-center justify-center gap-1 shadow-md disabled:opacity-50"
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

          {generatedGroups.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Shuffled Groups ({generatedGroups.length})
                </h3>
                <button
                  type="button"
                  onClick={handleSaveSessionGroups}
                  className="px-3 py-1 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Save Groups to Members' Home 💾
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

          <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">Present Today</h3>
                <p className="text-[10px] text-slate-400">
                  {presentMembersList.length} of {members.filter(m => m.id !== 'ENC-2302').length} checked
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const ids = filteredPickerMembers.map((m) => m.id);
                    setPresentMemberIds((prev) => new Set([...Array.from(prev), ...ids]));
                  }}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-medium"
                >
                  Check All
                </button>
                <button
                  onClick={() => {
                    setPresentMemberIds(new Set());
                  }}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-medium"
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
                    <span className="text-[10px] text-slate-500">{m.id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: EDITABLE GUIDELINES --- */}
      {activeTab === 'guidelines' && (
        <form onSubmit={handleSaveGuidelines} className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-yellow-400" />
              <span>Edit Live Guidelines Content</span>
            </h3>
            {guidelinesMsg && (
              <span className="text-[10px] text-emerald-400 font-bold">{guidelinesMsg}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Write or edit rules, session tips, and guidelines. Updates show up immediately for all members.
          </p>

          <textarea
            value={guidelinesText}
            onChange={(e) => setGuidelinesText(e.target.value)}
            rows={10}
            placeholder="Type your updated guidelines here..."
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guidelinesSaving}
              className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{guidelinesSaving ? 'Saving Changes...' : 'Save & Publish Live'}</span>
            </button>

            {guidelinesText && (
              <button
                type="button"
                onClick={handleDeleteGuidelines}
                disabled={guidelinesSaving}
                className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* --- TAB 6: SECTION TOGGLES (ENABLE/DISABLE SECTIONS) --- */}
      {activeTab === 'toggles' && (
        <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-yellow-400" />
              <span>Section Visibility Toggles</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Disable or enable app sections in real-time across all member devices
            </p>
          </div>

          {togglesMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-medium">
              {togglesMsg}
            </div>
          )}

          <div className="space-y-2.5">
            {/* Toggle 1: Feedback Page */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquareHeart className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Feedback Center</span>
                  <span className="text-[10px] text-slate-400">
                    {toggles.feedbackEnabled ? 'Active in footer navigation' : 'Hidden from members'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('feedbackEnabled')}
                className={`p-1 text-2xl transition-colors ${toggles.feedbackEnabled ? 'text-yellow-400' : 'text-slate-600'}`}
              >
                {toggles.feedbackEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            {/* Toggle 2: Game Center */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4 text-yellow-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Game Center (Coming Soon)</span>
                  <span className="text-[10px] text-slate-400">
                    {toggles.gameCenterEnabled ? 'Active in footer navigation' : 'Hidden from members'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('gameCenterEnabled')}
                className={`p-1 text-2xl transition-colors ${toggles.gameCenterEnabled ? 'text-yellow-400' : 'text-slate-600'}`}
              >
                {toggles.gameCenterEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
