'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import { Sidebar } from '@/app/components/Sidebar';

export default function BiranjePredmetaPage() {
  const { user, status } = useAuthState();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (user?.tip !== 'STUDENT') {
        router.replace('/home');
        return;
      }

      checkPeriod();
    }
  }, [status, user]);

  async function checkPeriod() {
    try {
      const res = await fetch('/api/student/biranje-predmeta/check', {
        credentials: 'include',
      });

      const data = await res.json();
      setAllowed(data.allowed === true);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return <h1 className="text-center mt-20">Učitavanje...</h1>;
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role={user!.tip} />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-green-800 mb-6">
          Biranje predmeta
        </h1>

        {!allowed ? (
          <p className="text-gray-700">
            Biranje predmeta trenutno nije u toku.
          </p>
        ) : (
          <p>Period je aktivan.</p>
        )}
      </main>
    </div>
  );
}