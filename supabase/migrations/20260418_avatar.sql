-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: avatar
--
-- 1. Adds avatar_url column to profiles table
-- 2. Creates the "avatars" storage bucket (public, 2 MB limit)
-- 3. Sets up RLS policies on storage.objects for the bucket
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Add avatar_url column to profiles ─────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;


-- ── 2. Create storage bucket ─────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,   -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ── 3. Storage RLS policies ───────────────────────────────────────────────────
--
-- Path convention: avatars/{user_id}/avatar.jpg
-- (storage.foldername returns the folder path components as a text[])

-- Public read — anyone can view avatars (needed to display partner's photo)
DROP POLICY IF EXISTS "avatars_public_select"      ON storage.objects;
CREATE POLICY "avatars_public_select"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Authenticated users can only upload to their own folder
DROP POLICY IF EXISTS "avatars_authenticated_insert" ON storage.objects;
CREATE POLICY "avatars_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can only overwrite their own folder
DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can only delete from their own folder
DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;
CREATE POLICY "avatars_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
