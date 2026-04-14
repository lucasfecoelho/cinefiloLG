// ─── Enums / Union types ─────────────────────────────────────────────────────

export type PrimaryColor = 'green' | 'red' | 'orange' | 'purple' | 'blue' | 'yellow';

export type ThemeMode = 'light' | 'dark';

export type MovieStatus = 'to_watch' | 'watched';

export type NotificationType = 'added_to_watch' | 'added_watched';

// ─── Domain models ────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string;
  primary_color: PrimaryColor;
  theme: ThemeMode;
  notifications_enabled: boolean;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  year: number;
  poster_url: string | null;
  synopsis: string | null;
  genres: string[];
  status: MovieStatus;
  suggested_by: string; // Profile.id
  watched_date: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  movie_id: string; // UUID — references movies.id
  user_id: string;
  // DB stores `rating` DECIMAL(2,1) in the 0.5–5.0 range.
  // Hooks expose it here as `score = rating * 2` (0–10 integer scale)
  // so that UI helpers using `score / 2` continue to work unchanged.
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  movie_id: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  expires_at: string | null;
  // Joined fields (optional, populated via select)
  movie?: Pick<Movie, 'title' | 'poster_url' | 'year'>;
  sender?: Pick<Profile, 'display_name'>;
}

// ─── TMDB API ─────────────────────────────────────────────────────────────────

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string; // "YYYY-MM-DD"
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  video: boolean;
  original_language: string;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface MovieWithRatings extends Movie {
  ratings:       Rating[];
  my_rating?:    Rating;
  /** Average of all rated users, rounded to nearest 0.5. null if nobody rated. */
  avg_rating:    number | null;
  /** How many users have submitted a rating (0, 1, or 2 for a couple). */
  total_ratings: number;
}

export interface NotificationWithDetails extends Notification {
  movie: Pick<Movie, 'title' | 'poster_url' | 'year'>;
  sender: Pick<Profile, 'display_name'>;
}
