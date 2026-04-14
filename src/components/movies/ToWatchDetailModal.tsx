'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Film } from 'lucide-react';

import { Modal }               from '@/components/ui/Modal';
import { Button }              from '@/components/ui/Button';
import { ConfirmModal }        from '@/components/ui/ConfirmModal';
import { MarkAsWatchedModal }  from '@/components/movies/MarkAsWatchedModal';
import type { Movie }          from '@/types';
import type { MarkAsWatchedParams } from '@/components/movies/MarkAsWatchedModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToWatchDetailModalProps {
  movie:             Movie | null;
  visible:           boolean;
  onClose:           () => void;
  suggestedByName:   string | null;
  onMoveToWatched:   (params: MarkAsWatchedParams) => Promise<void>;
  isMoving:          boolean;
  onDelete:          () => Promise<void>;
  isDeleting:        boolean;
}

// ─── Blur placeholder ─────────────────────────────────────────────────────────

const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// ─── Component ───────────────────────────────────────────────────────────────

export function ToWatchDetailModal({
  movie,
  visible,
  onClose,
  suggestedByName,
  onMoveToWatched,
  isMoving,
  onDelete,
  isDeleting,
}: ToWatchDetailModalProps) {
  const [showMarkWatched,  setShowMarkWatched]  = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Keep a snapshot of the movie while closing animation plays
  const [snapshot, setSnapshot] = useState<Movie | null>(null);
  const displayed = movie ?? snapshot;

  const handleMarkWatchedConfirm = async (params: MarkAsWatchedParams) => {
    await onMoveToWatched(params);
    setShowMarkWatched(false);
    // parent closes the detail modal
  };

  const handleDeleteConfirm = async () => {
    await onDelete();
    setShowConfirmDelete(false);
    // parent closes the detail modal
  };

  // Snapshot before close so content doesn't flash away during exit animation
  const handleOpen = () => {
    if (movie) setSnapshot(movie);
  };

  return (
    <>
      {/* ── Detail modal ──────────────────────────────────────────────────────── */}
      <Modal
        visible={visible}
        onClose={onClose}
        title={displayed?.title ?? ''}
        // Callback fired when children mount (we capture snapshot here)
        key={movie?.id}
      >
        {displayed ? (
          <div className="flex flex-col pb-6" onLoad={handleOpen}>

            {/* Poster */}
            <div className="relative w-full h-52 bg-[#2A2A2A] shrink-0">
              {displayed.poster_url ? (
                <Image
                  src={displayed.poster_url}
                  alt={`Poster de ${displayed.title}`}
                  fill
                  sizes="(max-width: 640px) 90vw, 500px"
                  className="object-cover object-top"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film size={40} className="text-[#3F3F46]" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-4 px-5 pt-4">

              {/* Year + genres */}
              <div className="flex flex-col gap-2">
                {displayed.year && (
                  <span className="text-sm text-[#6B7280]">{displayed.year}</span>
                )}
                {displayed.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {displayed.genres.map((g) => (
                      <span
                        key={g}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#2A2A2A] text-[#9CA3AF]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Synopsis */}
              {displayed.synopsis && (
                <p className="text-sm text-[#9CA3AF] leading-relaxed">
                  {displayed.synopsis}
                </p>
              )}

              {/* Suggested by */}
              {suggestedByName && (
                <p className="text-xs text-[#6B7280]">
                  Sugerido por:{' '}
                  <span className="text-[#9CA3AF] font-medium">{suggestedByName}</span>
                </p>
              )}

              {/* Divider */}
              <div className="border-t border-[#2A2A2A]" />

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  variant="info"
                  size="lg"
                  onClick={() => setShowMarkWatched(true)}
                  loading={isMoving}
                  className="w-full"
                >
                  Marcar como assistido
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setShowConfirmDelete(true)}
                  loading={isDeleting}
                  className="w-full"
                >
                  Excluir da lista
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ── Mark as watched modal (stacks above detail) ───────────────────────── */}
      <MarkAsWatchedModal
        visible={showMarkWatched}
        onClose={() => setShowMarkWatched(false)}
        onConfirm={handleMarkWatchedConfirm}
        loading={isMoving}
        movieTitle={displayed?.title}
      />

      {/* ── Confirm delete modal (stacks above detail) ───────────────────────── */}
      <ConfirmModal
        visible={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir filme?"
        message={
          displayed?.title
            ? `"${displayed.title}" será removido da lista permanentemente.`
            : 'Este filme será removido da lista permanentemente.'
        }
        confirmLabel="Excluir"
        loading={isDeleting}
      />
    </>
  );
}
