'use client';

import { useState } from 'react';
import DiceBearAvatar from '@/components/DiceBearAvatar';
import { AvatarConfig, AvatarStyle } from '@/types';
import {
  AVATAR_STYLES,
  COLOR_PALETTES,
  BOTTTS_TOPS,
  BOTTTS_EYES,
  BOTTTS_MOUTHS,
  ADVENTURER_HAIRS,
  ADVENTURER_GLASSES,
  ADVENTURER_MOUTHS,
  FUN_EMOJI_EYES,
  FUN_EMOJI_MOUTHS,
  getRandomAvatarConfig,
  normalizeAvatarConfig,
} from '@/lib/avatar';
import {
  Sparkles,
  Check,
  ArrowRight,
  Dices,
  Palette,
  Glasses,
} from 'lucide-react';

interface AvatarCustomizerProps {
  initialConfig?: AvatarConfig;
  memberId: string;
  onComplete: (config: AvatarConfig) => void;
  onClose?: () => void;
}

export default function AvatarCustomizer({
  initialConfig,
  memberId,
  onComplete,
  onClose,
}: AvatarCustomizerProps) {
  const [config, setConfig] = useState<AvatarConfig>(() =>
    normalizeAvatarConfig(initialConfig, memberId)
  );
  const [activeTab, setActiveTab] = useState<'style' | 'features' | 'colors'>('style');

  const currentStyle = config.style || 'bottts';
  const currentColor = config.backgroundColor?.[0] || '06b6d4';

  const handleStyleChange = (newStyle: AvatarStyle) => {
    setConfig(getRandomAvatarConfig(newStyle, memberId));
  };

  const handleRandomize = () => {
    setConfig(getRandomAvatarConfig(currentStyle, memberId));
  };

  const handleColorChange = (hex: string) => {
    setConfig((prev) => ({
      ...prev,
      backgroundColor: [hex],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-slate-900 border-2 border-yellow-400/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
        {/* Header with Enactus Branding & Member ID */}
        <div className="text-center space-y-1.5 flex flex-col items-center">
          <div className="flex items-center justify-between w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Character Studio</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕ Cancel
              </button>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white">
            Choose Your Presentation Persona
          </h2>

          {/* Member ID Badge */}
          <div className="py-2 px-5 bg-slate-950 border border-slate-800 rounded-2xl inline-flex items-center gap-2 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400">ID:</span>
            <span className="font-mono text-xl font-black tracking-widest text-yellow-400">
              {memberId}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Your unique avatar appears on the live leaderboards, games, and presentation teams.
          </p>
        </div>

        {/* Live Interactive Avatar Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950/90 to-slate-900 rounded-2xl border border-slate-800/80 relative group">
          <div className="relative">
            <DiceBearAvatar
              config={config}
              size="xl"
              className="ring-4 ring-yellow-400/30 shadow-xl transition-transform hover:scale-105"
            />
            <button
              type="button"
              onClick={handleRandomize}
              className="absolute -bottom-2 -right-2 p-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-full shadow-lg font-black text-xs transition-transform hover:rotate-45"
              title="Roll Random Avatar"
            >
              <Dices className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[11px] font-bold text-slate-300">
              {AVATAR_STYLES.find((s) => s.id === currentStyle)?.label}
            </span>
            <span className="text-[10px] text-yellow-400/80 font-mono">
              • Seed: {config.seed.slice(0, 10)}
            </span>
          </div>
        </div>

        {/* Sub-nav Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'style'
                ? 'bg-yellow-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>1. Archetype</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'features'
                ? 'bg-yellow-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>2. Features</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'colors'
                ? 'bg-yellow-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>3. Aura Color</span>
          </button>
        </div>

        {/* Tab 1: Character Style Archetype */}
        {activeTab === 'style' && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>Select Archetype Family</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AVATAR_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStyleChange(st.id)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-1 transition-all ${
                    currentStyle === st.id
                      ? 'bg-yellow-400/15 border-yellow-400 shadow-md ring-1 ring-yellow-400/40 text-white'
                      : 'bg-slate-800/70 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-2xl">{st.icon}</div>
                  <div>
                    <span className="text-xs font-black block text-white">{st.label}</span>
                    <span className="text-[9px] text-slate-400 leading-tight block line-clamp-2">
                      {st.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Presets / Seeds */}
            <div className="pt-2">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Quick Shuffle Variations:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Spark', 'Cyber', 'Echo', 'Nova', 'Pulse', 'Blaze'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, seed: `${tag}-${memberId}` }))}
                    className="px-2.5 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Custom Facial Features & Accessories */}
        {activeTab === 'features' && (
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {/* Style: BOTTTS ROBOT FEATURES */}
            {currentStyle === 'bottts' && (
              <>
                {/* 1. Antenna / Horns Top */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <span>Head Accessory / Top</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BOTTTS_TOPS.map((t) => {
                      const isSelected = config.top?.[0] === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, top: [t.id] }))}
                          className={`py-1.5 px-2 text-[10px] font-semibold rounded-xl border truncate transition-all ${
                            isSelected
                              ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Eyes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Eyes & Sensors</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BOTTTS_EYES.map((e) => {
                      const isSelected = config.eyes?.[0] === e.id;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, eyes: [e.id] }))}
                          className={`py-1.5 px-1 text-[10px] font-semibold rounded-xl border truncate transition-all text-center ${
                            isSelected
                              ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {e.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Mouth */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Mouth / Grille</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BOTTTS_MOUTHS.map((m) => {
                      const isSelected = config.mouth?.[0] === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, mouth: [m.id] }))}
                          className={`py-1.5 px-2 text-[10px] font-semibold rounded-xl border truncate transition-all ${
                            isSelected
                              ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Style: ADVENTURER HUMAN FEATURES */}
            {currentStyle === 'adventurer' && (
              <>
                {/* 1. Hair Style */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Hairstyle</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ADVENTURER_HAIRS.map((h) => {
                      const isSelected = config.hair?.[0] === h.id;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, hair: [h.id] }))}
                          className={`py-1.5 px-2 text-[10px] font-semibold rounded-xl border truncate transition-all ${
                            isSelected
                              ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {h.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Glasses */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Glasses className="w-3 h-3 text-yellow-400" />
                    <span>Eyewear & Glasses</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ADVENTURER_GLASSES.map((g) => {
                      const isSelected =
                        (g.id === 'none' && (!config.glasses || config.glasses.length === 0)) ||
                        config.glasses?.[0] === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() =>
                            setConfig((p) => ({
                              ...p,
                              glasses: g.id === 'none' ? [] : [g.id],
                            }))
                          }
                          className={`py-1.5 px-2 text-[10px] font-semibold rounded-xl border truncate transition-all ${
                            isSelected
                              ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Mouth */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Smile & Expression</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ADVENTURER_MOUTHS.map((m) => {
                      const isSelected = config.mouth?.[0] === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, mouth: [m.id] }))}
                          className={`py-1.5 px-2 text-[10px] font-semibold rounded-xl border truncate transition-all ${
                            isSelected
                              ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Style: FUN EMOJI FEATURES */}
            {currentStyle === 'funEmoji' && (
              <>
                {/* 1. Eyes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Mood & Eyes</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FUN_EMOJI_EYES.map((e) => {
                      const isSelected = config.eyes?.[0] === e.id;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, eyes: [e.id] }))}
                          className={`py-1.5 px-2 text-[10px] font-semibold rounded-xl border truncate transition-all ${
                            isSelected
                              ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {e.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Mouth */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Mouth & Reaction</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FUN_EMOJI_MOUTHS.map((m) => {
                      const isSelected = config.mouth?.[0] === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, mouth: [m.id] }))}
                          className={`py-1.5 px-2 text-[10px] font-semibold rounded-xl border truncate transition-all ${
                            isSelected
                              ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Background Aura Colors */}
        {activeTab === 'colors' && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-yellow-400" />
              <span>Background Aura Color</span>
            </label>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {COLOR_PALETTES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleColorChange(c.hex)}
                  className={`p-2 rounded-xl flex flex-col items-center gap-1.5 border-2 transition-all ${
                    currentColor === c.hex
                      ? 'border-yellow-400 bg-yellow-400/10 scale-105 shadow-md'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full ${c.bgClass} flex items-center justify-center shadow-inner`}
                  >
                    {currentColor === c.hex && (
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save / Complete Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onComplete(config)}
            className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Save Character & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
