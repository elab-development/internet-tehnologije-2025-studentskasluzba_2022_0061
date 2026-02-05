// app/student/molbe/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import { Sidebar } from '../../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Molba = {
  id: number;
  sadrzaj: string;
  status: string;
  datumPodnosenja: string;
  datumOdgovora: string | null;
  napomenaOdgovora: string | null;
};

export default function StudentMolbePage() {
  const { user, status } = useAuthState();
  const router = useRouter();
  const [molbe, setMolbe] = useState<Molba[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
    if (status === 'authenticated' && user?.tip !== 'STUDENT') {
      router.replace('/home');
    }
  }, [status, user, router]);

  useEffect(() => {
    if (status === 'authenticated' && user?.tip === 'STUDENT') {
      loadMolbe();
    }
  }, [status, user]);

  async function loadMolbe() {
    const res = await fetch('/api/molbe/student', { credentials: 'include' });
    const data = await res.json();
    setMolbe(data.molbe || []);
    setLoading(false);
  }

  if (status === 'loading' || loading) {
    return <h1 className="text-center mt-20">Učitavanje...</h1>;
  }

  if (status === 'unauthenticated' || user?.tip !== 'STUDENT') {
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

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="STUDENT" />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-green-800 mb-6">
          Moje molbe
        </h1>

        {molbe.length === 0 ? (
          <p className="text-gray-600">Nemate podnetih molbi.</p>
        ) : (
          <div className="space-y-4">
            {molbe.map(molba => (
              <Card key={molba.id} className="border-green-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-green-700 text-lg">
                      Molba #{molba.id}
                    </CardTitle>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}