'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'info' | 'error';

interface ToastState {
  id:      number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

// ─── Context + hook ───────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ─── Variant config ───────────────────────────────────────────────────────────

type IconType = React.ComponentType<{
  size?: number;
  className?: string;
  'aria-hidden'?: 'true';
}>;

const VARIANTS: Record<
  ToastVariant,
  { bg: string; border: string; iconColor: string; Icon: IconType }
> = {
  success: {
    bg:        'bg-[#052E16]',
    border:    'border-[#22C55E]/25',
    iconColor: 'text-[#22C55E]',
    Icon:      CheckCircle2,
  },
  info: {
    bg:        'bg-[#0C1A2E]',
    border:    'border-[#3B82F6]/25',
    iconColor: 'text-[#3B82F6]',
    Icon:      Info,
  },
  error: {
    bg:        'bg-[#2D0A0A]',
    border:    'border-[#EF4444]/25',
    iconColor: 'text-[#EF4444]',
    Icon:      AlertCircle,
  },
};

const DISMISS_MS = 2500;
let nextId = 0;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, DISMISS_MS);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Overlay — sits above tab bar, below modals */}
      <div
        className="fixed inset-x-0 z-[55] flex flex-col items-center gap-2 px-4 pointer-events-none"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <AnimatePresence>
          {toasts.map(({ id, message, variant }) => {
            const { bg, border, iconColor, Icon } = VARIANTS[variant];
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{   opacity: 0, y: 8,   scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                className={[
                  'flex items-center gap-2.5',
                  'px-4 py-3 rounded-2xl border',
                  'shadow-2xl shadow-black/40',
                  bg, border,
                ].join(' ')}
                role="status"
                aria-live="polite"
              >
                <Icon size={16} className={iconColor} aria-hidden="true" />
                <span className="text-sm font-medium text-[#F5F5F5]">{message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
