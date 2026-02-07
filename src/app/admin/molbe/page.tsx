// app/admin/molbe/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import { Sidebar } from '../../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

type Molba = {
  id: number;
  sadrzaj: string;
  status: string;
  datumPodnosenja: string;
  datumOdgovora: string | null;
  napomenaOdgovora: string | null;
  student: {
    brojIndeksa: string;
    korisnik: {
      ime: string;
      prezime: string;
      email: string;
    };
  };
};

export default function AdminMolbePage() {
  const { user, status } = useAuthState();
  const router = useRouter();
  const [molbe, setMolbe] = useState<Molba[]>([]);
  const [showOnlyUnanswered, setShowOnlyUnanswered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
    if (status === 'authenticated' && user?.tip !== 'ADMINISTRATOR') {
      router.replace('/home');
    }
  }, [status, user, router]);

  useEffect(() => {
    if (status === 'authenticated' && user?.tip === 'ADMINISTRATOR') {
      loadMolbe();
    }
  }, [status, user]);

  async function loadMolbe() {
    const res = await fetch('/api/molbe/all', { credentials: 'include' });
    const data = await res.json();
    setMolbe(data.molbe || []);
    setLoading(false);
  }

  if (status === 'loading' || loading) {
    return <h1 className="text-center mt-20">Učitavanje...</h1>;
  }

  if (status === 'unauthenticated' || user?.tip !== 'ADMINISTRATOR') {
    return <h1 className="text-center mt-20">Preusmeravanje...</h1>;
  }

  const statusLabels: Record<string, string> = {
    NA_ČEKANJU: 'Na čekanju',
    ODOBRENA: 'Odobrena',
    ODBIJENA: 'Odbijena',
  };

  const statusColors: Record<string, string> = {
    NA_ČEKANJU: 'bg-yellow-100 text-yellow-800',
    ODOBRENA: 'bg-green-100 text-green-800',
    ODBIJENA: 'bg-red-100 text-red-800',
  };
  const filteredMolbe = showOnlyUnanswered
    ? molbe.filter(m => m.status === 'NA_ČEKANJU')
    : molbe;

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="ADMINISTRATOR" />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-green-800 mb-6">
          Sve molbe
        </h1>

        <div className="flex items-center space-x-2 mb-6">
          <Checkbox
            id="unanswered"
            checked={showOnlyUnanswered}
            onCheckedChange={(checked) => setShowOnlyUnanswered(checked as boolean)}
          />
          <label
            htmlFor="unanswered"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Prikaži samo neodgovorene molbe
          </label>
        </div>

        {filteredMolbe.length === 0 ? (
          <p className="text-gray-600">Nema molbi za prikaz.</p>
        ) : (
          <div className="space-y-4">
            {filteredMolbe.map(molba => (
              <Card key={molba.id} className="border-green-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-green-700 text-lg">
                        Molba #{molba.id}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Student: {molba.student.korisnik.ime} {molba.student.korisnik.prezime} ({molba.student.brojIndeksa})
                      </p>
                      <p className="text-sm text-gray-500">
                        {molba.student.korisnik.email}
                      </p>
                    </div>
                    <Badge className={statusColors[molba.status]}>
                      {statusLabels[molba.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Podnet: {new Date(molba.datumPodnosenja).toLocaleDateString('sr-RS')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium text-gray-700">Sadržaj:</p>
                    <p className="text-gray-600">{molba.sadrzaj}</p>
                  </div>
                  {molba.napomenaOdgovora && (
                    <div>
                      <p className="font-medium text-gray-700">Odgovor:</p>
                      <p className="text-gray-600">{molba.napomenaOdgovora}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(molba.datumOdgovora!).toLocaleDateString('sr-RS')}
                      </p>
                    </div>
                  )}
                  {molba.status === 'NA_ČEKANJU' && (
                    <Button
                      onClick={() => router.push(`/admin/molbe/${molba.id}/answer`)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Odgovori
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}