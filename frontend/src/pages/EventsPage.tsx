import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import { eventsApi } from '../api/events';
import { clubsApi } from '../api/clubs';
import { useAuth } from '../context/AuthContext';
import type { Event, Club } from '../types';
import { Calendar, MapPin, Users, Plus } from 'lucide-react';

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    club_id: '', title: '', description: '', location: '',
    start_time: '', end_time: '', max_attendees: '',
  });

  const isStudent = user?.role === 'student';
  const canCreate = user?.role === 'club_admin' || user?.role === 'super_admin';

  useEffect(() => {
    const load = async () => {
      try {
        const isClubAdmin = user?.role === 'club_admin';
        const [evRes] = await Promise.allSettled([
          eventsApi.list({ limit: 50, admin_id: isClubAdmin ? user?.id : undefined }),
        ]);
        if (evRes.status === 'fulfilled') setEvents(evRes.value.data);
        if (canCreate) {
          const { data } = await clubsApi.list({
            limit: 100,
            admin_id: isClubAdmin ? user?.id : undefined,
          });
          setClubs(user?.role === 'super_admin' ? data : data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, canCreate]);

  const handleCreate = async () => {
    if (!newEvent.title.trim() || !newEvent.club_id || !newEvent.start_time || !newEvent.end_time || !newEvent.location) return;
    setCreating(true);
    try {
      const { data } = await eventsApi.create({
        club_id: newEvent.club_id,
        title: newEvent.title,
        description: newEvent.description || undefined,
        start_time: new Date(newEvent.start_time).toISOString(),
        end_time: new Date(newEvent.end_time).toISOString(),
        location: newEvent.location,
        max_attendees: newEvent.max_attendees ? Number(newEvent.max_attendees) : undefined,
      });
      setEvents(prev => [data, ...prev]);
      setCreateOpen(false);
      setNewEvent({ club_id: '', title: '', description: '', location: '', start_time: '', end_time: '', max_attendees: '' });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold"><span className="gradient-text">Events</span></h1>
          <p className="text-gray-400 mt-1">
            {isStudent ? 'Discover what\'s happening on campus.' : 'Create and manage events for your clubs.'}
          </p>
        </div>
        {canCreate && (
          <GradientButton onClick={() => setCreateOpen(true)} size="md">
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Create Event</span>
          </GradientButton>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((e, i) => {
          const start = new Date(e.start_time);
          const isPast = start < new Date();
          return (
            <Link key={e.id} to={`/events/${e.id}`}>
              <GlassCard transition={{ delay: i * 0.05 }} className="!h-[200px] flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20 line-clamp-1">
                    {e.club_name}
                  </span>
                  {isPast && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500">Past</span>
                  )}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1">{e.title}</h3>
                <div className="space-y-1.5 text-sm text-gray-400 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-1">{start.toLocaleDateString()} at {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-1">{e.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    {e.attendance_count}{e.max_attendees ? ` / ${e.max_attendees}` : ''} attending
                  </div>
                </div>
              </GlassCard>
            </Link>
          );
        })}
        {events.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-12">
            {isStudent ? 'No events yet.' : 'No events yet. Create your first event!'}
          </p>
        )}
      </div>

      {/* Create Event Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Event">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-400 font-medium">Club</label>
            <select
              value={newEvent.club_id}
              onChange={(e) => setNewEvent(p => ({ ...p, club_id: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-purple/50 focus:outline-none transition appearance-none"
            >
              <option value="" className="bg-gray-900">Select a club...</option>
              {clubs.map(c => (
                <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
              ))}
            </select>
          </div>
          <FormInput label="Event Title" placeholder="e.g. AI Workshop" value={newEvent.title} onChange={(e) => setNewEvent(p => ({ ...p, title: e.target.value }))} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-400 font-medium">Description</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-neon-purple/50 focus:outline-none resize-none transition"
              placeholder="What's this event about?"
            />
          </div>
          <FormInput label="Location" placeholder="Room 101, Science Building" value={newEvent.location} onChange={(e) => setNewEvent(p => ({ ...p, location: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-400 font-medium">Start Time</label>
              <input
                type="datetime-local"
                value={newEvent.start_time}
                onChange={(e) => setNewEvent(p => ({ ...p, start_time: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-purple/50 focus:outline-none transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-400 font-medium">End Time</label>
              <input
                type="datetime-local"
                value={newEvent.end_time}
                onChange={(e) => setNewEvent(p => ({ ...p, end_time: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-purple/50 focus:outline-none transition"
              />
            </div>
          </div>
          <FormInput label="Max Attendees (optional)" type="number" placeholder="100" value={newEvent.max_attendees} onChange={(e) => setNewEvent(p => ({ ...p, max_attendees: e.target.value }))} />
          <GradientButton onClick={handleCreate} loading={creating} className="w-full">
            Create Event
          </GradientButton>
        </div>
      </Modal>
    </div>
  );
}
