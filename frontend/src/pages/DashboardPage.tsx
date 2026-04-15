import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { aiApi } from '../api/ai';
import { analyticsApi } from '../api/analytics';
import { clubsApi } from '../api/clubs';
import { eventsApi } from '../api/events';
import type { Recommendation, StudentStats, Club, Event, OverviewStats } from '../types';
import {
  Sparkles, Users, Calendar, FileText, ArrowRight, Shield, Plus, BarChart3
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const promises: Promise<any>[] = [
          clubsApi.list({ limit: 4 }),
          eventsApi.list({ limit: 4 }),
        ];

        if (user?.role === 'student') {
          promises.push(aiApi.recommendations(), analyticsApi.my());
        }
        if (user?.role === 'super_admin') {
          promises.push(analyticsApi.overview());
        }
        if (user?.role === 'club_admin') {
          promises.push(analyticsApi.my());
        }

        const results = await Promise.allSettled(promises);
        if (results[0].status === 'fulfilled') setClubs(results[0].value.data);
        if (results[1].status === 'fulfilled') setEvents(results[1].value.data);

        if (user?.role === 'student') {
          if (results[2]?.status === 'fulfilled') setRecs(results[2].value.data);
          if (results[3]?.status === 'fulfilled') setStats(results[3].value.data);
        }
        if (user?.role === 'super_admin' && results[2]?.status === 'fulfilled') {
          setOverview(results[2].value.data);
        }
        if (user?.role === 'club_admin' && results[2]?.status === 'fulfilled') {
          setStats(results[2].value.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  const roleLabel =
    user?.role === 'super_admin' ? '🛡️ Super Admin' :
    user?.role === 'club_admin' ? '🏛️ Club Admin' : '🎓 Student';

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="gradient-text">{user?.full_name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-gray-400 mt-1">
          {roleLabel} · Here's what's happening on campus today.
        </p>
      </motion.div>

      {/* ── Super Admin: Platform Stats ────────────────────── */}
      {user?.role === 'super_admin' && overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Users', value: overview.total_users, color: 'text-neon-purple' },
            { label: 'Clubs', value: overview.total_clubs, color: 'text-neon-cyan' },
            { label: 'Events', value: overview.total_events, color: 'text-yellow-400' },
            { label: 'Applications', value: overview.total_applications, color: 'text-green-400' },
            { label: 'Pending', value: overview.pending_applications, color: 'text-orange-400' },
            { label: 'Attendance', value: overview.total_attendance_records, color: 'text-blue-400' },
          ].map((s, i) => (
            <GlassCard key={s.label} hover={false} transition={{ delay: i * 0.05 }} className="!p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {/* ── Club Admin: Quick Actions ──────────────────────── */}
      {user?.role === 'club_admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/clubs">
            <GlassCard className="!p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-neon-purple/10">
                <Plus className="w-6 h-6 text-neon-purple" />
              </div>
              <div>
                <p className="text-white font-semibold">Create Club</p>
                <p className="text-xs text-gray-400">Start a new club</p>
              </div>
            </GlassCard>
          </Link>
          <Link to="/applications">
            <GlassCard className="!p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-neon-cyan/10">
                <FileText className="w-6 h-6 text-neon-cyan" />
              </div>
              <div>
                <p className="text-white font-semibold">Review Applications</p>
                <p className="text-xs text-gray-400">Accept or reject</p>
              </div>
            </GlassCard>
          </Link>
          <Link to="/events">
            <GlassCard className="!p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-400/10">
                <Calendar className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Manage Events</p>
                <p className="text-xs text-gray-400">Create & track events</p>
              </div>
            </GlassCard>
          </Link>
        </div>
      )}

      {/* ── Student/Club Admin: Personal Stats ─────────────── */}
      {(user?.role === 'student' || user?.role === 'club_admin') && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Clubs Joined', value: stats.clubs_joined, icon: Users, color: 'text-neon-purple' },
            { label: 'Events Attended', value: stats.events_attended, icon: Calendar, color: 'text-neon-cyan' },
            { label: 'Applications', value: stats.applications_submitted, icon: FileText, color: 'text-yellow-400' },
          ].map((s, i) => (
            <GlassCard key={s.label} hover={false} transition={{ delay: i * 0.1 }}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-white/5 ${s.color}`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-sm text-gray-400">{s.label}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* ── Student: AI Recommendations ─────────────────────── */}
      {user?.role === 'student' && recs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-neon-purple" />
            <h2 className="text-xl font-semibold">AI Recommendations</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recs.slice(0, 4).map((r, i) => (
              <GlassCard key={r.club_id} transition={{ delay: i * 0.08 }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                    {r.category}
                  </span>
                  <span className="text-xs text-neon-purple font-semibold">
                    {Math.round(r.match_score * 100)}% match
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">{r.club_name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{r.reason}</p>
                <Link
                  to={`/clubs/${r.club_id}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-neon-purple hover:text-neon-cyan transition-colors"
                >
                  View Club <ArrowRight className="w-3 h-3" />
                </Link>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* ── Super Admin: Quick Links ────────────────────────── */}
      {user?.role === 'super_admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/admin">
            <GlassCard className="!p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-neon-purple/10"><Shield className="w-6 h-6 text-neon-purple" /></div>
              <div>
                <p className="text-white font-semibold">Admin Panel</p>
                <p className="text-xs text-gray-400">Manage platform</p>
              </div>
            </GlassCard>
          </Link>
          <Link to="/analytics">
            <GlassCard className="!p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-neon-cyan/10"><BarChart3 className="w-6 h-6 text-neon-cyan" /></div>
              <div>
                <p className="text-white font-semibold">Analytics</p>
                <p className="text-xs text-gray-400">Platform metrics</p>
              </div>
            </GlassCard>
          </Link>
          <Link to="/clubs">
            <GlassCard className="!p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-400/10"><Users className="w-6 h-6 text-yellow-400" /></div>
              <div>
                <p className="text-white font-semibold">All Clubs</p>
                <p className="text-xs text-gray-400">View & delete clubs</p>
              </div>
            </GlassCard>
          </Link>
        </div>
      )}

      {/* ── Clubs & Events Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-cyan" />
              {user?.role === 'club_admin' ? 'Your Clubs' : 'Popular Clubs'}
            </h2>
            <Link to="/clubs" className="text-xs text-neon-purple hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3 flex flex-col gap-2">
            {clubs.map((c) => (
              <Link key={c.id} to={`/clubs/${c.id}`}>
                <GlassCard className="!p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{c.name}</h3>
                    <p className="text-xs text-gray-400">{c.category} · {c.member_count} members</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </GlassCard>
              </Link>
            ))}
            {clubs.length === 0 && <p className="text-sm text-gray-500">No clubs yet.</p>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neon-purple" /> Upcoming Events
            </h2>
            <Link to="/events" className="text-xs text-neon-purple hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3 flex flex-col gap-2">
            {events.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`}>
                <GlassCard className="!p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{e.title}</h3>
                    <p className="text-xs text-gray-400">{e.club_name} · {e.location}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(e.start_time).toLocaleDateString()}
                  </span>
                </GlassCard>
              </Link>
            ))}
            {events.length === 0 && <p className="text-sm text-gray-500">No events yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
