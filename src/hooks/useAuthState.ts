'use client';
import { useEffect, useState } from 'react';

export type User = {
  id: number;
  email: string;
  ime: string;
  prezime: string;
  tip: string;
} | null;

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated';

export function useAuthState() {
  const [user, setUser] = useState<User>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();

        if (data.user) {
          setUser(data.user);
          setStatus('authenticated');
        } else {
          setUser(null);
          setStatus('unauthenticated');
        }
      } catch {
        setUser(null);
        setStatus('unauthenticated');
      }
    }

    load();
  }, []);

  return { user, status };
}
