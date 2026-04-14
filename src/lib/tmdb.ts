import { TMDBMovie, TMDBSearchResponse } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? '';

// ─── Genre map (id → PT-BR name) ─────────────────────────────────────────────

export const TMDB_GENRES: Record<number, string> = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  10770: 'Cinema TV',
  53: 'Thriller',
  10752: 'Guerra',
  37: 'Faroeste',
};

export function genreNames(genreIds: number[]): string[] {
  return genreIds
    .map((id) => TMDB_GENRES[id])
    .filter((name): name is string => !!name);
}

// ─── Image URL helpers ────────────────────────────────────────────────────────

export type PosterSize = 'w185' | 'w342' | 'w500' | 'original';

export function posterUrl(
  path: string | null | undefined,
  size: PosterSize = 'w500',
): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

// ─── Extended movie detail type (from /movie/{id}) ────────────────────────────
// Search results use genre_ids; details use genres objects.

export interface TMDBMovieDetails extends Omit<TMDBMovie, 'genre_ids'> {
  genres: Array<{ id: number; name: string }>;
  runtime: number | null;
  tagline: string | null;
  status: string;
  budget: number;
  revenue: number;
  homepage: string | null;
  imdb_id: string | null;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  if (!API_KEY) throw new Error('NEXT_PUBLIC_TMDB_API_KEY is not set');

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'pt-BR');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function searchMovies(
  query: string,
  page = 1,
): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>('/search/movie', {
    query: query.trim(),
    page: String(page),
    include_adult: 'false',
  });
}

export async function getMovieDetails(tmdbId: number): Promise<TMDBMovieDetails> {
  return tmdbFetch<TMDBMovieDetails>(`/movie/${tmdbId}`);
}
