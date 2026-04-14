'use client';

import { motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** Icon element — e.g. <Film size={56} /> from lucide-react */
  icon: React.ReactNode;
  title: string;
  description?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
    >
      {/* Icon */}
      <span className="text-[#D1D5DB] dark:text-[#3F3F46]" aria-hidden="true">
        {icon}
      </span>

      {/* Text */}
      <div>
        <p className="text-base font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
          {title}
        </p>
        {description && (
          <p className="mt-1.5 text-sm text-[#9CA3AF] dark:text-[#6B7280] leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
