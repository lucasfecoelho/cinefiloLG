'use client';

import { useState, useEffect } from 'react';
import { Check, LogOut, Moon, Pencil, Sun } from 'lucide-react';
import { m } from 'framer-motion';
import dynamic from 'next/dynamic';

import { useTheme }       from '@/providers/ThemeProvider';
import { useAuth }        from '@/providers/AuthProvider';
import { supabase }       from '@/lib/supabase/client';
import { Modal }          from '@/components/ui/Modal';
import { ConfirmModal }   from '@/components/ui/ConfirmModal';
import type { PrimaryColor } from '@/types';

const EditNameModal = dynamic(
  () => import('@/components/settings/EditNameModal').then(m => m.EditNameModal),
  { ssr: false },
);

// ─── Palettes ─────────────────────────────────────────────────────────────────

const COLORS: { key: PrimaryColor; hex: string; label: string }[] = [
  { key: 'green',  hex: '#22C55E', label: 'Verde'    },
  { key: 'red',    hex: '#EF4444', label: 'Vermelho' },
  { key: 'orange', hex: '#F97316', label: 'Laranja'  },
  { key: 'purple', hex: '#A855F7', label: 'Roxo'     },
  { key: 'blue',   hex: '#3B82F6', label: 'Azul'     },
  { key: 'yellow', hex: '#FACC15', label: 'Amarelo'  },
];

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <m.button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={[
        'relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0',
        enabled ? 'bg-(--color-primary)' : 'bg-[#3F3F46]',
      ].join(' ')}
    >
      <m.span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ x: enabled ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </m.button>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider px-1 mb-1">
        {title}
      </p>
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function Row({
  label,
  right,
  onPress,
  destructive = false,
}: {
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const base = [
    'flex items-center justify-between gap-3 px-5 py-4',
    'border-b border-[#2A2A2A] last:border-b-0',
    onPress
      ? 'hover:bg-white/3 active:bg-white/6 transition-colors duration-100 cursor-pointer'
      : '',
  ].join(' ');

  return onPress ? (
    <button type="button" onClick={onPress} className={`w-full text-left ${base}`}>
      <span className={`text-sm ${destructive ? 'text-[#EF4444]' : 'text-[#F5F5F5]'}`}>
        {label}
      </span>
      {right}
    </button>
  ) : (
    <div className={base}>
      <span className="text-sm text-[#F5F5F5]">{label}</span>
      {right}
    </div>
  );
}

// ─── ConfiguracoesPage ────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const { theme, primaryColor, toggleTheme, setPrimaryColor } = useTheme();
  const { profile, user, signOut } = useAuth();

  const [notifEnabled,   setNotifEnabled]   = useState(profile?.notifications_enabled ?? true);
  const [showHowTo,      setShowHowTo]      = useState(false);
  const [showTerms,      setShowTerms]      = useState(false);
  const [editNameOpen,   setEditNameOpen]   = useState(false);
  const [confirmLogout,  setConfirmLogout]  = useState(false);
  const [signingOut,     setSigningOut]     = useState(false);

  // Sync with profile once loaded
  useEffect(() => {
    if (profile) setNotifEnabled(profile.notifications_enabled);
  }, [profile?.notifications_enabled]);

  const handleLogout = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setConfirmLogout(false);
  };

  const handleToggleNotifications = async () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    if (!user) return;
    await supabase.from('profiles').update({ notifications_enabled: next }).eq('id', user.id);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <div className="flex flex-col gap-6 px-4 pt-4 pb-12">

        {/* ── Conta ────────────────────────────────────────────────────────── */}
        <Section title="Conta">
          <button
            type="button"
            onClick={() => setEditNameOpen(true)}
            className={[
              'w-full flex items-center justify-between gap-3 px-5 py-4',
              'hover:bg-white/3 active:bg-white/6',
              'transition-colors duration-100 text-left',
            ].join(' ')}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[#6B7280]">Seu nome</span>
              <span className="text-sm font-medium text-[#F5F5F5]">
                {profile?.display_name ?? '—'}
              </span>
            </div>
            <Pencil size={15} className="text-[#6B7280] shrink-0" aria-hidden="true" />
          </button>
        </Section>

        {/* ── Aparência ────────────────────────────────────────────────────── */}
        <Section title="Aparência">
          {/* Theme toggle */}
          <Row
            label={theme === 'dark' ? 'Modo escuro' : 'Modo claro'}
            right={
              <div className="flex items-center gap-2">
                {theme === 'dark'
                  ? <Moon size={15} className="text-[#9CA3AF]" aria-hidden="true" />
                  : <Sun  size={15} className="text-[#9CA3AF]" aria-hidden="true" />}
                <Toggle enabled={theme === 'dark'} onToggle={toggleTheme} />
              </div>
            }
          />

          {/* Color swatches */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] last:border-b-0">
            <span className="text-sm text-[#F5F5F5]">Cor principal</span>
            <div className="flex items-center gap-2.5">
              {COLORS.map(({ key, hex, label }) => {
                const isActive = key === primaryColor;
                return (
                  <m.button
                    key={key}
                    type="button"
                    aria-label={label}
                    aria-pressed={isActive}
                    whileTap={{ scale: 0.85 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => setPrimaryColor(key)}
                    className="relative w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: hex }}
                  >
                    {isActive && (
                      <Check
                        size={14}
                        strokeWidth={3}
                        className="text-white"
                        aria-hidden="true"
                      />
                    )}
                  </m.button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── Notificações ─────────────────────────────────────────────────── */}
        <Section title="Notificações">
          <Row
            label="Receber notificações"
            right={
              <Toggle
                enabled={notifEnabled}
                onToggle={handleToggleNotifications}
              />
            }
          />
        </Section>

        {/* ── Sobre ────────────────────────────────────────────────────────── */}
        <Section title="Sobre">
          <Row label="Como usar" onPress={() => setShowHowTo(true)} />
          <Row label="Termos de uso" onPress={() => setShowTerms(true)} />
        </Section>

        {/* ── Sessão ───────────────────────────────────────────────────────── */}
        <Section title="Sessão">
          <Row
            label="Sair"
            right={<LogOut size={16} className="text-[#EF4444] shrink-0" aria-hidden="true" />}
            onPress={() => setConfirmLogout(true)}
            destructive
          />
        </Section>

        {/* ── Versão ───────────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-[#3F3F46] pt-2">
          Cinefilos LG · v1.0.0
        </p>
      </div>

      {/* ── Edit name modal ──────────────────────────────────────────────── */}
      <EditNameModal
        visible={editNameOpen}
        onClose={() => setEditNameOpen(false)}
      />

      {/* ── Confirm logout modal ─────────────────────────────────────────── */}
      <ConfirmModal
        visible={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Sair da conta?"
        message="Você precisará fazer login novamente."
        confirmLabel="Sair"
        loading={signingOut}
      />

      {/* ── Como usar modal ──────────────────────────────────────────────── */}
      <Modal visible={showHowTo} onClose={() => setShowHowTo(false)} title="Como usar">
        <div className="px-5 pt-4 pb-6 flex flex-col gap-3">
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Use a aba <span className="text-[#F5F5F5] font-medium">Busca</span> para
            encontrar filmes pelo TMDB e adicioná-los à lista.
          </p>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Em <span className="text-[#F5F5F5] font-medium">Para Assistir</span> você
            gerencia a fila e marca filmes como assistidos.
          </p>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Em <span className="text-[#F5F5F5] font-medium">Assistidos</span> você
            avalia os filmes e confere as notas do casal.
          </p>
        </div>
      </Modal>

      {/* ── Termos modal ─────────────────────────────────────────────────── */}
      <Modal visible={showTerms} onClose={() => setShowTerms(false)} title="Termos de uso">
        <div className="px-5 pt-4 pb-6">
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Este aplicativo é de uso privado e exclusivo. Os dados são armazenados com
            segurança no Supabase. Não compartilhamos informações com terceiros.
          </p>
        </div>
      </Modal>
    </main>
  );
}
