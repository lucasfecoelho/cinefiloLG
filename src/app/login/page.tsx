'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '@/providers/AuthProvider';
import { staggerContainer, staggerItem } from '@/theme/animations';

// ─── Logo ─────────────────────────────────────────────────────────────────────

function CineLogo() {
  return (
    <div className="w-20 h-20 rounded-[22px] bg-[#22C55E] flex items-center justify-center shadow-lg shadow-[#22C55E]/30">
      <svg
        width="44"
        height="36"
        viewBox="0 0 44 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Film strip left */}
        <rect x="0" y="4" width="6" height="28" rx="2" fill="#000" opacity="0.85" />
        <rect x="1" y="7" width="4" height="4" rx="1" fill="#22C55E" />
        <rect x="1" y="15" width="4" height="4" rx="1" fill="#22C55E" />
        <rect x="1" y="23" width="4" height="4" rx="1" fill="#22C55E" />
        {/* Film strip right */}
        <rect x="38" y="4" width="6" height="28" rx="2" fill="#000" opacity="0.85" />
        <rect x="39" y="7" width="4" height="4" rx="1" fill="#22C55E" />
        <rect x="39" y="15" width="4" height="4" rx="1" fill="#22C55E" />
        <rect x="39" y="23" width="4" height="4" rx="1" fill="#22C55E" />
        {/* Center screen */}
        <rect x="8" y="4" width="28" height="28" rx="3" fill="#000" opacity="0.6" />
        {/* Play triangle */}
        <path d="M18 13l12 5-12 5V13z" fill="#fff" />
      </svg>
    </div>
  );
}

// ─── Input wrapper ────────────────────────────────────────────────────────────

interface InputFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  icon: React.ReactNode;
  rightSlot?: React.ReactNode;
}

function InputField({
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
  icon,
  rightSlot,
}: InputFieldProps) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        style={{ fontSize: '16px' }} // Prevents iOS Safari zoom
        className="
          w-full h-14
          pl-12 pr-12
          bg-[#1A1A1A]
          border border-[#2A2A2A]
          rounded-xl
          text-white placeholder-[#6B7280]
          focus:outline-none focus:border-[#22C55E]
          transition-colors duration-150
        "
      />
      {rightSlot && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          {rightSlot}
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { signIn } = useAuth();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      // Navigation is handled inside signIn (router.push('/para-assistir'))
    } catch (err) {
      setError(
        err instanceof Error
          ? friendlyError(err.message)
          : 'Erro ao fazer login. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-100"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={staggerItem} className="flex justify-center mb-8">
          <CineLogo />
        </motion.div>

        {/* Heading */}
        <motion.div variants={staggerItem} className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            Cinefilos LG
          </h1>
          <p className="text-[#6B7280] mt-2 text-sm">
            Faça login para continuar
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          variants={staggerItem}
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
          noValidate
        >
          {/* Email */}
          <InputField
            type="email"
            placeholder="Email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            icon={<Mail size={18} />}
          />

          {/* Password */}
          <InputField
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
            icon={<Lock size={18} />}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-[#EF4444] text-sm text-center"
                role="alert"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileTap={canSubmit ? { scale: 0.97 } : undefined}
            transition={{ duration: 0.1 }}
            className="
              mt-2 h-14
              bg-[#22C55E] text-black
              font-bold text-base rounded-xl
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-opacity duration-150
            "
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </motion.button>
        </motion.form>
      </motion.div>
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function friendlyError(msg: string): string {
  if (/invalid.*credentials|invalid.*password|invalid.*email/i.test(msg)) {
    return 'Email ou senha incorretos.';
  }
  if (/network|fetch/i.test(msg)) {
    return 'Sem conexão. Verifique sua internet.';
  }
  return 'Erro ao fazer login. Tente novamente.';
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
