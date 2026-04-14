'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { buildTheme, PRIMARY_PALETTES, type AppTheme } from '@/theme/colors';
import type { PrimaryColor, ThemeMode } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase/client';

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  /** Current mode: 'light' | 'dark' */
  theme: ThemeMode;
  primaryColor: PrimaryColor;
  /** Full resolved palette via buildTheme — use for inline styles or JS-driven logic */
  colors: AppTheme;
  toggleTheme: () => void;
  setPrimaryColor: (color: PrimaryColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_MODE: ThemeMode = 'dark';
const DEFAULT_COLOR: PrimaryColor = 'green';
const TRANSITION_MS = 250;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();

  const [mode, setModeState]             = useState<ThemeMode>(DEFAULT_MODE);
  const [primaryColor, setPrimaryState]  = useState<PrimaryColor>(DEFAULT_COLOR);
  const profileLoaded                    = useRef(false);

  // ── Initialize from profile (first load only) ───────────────────────────────
  useEffect(() => {
    if (!profile) {
      // Logout — reset flag so next login re-initializes
      profileLoaded.current = false;
      return;
    }
    if (profileLoaded.current) return;
    profileLoaded.current = true;
    setModeState(profile.theme ?? DEFAULT_MODE);
    setPrimaryState(profile.primary_color ?? DEFAULT_COLOR);
  }, [profile]);

  // ── Sync .dark class on <html> ───────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  // ── Sync CSS primary-color variables on <html> ───────────────────────────────
  useEffect(() => {
    const palette = PRIMARY_PALETTES[primaryColor];
    const root    = document.documentElement;
    root.style.setProperty('--color-primary',        palette.main);
    root.style.setProperty('--color-primary-light',  palette.light);
    root.style.setProperty('--color-primary-dark',   palette.dark);
    root.style.setProperty('--color-primary-subtle', palette.subtle);
  }, [primaryColor]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Briefly adds .theme-transitioning to <html> so colors cross-fade smoothly. */
  const withTransition = useCallback((fn: () => void) => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    fn();
    setTimeout(() => root.classList.remove('theme-transitioning'), TRANSITION_MS + 60);
  }, []);

  const persistProfile = useCallback(
    (updates: Partial<{ theme: ThemeMode; primary_color: PrimaryColor }>) => {
      if (!user) return;
      supabase.from('profiles').update(updates).eq('id', user.id).then(() => {});
    },
    [user],
  );

  // ── Public actions ───────────────────────────────────────────────────────────

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    withTransition(() => setModeState(next));
    persistProfile({ theme: next });
  }, [mode, withTransition, persistProfile]);

  const setPrimaryColor = useCallback(
    (color: PrimaryColor) => {
      setPrimaryState(color);
      persistProfile({ primary_color: color });
    },
    [persistProfile],
  );

  // ── Value ────────────────────────────────────────────────────────────────────

  const colors = buildTheme(mode, primaryColor);

  return (
    <ThemeContext.Provider
      value={{ theme: mode, primaryColor, colors, toggleTheme, setPrimaryColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
