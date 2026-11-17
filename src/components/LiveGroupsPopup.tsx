'use client';

import { useState, useEffect } from 'react';
import { subscribeToLiveGroups, LiveGroupsState } from '@/lib/firestore';
import confetti from 'canvas-confetti';
import { Users, Sparkles, X, UserCheck } from 'lucide-react';

export default function LiveGroupsPopup() {
  const [liveState, setLiveState] = useState<LiveGroupsState | null>(null);
  const [visible, setVisible] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  useEffect(() => {
    // Check current user ID
    try {
      const saved = localStorage.getItem('enactus_member');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id) setCurrentMemberId(parsed.id);
      }
    } catch (e) {
      console.error(e);
    }

    // Listen to real-time groups broadcasts from Coordinator
    const unsubscribe = subscribeToLiveGroups((data) => {
      if (!data) return;
      // Only react if broadcasted within the last 90 seconds
      if (Date.now() - data.timestamp < 90000) {
        setLiveState(data);
        setVisible(true);

        if (!data.isShuffling && data.groups && data.groups.length > 0) {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 },
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (!visible || !liveState) return null;

  // Find current user's team if any
  const myTeam = currentMemberId && liveState.groups
    ? liveState.groups.find((g) => g.members.some((m) => m.id === currentMemberId))
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="max-w-sm w-full bg-slate-900 border-2 border-indigo-500/80 rounded-3xl p-5 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-full text-indigo-400 text-xs font-bold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {liveState.isShuffling ? 'Shuffling Teams Live...' : 'Session Teams Announced! 🎉'}
            </span>
          </div>
          <h2 className="text-base font-black text-white">
            {liveState.isShuffling ? 'Organizing Groups' : 'Presentations Team Challenge'}
          </h2>
        </div>

        {liveState.isShuffling ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-spin">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-300">
              Coordinator Hazem is randomizing teams...
            </p>
          </div>
        ) : (
          <>
            {/* If member found in a team, highlight their team */}
            {myTeam && (
              <div className="p-3.5 bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-transparent border-2 border-yellow-400/80 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-yellow-400">
                  <UserCheck className="w-4 h-4" />
                  <span>YOUR TEAM: Team {myTeam.teamNumber}</span>
                </div>
                <div className="text-[11px] text-slate-200 flex flex-wrap gap-1.5">
                  {myTeam.members.map((m) => (
                    <span
                      key={m.id}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                        m.id === currentMemberId
                          ? 'bg-yellow-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-white border border-slate-700'
                      }`}
                    >
                      {m.name} {m.id === currentMemberId && '(You)'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable list of all teams */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[45vh]">
              {liveState.groups.map((group) => {
                const isMyGroup = myTeam?.teamNumber === group.teamNumber;
                return (
                  <div
                    key={group.teamNumber}
                    className={`p-3 rounded-2xl border transition-all ${
                      isMyGroup
                        ? 'bg-slate-800/90 border-yellow-400/60'
                        : 'bg-slate-800/50 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1.5">
                      <span className={isMyGroup ? 'text-yellow-400 font-extrabold' : 'text-indigo-300'}>
                        Team {group.teamNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {group.members.length} members
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {group.members.map((m) => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] text-slate-200"
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setVisible(false)}
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-all shadow-md mt-1 cursor-pointer"
            >
              Got It, Let&apos;s Present! 🚀
            </button>
          </>
        )}
      </div>
    </div>
  );
}
