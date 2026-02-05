'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import { Sidebar } from '../../../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function NovaMolbaPage() {
  const { user, status } = useAuthState();
  const router = useRouter();
  const [sadrzaj, setSadrzaj] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
    if (status === 'authenticated' && user?.tip !== 'STUDENT') {
      router.replace('/home');
    }
  }, [status, user, router]);

  async function handleSubmit() {
    if (!sadrzaj.trim() || submitting) return;

    setSubmitting(true);

    const res = await fetch('/api/molbe/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sadrzaj }),
    });

    if (res.ok) {
      router.push('/student/molbe');
    } else {
      alert('Greška pri kreiranju molbe');
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return <h1 className="text-center mt-20">Učitavanje...</h1>;
  }

  if (status === 'unauthenticated' || user?.tip !== 'STUDENT') {
    return <h1 className="text-center mt-20">Preusmeravanje...</h1>;
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="STUDENT" />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-green-800 mb-6">
          Nova molba
        </h1>

        <Card className="max-w-2xl border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Detalji molbe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sadržaj molbe</Label>
              <Textarea
                value={sadrzaj}
                onChange={e => setSadrzaj(e.target.value)}
                placeholder="Opišite razlog molbe..."
                rows={10}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSubmit}
                disabled={!sadrzaj.trim() || submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Podnošenje...' : 'Podnesi molbu'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/student/molbe')}
                disabled={submitting}
              >
                Otkaži
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}