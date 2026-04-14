'use client';

import { Bell } from 'lucide-react';

import { useNotifications }    from '@/hooks/useNotifications';
import { Button }              from '@/components/ui/Button';
import { EmptyState }          from '@/components/ui/EmptyState';
import { Skeleton }            from '@/components/ui/Skeleton';
import { NotificationCard }    from '@/components/notifications/NotificationCard';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificacoesPage() {
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead,
  } = useNotifications();

  return (
    <main className="min-h-screen bg-[#0A0A0A]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-end gap-3 mb-1">
          {!isLoading && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pb-8">

        {/* Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3.5 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A]"
                aria-hidden="true"
              >
                <Skeleton variant="circle" width="8px" height="8px" className="mt-1.5 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton variant="line" width="85%" height="14px" />
                  <Skeleton variant="line" width="30%" height="11px" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && notifications.length === 0 && (
          <EmptyState
            icon={<Bell size={52} />}
            title="Nenhuma notificação"
            description="Nenhuma notificação por enquanto."
          />
        )}

        {/* List */}
        {!isLoading && notifications.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {notifications.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                markAsRead={markAsRead}
                deleteNotification={deleteNotification}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
