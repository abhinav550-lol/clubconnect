import { motion } from 'framer-motion';

export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-4 py-20"
    >
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-neon-purple/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-purple animate-spin" />
      </div>
      <span className="text-sm text-gray-400">{text}</span>
    </motion.div>
  );
}
