'use client';

import { useState, useEffect } from 'react';
import { getAllMembers } from '@/lib/firestore';
import { Member, Committee } from '@/types';
import Avatar from '@/components/Avatar';
import BotAvatar from '@/components/BotAvatar';
import { Trophy, RefreshCw, Flame } from 'lucide-react';

export default function LeaderboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Load current member from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('enactus_member');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentMemberId(parsed.id);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await getAllMembers();
      setMembers(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh every 5 seconds (as specified in v1.0 [NOW])
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter out coordinator ENC-2302 from member ranking list
  const rankedMembers = members.filter((m) => m.id !== 'ENC-2302');

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Leaderboard
          </h1>
          <p className="text-xs text-slate-400">Presentations Committee live standings</p>
        </div>

        <button
          onClick={fetchLeaderboard}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-yellow-400 transition-colors flex items-center gap-1 text-xs"
          title="Manual refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-yellow-400' : ''}`} />
          <span className="text-[10px] text-slate-500">Live</span>
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2 mt-2">
        {loading && rankedMembers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Loading ranks...
          </div>
        ) : rankedMembers.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No members registered yet.
          </div>
        ) : (
          rankedMembers.map((member, index) => {
            const rank = index + 1;
            const isCurrent = member.id === currentMemberId;

            // Badges for Top 3
            let rankColor = 'text-slate-400';
            let rankBadge = null;
            if (rank === 1) {
              rankColor = 'text-yellow-400 font-bold';
              rankBadge = '🥇';
            } else if (rank === 2) {
              rankColor = 'text-slate-300 font-bold';
              rankBadge = '🥈';
            } else if (rank === 3) {
              rankColor = 'text-amber-600 font-bold';
              rankBadge = '🥉';
            }

            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                  isCurrent
                    ? 'bg-yellow-500/10 border-yellow-500/50 shadow-md ring-1 ring-yellow-500/30'
                    : 'bg-slate-800/50 border-slate-800/80 hover:bg-slate-800/80'
                }`}
              >
                {/* Rank Number */}
                <div className="w-7 text-center font-bold text-sm flex items-center justify-center">
                  {rankBadge || <span className={rankColor}>#{rank}</span>}
                </div>

                {/* Bot Avatar Character */}
                <BotAvatar config={member.avatar} name={member.name} size="md" />

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white truncate">
                        {member.name}
                      </span>
                      {member.titleBadge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full flex-shrink-0">
                          🎖️ {member.titleBadge}
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-yellow-400 text-slate-950 rounded-full flex-shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-yellow-400 font-mono font-medium">
                      {member.id}
                    </span>
                    {member.streak > 0 && (
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-amber-400" />
                        {member.streak}
                      </span>
                    )}
                  </div>
                </div>

                {/* Points Badge */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-extrabold text-yellow-400">
                    {member.totalPoints ?? 0}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">
                    pts
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
