'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { useAuthState } from '@/hooks/useAuthState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PARAMETER_FIELDS = [
  { key: 'TEZINA', label: 'Tezina' },
  { key: 'PRAKTI\u00C4\u0152NOST', label: 'Prakticnost' },
  { key: 'KVALITET_NASTAVE', label: 'Kvalitet nastave' },
  { key: 'ORGANIZACIJA', label: 'Organizacija' },
  { key: 'KORISNOST', label: 'Korisnost' },
] as const;

type ParameterKey = (typeof PARAMETER_FIELDS)[number]['key'];
type Ratings = Record<ParameterKey, number>;

type CourseItem = {
  kursId: number;
  naziv: string;
  examGrade: number;
  akademskaGodina: string;
  datumPolaganja: string;
  ratings: Record<ParameterKey, number | null>;
};

type ResponseShape = {
  items: CourseItem[];
};

function buildInitialRatings(source?: Record<ParameterKey, number | null>): Ratings {
  return {
    TEZINA: source?.TEZINA ?? 3,
    PRAKTI\u00C4\u0152NOST: source?.PRAKTI\u00C4\u0152NOST ?? 3,
    KVALITET_NASTAVE: source?.KVALITET_NASTAVE ?? 3,
    ORGANIZACIJA: source?.ORGANIZACIJA ?? 3,
    KORISNOST: source?.KORISNOST ?? 3,
  };
}

export default function OcenaPredmetaPage() {
  const { user, status } = useAuthState();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingCourseId, setSavingCourseId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState<ResponseShape | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Ratings>>({});

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

  async function loadData() {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/student/ocene-predmeta', { credentials: 'include' });
      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || 'Greska pri ucitavanju podataka.');
        setLoading(false);
        return;
      }

      const nextDrafts: Record<number, Ratings> = {};
      for (const item of payload.items as CourseItem[]) {
        nextDrafts[item.kursId] = buildInitialRatings(item.ratings);
      }

      setData(payload);
      setDrafts(nextDrafts);
    } catch {
      setError('Greska pri ucitavanju podataka.');
    } finally {
      setLoading(false);
    }
  }

  function setRating(courseId: number, key: ParameterKey, value: string) {
    const nextValue = Number(value);
    if (!Number.isInteger(nextValue) || nextValue < 1 || nextValue > 5) return;

    setDrafts(current => ({
      ...current,
      [courseId]: {
        ...current[courseId],
        [key]: nextValue,
      },
    }));
  }

  async function saveRatings(course: CourseItem) {
    const ratings = drafts[course.kursId];
    if (!ratings || savingCourseId !== null) return;

    setSavingCourseId(course.kursId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/student/ocene-predmeta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          kursId: course.kursId,
          ratings,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || 'Greska pri cuvanju ocene.');
        setSavingCourseId(null);
        return;
      }

      setSuccess(`Ocena za predmet "${course.naziv}" je uspesno sacuvana.`);
      await loadData();
    } catch {
      setError('Greska pri cuvanju ocene.');
      setSavingCourseId(null);
    } finally {
      setSavingCourseId(null);
    }
  }

  if (status === 'loading' || loading) {
    return <h1 className="text-center mt-20">Ucitavanje...</h1>;
  }

  if (status === 'unauthenticated' || user?.tip !== 'STUDENT') {
    return <h1 className="text-center mt-20">Preusmeravanje...</h1>;
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="STUDENT" />
      <main className="flex-1 p-8">
        <h1 className="mb-6 text-2xl font-semibold text-green-800">Ocena predmeta</h1>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-4 text-sm text-green-700">{success}</p>}

        {!data || data.items.length === 0 ? (
          <p className="text-gray-700">
            Nemate položenih predmeta koje možete oceniti.
          </p>
        ) : (
          <div className="space-y-5">
            {data.items.map(course => (
              <Card key={course.kursId} className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700">{course.naziv}</CardTitle>
                  <p className="text-sm text-gray-600">
                    Akademska godina: {course.akademskaGodina} | Ispitna ocena: {course.examGrade} | Datum polaganja:{' '}
                    {new Date(course.datumPolaganja).toLocaleDateString('sr-RS')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {PARAMETER_FIELDS.map(field => (
                      <div key={field.key} className="space-y-2">
                        <Label>{field.label}</Label>
                        <Select
                          value={String(drafts[course.kursId]?.[field.key] ?? 3)}
                          onValueChange={value => setRating(course.kursId, field.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveRatings(course)}
                      disabled={savingCourseId !== null}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {savingCourseId === course.kursId ? 'Cuvanje...' : 'Sacuvaj ocenu'}
                    </Button>
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
