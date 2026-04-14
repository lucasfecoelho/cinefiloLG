import { PrimaryColor, ThemeMode } from '@/types';

// ─── Fixed semantic colors (unchanged by theme) ───────────────────────────────

export const FIXED = {
  star: '#FACC15',               // ratings
  addToWatch: '#22C55E',         // green CTA
  addWatched: '#3B82F6',         // blue CTA
  delete: '#EF4444',             // destructive
  notificationUnread: '#FF453A', // unread dot
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Primary palettes ─────────────────────────────────────────────────────────

export type PrimaryPalette = {
  main: string;   // accent
  light: string;  // lighter tint (hover / pressed variant)
  dark: string;   // deeper shade (pressed / active)
  subtle: string; // very translucent bg tint (~10% opacity)
};

export const PRIMARY_PALETTES: Record<PrimaryColor, PrimaryPalette> = {
  green: {
    main: '#22C55E',
    light: '#4ADE80',
    dark: '#15803D',
    subtle: '#22C55E1A',
  },
  red: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#B91C1C',
    subtle: '#EF44441A',
  },
  orange: {
    main: '#F97316',
    light: '#FB923C',
    dark: '#C2410C',
    subtle: '#F973161A',
  },
  purple: {
    main: '#A855F7',
    light: '#C084FC',
    dark: '#7E22CE',
    subtle: '#A855F71A',
  },
  blue: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#1D4ED8',
    subtle: '#3B82F61A',
  },
  yellow: {
    main: '#FACC15',
    light: '#FDE047',
    dark: '#A16207',
    subtle: '#FACC151A',
  },
};

// ─── Theme tokens ─────────────────────────────────────────────────────────────

export type ThemeTokens = {
  // Backgrounds (3 depth levels)
  bg: string;
  bgCard: string;
  bgElevated: string;
  // Borders
  border: string;
  borderSubtle: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  // Tab bar
  tabBar: string;
  tabBarBorder: string;
  // Skeleton shimmer
  skeleton: string;
  skeletonHighlight: string;
};

export const THEME_TOKENS: Record<ThemeMode, ThemeTokens> = {
  dark: {
    bg: '#0A0A0A',
    bgCard: '#1A1A1A',
    bgElevated: '#1E1E1E',
    border: '#2A2A2A',
    borderSubtle: '#141414',
    textPrimary: '#F5F5F5',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    textDisabled: '#3F3F46',
    tabBar: '#141414',
    tabBarBorder: '#2A2A2A',
    skeleton: '#1E1E1E',
    skeletonHighlight: '#2A2A2A',
  },
  light: {
    bg: '#FAFAFA',
    bgCard: '#FFFFFF',
    bgElevated: '#FFFFFF',
    border: '#E5E7EB',
    borderSubtle: '#F3F4F6',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textDisabled: '#D1D5DB',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    skeleton: '#F3F4F6',
    skeletonHighlight: '#E5E7EB',
  },
};

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildTheme(mode: ThemeMode, primary: PrimaryColor) {
  return {
    mode,
    ...THEME_TOKENS[mode],
    primary: PRIMARY_PALETTES[primary],
    fixed: FIXED,
  };
}

export type AppTheme = ReturnType<typeof buildTheme>;

// Alias kept for backward compatibility
export const getTheme = buildTheme;
