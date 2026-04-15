import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Home, Users, Calendar, FileText, BarChart3, User, LogOut,
  Menu, X, Bot, Shield, Settings,
} from 'lucide-react';

const navConfig = {
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/clubs', label: 'Explore Clubs', icon: Users },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/applications', label: 'My Applications', icon: FileText },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  club_admin: [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/clubs', label: 'My Clubs', icon: Users },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/admin', label: 'Manage', icon: Settings },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  super_admin: [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/clubs', label: 'All Clubs', icon: Users },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/admin', label: 'Admin Panel', icon: Shield },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: User },
  ],
};

const roleBadge = {
  student: { label: 'Student', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
  club_admin: { label: 'Club Admin', color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
  super_admin: { label: 'Super Admin', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const links = navConfig[user.role as keyof typeof navConfig] || navConfig.student;
  const badge = roleBadge[user.role as keyof typeof roleBadge] || roleBadge.student;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <Bot className="w-7 h-7 text-neon-purple" />
              <span className="text-lg font-bold gradient-text hidden sm:block">ClubConnect AI</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => {
                const active = location.pathname === l.to || (l.to !== '/dashboard' && location.pathname.startsWith(l.to));
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all duration-200
                      ${active
                        ? 'bg-neon-purple/20 text-neon-purple glow-purple'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <l.icon className="w-4 h-4" />
                    {l.label}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <span className={`hidden sm:block text-xs px-2.5 py-1 rounded-full ${badge.bg} ${badge.color} border ${badge.border}`}>
                {badge.label}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 glass-strong md:hidden border-t border-white/5"
          >
            <div className="p-4 flex flex-col gap-1">
              <div className={`mb-3 px-4 py-2 rounded-lg ${badge.bg} ${badge.color} text-sm font-medium border ${badge.border}`}>
                {badge.label}
              </div>
              {links.map((l) => {
                const active = location.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition
                      ${active ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <l.icon className="w-4 h-4" />
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
