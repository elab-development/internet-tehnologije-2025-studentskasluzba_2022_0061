'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { useAuthState } from '@/hooks/useAuthState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MojPredmet = {
  id: number;
  datumBiranja: string;
  akademskaGodina: string;
  godinaStudija: number;
  semestar: number;
  smer: string;
  program: string;
  modul: string;
  predmet: string;
  opis: string | null;
  espb: number;
  izborni: boolean;
  ocena: number | null;
};

type MojiPredmetiResponse = {
  student: {
    ime: string;
    prezime: string;
    brojIndeksa: string;
  };
  items: MojPredmet[];
  passedCount: number;
  averageGrade: number | null;
};

function semesterLabel(semestar: number) {
  if (semestar === 1) return 'Prvi semestar';
  if (semestar === 2) return 'Drugi semestar';
  return `Semestar ${semestar}`;
}

export function MojiPredmetiClient() {
  const { user, status } = useAuthState();
  const router = useRouter();

  const [data, setData] = useState<MojiPredmetiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      loadData();
    }
  }, [status, user, router]);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/student/moji-predmeti', {
        credentials: 'include',
      });

      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || 'Greska pri ucitavanju predmeta.');
        setLoading(false);
        return;
      }

      setData(payload);
    } catch {
      setError('Greska pri ucitavanju predmeta.');
    } finally {
      setLoading(false);
    }
  }

  const groupedByYear = useMemo(() => {
    const groups = new Map<string, MojPredmet[]>();

    for (const item of data?.items ?? []) {
      const group = groups.get(item.akademskaGodina) ?? [];
      group.push(item);
      groups.set(item.akademskaGodina, group);
    }

    return [...groups.entries()];
  }, [data]);

  if (status === 'loading' || loading) {
    return <h1 className="mt-20 text-center">Ucitavanje...</h1>;
  }

  if (status === 'unauthenticated') {
    return <h1 className="mt-20 text-center">Preusmeravanje...</h1>;
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="STUDENT" />

      <main className="flex-1 p-8">
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-green-800">
              Moji predmeti
            </h1>
            {data && (
              <>
                <p className="mt-2 text-gray-700">
                  {data.student.ime} {data.student.prezime} - Broj indeksa: {data.student.brojIndeksa}
                </p>
                <p className="text-sm text-gray-600">
                  Prikazani su svi ranije izabrani predmeti, uključujući prethodne godine studija.
                </p>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {data && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-green-200">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-600">Ukupno izabranih predmeta</p>
                  <p className="mt-2 text-3xl font-semibold text-green-800">
                    {data.items.length}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-600">Položeni predmeti</p>
                  <p className="mt-2 text-3xl font-semibold text-green-800">
                    {data.passedCount}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-600">Prosečna ocena</p>
                  <p className="mt-2 text-3xl font-semibold text-green-800">
                    {data.averageGrade ?? '-'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {!data || data.items.length === 0 ? (
          <p className="text-gray-700">
            Trenutno nema sačuvanih izabranih predmeta.
          </p>
        ) : (
          <div className="space-y-8">
            {groupedByYear.map(([akademskaGodina, items]) => (
              <section key={akademskaGodina} className="space-y-4">
                <div className="border-b border-green-200 pb-3">
                  <h2 className="text-xl font-semibold text-green-800">
                    Akademska godina {akademskaGodina}
                  </h2>
                </div>

                <div className="space-y-4">
                  {items.map(item => (
                    <Card key={item.id} className="border-green-200">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <CardTitle className="text-lg text-green-800">
                              {item.predmet}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              {item.smer} / {item.modul} / {item.godinaStudija}. godina / {semesterLabel(item.semestar)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              {item.espb} ESPB
                            </Badge>
                            <Badge variant="outline" className={item.izborni ? 'border-amber-300 text-amber-800' : 'border-green-300 text-green-800'}>
                              {item.izborni ? 'Izborni predmet' : 'Obavezan predmet'}
                            </Badge>
                            <Badge className={item.ocena ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-100'}>
                              {item.ocena ? `Ocena: ${item.ocena}` : 'Nije položen'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {item.opis && (
                          <p className="text-sm leading-6 text-gray-700">
                            {item.opis}
                          </p>
                        )}

                        <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-3">
                          <p>Program: {item.program}</p>
                          <p>Datum izbora: {new Date(item.datumBiranja).toLocaleDateString('sr-RS')}</p>
                          <p>Status: {item.ocena ? 'Položen' : 'Nije položen'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
