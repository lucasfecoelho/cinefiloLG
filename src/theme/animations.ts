import type { Variants, Transition } from 'framer-motion';

// ─── Shared easing curves ─────────────────────────────────────────────────────

const EASE_STANDARD: [number, number, number, number] = [0.2, 0, 0, 1];
const EASE_DECELERATE: [number, number, number, number] = [0, 0, 0, 1];
const EASE_ACCELERATE: [number, number, number, number] = [0.3, 0, 1, 1];

// ─── Fade variants ────────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: EASE_STANDARD },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: EASE_ACCELERATE },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_STANDARD },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.15, ease: EASE_ACCELERATE },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_STANDARD },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: EASE_ACCELERATE },
  },
};

// ─── Slide variants (modais / bottom sheets) ──────────────────────────────────

export const slideUp: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_DECELERATE },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: { duration: 0.25, ease: EASE_ACCELERATE },
  },
};

// ─── Stagger variants (listas de cards) ───────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_STANDARD },
  },
};

// ─── Press / tap ─────────────────────────────────────────────────────────────

export const scalePress = {
  whileTap: { scale: 0.96 },
  transition: { duration: 0.1, ease: EASE_ACCELERATE } as Transition,
};

// ─── Overlay backdrop ─────────────────────────────────────────────────────────

export const overlayBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: EASE_STANDARD },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: EASE_ACCELERATE },
  },
};
