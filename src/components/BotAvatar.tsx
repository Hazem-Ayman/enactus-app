'use client';

import React from 'react';
import { AvatarConfig } from '@/types';

interface BotAvatarProps {
  config?: AvatarConfig;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const colorMaps: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  blue: { bg: 'bg-cyan-500', border: 'border-cyan-300', glow: 'shadow-cyan-500/50', text: 'text-cyan-900' },
  orange: { bg: 'bg-amber-500', border: 'border-amber-300', glow: 'shadow-amber-500/50', text: 'text-amber-950' },
  pink: { bg: 'bg-pink-500', border: 'border-pink-300', glow: 'shadow-pink-500/50', text: 'text-pink-950' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-300', glow: 'shadow-purple-500/50', text: 'text-purple-950' },
  green: { bg: 'bg-emerald-500', border: 'border-emerald-300', glow: 'shadow-emerald-500/50', text: 'text-emerald-950' },
  red: { bg: 'bg-rose-600', border: 'border-rose-300', glow: 'shadow-rose-500/50', text: 'text-rose-950' },
  slate: { bg: 'bg-slate-500', border: 'border-slate-300', glow: 'shadow-slate-500/50', text: 'text-slate-950' },
};

export default function BotAvatar({
  config,
  name,
  size = 'md',
  className = '',
}: BotAvatarProps) {
  // Fallback defaults if avatar config is not yet set
  const color = config?.color || 'blue';
  const shape = config?.shape || 'rounded';
  const accessory = config?.accessory || 'none';

  const colorStyle = colorMaps[color] || colorMaps.blue;

  const sizeClasses = {
    sm: 'w-8 h-8 text-[9px]',
    md: 'w-10 h-10 text-[10px]',
    lg: 'w-16 h-16 text-xs',
    xl: 'w-24 h-24 text-base',
  };

  const shapeClass =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'square'
      ? 'rounded-lg'
      : 'rounded-2xl';

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${sizeClasses[size]} ${className}`}
    >
      {/* Top Antenna / Ears / Horns */}
      {accessory === 'antenna' && (
        <div className="absolute -top-1.5 z-10 flex flex-col items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-sm animate-pulse" />
          <span className="w-0.5 h-1.5 bg-slate-400" />
        </div>
      )}

      {accessory === 'horns' && (
        <div className="absolute -top-1 z-10 w-full flex justify-between px-1.5">
          <span className="w-1.5 h-2 bg-yellow-400 rounded-t-full transform -rotate-12" />
          <span className="w-1.5 h-2 bg-yellow-400 rounded-t-full transform rotate-12" />
        </div>
      )}

      {/* Robot Head */}
      <div
        className={`w-full h-full ${shapeClass} ${colorStyle.bg} border-2 ${colorStyle.border} shadow-md ${colorStyle.glow} flex flex-col items-center justify-center relative overflow-hidden transition-all`}
      >
        {/* Screen/Face visor background */}
        <div className="w-[82%] h-[68%] bg-slate-950/80 rounded-lg flex flex-col items-center justify-center relative border border-white/10 px-1">
          {/* Accessories: Sunglasses / Glasses / VR */}
          {accessory === 'sunglasses' && (
            <div className="absolute inset-x-1 top-1.5 h-3 bg-black border border-slate-600 rounded-sm flex items-center justify-around z-10 shadow-sm">
              <span className="w-1.5 h-1 bg-cyan-400/80 rounded-full" />
              <span className="w-1.5 h-1 bg-cyan-400/80 rounded-full" />
            </div>
          )}

          {accessory === 'glasses' && (
            <div className="absolute inset-x-0.5 top-1.5 h-3.5 border-2 border-amber-300 rounded-md flex items-center justify-around z-10">
              <span className="w-2 h-2 rounded-full border border-amber-300" />
              <span className="w-1 h-0.5 bg-amber-300" />
              <span className="w-2 h-2 rounded-full border border-amber-300" />
            </div>
          )}

          {accessory === 'vr' && (
            <div className="absolute inset-x-0.5 top-1 h-3.5 bg-purple-900 border border-purple-400 rounded-md flex items-center justify-center z-10">
              <span className="w-4 h-1 bg-cyan-300 rounded-full animate-pulse" />
            </div>
          )}

          {/* Eyes (if not covered by sunglasses or VR) */}
          {accessory !== 'sunglasses' && accessory !== 'vr' && (
            <div className="flex items-center justify-between w-full px-1 z-0">
              {accessory === 'heart_eyes' ? (
                <>
                  <span className="text-[10px] text-pink-400 leading-none">❤️</span>
                  <span className="text-[10px] text-pink-400 leading-none">❤️</span>
                </>
              ) : (
                <>
                  {/* Digital Pixel / Glowing Eye */}
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_5px_#22d3ee]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_5px_#22d3ee]" />
                </>
              )}
            </div>
          )}

          {/* Smile or speaker mouth */}
          <div className="mt-1 w-2.5 h-0.5 bg-cyan-200/90 rounded-full" />
        </div>
      </div>
    </div>
  );
}
