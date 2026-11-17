'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, MessageSquareHeart, BookOpen, Gamepad2 } from 'lucide-react';
import { subscribeToSectionToggles, SectionToggles } from '@/lib/firestore';

export default function BottomNav() {
  const pathname = usePathname();
  const [toggles, setToggles] = useState<SectionToggles>({
    feedbackEnabled: true,
    gameCenterEnabled: true,
  });

  useEffect(() => {
    const unsub = subscribeToSectionToggles((data) => {
      setToggles(data);
    });
    return () => unsub();
  }, []);

  const navItems = [
    { name: 'Home', href: '/', icon: Home, visible: true },
    { name: 'Feedback', href: '/feedback', icon: MessageSquareHeart, visible: toggles.feedbackEnabled },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy, visible: true },
    { name: 'Games', href: '/games', icon: Gamepad2, visible: toggles.gameCenterEnabled },
    { name: 'Guide', href: '/guidelines', icon: BookOpen, visible: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 py-2">
      <div className="max-w-md mx-auto px-4 flex justify-around items-center">
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-colors px-2 py-1 rounded-xl ${
                  isActive
                    ? 'text-yellow-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}


