'use client';

import { useState } from 'react';
import BotAvatar from '@/components/BotAvatar';
import { AvatarConfig } from '@/types';
import { Sparkles, Check, ArrowRight, Bot, User, Skull, Orbit } from 'lucide-react';

interface AvatarCustomizerProps {
  initialConfig?: AvatarConfig;
  memberId: string;
  onComplete: (config: AvatarConfig) => void;
}

const types: { id: AvatarConfig['type']; label: string; icon: any }[] = [
  { id: 'robot', label: 'Robot 🤖', icon: Bot },
  { id: 'human', label: 'Human 👤', icon: User },
  { id: 'monster', label: 'Monster 👾', icon: Skull },
  { id: 'alien', label: 'Alien 👽', icon: Orbit },
];

const colors = [
  { id: 'blue', label: 'Cyan', bg: 'bg-cyan-500' },
  { id: 'orange', label: 'Orange', bg: 'bg-amber-500' },
  { id: 'pink', label: 'Pink', bg: 'bg-pink-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-600' },
  { id: 'green', label: 'Green', bg: 'bg-emerald-500' },
  { id: 'red', label: 'Red', bg: 'bg-rose-600' },
  { id: 'yellow', label: 'Gold', bg: 'bg-yellow-400' },
];

const shapes: { id: 'circle' | 'square' | 'rounded'; label: string }[] = [
  { id: 'rounded', label: 'Modern' },
  { id: 'circle', label: 'Round' },
  { id: 'square', label: 'Box' },
];

const accessories: { id: AvatarConfig['accessory']; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'crown', label: 'Crown 👑' },
  { id: 'cap', label: 'Cap 🧢' },
  { id: 'sunglasses', label: 'Shades 😎' },
  { id: 'glasses', label: 'Glasses 👓' },
  { id: 'antenna', label: 'Antenna 📡' },
  { id: 'horns', label: 'Horns ⚡' },
  { id: 'vr', label: 'VR Visor 🥽' },
  { id: 'heart_eyes', label: 'Hearts 😍' },
];

export default function AvatarCustomizer({
  initialConfig = { type: 'robot', color: 'blue', shape: 'rounded', accessory: 'antenna' },
  memberId,
  onComplete,
}: AvatarCustomizerProps) {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-slate-900 border-2 border-yellow-400/40 rounded-3xl p-6 shadow-2xl space-y-5 my-auto">
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
            Save this ID! You will sign in with your <strong>email and this ID</strong>.
          </p>
        </div>

        {/* Live Character Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
          <BotAvatar config={config} size="xl" className="transform hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold text-slate-400 mt-2">
            Live Character Face Preview
          </span>
        </div>

        {/* Customization Controls */}
        <div className="space-y-3.5">
          {/* 1. Character Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">1. Character Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, type: t.id }))}
                  className={`py-2 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    config.type === t.id
                      ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Color Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">2. Skin / Body Color</label>
            <div className="flex justify-between gap-1">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, color: c.id }))}
                  className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center border-2 transition-transform ${
                    config.color === c.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'
                  }`}
                >
                  {config.color === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Shape Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">3. Head Shape</label>
            <div className="grid grid-cols-3 gap-2">
              {shapes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, shape: s.id }))}
                  className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
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

          {/* 4. Accessories & Face Wear */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">4. Headwear & Face Accessories</label>
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
          <span>Save Character & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
