import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-gray-400 font-medium">{label}</label>
      <input
        className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
          text-white placeholder-gray-500
          focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/30
          focus:outline-none transition-all duration-200 ${error ? 'border-red-500/50' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
