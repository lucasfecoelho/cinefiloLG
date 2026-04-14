'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { NotificationWithDetails } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins < 1)   return 'agora mesmo';
  if (mins < 60)  return `há ${mins} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

function buildMessage(n: NotificationWithDetails): string {
  const sender = n.sender?.display_name ?? 'Alguém';
  const title  = n.movie?.title          ?? 'um filme';

  switch (n.type) {
    case 'added_to_watch':
      return `${sender} adicionou "${title}" para assistir`;
    case 'added_watched':
      return `${sender} marcou "${title}" como assistido`;
    default:
      return `${sender} enviou uma notificação`;
  }
}

function destinationFor(type: NotificationWithDetails['type']): string {
  return type === 'added_watched' ? '/assistidos' : '/para-assistir';
}

// ─── NotificationCard ─────────────────────────────────────────────────────────

export interface NotificationCardProps {
  notification:      NotificationWithDetails;
  markAsRead:        (id: string) => Promise<void>;
  deleteNotification:(id: string) => Promise<void>;
}

export function NotificationCard({
  notification,
  markAsRead,
  deleteNotification,
}: NotificationCardProps) {
  const router  = useRouter();
  const isUnread = !notification.read;

  const handleTap = async () => {
    if (isUnread) await markAsRead(notification.id);
    router.push(destinationFor(notification.type));
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      className={[
        'w-full text-left',
        'flex items-start gap-3 px-4 py-3.5',
        'rounded-2xl border',
        'transition-colors duration-100',
        isUnread
          ? 'bg-[#EF4444]/8 border-[#EF4444]/20'
          : 'bg-[#1A1A1A] border-[#2A2A2A]',
        'active:opacity-80',
      ].join(' ')}
      aria-label={buildMessage(notification)}
    >
      {/* Unread dot */}
      <span
        className={[
          'mt-1.5 h-2 w-2 rounded-full shrink-0',
          isUnread ? 'bg-[#EF4444]' : 'bg-transparent',
        ].join(' ')}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#F5F5F5] leading-snug">
          {buildMessage(notification)}
        </p>
        <p className="text-xs text-[#6B7280] mt-1">
          {relativeTime(notification.created_at)}
        </p>
      </div>

      {/* Delete */}
      <button
        type="button"
        aria-label="Excluir notificação"
        onClick={handleDelete}
        className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#9CA3AF] transition-colors duration-150 shrink-0 -mr-1"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </button>
  );
}
