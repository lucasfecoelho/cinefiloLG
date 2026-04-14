'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Pencil, Settings } from 'lucide-react';

import type { Profile } from '@/types';

// ─── ProfileMenu ──────────────────────────────────────────────────────────────

export interface ProfileMenuProps {
  visible:      boolean;
  profile:      Profile | null;
  onClose:      () => void;
  onEditName:   () => void;
  onSettings:   () => void;
  onLogout:     () => void;
}

export function ProfileMenu({
  visible,
  profile,
  onClose: _onClose,
  onEditName,
  onSettings,
  onLogout,
}: ProfileMenuProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: -8 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{   opacity: 0, scale: 0.92, y: -8  }}
          transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
          className={[
            'absolute top-full right-0 mt-2 w-52 z-50',
            'bg-[#1A1A1A] border border-[#2A2A2A]',
            'rounded-2xl shadow-2xl',
            'overflow-hidden',
            'origin-top-right',
          ].join(' ')}
        >
          {/* Name row */}
          <button
            type="button"
            onClick={onEditName}
            className={[
              'w-full flex items-center gap-3 px-4 py-3.5',
              'hover:bg-white/5 active:bg-white/8',
              'transition-colors duration-100',
              'text-left',
            ].join(' ')}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6B7280] leading-none mb-0.5">Seu nome</p>
              <p className="text-sm font-semibold text-[#F5F5F5] truncate">
                {profile?.display_name ?? '—'}
              </p>
            </div>
            <Pencil size={15} className="text-[#6B7280] shrink-0" aria-hidden="true" />
          </button>

          <div className="h-px bg-[#2A2A2A] mx-4" />

          {/* Configurações */}
          <button
            type="button"
            onClick={onSettings}
            className={[
              'w-full flex items-center gap-3 px-4 py-3.5',
              'hover:bg-white/5 active:bg-white/8',
              'transition-colors duration-100',
              'text-left',
            ].join(' ')}
          >
            <Settings size={16} className="text-[#9CA3AF] shrink-0" aria-hidden="true" />
            <span className="text-sm text-[#F5F5F5]">Configurações</span>
          </button>

          <div className="h-px bg-[#2A2A2A] mx-4" />

          {/* Sair */}
          <button
            type="button"
            onClick={onLogout}
            className={[
              'w-full flex items-center gap-3 px-4 py-3.5',
              'hover:bg-[#EF4444]/8 active:bg-[#EF4444]/12',
              'transition-colors duration-100',
              'text-left',
            ].join(' ')}
          >
            <LogOut size={16} className="text-[#EF4444] shrink-0" aria-hidden="true" />
            <span className="text-sm text-[#EF4444] font-medium">Sair</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
