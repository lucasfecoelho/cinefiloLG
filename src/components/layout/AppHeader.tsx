'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { UserAvatar } from '@/components/layout/UserAvatar';

// ─── Route titles ─────────────────────────────────────────────────────────────

const ROUTE_TITLES: Record<string, string> = {
  '/para-assistir': 'Para Assistir',
  '/assistidos':    'Assistidos',
  '/busca':         'Busca',
  '/notificacoes':  'Notificações',
  '/configuracoes': 'Configurações',
};

// ─── AppHeader ────────────────────────────────────────────────────────────────

export function AppHeader() {
  const pathname = usePathname();
  const router   = useRouter();

  const title         = ROUTE_TITLES[pathname] ?? 'Cinefilos LG';
  const isConfigPage  = pathname === '/configuracoes';

  return (
    <header
      className={[
        'fixed top-0 inset-x-0 z-30',
        'bg-[#0A0A0A]/95 backdrop-blur-sm',
        'border-b border-[#2A2A2A]/60',
      ].join(' ')}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-14 flex items-center px-4 gap-3">
        {isConfigPage ? (
          /* Config page: back button + title */
          <>
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              className={[
                'p-2 -ml-2 rounded-xl',
                'text-[#9CA3AF] hover:text-[#F5F5F5]',
                'transition-colors duration-150',
              ].join(' ')}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <h1 className="text-lg font-bold text-[#F5F5F5]">{title}</h1>
          </>
        ) : (
          /* Regular pages: title + avatar */
          <>
            <h1 className="text-lg font-bold text-[#F5F5F5] flex-1">{title}</h1>
            <UserAvatar />
          </>
        )}
      </div>
    </header>
  );
}
