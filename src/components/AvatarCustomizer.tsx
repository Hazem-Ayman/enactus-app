'use client';

import { useState } from 'react';
import BotAvatar from '@/components/BotAvatar';
import { AvatarConfig } from '@/types';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

interface AvatarCustomizerProps {
  initialConfig?: AvatarConfig;
  memberId: string;
  onComplete: (config: AvatarConfig) => void;
}

const colors = [
  { id: 'blue', label: 'Cyan', bg: 'bg-cyan-500' },
  { id: 'orange', label: 'Orange', bg: 'bg-amber-500' },
  { id: 'pink', label: 'Pink', bg: 'bg-pink-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-600' },
  { id: 'green', label: 'Green', bg: 'bg-emerald-500' },
  { id: 'red', label: 'Red', bg: 'bg-rose-600' },
];

const shapes: { id: 'circle' | 'square' | 'rounded'; label: string }[] = [
  { id: 'rounded', label: 'Modern' },
  { id: 'circle', label: 'Round' },
  { id: 'square', label: 'Box' },
];

const accessories: { id: AvatarConfig['accessory']; label: string }[] = [
  { id: 'none', label: 'Classic' },
  { id: 'antenna', label: 'Antenna 📡' },
  { id: 'sunglasses', label: 'Shades 😎' },
  { id: 'glasses', label: 'Glasses 👓' },
  { id: 'vr', label: 'VR Visor 🥽' },
  { id: 'heart_eyes', label: 'Hearts 😍' },
  { id: 'horns', label: 'Horns ⚡' },
];

export default function AvatarCustomizer({
  initialConfig = { color: 'blue', shape: 'rounded', accessory: 'antenna' },
  memberId,
  onComplete,
}: AvatarCustomizerProps) {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border-2 border-yellow-400/40 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Title & Permanent ID Announcement */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Enactus Presentations!</span>
          </div>

          <h2 className="text-xl font-black text-white">Your Permanent Member ID</h2>
          
          {/* Big ID Badge */}
          <div className="py-2.5 px-6 bg-slate-950 border border-slate-800 rounded-2xl inline-block shadow-inner">
            <span className="font-mono text-2xl font-black tracking-widest text-yellow-400">
              {memberId}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Save this ID! You will use your <strong>email and this ID</strong> to sign in.
          </p>
        </div>

        {/* Live Bot Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
          <BotAvatar config={config} size="xl" className="transform hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold text-slate-400 mt-2">
            Customize your bot character face
          </span>
        </div>

        {/* 3 Customization Controls */}
        <div className="space-y-4">
          {/* 1. Color Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">1. Color</label>
            <div className="flex justify-between gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, color: c.id }))}
                  className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center border-2 transition-transform ${
                    config.color === c.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'
                  }`}
                >
                  {config.color === c.id && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Shape Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">2. Head Shape</label>
            <div className="grid grid-cols-3 gap-2">
              {shapes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, shape: s.id }))}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    config.shape === s.id
                      ? 'bg-yellow-400 text-slate-950 border-yellow-400 shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Accessory / Face Wear */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">3. Face Wear & Antennas</label>
            <div className="grid grid-cols-3 gap-1.5">
              {accessories.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, accessory: a.id }))}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-xl border truncate transition-all ${
                    config.accessory === a.id
                      ? 'bg-yellow-400 text-slate-950 border-yellow-400 shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Done / Save Button */}
        <button
          onClick={() => onComplete(config)}
          className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <span>Confirm & Enter Beta App</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
