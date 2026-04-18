'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Optimistically updates profile in context and persists to Supabase */
  updateProfile: (
    updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>,
  ) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const AUTH_TIMEOUT_MS = 8_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);

  const router          = useRouter();
  const initialResolved = useRef(false);

  const finishLoading = useCallback(() => {
    if (initialResolved.current) return;
    initialResolved.current = true;
    setLoading(false);
  }, []);

  // ── Fetch profile ───────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.warn('[AuthProvider] fetchProfile error:', error.message);
        return;
      }
      setProfile(data as Profile);
    } catch (e) {
      console.warn('[AuthProvider] fetchProfile exception:', e);
    }
  }, []);

  // ── Auth init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Safety timeout: if auth never fires (network error), unblock the UI
    const timeout = setTimeout(() => {
      if (!initialResolved.current && mounted) {
        console.warn('[AuthProvider] auth timeout — forcing loading=false');
        finishLoading();
      }
    }, AUTH_TIMEOUT_MS);

    let subscription: { unsubscribe: () => void };

    try {
      // onAuthStateChange fires INITIAL_SESSION immediately from the persisted
      // cookie — no separate getSession() call needed, avoids race conditions.
      const { data } = supabase.auth.onAuthStateChange(async (event, s) => {
        if (!mounted) return;

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          // Don't await — profile arrives shortly after loading resolves
          fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }

        finishLoading();
      });
      subscription = data.subscription;
    } catch (err) {
      console.error('[AuthProvider] onAuthStateChange setup failed:', err);
      if (mounted) finishLoading();
    }

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, [fetchProfile, finishLoading]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Refresh server-side session cache, then navigate
      router.refresh();
      router.push('/para-assistir');
    },
    [router],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  }, [router]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>) => {
      if (!user) return { error: new Error('Not authenticated') };
      // Optimistic update
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) {
        // Revert on failure
        fetchProfile(user.id);
        return { error };
      }
      return { error: null };
    },
    [user, fetchProfile],
  );

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signIn, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
