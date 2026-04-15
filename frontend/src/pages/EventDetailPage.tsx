import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { eventsApi } from '../api/events';
import { attendanceApi, ticketApi } from '../api/attendance';
import { useAuth } from '../context/AuthContext';
import type { Event, Attendance } from '../types';
import {
  Calendar, MapPin, Users, ArrowLeft, QrCode, CheckCircle2,
  ScanLine, Download, UserCheck, Clock, Ticket,
} from 'lucide-react';

interface TicketData {
  event_id: string;
  event_title: string;
  user_id: string;
  user_name: string;
  qr_token: string;
  qr_image_base64: string;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Student: personal QR ticket
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Admin: scanner and attendance
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Attendance[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'club_admin' || user?.role === 'super_admin';

  const scannerRef = useRef<any>(null);
  const scannerContainerId = 'qr-scanner-container';

  // Load event
  useEffect(() => {
    if (!id) return;
    eventsApi.get(id).then(({ data }) => setEvent(data)).finally(() => setLoading(false));
  }, [id]);

  // Student: auto-fetch ticket
  useEffect(() => {
    if (!id || !isStudent) return;
    setLoadingTicket(true);
    ticketApi.getMyTicket(id)
      .then(({ data }) => setTicket(data))
      .catch(() => {})
      .finally(() => setLoadingTicket(false));
  }, [id, isStudent]);

  // Admin: load attendees
  useEffect(() => {
    if (!id || !isAdmin) return;
    setLoadingAttendees(true);
    attendanceApi.forEvent(id)
      .then(({ data }) => setAttendees(data))
      .catch(() => {})
      .finally(() => setLoadingAttendees(false));
  }, [id, isAdmin]);

  // Admin: QR Scanner
  useEffect(() => {
    if (!scannerOpen) return;
    let html5QrCode: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrCode = new Html5Qrcode(scannerContainerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            handleScanCheckIn(decodedText);
            html5QrCode.stop().catch(() => {});
            setScannerOpen(false);
          },
          () => {}
        );
      } catch (err) {
        console.error('Camera error:', err);
      }
    };

    const timer = setTimeout(startScanner, 200);
    return () => {
      clearTimeout(timer);
      if (html5QrCode) html5QrCode.stop().catch(() => {});
    };
  }, [scannerOpen]);

  // Admin: handle QR scan check-in
  const handleScanCheckIn = async (token?: string) => {
    const qrToken = token || manualToken.trim();
    if (!qrToken) return;
    setScanning(true);
    setScanResult(null);
    try {
      const { data } = await attendanceApi.scanCheckIn(qrToken);
      setScanResult(data.message || `✅ ${data.user_name} checked in!`);
      setManualToken('');
      // Refresh attendance list
      if (id) {
        attendanceApi.forEvent(id).then(({ data }) => setAttendees(data)).catch(() => {});
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Check-in failed';
      setScanResult(`❌ ${detail}`);
    } finally {
      setScanning(false);
    }
  };

  const handleDownloadTicket = () => {
    if (!ticket?.qr_image_base64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${ticket.qr_image_base64}`;
    link.download = `ticket_${event?.title?.replace(/\s+/g, '_') || 'event'}.png`;
    link.click();
  };

  if (loading) return <LoadingSpinner />;
  if (!event) return <p className="text-center text-gray-500 py-20">Event not found.</p>;

  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const isLive = new Date() >= start && new Date() <= end;
  const isPast = new Date() > end;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link to="/events" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>

      {/* Event Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard hover={false} className="!p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-3 py-1 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
              {event.club_name}
            </span>
            {isLive && (
              <span className="text-xs px-3 py-1 rounded-full bg-green-400/10 text-green-400 border border-green-400/20 flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> LIVE NOW
              </span>
            )}
            {isPast && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">Past</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white">{event.title}</h1>
          {event.description && (
            <p className="text-gray-400 mt-3 leading-relaxed">{event.description}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4 text-neon-purple shrink-0" />
              <div>
                <p>{start.toLocaleDateString()}</p>
                <p className="text-xs">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4 text-neon-cyan shrink-0" />
              <div>
                <p>Until</p>
                <p className="text-xs">{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4 text-neon-purple shrink-0" /> {event.location}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4 text-neon-cyan shrink-0" />
              {event.attendance_count}{event.max_attendees ? ` / ${event.max_attendees}` : ''} attending
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT COLUMN ─────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {isStudent ? (
            /* ── STUDENT: Personal QR Ticket ── */
            <GlassCard hover={false} className="text-center">
              <h2 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
                <Ticket className="w-5 h-5 text-neon-cyan" /> Your Event Ticket
              </h2>
              {loadingTicket ? (
                <div className="py-8"><LoadingSpinner /></div>
              ) : ticket ? (
                <>
                  <p className="text-sm text-gray-400 mb-4">
                    Show this QR code to the event organizer to mark your attendance.
                  </p>
                  <div className="mx-auto w-56 h-56 rounded-xl bg-white p-3 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                    <img
                      src={`data:image/png;base64,${ticket.qr_image_base64}`}
                      alt="Your Event Ticket QR"
                      className="w-full h-full"
                    />
                  </div>
                  <p className="text-white font-medium mt-4">{ticket.user_name}</p>
                  <p className="text-xs text-gray-500 mt-1">Personal ticket for {ticket.event_title}</p>
                  <GradientButton onClick={handleDownloadTicket} size="sm" className="mt-4">
                    <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Save Ticket</span>
                  </GradientButton>
                </>
              ) : (
                <div className="py-8">
                  <QrCode className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-500 text-sm">Could not load your ticket. Please try again.</p>
                </div>
              )}
            </GlassCard>
          ) : (
            /* ── ADMIN: QR Scanner ── */
            <GlassCard hover={false}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-neon-purple" /> Scan Student QR
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Scan a student's QR code to mark their attendance.
              </p>

              {/* Scan result banner */}
              <AnimatePresence>
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium
                      ${scanResult.startsWith('✅')
                        ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                        : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}
                  >
                    {scanResult}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scanner */}
              <AnimatePresence>
                {scannerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div
                      id={scannerContainerId}
                      className="rounded-xl overflow-hidden border border-white/10 bg-black"
                      style={{ minHeight: '300px' }}
                    />
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Point your camera at the student's QR code
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <GradientButton
                onClick={() => { setScannerOpen(!scannerOpen); setScanResult(null); }}
                className="w-full"
                variant={scannerOpen ? 'secondary' : 'primary'}
              >
                <span className="flex items-center justify-center gap-2">
                  <ScanLine className="w-4 h-4" />
                  {scannerOpen ? 'Close Scanner' : 'Open QR Scanner'}
                </span>
              </GradientButton>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-gray-500">or paste student token</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Manual input */}
              <div className="flex gap-2">
                <input
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanCheckIn()}
                  placeholder="Paste student QR token..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white
                    placeholder-gray-500 focus:border-neon-purple/50 focus:outline-none transition text-sm font-mono"
                />
                <GradientButton onClick={() => handleScanCheckIn()} loading={scanning} size="md">
                  Mark
                </GradientButton>
              </div>
            </GlassCard>
          )}
        </motion.div>

        {/* ── RIGHT COLUMN ────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {isAdmin ? (
            /* ── ADMIN: Attendance List ── */
            <GlassCard hover={false}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-400" />
                Attendees ({attendees.length})
              </h2>
              {loadingAttendees ? (
                <div className="py-6"><LoadingSpinner /></div>
              ) : attendees.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {attendees.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-neon-cyan flex items-center justify-center text-white text-xs font-bold">
                          {a.user_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{a.user_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(a.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-500 text-sm">No check-ins yet.</p>
                  <p className="text-xs text-gray-600 mt-1">Scan student QR codes to record attendance.</p>
                </div>
              )}
            </GlassCard>
          ) : (
            /* ── STUDENT: How it works ── */
            <GlassCard hover={false}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-neon-purple" /> How it works
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-neon-purple/10 flex items-center justify-center text-neon-purple text-sm font-bold">1</div>
                  <div>
                    <p className="text-white text-sm font-medium">Get your QR ticket</p>
                    <p className="text-xs text-gray-400 mt-0.5">Your personal QR code is shown on the left. Download it or keep this page open.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-neon-cyan/10 flex items-center justify-center text-neon-cyan text-sm font-bold">2</div>
                  <div>
                    <p className="text-white text-sm font-medium">Show it at the event</p>
                    <p className="text-xs text-gray-400 mt-0.5">At {event.location} on {start.toLocaleDateString()}, show your QR to the event organizer.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-green-400/10 flex items-center justify-center text-green-400 text-sm font-bold">3</div>
                  <div>
                    <p className="text-white text-sm font-medium">Attendance recorded ✅</p>
                    <p className="text-xs text-gray-400 mt-0.5">The organizer scans your code and your attendance is instantly recorded.</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}
