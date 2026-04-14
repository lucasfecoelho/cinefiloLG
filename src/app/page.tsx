import { redirect } from 'next/navigation';

// The proxy (src/proxy.ts) handles the actual auth-based redirect before this
// page is reached. This is a simple fallback for unauthenticated-but-unmatched
// edge cases; authenticated users land on /para-assistir via proxy.
export default function Home() {
  redirect('/para-assistir');
}
