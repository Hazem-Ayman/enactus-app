'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Trophy, 
  MessageSquareHeart, 
  BookOpen, 
  Gamepad2, 
  CalendarCheck, 
  Users 
} from 'lucide-react';
import { subscribeToSectionToggles, SectionToggles } from '@/lib/firestore';

export default function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [toggles, setToggles] = useState<SectionToggles>({
    feedbackEnabled: true,
    gameCenterEnabled: true,
  });

  useEffect(() => {
    const unsub = subscribeToSectionToggles((data) => {
      setToggles(data);
    });

    const checkRole = () => {
      try {
        const saved = localStorage.getItem('enactus_member');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.id === 'ENC-2302' || parsed.role === 'admin') {
            setIsAdmin(true);
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
      setIsAdmin(false);
    };

    checkRole();
    window.addEventListener('storage', checkRole);

    return () => {
      unsub();
      window.removeEventListener('storage', checkRole);
    };
  }, [pathname]);

  // Dynamic Navigation Items
  const navItems = isAdmin
    ? [
        { name: 'Home', href: '/', icon: Home, visible: true },
        { name: 'Sessions', href: '/sessions', icon: CalendarCheck, visible: true },
        { name: 'Members', href: '/members', icon: Users, visible: true },
        { name: 'Feedback', href: '/feedback', icon: MessageSquareHeart, visible: toggles.feedbackEnabled },
        { name: 'Ranks', href: '/leaderboard', icon: Trophy, visible: true },
        { name: 'Guide', href: '/guidelines', icon: BookOpen, visible: true },
      ]
    : [
        { name: 'Home', href: '/', icon: Home, visible: true },
        { name: 'Feedback', href: '/feedback', icon: MessageSquareHeart, visible: toggles.feedbackEnabled },
        { name: 'Ranks', href: '/leaderboard', icon: Trophy, visible: true },
        { name: 'Games', href: '/games', icon: Gamepad2, visible: toggles.gameCenterEnabled },
        { name: 'Guide', href: '/guidelines', icon: BookOpen, visible: true },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 py-1.5">
      <div className="max-w-md mx-auto px-2 flex justify-around items-center">
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 transition-colors px-1.5 py-1 rounded-xl ${
                  isActive
                    ? 'text-yellow-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[9px] leading-tight">{item.name}</span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
