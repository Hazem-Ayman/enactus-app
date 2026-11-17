'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if dismissed previously in this session
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-gradient-to-r from-yellow-500/95 to-amber-600/95 text-slate-950 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-yellow-300 animate-bounce-short backdrop-blur-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 bg-slate-950 text-yellow-400 rounded-xl flex-shrink-0">
          <Download className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h4 className="font-black text-xs leading-tight">Install Enactus App</h4>
          <p className="text-[10px] text-slate-900 font-medium truncate">
            Add to your home screen for full app experience
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-slate-950 text-white hover:bg-slate-900 font-bold text-[11px] rounded-xl shadow-md transition-all"
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
