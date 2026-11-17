import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const getInitials = (str: string) => {
    if (!str) return '??';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const colors = [
    'from-amber-500 to-yellow-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-indigo-600',
    'from-rose-500 to-pink-600',
  ];

  // Pick deterministic gradient based on name string
  const hash = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const gradient = colors[hash % colors.length];

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-lg font-bold',
    xl: 'w-20 h-20 text-2xl font-bold',
  };

  return (
    <div
      className={`rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-white shadow-md flex-shrink-0 select-none ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
