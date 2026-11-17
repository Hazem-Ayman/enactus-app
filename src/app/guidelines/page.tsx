'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  Star, 
  Award, 
  ShieldAlert, 
  Users, 
  Edit2, 
  Save, 
  Trash2, 
  CheckCircle2 
} from 'lucide-react';
import { 
  getGuidelinesContent, 
  updateGuidelinesContent, 
  deleteGuidelinesContent 
} from '@/lib/firestore';

export default function GuidelinesPage() {
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function load() {
      const content = await getGuidelinesContent();
      if (content) {
        setCustomContent(content);
        setEditText(content);
      }
    }
    load();
    checkRole();
  }, []);

  const checkRole = () => {
    try {
      const saved = localStorage.getItem('enactus_member');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === 'ENC-2302' || parsed.role === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateGuidelinesContent(editText);
      setCustomContent(editText);
      setIsEditing(false);
      setMsg('Guidelines updated and published live!');
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      alert('Error updating guidelines: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setSaving(true);
    try {
      await deleteGuidelinesContent();
      setCustomContent(null);
      setEditText('');
      setIsEditing(false);
      setShowDeleteModal(false);
      setMsg('Custom guidelines deleted successfully!');
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      alert('Error deleting guidelines: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
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
              <span>Guidelines</span>
            </h1>
            <p className="text-xs text-slate-400">Everything you need to know about points & sessions</p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Close Editor' : 'Edit Rules'}</span>
          </button>
        )}
      </div>

      {msg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Admin Live Guidelines Editor */}
      {isAdmin && isEditing && (
        <form onSubmit={handleSave} className="p-4 bg-slate-800/80 border-2 border-yellow-400/60 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Edit2 className="w-4 h-4 text-yellow-400" />
              <span>Coordinator Live Guidelines Editor</span>
            </h3>
            <span className="text-[10px] text-yellow-400 font-mono">Live updates</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Write rules, session requirements, or expectations. Any changes saved here show up immediately for all members.
          </p>

          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={8}
            placeholder="Write customized rules, session tips, or guidelines here..."
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing...' : 'Save & Publish Live'}</span>
            </button>

            {customContent && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={saving}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-slate-900 border border-rose-500/50 rounded-3xl p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Delete Custom Guidelines?</h3>
              <p className="text-xs text-slate-300">
                This will remove your custom announcements and revert the page back to the standard presentations guidelines.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
