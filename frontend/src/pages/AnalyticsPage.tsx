import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../api/analytics';
import type { StudentStats, OverviewStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';

const COLORS = ['#a855f7', '#06b6d4', '#facc15', '#f87171'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [myRes] = await Promise.allSettled([
          analyticsApi.my(),
          ...(user?.role === 'super_admin' ? [analyticsApi.overview()] : []),
        ]);
        if (myRes.status === 'fulfilled') setStudentStats(myRes.value.data);
        if (user?.role === 'super_admin') {
          try {
            const ov = await analyticsApi.overview();
            setOverviewStats(ov.data);
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  const myData = studentStats
    ? [
        { name: 'Clubs', value: studentStats.clubs_joined },
        { name: 'Events', value: studentStats.events_attended },
        { name: 'Apps', value: studentStats.applications_submitted },
      ]
    : [];

  const overviewData = overviewStats
    ? [
        { name: 'Users', value: overviewStats.total_users },
        { name: 'Clubs', value: overviewStats.total_clubs },
        { name: 'Events', value: overviewStats.total_events },
        { name: 'Apps', value: overviewStats.total_applications },
        { name: 'Pending', value: overviewStats.pending_applications },
        { name: 'Attendance', value: overviewStats.total_attendance_records },
      ]
    : [];

  const pieData = studentStats
    ? [
        { name: 'Clubs', value: studentStats.clubs_joined || 1 },
        { name: 'Events', value: studentStats.events_attended || 1 },
        { name: 'Applications', value: studentStats.applications_submitted || 1 },
      ]
    : [];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-gray-400 mt-1">Your engagement at a glance.</p>
      </motion.div>

      {/* Personal Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard hover={false}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-neon-purple" /> My Engagement
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={myData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="value" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard hover={false}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-cyan" /> Engagement Split
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {d.name}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Platform Overview (super admin) */}
      {overviewStats && (
        <GlassCard hover={false}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-neon-cyan" /> Platform Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px' }}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      )}
    </div>
  );
}
