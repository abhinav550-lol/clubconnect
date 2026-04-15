import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import GradientButton from '../components/GradientButton';
import { Sparkles, Users, Calendar, BarChart3, Bot, QrCode } from 'lucide-react';

const features = [
  { icon: Sparkles, title: 'AI Recommendations', desc: 'Get personalized club suggestions based on your interests.' },
  { icon: Users, title: 'Club Management', desc: 'Browse, apply, and manage club memberships seamlessly.' },
  { icon: Calendar, title: 'Event Tracking', desc: 'Discover events and never miss what matters.' },
  { icon: QrCode, title: 'QR Attendance', desc: 'Scan and check-in instantly at any event.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track engagement with powerful visual dashboards.' },
  { icon: Bot, title: 'AI Chatbot', desc: 'Ask anything about clubs, events, and more.' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Campus Platform
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-bold leading-tight mb-6">
            <span className="gradient-text">ClubConnect</span>
            <br />
            <span className="text-white">meets Artificial Intelligence</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Discover the perfect club, track events, scan into sessions, and let AI guide your campus journey — all in one futuristic platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <GradientButton size="lg">Get Started</GradientButton>
            </Link>
            <Link to="/login">
              <GradientButton variant="secondary" size="lg">
                Sign In
              </GradientButton>
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-neon-purple"
            />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
          >
            Everything you need, <span className="gradient-text">supercharged</span>
          </motion.h2>
          <p className="text-center text-gray-400 mb-16 max-w-xl mx-auto">
            One platform to manage your entire campus club experience.
          </p>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={item}
                className="glass rounded-2xl p-6 group hover:glow-purple transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 flex items-center justify-center mb-4 group-hover:from-neon-purple/40 group-hover:to-neon-cyan/40 transition-colors">
                  <f.icon className="w-6 h-6 text-neon-purple" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass rounded-3xl p-12"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to transform your campus?</h2>
          <p className="text-gray-400 mb-8">Join hundreds of students already using ClubConnect AI.</p>
          <Link to="/login">
            <GradientButton size="lg">Start Now — It's Free</GradientButton>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-4 text-center text-sm text-gray-500">
        © 2026 ClubConnect AI · Built with ❤️ and AI
      </footer>
    </div>
  );
}
