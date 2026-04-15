import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { applicationsApi } from '../api/applications';
import { clubsApi } from '../api/clubs';
import type { Application, Club } from '../types';
import {
  FileText, Clock, CheckCircle2, XCircle, Eye, Users, ArrowRight,
} from 'lucide-react';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  accepted: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  // Student state
  const [myApps, setMyApps] = useState<Application[]>([]);

  // Admin state
  const [pendingApps, setPendingApps] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (isStudent) {
          const { data } = await applicationsApi.my();
          setMyApps(data);
        } else {
          // Club admin / super admin: load apps for their clubs
          const { data: clubs } = await clubsApi.list({ limit: 100 });
          const relevantClubs = clubs.filter(
            (c: Club) => c.admin_id === user?.id || user?.role === 'super_admin'
          );
          const results = await Promise.allSettled(
            relevantClubs.map((c: Club) => applicationsApi.forClub(c.id))
          );
          const allApps: Application[] = [];
          results.forEach((r) => {
            if (r.status === 'fulfilled') allApps.push(...r.value.data);
          });
          setPendingApps(allApps);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isStudent]);

  const handleReview = async (status: 'accepted' | 'rejected') => {
    if (!selectedApp) return;
    setReviewing(true);
    try {
      await applicationsApi.review(selectedApp.id, { status, review_note: reviewNote || undefined });
      setPendingApps((p) => p.map(a => a.id === selectedApp.id ? { ...a, status } : a));
      setSelectedApp(null);
      setReviewNote('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Review failed');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  // ── Student View ───────────────────────────────
  if (isStudent) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">My <span className="gradient-text">Applications</span></h1>
          <p className="text-gray-400 mt-1">Track your club application status.</p>
        </motion.div>

        <div className="space-y-4">
          {myApps.map((a, i) => {
            const cfg = statusConfig[a.status as keyof typeof statusConfig];
            const Icon = cfg.icon;
            return (
              <GlassCard key={a.id} hover={false} transition={{ delay: i * 0.05 }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{a.club_name}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        <Icon className="w-3 h-3" /> {a.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">{a.statement}</p>
                    {a.review_note && (
                      <p className="text-sm text-gray-300 mt-2 bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-gray-500">Review: </span>{a.review_note}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Applied {new Date(a.created_at).toLocaleDateString()}
                      {a.reviewed_at && ` · Reviewed ${new Date(a.reviewed_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
          {myApps.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-500 mb-4">No applications yet.</p>
              <Link to="/clubs">
                <GradientButton size="md">
                  <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Explore Clubs <ArrowRight className="w-4 h-4" /></span>
                </GradientButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Admin View ─────────────────────────────────
  const pending = pendingApps.filter(a => a.status === 'pending');
  const reviewed = pendingApps.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Review <span className="gradient-text">Applications</span></h1>
        <p className="text-gray-400 mt-1">Accept or reject applications to your clubs.</p>
      </motion.div>

      {/* Pending */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-gray-500 text-sm bg-white/5 rounded-xl p-6 text-center">No pending applications 🎉</p>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <GlassCard key={a.id} hover={false} className="!p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium">{a.club_name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">"{a.statement}"</p>
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

      {/* Recently Reviewed */}
      {reviewed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Recently Reviewed ({reviewed.length})
          </h2>
          <div className="space-y-3">
            {reviewed.map((a) => {
              const cfg = statusConfig[a.status as keyof typeof statusConfig];
              const Icon = cfg.icon;
              return (
                <GlassCard key={a.id} hover={false} className="!p-4 flex items-center justify-between opacity-70">
                  <div>
                    <h3 className="text-white font-medium">{a.club_name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">"{a.statement}"</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    <Icon className="w-3 h-3" /> {a.status}
                  </span>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Review Application">
        {selectedApp && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Club: <span className="text-white font-medium">{selectedApp.club_name}</span></p>
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
