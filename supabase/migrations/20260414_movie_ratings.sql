-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: movie_ratings
--
-- Replaces the old `ratings` table (score INTEGER 0-10) with `movie_ratings`
-- which stores individual half-star ratings as DECIMAL(2,1) in the 0.5–5.0
-- range.
--
-- Key design decisions:
--   • movie_id is UUID → FK to movies.id.  Ratings cascade-delete with the
--     movie, which is correct for this app (a deleted movie has no ratings).
--   • rating DECIMAL(2,1) with CHECK ensures only 0.5-step values.
--   • SELECT policy is open to all authenticated users so each person can
--     see their partner's rating and the average is computable client-side.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Table ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.movie_ratings (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id    UUID         NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  -- 0.5 increments enforced: rating * 2 must be a whole number
  rating      DECIMAL(2,1) NOT NULL
                CHECK (rating >= 0.5
                   AND rating <= 5.0
                   AND FLOOR(rating * 2) = rating * 2),
  comment     TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (movie_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_movie_ratings_movie_id
  ON public.movie_ratings (movie_id);


-- ── 2. Auto-update updated_at on every UPDATE ────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_movie_ratings_updated_at ON public.movie_ratings;
CREATE TRIGGER trg_movie_ratings_updated_at
  BEFORE UPDATE ON public.movie_ratings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ── 3. Row-Level Security ────────────────────────────────────────────────────

ALTER TABLE public.movie_ratings ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read ALL ratings.
-- Needed so each person can view their partner's rating and compute averages.
CREATE POLICY "authenticated users can select all movie ratings"
  ON public.movie_ratings
  FOR SELECT
  TO authenticated
  USING (true);

-- Users may only insert their own ratings.
CREATE POLICY "users can insert own movie rating"
  ON public.movie_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users may only update their own ratings.
CREATE POLICY "users can update own movie rating"
  ON public.movie_ratings
  FOR UPDATE
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users may only delete their own ratings.
CREATE POLICY "users can delete own movie rating"
  ON public.movie_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ── 4. Average view ──────────────────────────────────────────────────────────
--
-- avg_rating is rounded to the nearest 0.5:
--   ROUND(avg * 2) / 2  →  e.g. avg 3.75 becomes 4.0, avg 3.25 becomes 3.5
--
-- With only 2 users, the two possible outcomes are:
--   1 rating  → avg = that rating (already a 0.5-step value)
--   2 ratings → avg = (r1 + r2) / 2, rounded to nearest 0.5

CREATE OR REPLACE VIEW public.movie_avg_rating AS
SELECT
  movie_id,
  COUNT(*)::INT                   AS rating_count,
  ROUND(AVG(rating) * 2) / 2.0   AS avg_rating
FROM public.movie_ratings
GROUP BY movie_id;


-- ── 5. Migrate data from the old `ratings` table (if it exists) ──────────────
--
-- Old schema: score INTEGER 0-10 (stored as display_value × 2).
-- New schema: rating DECIMAL(2,1) = display_value = score / 2.
-- Integer division by 2 always produces a valid 0.5-step decimal.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ratings'
  ) THEN
    INSERT INTO public.movie_ratings
      (id, movie_id, user_id, rating, comment, created_at, updated_at)
    SELECT
      id,
      movie_id,
      user_id,
      (score / 2.0)::DECIMAL(2,1),   -- 7 → 3.5, 6 → 3.0, etc.
      comment,
      created_at,
      created_at                     -- old table has no updated_at
    FROM public.ratings
    WHERE score > 0                  -- skip rows with no rating (score = 0)
    ON CONFLICT (movie_id, user_id) DO NOTHING;
  END IF;
END $$;
