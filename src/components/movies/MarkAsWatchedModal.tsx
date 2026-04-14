'use client';

import { useEffect, useState } from 'react';
import { Modal }       from '@/components/ui/Modal';
import { Button }      from '@/components/ui/Button';
import { StarRating }  from '@/components/ui/StarRating';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarkAsWatchedParams {
  watchedDate: string; // "YYYY-MM-DD"
  score:       number; // 0–5
  comment:     string;
}

export interface MarkAsWatchedModalProps {
  visible:     boolean;
  onClose:     () => void;
  onConfirm:   (params: MarkAsWatchedParams) => Promise<void> | void;
  loading?:    boolean;
  movieTitle?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MarkAsWatchedModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
  movieTitle,
}: MarkAsWatchedModalProps) {
  const [watchedDate, setWatchedDate] = useState(todayIso);
  const [score,       setScore]       = useState(0);
  const [comment,     setComment]     = useState('');

  // Reset form each time the modal opens for a new movie
  useEffect(() => {
    if (visible) {
      setWatchedDate(todayIso());
      setScore(0);
      setComment('');
    }
  }, [visible]);

  const handleConfirm = async () => {
    await onConfirm({ watchedDate, score, comment: comment.trim() });
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={movieTitle ? `Assistido: ${movieTitle}` : 'Marcar como assistido'}
    >
      <div className="flex flex-col gap-5 px-5 pb-6 pt-4">

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="watched-date"
            className="text-xs font-semibold text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-wide"
          >
            Data assistido
          </label>
          <input
            id="watched-date"
            type="date"
            value={watchedDate}
            onChange={(e) => setWatchedDate(e.target.value)}
            max={todayIso()}
            // 16px prevents iOS Safari zoom
            style={{ fontSize: '16px', colorScheme: 'dark' }}
            className={[
              'w-full h-12 px-4 rounded-xl',
              'bg-white dark:bg-[#1A1A1A]',
              'border border-[#E5E7EB] dark:border-[#2A2A2A]',
              'text-[#111827] dark:text-[#F5F5F5]',
              'focus:outline-none focus:border-(--color-primary)',
              'focus:ring-2 focus:ring-[var(--color-primary-subtle,rgba(0,0,0,0.08))]',
              'transition-colors duration-150',
            ].join(' ')}
          />
        </div>

        {/* Star rating (optional) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-wide">
            Avaliação
            <span className="ml-1 normal-case font-normal text-[#9CA3AF]">(opcional)</span>
          </span>
          <StarRating value={score} onChange={setScore} size={28} />
        </div>

        {/* Comment (optional) */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="watched-comment"
            className="text-xs font-semibold text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-wide"
          >
            Comentário
            <span className="ml-1 normal-case font-normal text-[#9CA3AF]">(opcional)</span>
          </label>
          <textarea
            id="watched-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="O que você achou?"
            style={{ fontSize: '16px' }}
            className={[
              'w-full px-4 py-3 rounded-xl resize-none',
              'bg-white dark:bg-[#1A1A1A]',
              'border border-[#E5E7EB] dark:border-[#2A2A2A]',
              'text-[#111827] dark:text-[#F5F5F5]',
              'placeholder-[#9CA3AF] dark:placeholder-[#6B7280]',
              'focus:outline-none focus:border-(--color-primary)',
              'focus:ring-2 focus:ring-[var(--color-primary-subtle,rgba(0,0,0,0.08))]',
              'transition-colors duration-150',
            ].join(' ')}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
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
            variant="info"
            size="md"
            onClick={handleConfirm}
            loading={loading}
            disabled={!watchedDate}
            className="flex-1"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
