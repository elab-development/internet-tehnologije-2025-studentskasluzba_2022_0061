'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { useAuthState } from '@/hooks/useAuthState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

type CourseItem = {
  id: number;
  semestar: number;
  izborni: boolean;
  godinaStudija: number;
  izborniBlok: {
    id: number;
    semestar: number;
    ukupnoIzbornih: number;
    potrebnoBirati: number;
  } | null;
  course: {
    id: number;
    naziv: string;
    opis: string | null;
    espb: number;
  };
};

type PredmetiResponse = {
  activePeriod: boolean;
  activePeriodEnd: string | null;
  enrollment: {
    akademskaGodina: string;
    godinaStudija: number;
    nivoStudija: string;
    smer: string;
    program: string;
    modul: string;
    fakultet: string;
  };
  courses: CourseItem[];
  selectedCourseIds: number[];
};

function semesterLabel(semestar: number) {
  if (semestar === 1) return 'Prvi semestar';
  if (semestar === 2) return 'Drugi semestar';
  return `Semestar ${semestar}`;
}

function studyLevelLabel(level: string) {
  const labels: Record<string, string> = {
    OSNOVNE: 'Osnovne studije',
    MASTER: 'Master studije',
    DOKTORSKE: 'Doktorske studije',
    SPECIJALISTICKE: 'Specijalisticke studije',
    'SPECIJALISTIÄŒKE': 'Specijalisticke studije',
  };

  return labels[level] ?? level;
}

export function PredmetiClient() {
  const { user, status } = useAuthState();
  const router = useRouter();

  const [data, setData] = useState<PredmetiResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

      loadPredmeti();
    }
  }, [status, user, router]);

  async function loadPredmeti() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/student/predmeti', {
        credentials: 'include',
      });

      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || 'Greska pri ucitavanju predmeta.');
        setLoading(false);
        return;
      }

      setData(payload);

      setSelectedIds(payload.selectedCourseIds);
    } catch {
      setError('Greska pri ucitavanju predmeta.');
    } finally {
      setLoading(false);
    }
  }

  const courseMap = useMemo(
    () => new Map((data?.courses ?? []).map(course => [course.id, course])),
    [data]
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const totalEspb = useMemo(
    () =>
      selectedIds.reduce((sum, id) => {
        const course = courseMap.get(id);
        return sum + (course?.course.espb ?? 0);
      }, 0),
    [selectedIds, courseMap]
  );

  const groupedBySemester = useMemo(() => {
    const semesters = new Map<number, CourseItem[]>();

    for (const course of data?.courses ?? []) {
      const items = semesters.get(course.semestar) ?? [];
      items.push(course);
      semesters.set(course.semestar, items);
    }

    return [...semesters.entries()].sort((left, right) => left[0] - right[0]);
  }, [data]);

  const blockStatus = useMemo(() => {
    const blocks = new Map<number, { potrebnoBirati: number; izabrano: number }>();

    for (const course of data?.courses ?? []) {
      if (!course.izborni || !course.izborniBlok) continue;

      const existing = blocks.get(course.izborniBlok.id);
      const nextSelected = selectedSet.has(course.id) ? 1 : 0;

      if (existing) {
        existing.izabrano += nextSelected;
        continue;
      }

      blocks.set(course.izborniBlok.id, {
        potrebnoBirati: course.izborniBlok.potrebnoBirati,
        izabrano: nextSelected,
      });
    }

    return blocks;
  }, [data, selectedSet]);

  const invalidBlock = useMemo(
    () =>
      [...blockStatus.values()].find(
        block => block.izabrano > block.potrebnoBirati
      ) ?? null,
    [blockStatus]
  );

  const canEdit = !!data?.activePeriod;
  const canSave = canEdit && !saving && totalEspb >= 30 && totalEspb <= 60 && !invalidBlock;

  function toggleCourse(course: CourseItem, checked: boolean) {
    setSuccess('');
    setError('');

    const current = new Set(selectedIds);

    if (checked) {
      if (course.izborniBlok) {
        const blockCourses = (data?.courses ?? []).filter(
          item => item.izborniBlok?.id === course.izborniBlok?.id
        );
        const selectedInBlock = blockCourses.filter(item => current.has(item.id)).length;

        if (selectedInBlock >= course.izborniBlok.potrebnoBirati) {
          setError(`U ovom izbornom bloku mozete izabrati najvise ${course.izborniBlok.potrebnoBirati} predmeta.`);
          return;
        }
      }

      current.add(course.id);
    } else {
      current.delete(course.id);
    }

    setSelectedIds([...current]);
  }

  async function saveSelection() {
    if (!canSave) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/student/predmeti', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ selectedCourseIds: selectedIds }),
      });

      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || 'Greska pri cuvanju izbora.');
        setSaving(false);
        return;
      }

      setSelectedIds(payload.savedCourseIds);
      setSuccess('Izabrani predmeti su uspesno sacuvani.');
    } catch {
      setError('Greska pri cuvanju izbora.');
    } finally {
      setSaving(false);
    }
  }

  function renderCourseCard(course: CourseItem) {
    const checked = selectedSet.has(course.id);
    const isMandatory = !course.izborni;

    return (
      <Card key={course.id} className="border-green-200">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-green-800">
                  {course.course.naziv}
                </h3>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  {course.course.espb} ESPB
                </Badge>
                {isMandatory ? (
                  <Badge variant="outline" className="border-green-300 text-green-800">
                    Obavezan predmet
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-300 text-amber-800">
                    Izborni predmet
                  </Badge>
                )}
              </div>

              {course.course.opis && (
                <p className="text-sm leading-6 text-gray-700">
                  {course.course.opis}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3">
              <Checkbox
                checked={checked}
                disabled={!canEdit || saving}
                onCheckedChange={value => toggleCourse(course, value === true)}
                className="border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white"
              />
              <span className="text-sm font-medium text-gray-700">
                {checked ? 'Izabran' : 'Nije izabran'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'loading' || loading) {
    return <h1 className="mt-20 text-center">Ucitavanje...</h1>;
  }

  if (status === 'unauthenticated') {
    return <h1 className="mt-20 text-center">Preusmeravanje...</h1>;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex bg-green-50">
        <Sidebar role="STUDENT" />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-semibold text-green-800">
            Biranje predmeta
          </h1>
          <p className="mt-4 text-red-600">{error || 'Podaci nisu dostupni.'}</p>
        </main>
      </div>
    );
  }

  if (!data.activePeriod) {
    return (
      <div className="min-h-screen flex bg-green-50">
        <Sidebar role="STUDENT" />
        <main className="flex-1 p-8">
            <h1 className="mb-6 text-2xl font-semibold text-green-800">
              Biranje predmeta
            </h1>
          <p className="text-gray-700">
            Biranje predmeta trenutno nije u toku.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="STUDENT" />

      <main className="flex-1 p-8">
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-green-800">
              Biranje predmeta
            </h1>
            <p className="mt-2 text-gray-700">
              {data.enrollment.smer} / {data.enrollment.modul} / {data.enrollment.godinaStudija}. godina
            </p>
            <p className="text-sm text-gray-600">
              {studyLevelLabel(data.enrollment.nivoStudija)} - {data.enrollment.akademskaGodina} - {data.enrollment.fakultet}
            </p>
          </div>

          <Card className="border-green-200">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">
                  Ukupno izabrano
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-3xl font-semibold text-green-800">
                    {totalEspb} ESPB
                  </span>
                  <Badge className={totalEspb >= 30 && totalEspb <= 60
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                    Dozvoljeni opseg: 30-60 ESPB
                  </Badge>
                </div>
                {data.activePeriod ? (
                  <p className="text-sm text-gray-600">
                    Period za biranje je aktivan. Predmete mozete menjati dok period ne istekne.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Period za biranje nije aktivan. Prikazani su trenutno sacuvani predmeti.
                  </p>
                )}
              </div>

              {canEdit && (
                <Button
                  onClick={saveSelection}
                  disabled={!canSave}
                  className="bg-green-700 hover:bg-green-800"
                >
                  {saving ? 'Cuvanje...' : 'Sacuvaj izbor'}
                </Button>
              )}
            </CardContent>
          </Card>

          {invalidBlock && (
            <p className="text-sm text-red-600">
              U jednom izbornom bloku mozete izabrati najvise {invalidBlock.potrebnoBirati} predmeta.
            </p>
          )}

          {(totalEspb < 30 || totalEspb > 60) && (
            <p className="text-sm text-red-600">
              Ukupan broj ESPB mora biti izmedju 30 i 60.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-700">{success}</p>
          )}
        </div>

        {groupedBySemester.length === 0 ? (
          <p className="text-gray-700">
            Za trenutni modul i godinu studija nema evidentiranih predmeta.
          </p>
        ) : (
          <div className="space-y-8">
            {groupedBySemester.map(([semestar, semesterCourses]) => {
              const mandatoryCourses = semesterCourses.filter(course => !course.izborni);
              const electiveCourses = semesterCourses.filter(course => course.izborni);
              const electiveBlocks = new Map<number, CourseItem[]>();
              const freeElectives: CourseItem[] = [];

              for (const course of electiveCourses) {
                if (!course.izborniBlok) {
                  freeElectives.push(course);
                  continue;
                }

                const items = electiveBlocks.get(course.izborniBlok.id) ?? [];
                items.push(course);
                electiveBlocks.set(course.izborniBlok.id, items);
              }

              return (
                <section key={semestar} className="space-y-5">
                  <div className="border-b border-green-200 pb-3">
                    <h2 className="text-xl font-semibold text-green-800">
                      {semesterLabel(semestar)}
                    </h2>
                  </div>

                  {mandatoryCourses.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                        Obavezni predmeti
                      </h3>
                      <div className="space-y-4">
                        {mandatoryCourses.map(renderCourseCard)}
                      </div>
                    </div>
                  )}

                  {[...electiveBlocks.entries()].map(([blockId, courses]) => {
                    const blockInfo = courses[0].izborniBlok!;
                    const selectedInBlock = courses.filter(course => selectedSet.has(course.id)).length;

                    return (
                      <div key={blockId} className="space-y-4">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="font-semibold text-amber-900">
                                Izborni blok
                              </h3>
                              <p className="text-sm text-amber-800">
                                Izabrati {blockInfo.potrebnoBirati} od ukupno {blockInfo.ukupnoIzbornih} ponudjenih predmeta.
                              </p>
                            </div>
                            <Badge className={selectedInBlock === blockInfo.potrebnoBirati
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : selectedInBlock < blockInfo.potrebnoBirati
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                              Izabrano {selectedInBlock} / najvise {blockInfo.potrebnoBirati}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {courses.map(renderCourseCard)}
                        </div>
                      </div>
                    );
                  })}

                  {freeElectives.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                        Ostali izborni predmeti
                      </h3>
                      <div className="space-y-4">
                        {freeElectives.map(renderCourseCard)}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
