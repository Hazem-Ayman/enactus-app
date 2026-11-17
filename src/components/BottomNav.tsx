'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, MessageSquareHeart, BookOpen, Shield } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current logged-in user is coordinator admin
    const checkAdmin = () => {
      const saved = localStorage.getItem('enactus_member');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.id === 'ENC-2302' || parsed.role === 'admin') {
            setIsAdmin(true);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setIsAdmin(false);
    };

    checkAdmin();
    window.addEventListener('storage', checkAdmin);
    return () => window.removeEventListener('storage', checkAdmin);
  }, [pathname]);

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Feedback', href: '/feedback', icon: MessageSquareHeart },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Guide', href: '/guidelines', icon: BookOpen },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 py-2">
      <div className="max-w-md mx-auto px-4 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-colors px-3 py-1 rounded-xl ${
                isActive
                  ? 'text-yellow-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

