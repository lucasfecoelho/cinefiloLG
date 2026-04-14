import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { NotificationWithDetails } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const NOTIFICATIONS_KEY = ['notifications'] as const;

const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async (): Promise<NotificationWithDetails[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          movie:movies!notifications_movie_id_fkey(title, poster_url, year),
          sender:profiles!notifications_sender_id_fkey(display_name)
        `)
        .eq('recipient_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const cutoff = Date.now() - THREE_MONTHS_MS;

      return ((data ?? []) as NotificationWithDetails[]).filter((n) => {
        if (new Date(n.created_at).getTime() < cutoff) return false;
        if (n.expires_at && new Date(n.expires_at) < new Date()) return false;
        return true;
      });
    },
    enabled: !!user,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });

  // ── Mark single notification as read ───────────────────────────────────────
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ── Delete notification ────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ── Mark all as read ───────────────────────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', user.id)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const notifications = query.data ?? [];

  return {
    notifications,
    isLoading: query.isLoading,
    refetch: query.refetch,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead: markAsReadMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync,
    markAllAsRead: markAllReadMutation.mutateAsync,
    isMarkingRead: markAsReadMutation.isPending,
  };
}
