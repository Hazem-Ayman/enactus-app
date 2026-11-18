'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getAllMembers, 
  updateMemberProfile, 
  deleteMember 
} from '@/lib/firestore';
import { Member } from '@/types';
import BotAvatar from '@/components/BotAvatar';
import { 
  Users, 
  ArrowLeft, 
  Download, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Flame, 
  Award,
  Sparkles
} from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Delete Member Modal State
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadMembers();
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

  const loadMembers = async () => {
    setLoading(true);
    try {
      const all = await getAllMembers();
      setMembers(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    try {
      const exportable = members.filter((m) => m.id !== 'ENC-2302');
      const headers = ['Member ID', 'Full Name', 'Email', 'Total Points', 'Streak Sessions', 'Special Title', 'Joined Date'];
      
      const rows = exportable.map((m) => [
        `"${m.id}"`,
        `"${(m.name || '').replace(/"/g, '""')}"`,
        `"${(m.email || '').replace(/"/g, '""')}"`,
        m.totalPoints || 0,
        m.streak || 0,
        `"${(m.titleBadge || '').replace(/"/g, '""')}"`,
        `"${new Date(m.createdAt || Date.now()).toLocaleDateString()}"`,
      ]);

      const csvString = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `enactus_members_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error exporting CSV: ' + err.message);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setEditName(m.name || '');
    setEditEmail(m.email || '');
    setEditTitle(m.titleBadge || '');
  };

  // Save Edit
  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      await updateMemberProfile(editingMember.id, {
        name: editName,
        email: editEmail,
        titleBadge: editTitle,
      });
      setActionMsg(`Updated profile for ${editName}!`);
      setEditingMember(null);
      await loadMembers();
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      alert('Error updating member: ' + err.message);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteMember(memberToDelete.id, (memberToDelete as any).docId);
      setMembers((prev) =>
        prev.filter(
          (item) =>
            item.id !== memberToDelete.id &&
            (item as any).docId !== (memberToDelete as any).docId
        )
      );
      setActionMsg(`Deleted member ${memberToDelete.name}.`);
      setMemberToDelete(null);
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      alert('Error deleting member: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredMembers = members
    .filter((m) => m.id !== 'ENC-2302')
    .filter((m) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q))
      );
    });

  return (
    <div className="space-y-4 pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <img src="/enactus-icon.png" alt="Enactus" className="w-6 h-6 object-contain" />
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-yellow-400" />
              <span>Members Roster</span>
            </h1>
            <p className="text-[10px] text-slate-400">
              {members.filter((m) => m.id !== 'ENC-2302').length} registered presentations speakers
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        )}
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, or email..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Members Cards List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">
          Loading presentations members...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700/60 text-slate-400 text-xs">
          No members found matching &quot;{search}&quot;
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BotAvatar config={m.avatar} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-white truncate">{m.name}</span>
                    {m.titleBadge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                        🎖️ {m.titleBadge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                    <span className="text-yellow-400 font-bold">{m.id}</span>
                    <span>•</span>
                    <span>{m.totalPoints || 0} pts</span>
                    <span>•</span>
                    <span className="text-orange-400 font-bold">🔥 {m.streak || 0}</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(m)}
                    className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-yellow-400 transition-colors cursor-pointer"
                    title="Edit Member"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberToDelete(m)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                    title="Delete Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveMemberEdit}
            className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-yellow-400" />
                <span>Edit Member ({editingMember.id})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-amber-400">
                Special Title / Prestige Badge
              </label>
              <select
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="">-- No Badge Assigned --</option>
                <option value="Most Improved Speaker">Most Improved Speaker</option>
                <option value="Best Stage Presence">Best Stage Presence</option>
                <option value="Most Consistent">Most Consistent</option>
                <option value="Breakthrough Storyteller">Breakthrough Storyteller</option>
                <option value="Audience Magnet">Audience Magnet</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-3 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-slate-900 border border-rose-500/50 rounded-3xl p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Permanently Delete Member?</h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to delete <strong className="text-white">{memberToDelete.name}</strong> ({memberToDelete.id})?
              </p>
              <p className="text-[10px] text-rose-400">This action cannot be undone.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
