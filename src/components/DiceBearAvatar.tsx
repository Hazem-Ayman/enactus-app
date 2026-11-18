'use client';

import React, { useMemo } from 'react';
import { AvatarConfig } from '@/types';
import { getAvatarDataUri } from '@/lib/avatar';

export interface DiceBearAvatarProps {
  config?: AvatarConfig;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  alt?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 min-w-[2rem] min-h-[2rem]',
  md: 'w-10 h-10 min-w-[2.5rem] min-h-[2.5rem]',
  lg: 'w-16 h-16 min-w-[4rem] min-h-[4rem]',
  xl: 'w-24 h-24 min-w-[6rem] min-h-[6rem]',
};

export default function DiceBearAvatar({
  config,
  name,
  size = 'md',
  className = '',
  alt,
}: DiceBearAvatarProps) {
  const dataUri = useMemo(() => {
    return getAvatarDataUri(config, name || 'Member');
  }, [config, name]);

  const sizeClass = typeof size === 'string' ? sizeMap[size] || sizeMap.md : '';
  const inlineSize = typeof size === 'number' ? { width: size, height: size } : undefined;

  return (
    <div
      style={inlineSize}
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none rounded-full overflow-hidden shadow-md ring-2 ring-yellow-400/20 bg-slate-900 ${sizeClass} ${className}`}
    >
      <img
        src={dataUri}
        alt={alt || name || 'User Avatar'}
        className="w-full h-full object-cover transition-transform"
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

export { DiceBearAvatar };
