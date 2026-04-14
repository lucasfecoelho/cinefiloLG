'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase }              from '@/lib/supabase/client';
import { useAuth }               from '@/providers/AuthProvider';
import { NOTIFICATIONS_KEY }     from '@/hooks/useNotifications';
import { WATCHED_QUERY_KEY }     from '@/hooks/useWatchedMovies';
import { NotificationBanner }    from '@/components/notifications/NotificationBanner';

// ─── RealtimeProvider ─────────────────────────────────────────────────────────

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user }        = useAuth();
  const queryClient     = useQueryClient();
  const dismissTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bannerVisible, setBannerVisible] = useState(false);

  const showBanner = () => {
    // Reset auto-dismiss timer on each new notification
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setBannerVisible(true);
    dismissTimer.current = setTimeout(() => setBannerVisible(false), 4000);
  };

  const hideBanner = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setBannerVisible(false);
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`realtime-${user.id}`)

      // Movies table — any change invalidates movies lists
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movies' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['movies'] });
        },
      )

      // Ratings table — invalidate watched (scores may have changed)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings' },
        () => {
          queryClient.invalidateQueries({ queryKey: WATCHED_QUERY_KEY });
        },
      )

      // Notifications table — only INSERTs addressed to this user
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
          showBanner();
        },
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
    // queryClient is stable; showBanner captured via ref pattern via closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <>
      {children}
      <NotificationBanner visible={bannerVisible} onDismiss={hideBanner} />
    </>
  );
}
