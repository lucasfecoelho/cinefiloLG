'use client';

import { usePathname } from 'next/navigation';

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
  const title    = ROUTE_TITLES[pathname] ?? 'Cinefilos LG';

  return (
    <header
      className={[
        'fixed top-0 inset-x-0 z-30',
        'bg-[#0A0A0A]/95 backdrop-blur-sm',
        'border-b border-[#2A2A2A]/60',
      ].join(' ')}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-14 flex items-center px-4">
        <h1 className="text-lg font-bold text-[#F5F5F5]">{title}</h1>
      </div>
    </header>
  );
}
