'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Bookmark, Bell, Eye, Search } from 'lucide-react';
import { motion } from 'framer-motion';

import { useNotificationCount } from '@/hooks/useNotificationCount';
import { useAuth }               from '@/providers/AuthProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
  'aria-hidden'?: 'true';
}>;

interface TabDef {
  path:      string;
  label:     string;
  Icon?:     IconComponent;
  isAvatar?: boolean;
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { path: '/para-assistir', label: 'Para Assistir', Icon: Bookmark },
  { path: '/assistidos',    label: 'Assistidos',    Icon: Eye      },
  { path: '/busca',         label: 'Busca',         Icon: Search   },
  { path: '/notificacoes',  label: 'Notificações',  Icon: Bell     },
  { path: '/configuracoes', label: 'Perfil',        isAvatar: true },
];

// ─── Mini avatar ─────────────────────────────────────────────────────────────

function TabAvatar({ initial, isActive }: { initial: string; isActive: boolean }) {
  return (
    <span
      className={[
        'w-7 h-7 rounded-full',
        'bg-(--color-primary)',
        'flex items-center justify-center shrink-0',
        'transition-all duration-200',
        isActive
          ? 'ring-2 ring-(--color-primary) ring-offset-[3px] ring-offset-[#141414]'
          : 'opacity-55',
      ].join(' ')}
      aria-hidden="true"
    >
      <span className="text-[11px] font-bold text-white leading-none">{initial}</span>
    </span>
  );
}

// ─── BottomTabBar ─────────────────────────────────────────────────────────────

export function BottomTabBar() {
  const router      = useRouter();
  const pathname    = usePathname();
  const unreadCount = useNotificationCount();
  const { profile } = useAuth();

  const initial = profile?.display_name?.[0]?.toUpperCase() ?? '?';

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-[#141414] border-t border-[#2A2A2A]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação principal"
    >
      <div className="h-16 flex items-center">
        {TABS.map(({ path, label, Icon, isAvatar }) => {
          const isActive  = pathname === path;
          const isBell    = path === '/notificacoes';
          const showBadge = isBell && unreadCount > 0;

          return (
            <button
              key={path}
              type="button"
              onClick={() => router.push(path)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative"
            >
              {/* Sliding top indicator */}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 w-8 h-0.5 rounded-full bg-(--color-primary)"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}

              {/* Icon / badge area */}
              <span className="relative mt-1">
                {isAvatar ? (
                  <TabAvatar initial={initial} isActive={isActive} />
                ) : Icon ? (
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? 'text-(--color-primary)' : 'text-[#6B7280]'}
                    aria-hidden="true"
                  />
                ) : null}

                {showBadge && (
                  <span
                    className={[
                      'absolute -top-1 -right-1.5',
                      'min-w-4 h-4 px-1 rounded-full',
                      'bg-[#EF4444] text-white',
                      'flex items-center justify-center',
                      'text-[10px] font-bold leading-none',
                    ].join(' ')}
                    aria-label={`${unreadCount} não lidas`}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                className={[
                  'text-[10px] font-medium leading-none',
                  isActive ? 'text-(--color-primary)' : 'text-[#6B7280]',
                ].join(' ')}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
