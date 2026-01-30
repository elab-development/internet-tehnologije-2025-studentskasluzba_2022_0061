'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';

export default function IndexPage() {
  const { status } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/home');
    }
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <h1 className="text-center mt-20">Učitavanje...</h1>;
  }

  return <h1 className="text-center mt-20">Preusmeravanje...</h1>;
}
