'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { useAuth }          from '@/providers/AuthProvider';
import { ConfirmModal }     from '@/components/ui/ConfirmModal';
import { ProfileMenu }      from '@/components/layout/ProfileMenu';
import { EditNameModal }    from '@/components/settings/EditNameModal';

// ─── UserAvatar ───────────────────────────────────────────────────────────────

export function UserAvatar() {
  const { profile, signOut }  = useAuth();
  const router                 = useRouter();
  const containerRef           = useRef<HTMLDivElement>(null);

  const [menuOpen,       setMenuOpen]       = useState(false);
  const [editNameOpen,   setEditNameOpen]   = useState(false);
  const [confirmLogout,  setConfirmLogout]  = useState(false);
  const [signingOut,     setSigningOut]     = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleLogout = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setConfirmLogout(false);
  };

  const initial = profile?.display_name?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Avatar button */}
        <motion.button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          whileTap={{ scale: 0.88 }}
          transition={{ duration: 0.1 }}
          aria-label="Menu do usuário"
          aria-expanded={menuOpen}
          className={[
            'w-9 h-9 rounded-full shrink-0',
            'bg-(--color-primary)',
            'flex items-center justify-center',
            'select-none',
          ].join(' ')}
        >
          <span className="text-sm font-bold text-white leading-none" aria-hidden="true">
            {initial}
          </span>
        </motion.button>

        {/* Dropdown */}
        <ProfileMenu
          visible={menuOpen}
          profile={profile}
          onClose={() => setMenuOpen(false)}
          onEditName={() => { setMenuOpen(false); setEditNameOpen(true); }}
          onSettings={() => { setMenuOpen(false); router.push('/configuracoes'); }}
          onLogout={() => { setMenuOpen(false); setConfirmLogout(true); }}
        />
      </div>

      {/* Edit name modal (z-50, DOM-level) */}
      <EditNameModal
        visible={editNameOpen}
        onClose={() => setEditNameOpen(false)}
      />

      {/* Confirm logout modal */}
      <ConfirmModal
        visible={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Sair da conta?"
        message="Você precisará fazer login novamente."
        confirmLabel="Sair"
        loading={signingOut}
      />
    </>
  );
}
