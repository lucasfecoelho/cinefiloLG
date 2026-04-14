import { useNotifications } from './useNotifications';

/**
 * Lightweight selector — reads the unread notification count from the shared
 * TanStack Query cache populated by useNotifications. No extra network request.
 */
export function useNotificationCount(): number {
  return useNotifications().unreadCount;
}
