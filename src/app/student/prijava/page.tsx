'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { useAuthState } from '@/hooks/useAuthState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EligibleCourse = {
  kursUModuluId: number;
  naziv: string;
  espb: number;
  godinaStudija: number;
  semestar: number;
  datumBiranja: string;
};

type OpenRealization = {
  id: number;
  tip: 'ISPITNI_ROK' | 'KOLOKVIJUMSKA_NEDELJA';
  naziv: string;
  akademskaGodina: string;
  pocetakPrijavljivanja: string;
  krajPrijavljivanja: string;
};

type ResponseShape = {
  akademskaGodina: string;
  openRealizations: OpenRealization[];
  eligibleCourses: EligibleCourse[];
  registeredCourses: {
    id: string;
    tip: 'ISPITNI_ROK' | 'KOLOKVIJUMSKA_NEDELJA';
    realizacijaNaziv: string;
    predmet: string;
    espb: number;
    datumPrijave: string;
  }[];
};

export default function PrijavaPage() {
  const { user, status } = useAuthState();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState<ResponseShape | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [showRealizationStep, setShowRealizationStep] = useState(false);
  const [selectedRealizationId, setSelectedRealizationId] = useState('');
  const [sendEmailConfirmation, setSendEmailConfirmation] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    setSuccess('');
    setShowRealizationStep(false);
    setSelectedCourseIds([]);
    setSendEmailConfirmation(false);

    const res = await fetch('/api/student/prijava/options', { credentials: 'include' });
    const payload = await res.json();

    if (!res.ok) {
      setError(payload.error || 'Greska pri ucitavanju podataka.');
      setLoading(false);
      return;
    }

    setData(payload);
    if (payload.openRealizations?.length > 0) {
      setSelectedRealizationId(payload.openRealizations[0].id.toString());
    }
    setLoading(false);
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    if (status === 'authenticated' && user?.tip !== 'STUDENT') router.replace('/home');
  }, [status, user, router]);

  useEffect(() => {
    if (status === 'authenticated' && user?.tip === 'STUDENT') {
      const timer = setTimeout(() => {
        void loadData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [status, user]);

  const selectedRealization = useMemo(
    () => data?.openRealizations.find(item => item.id.toString() === selectedRealizationId) ?? null,
    [data, selectedRealizationId]
  );

  function toggleCourse(courseId: number, checked: boolean) {
    setError('');
    setSuccess('');
    setSelectedCourseIds(current => {
      const next = new Set(current);
      if (checked) next.add(courseId);
      else next.delete(courseId);
      return [...next];
    });
  }

  async function submitRegistration() {
    if (!selectedRealization || selectedCourseIds.length === 0 || submitting) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    const res = await fetch('/api/student/prijava/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        tip: selectedRealization.tip,
        realizationId: selectedRealization.id,
        selectedCourseIds,
        sendEmailConfirmation,
      }),
    });

    const payload = await res.json();

    if (!res.ok) {
      setError(payload.error || 'Greska pri prijavi predmeta.');
      setSubmitting(false);
      return;
    }

    if (sendEmailConfirmation) {
      setSuccess(
        payload.emailSent
          ? 'Predmeti su uspešno prijavljeni. Poslata je i email potvrda.'
          : 'Predmeti su uspešno prijavljeni. Email potvrda nije poslata.'
      );
    } else {
      setSuccess('Predmeti su uspešno prijavljeni.');
    }

    await loadData();
    setSubmitting(false);
  }

  if (status === 'loading' || loading) return <h1 className="text-center mt-20">Ucitavanje...</h1>;
  if (status === 'unauthenticated' || user?.tip !== 'STUDENT') return <h1 className="text-center mt-20">Preusmeravanje...</h1>;

  if (!data || data.openRealizations.length === 0) {
    return (
      <div className="min-h-screen flex bg-green-50">
        <Sidebar role="STUDENT" />
        <main className="flex-1 p-8">
          <h1 className="mb-6 text-2xl font-semibold text-green-800">Prijava ispita i kolokvijuma</h1>
          <p className="text-gray-700">Prijave nisu u toku.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="STUDENT" />
      <main className="flex-1 p-8">
        <h1 className="mb-6 text-2xl font-semibold text-green-800">Prijava ispita i kolokvijuma</h1>

        <div className="space-y-6">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">Aktivne prijave</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {data.openRealizations.map(item => (
                <Badge key={`${item.tip}-${item.id}`} className="bg-green-100 text-green-800 hover:bg-green-100">
                  {item.tip === 'ISPITNI_ROK' ? 'Ispitni rok' : 'Kolokvijumska nedelja'}: {item.naziv}
                </Badge>
              ))}
            </CardContent>
          </Card>

          {data.registeredCourses.length > 0 && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Već prijavljeni predmeti u aktivnim realizacijama</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-600">
                        <th className="py-2 pr-4">Tip</th>
                        <th className="py-2 pr-4">Realizacija</th>
                        <th className="py-2 pr-4">Predmet</th>
                        <th className="py-2 pr-4">ESPB</th>
                        <th className="py-2 pr-4">Datum prijave</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.registeredCourses.map(course => (
                        <tr key={course.id} className="border-b last:border-b-0">
                          <td className="py-3 pr-4">
                            {course.tip === 'ISPITNI_ROK' ? 'Ispitni rok' : 'Kolokvijumska nedelja'}
                          </td>
                          <td className="py-3 pr-4">{course.realizacijaNaziv}</td>
                          <td className="py-3 pr-4">{course.predmet}</td>
                          <td className="py-3 pr-4">{course.espb}</td>
                          <td className="py-3 pr-4">{new Date(course.datumPrijave).toLocaleString('sr-RS')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {data.eligibleCourses.length === 0 ? (
            <p className="text-gray-700">
              Nemate izabranih nepolozenih predmeta za prijavu u akademskoj godini {data.akademskaGodina}.
            </p>
          ) : (
            <>
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700">Predmeti koje mozete prijaviti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-600">
                          <th className="py-2 pr-4">Izbor</th>
                          <th className="py-2 pr-4">Predmet</th>
                          <th className="py-2 pr-4">ESPB</th>
                          <th className="py-2 pr-4">Godina</th>
                          <th className="py-2 pr-4">Semestar</th>
                          <th className="py-2 pr-4">Datum izbora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.eligibleCourses.map(course => (
                          <tr key={course.kursUModuluId} className="border-b last:border-b-0">
                            <td className="py-3 pr-4">
                              <Checkbox
                                checked={selectedCourseIds.includes(course.kursUModuluId)}
                                onCheckedChange={value => toggleCourse(course.kursUModuluId, value === true)}
                                className="border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white"
                              />
                            </td>
                            <td className="py-3 pr-4">{course.naziv}</td>
                            <td className="py-3 pr-4">{course.espb}</td>
                            <td className="py-3 pr-4">{course.godinaStudija}</td>
                            <td className="py-3 pr-4">{course.semestar}</td>
                            <td className="py-3 pr-4">{new Date(course.datumBiranja).toLocaleDateString('sr-RS')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button onClick={() => setShowRealizationStep(true)} disabled={selectedCourseIds.length === 0} className="bg-green-600 hover:bg-green-700">
                    Nastavi na izbor realizacije
                  </Button>
                </CardContent>
              </Card>

              {showRealizationStep && (
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-700">Izbor realizacije</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Realizacija</Label>
                      <Select value={selectedRealizationId} onValueChange={setSelectedRealizationId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {data.openRealizations.map(item => (
                            <SelectItem key={`${item.tip}-${item.id}`} value={item.id.toString()}>
                              {item.tip === 'ISPITNI_ROK' ? 'Ispitni rok' : 'Kolokvijumska nedelja'} - {item.naziv}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRealization && (
                      <p className="text-sm text-gray-600">
                        Rok za prijavu traje do {new Date(selectedRealization.krajPrijavljivanja).toLocaleString('sr-RS')}.
                      </p>
                    )}

                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                      <Checkbox
                        id="send-email-confirmation"
                        checked={sendEmailConfirmation}
                        onCheckedChange={value => setSendEmailConfirmation(value === true)}
                        disabled={submitting}
                        className="border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white"
                      />
                      <Label htmlFor="send-email-confirmation" className="cursor-pointer text-sm text-gray-700">
                        Pošalji mi email potvrdu o prijavi (opciono)
                      </Label>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {success && <p className="text-sm text-green-700">{success}</p>}

                    <div className="flex gap-4">
                      <Button onClick={submitRegistration} disabled={!selectedRealizationId || submitting} className="bg-green-600 hover:bg-green-700">
                        {submitting ? 'Prijavljivanje...' : 'Potvrdi prijavu'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowRealizationStep(false)} disabled={submitting}>
                        Nazad
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
