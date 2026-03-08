'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { useAuthState } from '@/hooks/useAuthState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Fakultet = {
  id: number;
  naziv: string;
};

type BaseEntity = {
  id: number;
  naziv: string;
  sifra: string;
  fakultetId: number;
};

function defaultAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 9 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

export default function NovaRealizacijaPage() {
  const { user, status } = useAuthState();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fakulteti, setFakulteti] = useState<Fakultet[]>([]);
  const [klaseIspitnihRokova, setKlaseIspitnihRokova] = useState<BaseEntity[]>([]);
  const [klaseKolokvijumskihNedelja, setKlaseKolokvijumskihNedelja] = useState<BaseEntity[]>([]);
  const [form, setForm] = useState({
    tip: 'ISPITNI_ROK',
    fakultetId: '',
    klasaId: '',
    akademskaGodina: defaultAcademicYear(),
    pocetak: '',
    kraj: '',
    pocetakPrijavljivanja: '',
    krajPrijavljivanja: '',
  });

  async function loadOptions() {
    const res = await fetch('/api/admin/realizacije/options', { credentials: 'include' });
    const data = await res.json();
    setFakulteti(data.fakulteti || []);
    setKlaseIspitnihRokova(data.klaseIspitnihRokova || []);
    setKlaseKolokvijumskihNedelja(data.klaseKolokvijumskihNedelja || []);
    if (data.fakulteti?.length > 0) {
      setForm(current => ({ ...current, fakultetId: current.fakultetId || data.fakulteti[0].id.toString() }));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    if (status === 'authenticated' && user?.tip !== 'ADMINISTRATOR') router.replace('/home');
  }, [status, user, router]);

  useEffect(() => {
    if (status === 'authenticated' && user?.tip === 'ADMINISTRATOR') {
      const timer = setTimeout(() => {
        void loadOptions();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [status, user]);

  const availableClasses = useMemo(() => {
    const source = form.tip === 'ISPITNI_ROK' ? klaseIspitnihRokova : klaseKolokvijumskihNedelja;
    return source.filter(item => item.fakultetId === Number(form.fakultetId));
  }, [form.tip, form.fakultetId, klaseIspitnihRokova, klaseKolokvijumskihNedelja]);

  const selectedKlasaId = availableClasses.some(item => item.id.toString() === form.klasaId)
    ? form.klasaId
    : availableClasses[0]?.id.toString() ?? '';

  async function handleSubmit() {
    if (
      !form.fakultetId ||
      !form.klasaId ||
      !form.akademskaGodina ||
      !form.pocetak ||
      !form.kraj ||
      !form.pocetakPrijavljivanja ||
      !form.krajPrijavljivanja ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await fetch('/api/admin/realizacije/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        tip: form.tip,
        fakultetId: Number(form.fakultetId),
        klasaId: Number(selectedKlasaId),
        akademskaGodina: form.akademskaGodina,
        pocetak: new Date(form.pocetak).toISOString(),
        kraj: new Date(form.kraj).toISOString(),
        pocetakPrijavljivanja: new Date(form.pocetakPrijavljivanja).toISOString(),
        krajPrijavljivanja: new Date(form.krajPrijavljivanja).toISOString(),
      }),
    });

    if (res.ok) {
      router.push('/home');
      return;
    }

    const data = await res.json();
    setError(data.error || 'Greska pri kreiranju realizacije.');
    setSubmitting(false);
  }

  if (status === 'loading' || loading) return <h1 className="text-center mt-20">Ucitavanje...</h1>;
  if (status === 'unauthenticated' || user?.tip !== 'ADMINISTRATOR') return <h1 className="text-center mt-20">Preusmeravanje...</h1>;

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="ADMINISTRATOR" />
      <main className="flex-1 p-8">
        <h1 className="mb-6 text-2xl font-semibold text-green-800">Nova realizacija roka ili kolokvijumske nedelje</h1>
        <Card className="max-w-3xl border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Podaci o realizaciji</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tip realizacije</Label>
                <Select value={form.tip} onValueChange={value => setForm(current => ({ ...current, tip: value, klasaId: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISPITNI_ROK">Ispitni rok</SelectItem>
                    <SelectItem value="KOLOKVIJUMSKA_NEDELJA">Kolokvijumska nedelja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fakultet</Label>
                <Select value={form.fakultetId} onValueChange={value => setForm(current => ({ ...current, fakultetId: value, klasaId: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {fakulteti.map(fakultet => (
                      <SelectItem key={fakultet.id} value={fakultet.id.toString()}>{fakultet.naziv}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tip roka</Label>
                <Select value={selectedKlasaId} onValueChange={value => setForm(current => ({ ...current, klasaId: value }))}>
                  <SelectTrigger><SelectValue placeholder="Izaberi klasu" /></SelectTrigger>
                  <SelectContent>
                    {availableClasses.map(item => (
                      <SelectItem key={item.id} value={item.id.toString()}>{item.naziv} ({item.sifra})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Akademska godina</Label>
                <input className="w-full rounded border px-3 py-2" value={form.akademskaGodina} onChange={event => setForm(current => ({ ...current, akademskaGodina: event.target.value }))} placeholder="2025/2026" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Početak realizacije</Label>
                <input type="datetime-local" className="w-full rounded border px-3 py-2" value={form.pocetak} onChange={event => setForm(current => ({ ...current, pocetak: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Kraj realizacije</Label>
                <input type="datetime-local" className="w-full rounded border px-3 py-2" value={form.kraj} onChange={event => setForm(current => ({ ...current, kraj: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Početak prijavljivanja</Label>
                <input type="datetime-local" className="w-full rounded border px-3 py-2" value={form.pocetakPrijavljivanja} onChange={event => setForm(current => ({ ...current, pocetakPrijavljivanja: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Kraj prijavljivanja</Label>
                <input type="datetime-local" className="w-full rounded border px-3 py-2" value={form.krajPrijavljivanja} onChange={event => setForm(current => ({ ...current, krajPrijavljivanja: event.target.value }))} />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-4">
              <Button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700">
                {submitting ? 'Čuvanje...' : 'Sačuvaj realizaciju'}
              </Button>
              <Button variant="outline" onClick={() => router.push('/home')} disabled={submitting}>Otkaži</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
