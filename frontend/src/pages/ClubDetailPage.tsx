import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { clubsApi } from '../api/clubs';
import { applicationsApi } from '../api/applications';
import { eventsApi } from '../api/events';
import { useAuth } from '../context/AuthContext';
import type { Club, ClubMember, Application, Event } from '../types';
import {
  Users, Calendar, ArrowLeft, Send, Settings, Eye, CheckCircle2, XCircle, Trash2
} from 'lucide-react';

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Student state
  const [applyOpen, setApplyOpen] = useState(false);
  const [statement, setStatement] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Admin state
  const [clubApps, setClubApps] = useState<Application[]>([]);
  const [clubEvents, setClubEvents] = useState<Event[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const isStudent = user?.role === 'student';
  const isOwner = club?.admin_id === user?.id;
  const isSuperAdmin = user?.role === 'super_admin';
  const canManage = isOwner || isSuperAdmin;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [clubRes, membersRes] = await Promise.all([
          clubsApi.get(id),
          clubsApi.members(id),
        ]);
        setClub(clubRes.data);
        setMembers(membersRes.data);

        // If admin, also load apps and events
        if (user?.role !== 'student') {
          try {
            const [appsRes, eventsRes] = await Promise.allSettled([
              applicationsApi.forClub(id),
              eventsApi.list({ club_id: id }),
            ]);
            if (appsRes.status === 'fulfilled') setClubApps(appsRes.value.data);
            if (eventsRes.status === 'fulfilled') setClubEvents(eventsRes.value.data);
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const handleApply = async () => {
    if (!id || !statement.trim()) return;
    setApplying(true);
    try {
      await applicationsApi.submit({ club_id: id, statement });
      setApplied(true);
      setApplyOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const handleReview = async (status: 'accepted' | 'rejected') => {
    if (!selectedApp) return;
    setReviewing(true);
    try {
      await applicationsApi.review(selectedApp.id, { status, review_note: reviewNote || undefined });
      setClubApps(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status } : a));
      setSelectedApp(null);
      setReviewNote('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Review failed');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!club) return <p className="text-center text-gray-500 py-20">Club not found.</p>;

  const pendingApps = clubApps.filter(a => a.status === 'pending');

  return (
    <div className="space-y-8">
      <Link to="/clubs" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Clubs
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                  {club.category}
                </span>
                {canManage && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20 flex items-center gap-1">
                    <Settings className="w-3 h-3" /> {isOwner ? 'You own this' : 'Admin'}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mt-3">{club.name}</h1>
              <p className="text-gray-400 mt-2 max-w-xl">{club.description || 'No description available.'}</p>
              {club.tags && club.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {club.tags.map((t) => (
                    <span key={t} className="text-xs px-3 py-1 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Student: Apply button */}
            {isStudent && (
              <GradientButton
                onClick={() => setApplyOpen(true)}
                disabled={applied}
                className="shrink-0"
              >
                {applied ? '✓ Applied' : 'Apply Now'}
              </GradientButton>
            )}
          </div>

          <div className="flex gap-6 mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4 text-neon-purple" />
              {members.length} members
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4 text-neon-cyan" />
              Created {new Date(club.created_at).toLocaleDateString()}
            </div>
            {!isStudent && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                ✉️ {pendingApps.length} pending apps
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Admin Section: Pending Applications ─────── */}
      {canManage && pendingApps.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            ✉️ Pending Applications ({pendingApps.length})
          </h2>
          <div className="space-y-3">
            {pendingApps.map((a) => (
              <GlassCard key={a.id} hover={false} className="!p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">"{a.statement}"</p>
                  <p className="text-xs text-gray-500 mt-1">Applied {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <GradientButton size="sm" onClick={() => setSelectedApp(a)}>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Review</span>
                </GradientButton>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* ── Admin Section: Club Events ────────── */}
      {canManage && clubEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neon-cyan" /> Events ({clubEvents.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubEvents.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`}>
                <GlassCard className="!p-4">
                  <h3 className="text-white font-medium mb-1 line-clamp-1">{e.title}</h3>
                  <p className="text-xs text-gray-400">{new Date(e.start_time).toLocaleDateString()} · {e.location}</p>
                  <p className="text-xs text-gray-500 mt-1">{e.attendance_count} attending</p>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Members ({members.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <GlassCard key={m.id} hover={false} className="!p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center text-white font-bold text-sm shrink-0">
                {m.user_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{m.user_name}</p>
                <p className="text-xs text-gray-400 truncate">{m.role} · {m.user_email}</p>
              </div>
            </GlassCard>
          ))}
          {members.length === 0 && <p className="text-sm text-gray-500">No members yet.</p>}
        </div>
      </div>

      {/* Student: Apply Modal */}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title={`Apply to ${club.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Write a brief statement about why you'd like to join.</p>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white
              placeholder-gray-500 focus:border-neon-purple/50 focus:outline-none resize-none transition"
            placeholder="I'm passionate about..."
          />
          <GradientButton onClick={handleApply} loading={applying} className="w-full">
            <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Submit Application</span>
          </GradientButton>
        </div>
      </Modal>

      {/* Admin: Review Modal */}
      <Modal open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Review Application">
        {selectedApp && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mt-2">Statement:</p>
              <p className="text-white text-sm bg-white/5 rounded-lg p-3 mt-1">{selectedApp.statement}</p>
            </div>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              placeholder="Optional review note..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-neon-purple/50 focus:outline-none resize-none transition"
            />
            <div className="flex gap-3">
              <GradientButton onClick={() => handleReview('accepted')} loading={reviewing} className="flex-1">
                <span className="flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> Accept</span>
              </GradientButton>
              <GradientButton variant="danger" onClick={() => handleReview('rejected')} loading={reviewing} className="flex-1">
                <span className="flex items-center justify-center gap-1"><XCircle className="w-4 h-4" /> Reject</span>
              </GradientButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
