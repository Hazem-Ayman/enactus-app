'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getAllMembers, 
  getAllSessions, 
  createSession, 
  markAttendance,
  getSessionAttendance,
  deleteSession,
  clearSessionAttendance
} from '@/lib/firestore';
import { Member, Session, AttendanceRecord } from '@/types';
import BotAvatar from '@/components/BotAvatar';
import confetti from 'canvas-confetti';
import { 
  CalendarCheck, 
  ArrowLeft, 
  Plus, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  RotateCcw, 
  Edit3, 
  Users, 
  Clock, 
  Calendar,
  Lock,
  Unlock
} from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [loading, setLoading] = useState(true);

  // Create Session Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTheme, setNewTheme] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  // Attendance Form State
  const [attendanceStatuses, setAttendanceStatuses] = useState<{ [memberId: string]: 'present' | 'late' | 'absent' | 'excused' }>({});
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Delete Session Modal State
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Clear Attendance Modal State
  const [confirmClearSession, setConfirmClearSession] = useState<Session | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [allSessions, allMembers] = await Promise.all([
        getAllSessions(),
        getAllMembers(),
      ]);
      setSessions(allSessions);
      setMembers(allMembers);

      if (allSessions.length > 0) {
        const first = allSessions[0];
        setSelectedSessionId(first.id);
        await loadSessionAttendanceData(first.id, allMembers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionAttendanceData = async (sessId: string, currentMembers: Member[]) => {
    try {
      const records = await getSessionAttendance(sessId);
      setExistingRecords(records);

      const statusMap: { [memberId: string]: 'present' | 'late' | 'absent' | 'excused' } = {};
      if (records.length > 0) {
        records.forEach((r) => {
          statusMap[r.memberId] = r.status;
        });
      } else {
        // Default all to present if never marked
        currentMembers.forEach((m) => {
          statusMap[m.id] = 'present';
        });
      }
      setAttendanceStatuses(statusMap);
      setIsEditingExisting(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Switch Selected Session
  const handleSelectSession = async (sessId: string) => {
    setSelectedSessionId(sessId);
    await loadSessionAttendanceData(sessId, members);
  };

  // Create Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) {
      alert('Please provide a session title and date.');
      return;
    }

    setCreatingSession(true);
    try {
      const created = await createSession(newTitle, newDate, newTheme);
      setSessions((prev) => [created, ...prev]);
      setSelectedSessionId(created.id);
      await loadSessionAttendanceData(created.id, members);
      setNewTitle('');
      setNewDate('');
      setNewTheme('');
      setSuccessMsg(`Session "${created.title}" created successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Error creating session: ' + err.message);
    } finally {
      setCreatingSession(false);
    }
  };

  // Submit Attendance
  const handleSaveAttendance = async () => {
    const activeSession = sessions.find((s) => s.id === selectedSessionId);
    if (!activeSession) {
      alert('Please select a session first.');
      return;
    }

    const isUpdate = activeSession.attendanceSubmitted && isEditingExisting;

    setSavingAttendance(true);
    setSuccessMsg('');

    try {
      const records = members
        .filter((m) => m.id !== 'ENC-2302')
        .map((m) => ({
          memberId: m.id,
          memberName: m.name,
          status: attendanceStatuses[m.id] || 'present',
        }));

      await markAttendance(selectedSessionId, records, isUpdate);

      setSuccessMsg(
        isUpdate
          ? 'Attendance updated successfully without duplicating points!'
          : 'Attendance recorded! Streaks and points awarded to present members! 🔥'
      );

      // Reload fresh sessions and members
      const [updatedSessions, updatedMembers] = await Promise.all([
        getAllSessions(),
        getAllMembers(),
      ]);
      setSessions(updatedSessions);
      setMembers(updatedMembers);
      await loadSessionAttendanceData(selectedSessionId, updatedMembers);

      if (!isUpdate) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      alert('Error recording attendance: ' + err.message);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Clear Session Attendance
  const handleConfirmClearAttendance = async () => {
    if (!confirmClearSession) return;
    try {
      await clearSessionAttendance(confirmClearSession.id);
      setSuccessMsg(`Cleared attendance for "${confirmClearSession.title}".`);
      setConfirmClearSession(null);
      const updatedSessions = await getAllSessions();
      setSessions(updatedSessions);
      await loadSessionAttendanceData(confirmClearSession.id, members);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Error clearing attendance: ' + err.message);
    }
  };

  // Delete Session
  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteSession(sessionToDelete.id);
      const remaining = sessions.filter((s) => s.id !== sessionToDelete.id);
      setSessions(remaining);
      if (selectedSessionId === sessionToDelete.id) {
        if (remaining.length > 0) {
          setSelectedSessionId(remaining[0].id);
          await loadSessionAttendanceData(remaining[0].id, members);
        } else {
          setSelectedSessionId('');
          setExistingRecords([]);
        }
      }
      setSuccessMsg(`Deleted session "${sessionToDelete.title}".`);
      setSessionToDelete(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Error deleting session: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-yellow-400" />
              <span>Sessions & Attendance</span>
            </h1>
            <p className="text-[10px] text-slate-400">
              Create meetings, track participation & update streaks logically
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-xl text-xs font-bold font-mono">
          {sessions.length} Sessions
        </span>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SECTION 1: CREATE NEW SESSION */}
      <form
        onSubmit={handleCreateSession}
        className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3"
      >
        <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-yellow-400" />
          <span>Create New Presentations Session</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Session Title (e.g. Session 3: Body Language)"
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
          />
        </div>

        <input
          type="text"
          value={newTheme}
          onChange={(e) => setNewTheme(e.target.value)}
          placeholder="Optional Theme / Focus (e.g. Impromptu Speaking)"
          className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        <button
          type="submit"
          disabled={creatingSession}
          className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{creatingSession ? 'Creating...' : '+ Create Session'}</span>
        </button>
      </form>

      {/* SECTION 2: SESSION SELECTOR & LOGICAL STATUS */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700/60 text-slate-400 text-xs">
          No sessions created yet. Create your first session above!
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                <span>Select Active Session</span>
              </label>

              {activeSession && (
                <div className="flex items-center gap-1.5">
                  {activeSession.attendanceSubmitted && (
                    <button
                      type="button"
                      onClick={() => setConfirmClearSession(activeSession)}
                      className="px-2 py-1 text-[10px] bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Clear attendance records for this session"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSessionToDelete(activeSession)}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                    title="Delete this session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <select
              value={selectedSessionId}
              onChange={(e) => handleSelectSession(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.title} ({sess.date}) {sess.attendanceSubmitted ? '✓ [Marked]' : '⏳ [Pending]'}
                </option>
              ))}
            </select>

            {/* Logical Status Banner */}
            {activeSession && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  activeSession.attendanceSubmitted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {activeSession.attendanceSubmitted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold truncate">
                      {activeSession.attendanceSubmitted
                        ? 'Attendance Submitted & Points Awarded'
                        : 'Attendance Pending (Not Submitted Yet)'}
                    </p>
                    {activeSession.attendanceSummary && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {activeSession.attendanceSummary.present} Present • {activeSession.attendanceSummary.late} Late • {activeSession.attendanceSummary.absent} Absent • {activeSession.attendanceSummary.excused} Excused
                      </p>
                    )}
                  </div>
                </div>

                {activeSession.attendanceSubmitted && (
                  <button
                    type="button"
                    onClick={() => setIsEditingExisting(!isEditingExisting)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-yellow-400 border border-slate-700 hover:bg-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    {isEditingExisting ? (
                      <>
                        <Lock className="w-3 h-3" /> Lock
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3 h-3" /> Adjust
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: ATTENDANCE SHEET */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Member Attendance & Streaks</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Present: +10 pts + (streak × 5) bonus • Late: +5 pts flat
                </p>
              </div>

              {(!activeSession?.attendanceSubmitted || isEditingExisting) && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const allPresent: { [id: string]: 'present' } = {};
                      members.forEach((m) => {
                        allPresent[m.id] = 'present';
                      });
                      setAttendanceStatuses(allPresent);
                    }}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-medium rounded-lg cursor-pointer"
                  >
                    All P
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const allAbsent: { [id: string]: 'absent' } = {};
                      members.forEach((m) => {
                        allAbsent[m.id] = 'absent';
                      });
                      setAttendanceStatuses(allAbsent);
                    }}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-medium rounded-lg cursor-pointer"
                  >
                    All A
                  </button>
                </div>
              )}
            </div>

            {/* Members Attendance Rows */}
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {members
                .filter((m) => m.id !== 'ENC-2302')
                .map((m) => {
                  const currentStatus = attendanceStatuses[m.id] || 'present';
                  const isLocked = activeSession?.attendanceSubmitted && !isEditingExisting;

                  return (
                    <div
                      key={m.id}
                      className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BotAvatar config={m.avatar} size="sm" />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">{m.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {m.id} • Streak: 🔥 {m.streak || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1 flex-shrink-0">
                        {(['present', 'late', 'absent', 'excused'] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={isLocked}
                            onClick={() =>
                              setAttendanceStatuses((prev) => ({ ...prev, [m.id]: status }))
                            }
                            className={`w-7 h-7 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all flex items-center justify-center ${
                              isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                            } ${
                              currentStatus === status
                                ? status === 'present'
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                  : status === 'late'
                                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                                  : status === 'absent'
                                  ? 'bg-rose-500 text-white shadow-sm'
                                  : 'bg-blue-500 text-white shadow-sm'
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

            {/* Action Submit Button */}
            {activeSession?.attendanceSubmitted && !isEditingExisting ? (
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 text-center space-y-1">
                <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Attendance is Locked (Points Already Awarded)</span>
                </span>
                <p className="text-[10px] text-slate-400">
                  Click &quot;Adjust&quot; above to correct an attendance status without duplicating points.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={savingAttendance || members.length === 0}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>
                  {savingAttendance
                    ? 'Recording Attendance...'
                    : isEditingExisting
                    ? 'Save Updated Attendance (No Duplicate Points)'
                    : 'Submit Attendance & Fire Streaks 🔥'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Session Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-slate-900 border border-rose-500/50 rounded-3xl p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Delete Session?</h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to delete <strong className="text-white">{sessionToDelete.title}</strong>? All attendance records for this session will also be deleted.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDeleteSession}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Attendance Modal */}
      {confirmClearSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-slate-900 border border-amber-500/50 rounded-3xl p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Reset Session Attendance?</h3>
              <p className="text-xs text-slate-300">
                This will clear the recorded attendance sheet for <strong className="text-white">{confirmClearSession.title}</strong> so you can mark it fresh.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmClearAttendance}
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Reset Sheet
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearSession(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
