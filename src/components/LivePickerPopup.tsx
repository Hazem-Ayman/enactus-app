'use client';

import { useState, useEffect } from 'react';
import BotAvatar from '@/components/BotAvatar';
import { Member } from '@/types';
import { subscribeToLivePicker } from '@/lib/firestore';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, X } from 'lucide-react';

export default function LivePickerPopup() {
  const [liveState, setLiveState] = useState<{
    isSpinning: boolean;
    selectedMember: Member | null;
    timestamp: number;
  } | null>(null);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Listen to real-time picker broadcasts from Coordinator
    const unsubscribe = subscribeToLivePicker((data) => {
      if (!data) return;
      // Only react if event was broadcasted within the last 60 seconds
      if (Date.now() - data.timestamp < 60000) {
        setLiveState(data);
        setVisible(true);

        if (!data.isSpinning && data.selectedMember) {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (!visible || !liveState) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="max-w-xs w-full bg-slate-900 border-2 border-yellow-400 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative">
        <div className="absolute top-3 left-3 p-1 rounded-lg bg-slate-800/80">
          <img src="/enactus-icon.png" alt="Enactus" className="w-4 h-4 object-contain" />
        </div>
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400/20 border border-yellow-400/40 rounded-full text-yellow-400 text-xs font-bold animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {liveState.isSpinning ? 'Coordinator is picking...' : 'Participant Selected!'}
          </span>
        </div>

        {liveState.selectedMember ? (
          <div className="space-y-3 py-2">
            <div className={`flex justify-center ${liveState.isSpinning ? 'animate-bounce' : 'scale-110'} transition-transform`}>
              <BotAvatar config={liveState.selectedMember.avatar} size="xl" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                {liveState.selectedMember.name}
              </h3>
              <span className="font-mono text-xs text-yellow-400 font-bold block mt-0.5">
                {liveState.selectedMember.id}
              </span>
            </div>

            {!liveState.isSpinning && (
              <p className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 py-1.5 rounded-xl border border-emerald-500/20">
                🎤 You have the stage!
              </p>
            )}
          </div>
        ) : (
          <div className="py-8 text-xs text-slate-400">
            Shuffling presenters...
          </div>
        )}
      </div>
    </div>
  );
}
