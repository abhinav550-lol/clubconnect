import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import FormInput from '../components/FormInput';
import GradientButton from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { Bot, User, Shield } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ email: '', password: '', full_name: '', interests: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'signup') {
        await authApi.register({
          email: form.email,
          full_name: form.full_name,
          password: form.password,
          role: form.role,
          interests: form.interests ? form.interests.split(',').map((s) => s.trim()) : undefined,
        });
      }
      const { data } = await authApi.login({ email: form.email, password: form.password });
      await login(data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'student', label: 'Student', desc: 'Browse & join clubs', icon: User },
    { value: 'club_admin', label: 'Club Admin', desc: 'Create & manage a club', icon: Shield },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Bot className="w-8 h-8 text-neon-purple" />
          <span className="text-2xl font-bold gradient-text">ClubConnect AI</span>
        </Link>

        <div className="glass-strong rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex mb-8 bg-white/5 rounded-xl p-1">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
                  ${tab === t ? 'bg-neon-purple/20 text-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'text-gray-400 hover:text-white'}`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === 'signup' && (
              <>
                <FormInput
                  label="Full Name"
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={set('full_name')}
                  required
                />

                {/* Role Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-gray-400 font-medium">I want to</label>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-300
                          ${form.role === r.value
                            ? 'bg-neon-purple/15 border-neon-purple/40 text-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'}`}
                      >
                        <r.icon className="w-5 h-5" />
                        <span className="text-xs font-semibold">{r.label}</span>
                        <span className="text-[10px] opacity-70">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <FormInput
              label="Email"
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={set('email')}
              required
            />
            <FormInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
            />
            {tab === 'signup' && (
              <FormInput
                label="Interests (comma-separated)"
                placeholder="coding, music, sports"
                value={form.interests}
                onChange={set('interests')}
              />
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 bg-red-500/10 px-4 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <GradientButton type="submit" loading={loading} className="w-full mt-2">
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </GradientButton>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
