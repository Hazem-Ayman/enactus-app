import { Sparkles, Gamepad2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GamesPage() {
  return (
    <div className="space-y-6 pb-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-yellow-400" />
            Game Center
          </h1>
          <p className="text-xs text-slate-400">Interactive session games & speaking battles</p>
        </div>
      </div>

      {/* Coming Soon Hero Card */}
      <div className="p-8 bg-gradient-to-br from-yellow-500/15 via-amber-600/10 to-slate-900 border-2 border-yellow-400/40 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-yellow-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/30 animate-bounce">
          <Gamepad2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 rounded-full text-[11px] font-black uppercase tracking-wider">
            ⚡ Coming Soon
          </span>
          <h2 className="text-xl font-black text-white pt-2">
            Presentations Game Center
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Live speech battles, impromptu speaking roulette, and rapid-fire presentation challenges are currently being prepared for upcoming sessions!
          </p>
        </div>
      </div>
    </div>
  );
}
