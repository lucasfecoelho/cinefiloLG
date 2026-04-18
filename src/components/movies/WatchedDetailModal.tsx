'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Film } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Modal }           from '@/components/ui/Modal';
import { Button }          from '@/components/ui/Button';
import { ConfirmModal }    from '@/components/ui/ConfirmModal';
import { StarRating }      from '@/components/ui/StarRating';
import { UserAvatar }      from '@/components/ui/UserAvatar';
import { upgradePosterUrl, getMovieDetails } from '@/lib/tmdb';
import { tmdbMovieKey }    from '@/hooks/usePrefetchMovieDetails';
import { STALE_TMDB }      from '@/providers/QueryProvider';
import type { MovieWithRatings, Profile } from '@/types';
import type { UpsertRatingParams }        from '@/hooks/useWatchedMovies';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchedDetailModalProps {
  movie:          MovieWithRatings | null;
  visible:        boolean;
  onClose:        () => void;
  suggestedByName: string | null;
  /** Both users in sorted order (current user first). */
  profiles:       Profile[];
  currentUserId:  string;
  onSaveRating:   (params: UpsertRatingParams) => Promise<void>;
  isSavingRating: boolean;
  onDelete:       () => Promise<void>;
  isDeleting:     boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function dbToDisplay(dbScore: number): number {
  return dbScore / 2;
}

function fmtRuntime(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ─── Rating row ───────────────────────────────────────────────────────────────

interface RatingRowProps {
  profile:      Profile;
  dbScore:      number;   // current DB score (0-10) to read
  comment:      string;   // current comment
  isOwn:        boolean;  // editable iff true
  editScore:    number;   // controlled edit value (0-5)
  editComment:  string;
  onScoreChange:   (v: number) => void;
  onCommentChange: (v: string) => void;
}

function RatingRow({
  profile, isOwn,
  editScore, editComment,
  onScoreChange, onCommentChange,
}: RatingRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <UserAvatar
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          size="sm"
        />
        <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
          {profile.display_name}
        </span>
      </div>

      <StarRating
        rating={editScore}
        onChange={isOwn ? onScoreChange : undefined}
        size="lg"
      />

      {/* Comment — editable for own, display-only for partner */}
      {isOwn ? (
        <textarea
          value={editComment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Comentário (opcional)"
          rows={2}
          style={{ fontSize: '16px' }}
          className={[
            'w-full px-3 py-2 rounded-xl resize-none',
            'bg-[#141414]',
            'border border-[#2A2A2A]',
            'text-[#F5F5F5] text-sm',
            'placeholder-[#3F3F46]',
            'focus:outline-none focus:border-(--color-primary)',
            'transition-colors duration-150',
          ].join(' ')}
        />
      ) : (
        editComment.trim() ? (
          <p className="text-xs text-[#6B7280] leading-relaxed italic">
            &ldquo;{editComment}&rdquo;
          </p>
        ) : (
          <p className="text-xs text-[#3F3F46]">Sem comentário</p>
        )
      )}
    </div>
  );
}

// ─── WatchedDetailModal ───────────────────────────────────────────────────────

export function WatchedDetailModal({
  movie,
  visible,
  onClose,
  suggestedByName,
  profiles,
  currentUserId,
  onSaveRating,
  isSavingRating,
  onDelete,
  isDeleting,
}: WatchedDetailModalProps) {
  // ── Own rating edit state ─────────────────────────────────────────────────
  const [editScore,   setEditScore]   = useState(0);
  const [editComment, setEditComment] = useState('');
  // "base" = last persisted values — used to detect changes
  const [baseScore,   setBaseScore]   = useState(0);
  const [baseComment, setBaseComment] = useState('');

  // ── Sub-modal ─────────────────────────────────────────────────────────────
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // ── Initialize on open (key: movie id) ───────────────────────────────────
  const prevMovieIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible || !movie) return;
    if (prevMovieIdRef.current === movie.id) return;
    prevMovieIdRef.current = movie.id;

    const myR = movie.ratings.find((r) => r.user_id === currentUserId);
    const s   = myR ? dbToDisplay(myR.score) : 0;
    const c   = myR?.comment ?? '';
    setEditScore(s);
    setEditComment(c);
    setBaseScore(s);
    setBaseComment(c);
  }, [visible, movie, currentUserId]);

  // Reset prevRef when modal closes so next open re-initialises
  useEffect(() => {
    if (!visible) prevMovieIdRef.current = null;
  }, [visible]);

  // ── Has changes ───────────────────────────────────────────────────────────
  const hasChanges =
    editScore !== baseScore ||
    editComment.trim() !== baseComment.trim();

  // ── Partner state (read-only) ─────────────────────────────────────────────
  const partnerProfile = profiles.find((p) => p.id !== currentUserId) ?? null;
  const partnerRating  = movie?.ratings.find((r) => r.user_id !== currentUserId);
  const partnerScore   = partnerRating ? dbToDisplay(partnerRating.score) : 0;
  const partnerComment = partnerRating?.comment ?? '';

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!movie) return;
    await onSaveRating({
      movieId: movie.id,
      score:   editScore,
      comment: editComment.trim() || undefined,
    });
    setBaseScore(editScore);
    setBaseComment(editComment.trim());
  };

  const handleDeleteConfirm = async () => {
    await onDelete();
    setShowConfirmDelete(false);
  };

  // ── Snapshot for exit animation ───────────────────────────────────────────
  const [snapshot, setSnapshot] = useState<typeof movie>(null);
  useEffect(() => {
    if (movie) setSnapshot(movie);
  }, [movie]);
  const displayed = movie ?? snapshot;

  // TMDB extra details (runtime, tagline) — served from prefetch cache
  const { data: tmdbDetails } = useQuery({
    queryKey: tmdbMovieKey(displayed?.tmdb_id ?? 0),
    queryFn:  () => getMovieDetails(displayed!.tmdb_id),
    enabled:  !!displayed?.tmdb_id,
    staleTime: STALE_TMDB,
  });

  const runtime = fmtRuntime(tmdbDetails?.runtime);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        title={displayed?.title ?? ''}
      >
        {displayed ? (
          <div className="flex flex-col pb-6">

            {/* ── Poster ──────────────────────────────────────────────────── */}
            <div className="relative w-full h-52 bg-[#2A2A2A] shrink-0">
              {displayed.poster_url ? (
                <Image
                  src={upgradePosterUrl(displayed.poster_url, 'detail') ?? displayed.poster_url}
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

            <div className="flex flex-col gap-4 px-5 pt-4">

              {/* ── Meta ────────────────────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {displayed.year && (
                    <span className="text-sm text-[#6B7280]">{displayed.year}</span>
                  )}
                  {runtime && (
                    <>
                      <span className="text-[#3F3F46]" aria-hidden="true">·</span>
                      <span className="text-sm text-[#6B7280]">{runtime}</span>
                    </>
                  )}
                  {displayed.watched_date && (
                    <>
                      <span className="text-[#3F3F46]" aria-hidden="true">·</span>
                      <span className="text-sm text-[#6B7280]">
                        {fmtDate(displayed.watched_date)}
                      </span>
                    </>
                  )}
                </div>

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

              {/* ── Tagline ─────────────────────────────────────────────── */}
              {tmdbDetails?.tagline && (
                <p className="text-xs text-[#6B7280] italic leading-relaxed">
                  &ldquo;{tmdbDetails.tagline}&rdquo;
                </p>
              )}

              {/* ── Synopsis ────────────────────────────────────────────── */}
              {displayed.synopsis && (
                <p className="text-sm text-[#9CA3AF] leading-relaxed">
                  {displayed.synopsis}
                </p>
              )}

              {/* ── Suggested by ────────────────────────────────────────── */}
              {suggestedByName && (
                <p className="text-xs text-[#6B7280]">
                  Sugerido por:{' '}
                  <span className="text-[#9CA3AF] font-medium">{suggestedByName}</span>
                </p>
              )}

              <div className="border-t border-[#2A2A2A]" />

              {/* ── Ratings ─────────────────────────────────────────────── */}
              <div className="flex flex-col gap-5">
                {/* Own rating (editable) */}
                {profiles.find((p) => p.id === currentUserId) && (
                  <RatingRow
                    profile={profiles.find((p) => p.id === currentUserId)!}
                    dbScore={0} /* unused — we use editScore */
                    comment={editComment}
                    isOwn={true}
                    editScore={editScore}
                    editComment={editComment}
                    onScoreChange={setEditScore}
                    onCommentChange={setEditComment}
                  />
                )}

                {/* Partner rating (read-only) */}
                {partnerProfile && (
                  <RatingRow
                    profile={partnerProfile}
                    dbScore={partnerRating?.score ?? 0}
                    comment={partnerComment}
                    isOwn={false}
                    editScore={partnerScore}
                    editComment={partnerComment}
                    onScoreChange={() => {}}
                    onCommentChange={() => {}}
                  />
                )}
              </div>

              {/* ── Average ─────────────────────────────────────────────── */}
              {displayed?.avg_rating != null && (
                <div className="flex items-center gap-2 py-1">
                  <span className="text-sm text-[#9CA3AF]">Média</span>
                  <StarRating rating={displayed.avg_rating} mode="display" size="sm" />
                </div>
              )}

              <div className="border-t border-[#2A2A2A]" />

              {/* ── Action buttons ───────────────────────────────────────── */}
              <div className="flex flex-col gap-3">
                {hasChanges && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSave}
                    loading={isSavingRating}
                    className="w-full"
                  >
                    Salvar alterações
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setShowConfirmDelete(true)}
                  disabled={isDeleting}
                  className="w-full"
                >
                  Excluir dos assistidos
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ── Confirm delete (stacks above detail modal) ────────────────────── */}
      <ConfirmModal
        visible={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir filme?"
        message={
          displayed?.title
            ? `"${displayed.title}" será removido dos assistidos.`
            : 'Este filme será removido dos assistidos.'
        }
        confirmLabel="Excluir"
        loading={isDeleting}
      />
    </>
  );
}
