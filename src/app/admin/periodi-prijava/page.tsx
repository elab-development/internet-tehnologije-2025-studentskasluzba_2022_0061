'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import { Sidebar } from '@/app/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Period = {
  id: number;
  akademskaGodina: string;
  nivoStudija: string;
  pocetakPerioda: string;
  krajPerioda: string;
};

export default function AktivniPeriodiPage() {
  const { user, status } = useAuthState();
  const router = useRouter();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (user?.tip !== 'ADMINISTRATOR') {
        router.replace('/home');
        return;
      }
      loadPeriods();
    }
  }, [status, user]);

  async function loadPeriods() {
    setLoading(true);
    const res = await fetch('/api/admin/periodi-prijava/active', {
      credentials: 'include',
    });
    const data = await res.json();
    setPeriods(data.periods || []);
    setLoading(false);
  }

  async function updatePeriod(id: number, newDate: string) {
    await fetch(`/api/admin/periodi-prijava/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ krajPerioda: new Date(newDate).toISOString() }),
    });

    loadPeriods();
  }

  if (status === 'loading' || loading) {
    return <h1 className="text-center mt-20">Učitavanje...</h1>;
  }

  if (status === 'unauthenticated') {
    return <h1 className="text-center mt-20">Preusmeravanje...</h1>;
  }

  const levelLabels: Record<string, string> = {
    OSNOVNE: 'Osnovne studije',
    MASTER: 'Master studije',
    DOKTORSKE: 'Doktorske studije',
    SPECIJALISTIČKE: 'Specijalističke studije',
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role={user!.tip} />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-green-800 mb-6">
          Aktivni periodi biranja predmeta
        </h1>

        {periods.length === 0 ? (
          <p className="text-gray-600">Trenutno nema aktivnih perioda za biranje predmeta.</p>
        ) : (
          <div className="space-y-4">
            {periods.map(period => (
              <Card key={period.id} className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700">
                    {period.akademskaGodina} — {levelLabels[period.nivoStudija]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    Početak:{' '}
                    {new Date(period.pocetakPerioda).toLocaleString('sr-RS')}
                  </p>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Kraj perioda
                    </label>
                    <input
                      type="datetime-local"
                      defaultValue={(() => {
                        const d = new Date(period.krajPerioda);
                        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                        return d.toISOString().slice(0, 16);
                      })()}
                      onBlur={e =>
                        updatePeriod(period.id, e.target.value)
                      }
                      className="border rounded px-2 py-1"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}