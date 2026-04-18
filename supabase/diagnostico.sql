-- ─────────────────────────────────────────────────────────────────────────────
-- DIAGNÓSTICO — rodar no Supabase Dashboard → SQL Editor
-- Execute cada bloco separadamente (selecione e clique em "Run").
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Verificar se a tabela movie_ratings existe ────────────────────────────
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ratings', 'movie_ratings');
-- Resultado esperado: linha com "movie_ratings" (tabela da migration nova).
-- Se aparecer apenas "ratings" → a migration NÃO foi aplicada → execute o Passo A abaixo.
-- Se ambas aparecerem → migration foi aplicada e a tabela antiga ainda existe.
-- Se nenhuma aparecer → execute o Passo A abaixo.


-- ── 2. Contar filmes assistidos na tabela movies ──────────────────────────────
SELECT status, COUNT(*) AS total
FROM movies
GROUP BY status;
-- Deve mostrar linhas para "to_watch" e/ou "watched".
-- Se não aparecer nada → os dados foram deletados (ver Passo B abaixo).


-- ── 3. (Se movie_ratings existir) Contar ratings ─────────────────────────────
SELECT COUNT(*) AS total_ratings FROM movie_ratings;


-- ── 4. (Se ratings existir) Contar dados na tabela antiga ────────────────────
SELECT COUNT(*) AS total_ratings_antigos FROM ratings;


-- ── 5. Verificar RLS policies na movie_ratings ───────────────────────────────
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'movie_ratings';
-- Deve ter 4 policies: SELECT (USING true), INSERT, UPDATE, DELETE.


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO A — Aplicar a migration (se movie_ratings não existir)
-- Cole o conteúdo completo de:
--   supabase/migrations/20260414_movie_ratings.sql
-- no SQL Editor e execute. Isso irá:
--   • criar a tabela movie_ratings
--   • criar as RLS policies
--   • migrar os dados da tabela ratings (se ela existir)
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO B — Se os dados em movies sumiram (SELECT retornou vazio)
-- Verifique se existe backup:
--   Supabase Dashboard → Database → Backups
-- Ou verifique se há dados em "soft-delete" / tabelas arquivadas.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Após corrigir: verificação final ─────────────────────────────────────────
-- Rode as queries abaixo para confirmar que tudo está OK:

-- Filmes assistidos com ratings:
SELECT
  m.title,
  m.status,
  m.watched_date,
  mr.rating,
  mr.user_id
FROM movies m
LEFT JOIN movie_ratings mr ON mr.movie_id = m.id
WHERE m.status = 'watched'
ORDER BY m.watched_date DESC;
