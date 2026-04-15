import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import FormInput from '../components/FormInput';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { User, Mail, Tag } from 'lucide-react';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.full_name || '');
  const [interests, setInterests] = useState(user?.interests?.join(', ') || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({
        full_name: name,
        interests: interests ? interests.split(',').map((s) => s.trim()) : [],
      });
      await refresh();
      setEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">My <span className="gradient-text">Profile</span></h1>
      </motion.div>

      <GlassCard hover={false}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center text-2xl font-bold text-white">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user.full_name}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple mt-1 inline-block">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <FormInput label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <FormInput
              label="Interests (comma-separated)"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="coding, music, sports"
            />
            <div className="flex gap-3">
              <GradientButton onClick={save} loading={saving}>Save</GradientButton>
              <GradientButton variant="secondary" onClick={() => setEditing(false)}>Cancel</GradientButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-neon-purple" />
              <span className="text-gray-400">Name:</span>
              <span className="text-white">{user.full_name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-neon-cyan" />
              <span className="text-gray-400">Email:</span>
              <span className="text-white">{user.email}</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Tag className="w-4 h-4 text-neon-purple mt-0.5" />
              <span className="text-gray-400">Interests:</span>
              <div className="flex flex-wrap gap-1.5">
                {user.interests && user.interests.length > 0 ? (
                  user.interests.map((i) => (
                    <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                      {i}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">None set</span>
                )}
              </div>
            </div>
            <GradientButton variant="secondary" onClick={() => setEditing(true)} className="mt-4">
              Edit Profile
            </GradientButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
