import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { clubsApi } from '../api/clubs';
import { applicationsApi } from '../api/applications';
import { analyticsApi } from '../api/analytics';
import type { Club, Application, OverviewStats } from '../types';
import {
  Shield, Users, FileText, Calendar, CheckCircle2, XCircle, Eye, Trash2,
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [pendingApps, setPendingApps] = useState<Application[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Club | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const isClubAdmin = user?.role === 'club_admin';

  useEffect(() => {
    const load = async () => {
      try {
        const [clubRes] = await Promise.allSettled([clubsApi.list({ limit: 50 })]);
        if (clubRes.status === 'fulfilled') {
          setClubs(clubRes.value.data);

          // Load pending apps for admin's clubs
          const relevantClubs = clubRes.value.data.filter(
            (c) => c.admin_id === user?.id || isSuperAdmin
          );
          const appPromises = relevantClubs.map((c) => applicationsApi.forClub(c.id));
          const results = await Promise.allSettled(appPromises);
          const allApps: Application[] = [];
          results.forEach((r) => {
            if (r.status === 'fulfilled') allApps.push(...r.value.data);
          });
          setPendingApps(allApps.filter((a) => a.status === 'pending'));
        }

        if (isSuperAdmin) {
          try {
            const ov = await analyticsApi.overview();
            setOverview(ov.data);
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isSuperAdmin]);

  const handleReview = async (status: 'accepted' | 'rejected') => {
    if (!selectedApp) return;
    setReviewing(true);
    try {
      await applicationsApi.review(selectedApp.id, { status, review_note: reviewNote || undefined });
      setPendingApps((p) => p.filter((a) => a.id !== selectedApp.id));
      setSelectedApp(null);
      setReviewNote('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Review failed');
    } finally {
      setReviewing(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await clubsApi.delete(deleteConfirm.id);
      setClubs((p) => p.filter((c) => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const managedClubs = clubs.filter((c) => c.admin_id === user?.id || isSuperAdmin);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">
          <Shield className="w-8 h-8 inline text-neon-purple mr-2" />
          <span className="gradient-text">
            {isSuperAdmin ? 'Super Admin Dashboard' : 'Club Admin Dashboard'}
          </span>
        </h1>
        <p className="text-gray-400 mt-1">
          {isSuperAdmin ? 'Platform-wide management — view, manage, and delete clubs' : 'Manage your clubs and review applications'}
        </p>
      </motion.div>

      {/* Platform Stats (super admin only) */}
      {isSuperAdmin && overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Users', value: overview.total_users, icon: Users },
            { label: 'Clubs', value: overview.total_clubs, icon: Users },
            { label: 'Events', value: overview.total_events, icon: Calendar },
            { label: 'Total Apps', value: overview.total_applications, icon: FileText },
            { label: 'Pending', value: overview.pending_applications, icon: FileText },
            { label: 'Attendance', value: overview.total_attendance_records, icon: CheckCircle2 },
          ].map((s) => (
            <GlassCard key={s.label} hover={false} className="!p-4 text-center">
              <s.icon className="w-5 h-5 mx-auto text-neon-purple mb-2" />
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Pending Applications */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-neon-cyan" />
          Pending Applications ({pendingApps.length})
        </h2>
        {pendingApps.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending applications.</p>
        ) : (
          <div className="space-y-3">
            {pendingApps.map((a) => (
              <GlassCard key={a.id} hover={false} className="!p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{a.club_name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-1">"{a.statement}"</p>
                  <p className="text-xs text-gray-500 mt-1">Applied {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <GradientButton size="sm" onClick={() => setSelectedApp(a)}>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Review</span>
                </GradientButton>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Managed Clubs */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-neon-purple" />
          {isSuperAdmin ? 'All Clubs' : 'Your Clubs'}
          <span className="text-sm text-gray-400 font-normal">({managedClubs.length})</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {managedClubs.map((c) => (
            <GlassCard key={c.id} hover={false} className="!p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium">{c.name}</h3>
                  <p className="text-xs text-gray-400">{c.category} · {c.member_count} members</p>
                </div>
                {(isSuperAdmin || c.admin_id === user?.id) && (
                  <button
                    onClick={() => setDeleteConfirm(c)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete Club"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
          {managedClubs.length === 0 && (
            <p className="text-sm text-gray-500">No clubs to manage.</p>
          )}
        </div>
      </div>

      {/* Review Application Modal */}
      <Modal open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Review Application">
        {selectedApp && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Club: <span className="text-white">{selectedApp.club_name}</span></p>
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

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Club">
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-gray-400">
              Are you sure you want to delete <span className="text-white font-semibold">{deleteConfirm.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <GradientButton variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
                Cancel
              </GradientButton>
              <GradientButton variant="danger" onClick={handleDeleteClub} loading={deleting} className="flex-1">
                <span className="flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" /> Delete</span>
              </GradientButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
