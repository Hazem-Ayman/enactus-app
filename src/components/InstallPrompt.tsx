'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      // In Safari iOS or browsers where prompt cannot be triggered programmatically, show instructions
      alert(
        'To install this app on your phone:\n\n• On iPhone (Safari): Tap the Share icon (square with arrow) at the bottom, then tap "Add to Home Screen".\n\n• On Android (Chrome): Tap the three dots (⋮) menu in the top right, then tap "Install App" or "Add to Home screen".'
      );
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || isDismissed) return null;

  return (
    <div className="mb-4 bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-slate-950 p-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 border border-yellow-300 backdrop-blur-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 bg-slate-950 rounded-xl flex-shrink-0 flex items-center justify-center shadow-inner">
          <img src="/enactus-icon.png" alt="Enactus" className="w-5 h-5 object-contain" />
        </div>
        <div className="min-w-0">
          <h4 className="font-black text-xs leading-tight">Install Enactus App</h4>
          <p className="text-[10px] text-slate-900 font-semibold truncate">
            Add to home screen for full app experience
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-slate-950 text-yellow-400 hover:text-white font-black text-[11px] rounded-xl shadow-md transition-all"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-900 hover:text-white transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
