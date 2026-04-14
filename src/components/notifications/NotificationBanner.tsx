'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── NotificationBanner ───────────────────────────────────────────────────────

export interface NotificationBannerProps {
  visible:   boolean;
  onDismiss: () => void;
}

export function NotificationBanner({ visible, onDismiss }: NotificationBannerProps) {
  const router = useRouter();

  const handleTap = () => {
    onDismiss();
    router.push('/notificacoes');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="notification-banner"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className={[
            'fixed top-0 inset-x-0 z-[60]',
            'flex items-center gap-3 px-4',
            'h-14 safe-area-inset-top',
            'bg-(--color-primary)/90 backdrop-blur-sm',
            'text-white',
            'cursor-pointer select-none',
          ].join(' ')}
          onClick={handleTap}
          role="alert"
          aria-live="assertive"
        >
          <p className="flex-1 text-sm font-medium truncate">
            Nova notificação! Confira na aba de notificações.
          </p>

          <button
            type="button"
            aria-label="Fechar notificação"
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="p-1 rounded-full hover:bg-white/20 transition-colors duration-150 shrink-0"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
