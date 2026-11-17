'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Star, Award, ShieldAlert, Users } from 'lucide-react';
import { getGuidelinesContent } from '@/lib/firestore';

export default function GuidelinesPage() {
  const [customContent, setCustomContent] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const content = await getGuidelinesContent();
      if (content) setCustomContent(content);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-yellow-400" />
            Beta Guidelines
          </h1>
          <p className="text-xs text-slate-400">Everything you need to know about points & sessions</p>
        </div>
      </div>

      {/* If custom coordinator guidelines exist, show them prominently */}
      {customContent && (
        <section className="bg-slate-800/80 rounded-2xl p-4 border border-yellow-400/40 space-y-2">
          <div className="flex items-center gap-2 text-yellow-400 font-semibold text-xs">
            <Award className="w-4 h-4" />
            <span>Coordinator Announcements & Rules</span>
          </div>
          <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {customContent}
          </div>
        </section>
      )}

      {/* Section 1: How Points Work */}
      <section className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-3">
        <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm">
          <Award className="w-4 h-4" />
          <span>How Points Work</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Points measure your improvement, participation, and active consistency. Talent is great, but consistency and curiosity take you much further.
        </p>
        <ul className="text-xs space-y-2 text-slate-300 list-disc list-inside">
          <li><strong>Live Sessions:</strong> Points for asking thoughtful questions, speaking up, volunteering, or sharing creative design critiques.</li>
          <li><strong>Activities & Tasks:</strong> Points awarded for timely task submissions.</li>
          <li><strong>Corrections:</strong> Mistakes or point adjustments can be made at any time by your coordinators.</li>
        </ul>
      </section>

      {/* Section 2: Feedback (2 Stars & 1 Wish) */}
      <section className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <Star className="w-4 h-4" />
          <span>Feedback Culture</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          We use the <strong>2 Stars and 1 Wish</strong> method:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-amber-500/20">
            <span className="text-amber-400 font-bold block mb-1">⭐ 2 Stars</span>
            <span className="text-slate-400 text-[11px]">Two genuine strengths or things done well.</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-sky-500/20">
            <span className="text-sky-400 font-bold block mb-1">✨ 1 Wish</span>
            <span className="text-slate-400 text-[11px]">One specific, actionable area to improve.</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          Giving constructive feedback to your peers helps both of you grow and earns feedback points.
        </p>
      </section>

      {/* Section 3: Session Rules & Expectations */}
      <section className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <Users className="w-4 h-4" />
          <span>Session Expectations</span>
        </div>
        <ul className="text-xs space-y-2 text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span><strong>Be on time:</strong> Arrival counts toward streaks and rewards.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span><strong>Safe space to fail:</strong> Nobody starts as a pro speaker or designer. Try bold ideas without fear.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span><strong>Support your peers:</strong> Applaud presentations, critique designs respectfully, and share tips.</span>
          </li>
        </ul>
      </section>

      {/* Section 4: Respect & Fair Play */}
      <section className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-2">
        <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
          <ShieldAlert className="w-4 h-4" />
          <span>Respect & Fair Play</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The leaderboard exists to celebrate progress, not to create toxic competition. Any unfair behaviour or disruption during sessions will result in point deductions.
        </p>
      </section>
    </div>
  );
}
