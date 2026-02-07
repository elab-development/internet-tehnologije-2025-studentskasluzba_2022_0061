'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import { Sidebar } from '../../../../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Molba = {
  id: number;
  sadrzaj: string;
  datumPodnosenja: string;
  student: {
    brojIndeksa: string;
    korisnik: {
      ime: string;
      prezime: string;
      email: string;
    };
  };
};

export default function AnswerMolbaPage() {
  const { user, status } = useAuthState();
  const router = useRouter();
  const params = useParams();
  const molbaId = params.id as string;

  const [molba, setMolba] = useState<Molba | null>(null);
  const [decision, setDecision] = useState<'ODOBRENA' | 'ODBIJENA'>('ODOBRENA');
  const [napomena, setNapomena] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
      loadMolba();
    }
  }, [status, user]);

  async function loadMolba() {
    const res = await fetch(`/api/molbe/${molbaId}`, { credentials: 'include' });
    const data = await res.json();
    setMolba(data.molba);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!napomena.trim() || submitting) return;

    setSubmitting(true);

    const res = await fetch(`/api/molbe/${molbaId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: decision, napomenaOdgovora: napomena }),
    });

    if (res.ok) {
      router.push('/admin/molbe');
    } else {
      alert('Greška pri odgovaranju na molbu');
      setSubmitting(false);
    }
  }

  if (status === 'loading' || loading) {
    return <h1 className="text-center mt-20">Učitavanje...</h1>;
  }

  if (status === 'unauthenticated' || user?.tip !== 'ADMINISTRATOR' || !molba) {
    return <h1 className="text-center mt-20">Preusmeravanje...</h1>;
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="ADMINISTRATOR" />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-green-800 mb-6">
          Odgovori na molbu #{molba.id}
        </h1>

        <Card className="max-w-2xl border-green-200 mb-6">
          <CardHeader>
            <CardTitle className="text-green-700">Informacije o molbi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium text-gray-700">Student:</p>
              <p className="text-gray-600">
                {molba.student.korisnik.ime} {molba.student.korisnik.prezime} ({molba.student.brojIndeksa})
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Datum podnošenja:</p>
              <p className="text-gray-600">
                {new Date(molba.datumPodnosenja).toLocaleDateString('sr-RS')}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Sadržaj:</p>
              <p className="text-gray-600">{molba.sadrzaj}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Odgovor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Odluka</Label>
              <RadioGroup value={decision} onValueChange={(v) => setDecision(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ODOBRENA" id="odobrena" />
                  <Label htmlFor="odobrena" className="cursor-pointer">Odobrena</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ODBIJENA" id="odbijena" />
                  <Label htmlFor="odbijena" className="cursor-pointer">Odbijena</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Napomena</Label>
              <Textarea
                value={napomena}
                onChange={e => setNapomena(e.target.value)}
                placeholder="Unesite obrazloženje odluke..."
                rows={6}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSubmit}
                disabled={!napomena.trim() || submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Slanje...' : 'Pošalji odgovor'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/molbe')}
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