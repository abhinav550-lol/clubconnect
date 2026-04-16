import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import { clubsApi } from '../api/clubs';
import { useAuth } from '../context/AuthContext';
import type { Club } from '../types';
import { Users, Search, Plus, Settings, Trash2 } from 'lucide-react';

const categories = ['All', 'Tech', 'Arts', 'Sports', 'Music', 'Science', 'Social', 'Business'];

export default function ClubsPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '', category: 'Tech', tags: '' });

  const isStudent = user?.role === 'student';
  const canCreate = user?.role === 'club_admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    const load = async () => {
      try {
        const isClubAdmin = user?.role === 'club_admin';
        const { data } = await clubsApi.list({
          limit: 50,
          search: search || undefined,
          category: filter !== 'All' ? filter : undefined,
          admin_id: isClubAdmin ? user?.id : undefined,
        });
        setClubs(data);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, filter, user]);

  const handleCreate = async () => {
    if (!newClub.name.trim()) return;
    setCreating(true);
    try {
      const { data } = await clubsApi.create({
        name: newClub.name,
        description: newClub.description || undefined,
        category: newClub.category,
        tags: newClub.tags ? newClub.tags.split(',').map(s => s.trim()) : undefined,
      });
      setClubs(prev => [data, ...prev]);
      setCreateOpen(false);
      setNewClub({ name: '', description: '', category: 'Tech', tags: '' });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create club');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (clubId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this club?')) return;
    try {
      await clubsApi.delete(clubId);
      setClubs(prev => prev.filter(c => c.id !== clubId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const displayClubs = clubs;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isStudent ? 'Explore ' : user?.role === 'club_admin' ? 'Manage ' : 'All '}
            <span className="gradient-text">Clubs</span>
          </h1>
          <p className="text-gray-400 mt-1">
            {isStudent
              ? 'Find your community. Join a club that matches your vibe.'
              : user?.role === 'club_admin'
                ? 'Create and manage your clubs. Review incoming applications.'
                : 'Platform-wide club management.'}
          </p>
        </div>
        {canCreate && (
          <GradientButton onClick={() => setCreateOpen(true)} size="md">
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Create Club</span>
          </GradientButton>
        )}
      </motion.div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white
              placeholder-gray-500 focus:border-neon-purple/50 focus:outline-none transition"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all
                ${filter === c
                  ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30 glow-purple'
                  : 'bg-white/5 text-gray-400 border border-white/5 hover:text-white hover:border-white/20'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayClubs.map((club, i) => {
            const isOwned = club.admin_id === user?.id;
            return (
              <Link key={club.id} to={`/clubs/${club.id}`}>
                <GlassCard transition={{ delay: i * 0.05 }} className="!h-[220px] flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                        {club.category}
                      </span>
                      {isOwned && !isStudent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                          Owner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" /> {club.member_count}
                      </span>
                      {(isSuperAdmin || isOwned) && !isStudent && (
                        <button
                          onClick={(e) => handleDelete(club.id, e)}
                          className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Delete Club"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1">{club.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed flex-1">
                    {club.description || 'No description provided.'}
                  </p>
                  {club.tags && club.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
                      {club.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </Link>
            );
          })}
          {displayClubs.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-12">No clubs found.</p>
          )}
        </div>
      )}

      {/* Create Club Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Club">
        <div className="space-y-4">
          <FormInput label="Club Name" placeholder="e.g. AI Research Club" value={newClub.name} onChange={(e) => setNewClub(p => ({ ...p, name: e.target.value }))} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-400 font-medium">Description</label>
            <textarea
              value={newClub.description}
              onChange={(e) => setNewClub(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-neon-purple/50 focus:outline-none resize-none transition"
              placeholder="What's your club about?"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-400 font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.filter(c => c !== 'All').map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewClub(p => ({ ...p, category: c }))}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all
                    ${newClub.category === c
                      ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                      : 'bg-white/5 text-gray-400 border border-white/5 hover:text-white'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <FormInput label="Tags (comma-separated)" placeholder="ai, machine-learning, python" value={newClub.tags} onChange={(e) => setNewClub(p => ({ ...p, tags: e.target.value }))} />
          <GradientButton onClick={handleCreate} loading={creating} className="w-full">
            Create Club
          </GradientButton>
        </div>
      </Modal>
    </div>
  );
}
