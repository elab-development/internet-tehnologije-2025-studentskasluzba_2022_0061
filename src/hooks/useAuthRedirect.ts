'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type User = {
  id: number;
  email: string;
  ime: string;
  prezime: string;
  tip: string;
} | null;

/**
 * useAuthRedirect options:
 * - redirectIfUnauthenticated → redirect to login if not logged in
 * - redirectIfAuthenticated → redirect to home if logged in
 */
export function useAuthRedirect({
  redirectIfUnauthenticated = false,
  redirectIfAuthenticated = false,
} = {}) {
  const [user, setUser] = useState<User | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        setUser(data.user ?? null);

        if (redirectIfUnauthenticated && !data.user) {
          router.replace('/login');
        } else if (redirectIfAuthenticated && data.user) {
          router.replace('/home');
        }
      } catch {
        setUser(null);
        if (redirectIfUnauthenticated) router.replace('/login');
      }
    }

    fetchUser();
  }, [redirectIfUnauthenticated, redirectIfAuthenticated, router]);

  return user;
}
