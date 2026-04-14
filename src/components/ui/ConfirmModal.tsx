'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal }         from './Modal';
import { Button }        from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-2">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-[#F3F4F6] dark:bg-[#2A2A2A] flex items-center justify-center shrink-0">
          <AlertTriangle
            size={26}
            className="text-[#6B7280] dark:text-[#9CA3AF]"
            aria-hidden="true"
          />
        </div>

        {/* Text */}
        <div className="text-center">
          <h3 className="text-base font-semibold text-[#111827] dark:text-[#F5F5F5] leading-snug">
            {title}
          </h3>
          {message && (
            <p className="mt-1.5 text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
              {message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full mt-1">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
