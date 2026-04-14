import { RealtimeProvider } from '@/providers/RealtimeProvider';
import { AppHeader }         from '@/components/layout/AppHeader';
import { BottomTabBar }      from '@/components/layout/BottomTabBar';
import { ToastProvider }     from '@/components/ui/Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <ToastProvider>
        {/* Fixed header — z-30, accounts for safe-area-inset-top internally */}
        <AppHeader />

        {/* Scrollable content — offset for header + tab bar + safe areas */}
        <div
          className="min-h-dvh bg-[#0A0A0A]"
          style={{
            paddingTop:    'calc(3.5rem + env(safe-area-inset-top))',
            paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>

        {/* Fixed tab bar — z-40, accounts for safe-area-inset-bottom internally */}
        <BottomTabBar />
      </ToastProvider>
    </RealtimeProvider>
  );
}
