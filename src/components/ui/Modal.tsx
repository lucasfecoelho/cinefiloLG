'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Modal({ visible, onClose, title, children }: ModalProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        // Backdrop — fades in/out; click outside closes
        <motion.div
          key="modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Content — slides up independently */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className={[
              'relative flex flex-col',
              'w-full max-w-[90vw] max-h-[90vh]',
              'bg-white dark:bg-[#1A1A1A]',
              'rounded-2xl shadow-2xl overflow-hidden',
            ].join(' ')}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.3, ease: [0, 0, 0, 1] }}
            // Prevent backdrop click from firing when clicking inside modal
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={[
                'flex items-center shrink-0 px-5 py-4',
                title
                  ? 'justify-between border-b border-[#E5E7EB] dark:border-[#2A2A2A]'
                  : 'justify-end',
              ].join(' ')}
            >
              {title && (
                <h2 className="text-base font-semibold text-[#111827] dark:text-[#F5F5F5] pr-4 leading-snug">
                  {title}
                </h2>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className={[
                  'shrink-0 p-1.5 rounded-lg',
                  'text-[#6B7280]',
                  'hover:text-[#111827] dark:hover:text-[#F5F5F5]',
                  'hover:bg-black/5 dark:hover:bg-white/8',
                  'transition-colors duration-150',
                ].join(' ')}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
