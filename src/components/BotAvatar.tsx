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
  yellow: { bg: 'bg-yellow-400', border: 'border-yellow-200', glow: 'shadow-yellow-400/50', text: 'text-yellow-950' },
};

export default function BotAvatar({
  config,
  name,
  size = 'md',
  className = '',
}: BotAvatarProps) {
  const type = config?.type || 'robot';
  const color = config?.color || 'blue';
  const shape = config?.shape || 'rounded';
  const accessory = config?.accessory || 'none';
  const expression = config?.expression || 'smile';

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
      {/* Accessory: Cap */}
      {accessory === 'cap' && (
        <div className="absolute -top-2 z-20 flex flex-col items-center">
          <div className="w-8 h-2.5 bg-rose-600 rounded-t-full border border-rose-400" />
          <div className="w-10 h-1 bg-rose-700 rounded-full" />
        </div>
      )}

      {/* Accessory: Crown */}
      {accessory === 'crown' && (
        <div className="absolute -top-2.5 z-20 text-yellow-300 text-xs filter drop-shadow">
          👑
        </div>
      )}

      {/* Accessory: Antenna (for Robots / Aliens) */}
      {accessory === 'antenna' && (
        <div className="absolute -top-2 z-10 flex flex-col items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-sm animate-pulse" />
          <span className="w-0.5 h-1.5 bg-slate-400" />
        </div>
      )}

      {/* Accessory: Horns (for Monster) */}
      {accessory === 'horns' && (
        <div className="absolute -top-1.5 z-10 w-full flex justify-between px-1">
          <span className="w-1.5 h-2.5 bg-amber-400 rounded-t-full transform -rotate-12" />
          <span className="w-1.5 h-2.5 bg-amber-400 rounded-t-full transform rotate-12" />
        </div>
      )}

      {/* Head Container */}
      <div
        className={`w-full h-full ${shapeClass} ${colorStyle.bg} border-2 ${colorStyle.border} shadow-md ${colorStyle.glow} flex flex-col items-center justify-center relative overflow-hidden transition-all`}
      >
        {/* CHARACTER TYPE: ROBOT */}
        {type === 'robot' && (
          <div className="w-[82%] h-[68%] bg-slate-950/85 rounded-lg flex flex-col items-center justify-center relative border border-white/10 px-1">
            {/* Sunglasses / Glasses / VR */}
            {accessory === 'sunglasses' && (
              <div className="absolute inset-x-1 top-1.5 h-3 bg-black border border-slate-600 rounded-sm flex items-center justify-around z-10">
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

            {/* Robot Eyes */}
            {accessory !== 'sunglasses' && accessory !== 'vr' && (
              <div className="flex items-center justify-between w-full px-1">
                {accessory === 'heart_eyes' ? (
                  <>
                    <span className="text-[10px] text-pink-400 leading-none">❤️</span>
                    <span className="text-[10px] text-pink-400 leading-none">❤️</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_5px_#22d3ee]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_5px_#22d3ee]" />
                  </>
                )}
              </div>
            )}
            <div className="mt-1 w-2.5 h-0.5 bg-cyan-200/90 rounded-full" />
          </div>
        )}

        {/* CHARACTER TYPE: HUMAN */}
        {type === 'human' && (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {/* Hair Top */}
            <div className="absolute top-0 inset-x-0 h-2 bg-slate-900 rounded-t-xl" />

            {/* Glasses / Sunglasses */}
            {accessory === 'sunglasses' ? (
              <div className="w-6 h-2.5 bg-slate-950 border border-slate-700 rounded-sm mt-1 z-10 shadow-sm" />
            ) : accessory === 'glasses' ? (
              <div className="w-6 h-3 border-2 border-amber-300 rounded-md flex items-center justify-around z-10 mt-1">
                <span className="w-2 h-2 rounded-full border border-amber-300" />
                <span className="w-2 h-2 rounded-full border border-amber-300" />
              </div>
            ) : (
              /* Eyes */
              <div className="flex items-center justify-between w-5 mt-1 z-0">
                {accessory === 'heart_eyes' ? (
                  <>
                    <span className="text-[9px] text-pink-500">❤️</span>
                    <span className="text-[9px] text-pink-500">❤️</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  </>
                )}
              </div>
            )}

            {/* Human Smile */}
            <div className="mt-1 w-3 h-1 border-b-2 border-slate-950 rounded-full" />
          </div>
        )}

        {/* CHARACTER TYPE: MONSTER */}
        {type === 'monster' && (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {/* Monster 3 Eyes or Cyclops */}
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white border border-slate-900 flex items-center justify-center">
                <span className="w-0.5 h-0.5 bg-slate-950 rounded-full" />
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-900 flex items-center justify-center shadow-sm">
                <span className="w-1 h-1 bg-yellow-400 rounded-full" />
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white border border-slate-900 flex items-center justify-center">
                <span className="w-0.5 h-0.5 bg-slate-950 rounded-full" />
              </span>
            </div>

            {/* Monster Mouth with Sharp Teeth */}
            <div className="mt-1 w-4 h-2 bg-slate-950 rounded-md flex items-center justify-around px-0.5">
              <span className="w-1 h-1 bg-white transform rotate-45" />
              <span className="w-1 h-1 bg-white transform rotate-45" />
            </div>
          </div>
        )}

        {/* CHARACTER TYPE: ALIEN */}
        {type === 'alien' && (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {/* Slanted Big Black Alien Eyes */}
            <div className="flex items-center justify-between w-6 mt-1">
              <span className="w-2.5 h-3.5 bg-slate-950 rounded-full transform -rotate-12 shadow-sm" />
              <span className="w-2.5 h-3.5 bg-slate-950 rounded-full transform rotate-12 shadow-sm" />
            </div>
            {/* Tiny alien mouth */}
            <div className="mt-1 w-1.5 h-1 bg-slate-950 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
