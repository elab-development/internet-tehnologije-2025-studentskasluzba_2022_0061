'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { useAuthState } from '@/hooks/useAuthState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from './components/SearchableSelect';

type SubjectOption = {
  izvodjenjeKursaId: number;
  naziv: string;
  espb: number;
  akademskaGodina: string;
  fakultet: string;
};

type RealizationOption = {
  id: number;
  naziv: string;
  akademskaGodina: string;
  pocetakRoka: string;
  krajRoka: string;
};

type ImportResult = {
  processedRows: number;
  updatedRows: number;
  invalidRows: { rowNumber: number; reason: string }[];
  missingStudents: string[];
  missingPrijava: string[];
};

export default function UpisOcenaPage() {
  const { user, status } = useAuthState();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [realizations, setRealizations] = useState<RealizationOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedRealizationId, setSelectedRealizationId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);

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
      const timer = setTimeout(() => {
        void loadOptions();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [status, user]);

  const selectedRealization = useMemo(
    () => realizations.find(item => item.id.toString() === selectedRealizationId) ?? null,
    [realizations, selectedRealizationId]
  );

  const subjectOptions = useMemo(
    () =>
      subjects.map(subject => ({
        value: subject.izvodjenjeKursaId.toString(),
        label: `${subject.naziv} | ${subject.akademskaGodina} | ${subject.fakultet} | ${subject.espb} ESPB`,
      })),
    [subjects]
  );

  useEffect(() => {
    if (subjects.length === 0) {
      setSelectedSubjectId('');
      return;
    }

    setSelectedSubjectId(current => {
      if (subjects.some(subject => subject.izvodjenjeKursaId.toString() === current)) {
        return current;
      }

      return subjects[0].izvodjenjeKursaId.toString();
    });
  }, [subjects]);

  async function loadOptions() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/upis-ocena', { credentials: 'include' });
      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || 'Greska pri ucitavanju opcija.');
        setLoading(false);
        return;
      }

      const loaded = payload.realizations as RealizationOption[];
      setRealizations(loaded);
      setSubjects((payload.subjects ?? []) as SubjectOption[]);
      setSelectedRealizationId(loaded[0]?.id?.toString() ?? '');
    } catch {
      setError('Greska pri ucitavanju opcija.');
    } finally {
      setLoading(false);
    }
  }

  function onFileSelected(nextFile: File | null) {
    setError('');
    setSuccess('');
    setResult(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    const extension = nextFile.name.toLowerCase().split('.').pop() ?? '';
    if (!['csv', 'xls', 'xlsx'].includes(extension)) {
      setError('Dozvoljene su samo CSV/XLS/XLSX datoteke.');
      setFile(null);
      return;
    }

    setFile(nextFile);
  }

  async function handleSubmit() {
    if (!selectedRealizationId || !selectedSubjectId || !file || submitting) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    setResult(null);

    const formData = new FormData();
    formData.append('realizationId', selectedRealizationId);
    formData.append('izvodjenjeKursaId', selectedSubjectId);
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upis-ocena', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || 'Greska pri upisu ocena.');
        setSubmitting(false);
        return;
      }

      setResult(payload as ImportResult);
      setSuccess('Datoteka je obradjena. Rezultat je prikazan ispod.');
    } catch {
      setError('Greska pri upisu ocena.');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || loading) {
    return <h1 className="mt-20 text-center">Ucitavanje...</h1>;
  }

  if (status === 'unauthenticated' || user?.tip !== 'ADMINISTRATOR') {
    return <h1 className="mt-20 text-center">Preusmeravanje...</h1>;
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="ADMINISTRATOR" />

      <main className="flex-1 p-8">
        <h1 className="mb-6 text-2xl font-semibold text-green-800">Upis ocena</h1>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Masovni unos iz datoteke</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {realizations.length === 0 ? (
              <p className="text-sm text-gray-700">
                Trenutno nema aktivnih realizacija ispitnog roka.
              </p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Aktivna realizacija ispitnog roka</Label>
                    <Select value={selectedRealizationId} onValueChange={setSelectedRealizationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberi realizaciju" />
                      </SelectTrigger>
                      <SelectContent>
                        {realizations.map(realization => (
                          <SelectItem key={realization.id} value={realization.id.toString()}>
                            {realization.naziv} ({realization.akademskaGodina})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <SearchableSelect
                    label="Predmet (izvodjenje)"
                    placeholder="Izaberi predmet"
                    searchPlaceholder="Pretrazi predmete..."
                    value={selectedSubjectId}
                    query={subjectQuery}
                    onQueryChange={setSubjectQuery}
                    onValueChange={setSelectedSubjectId}
                    options={subjectOptions}
                    emptyMessage="Nema predmeta za zadatu pretragu."
                  />
                </div>

                {selectedRealization && (
                  <p className="text-sm text-gray-600">
                    Aktivna realizacija: {selectedRealization.naziv} ({selectedRealization.akademskaGodina}) traje do{' '}
                    {new Date(selectedRealization.krajRoka).toLocaleString('sr-RS')}.
                  </p>
                )}

                <div
                  onDragOver={event => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={event => {
                    event.preventDefault();
                    setDragActive(false);
                    onFileSelected(event.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`rounded-lg border-2 border-dashed p-6 text-center ${
                    dragActive ? 'border-green-600 bg-green-100' : 'border-green-300 bg-green-50'
                  }`}
                >
                  <p className="text-sm text-gray-700">
                    Prevucite CSV/XLS/XLSX datoteku ovde ili izaberite fajl.
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={event => onFileSelected(event.target.files?.[0] ?? null)}
                    className="mt-3"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    Ocekivani format reda: broj indeksa, poeni, ocena
                  </p>
                  {file && (
                    <p className="mt-2 text-sm text-green-700">
                      Izabrana datoteka: {file.name}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!selectedRealizationId || !selectedSubjectId || !file || submitting}
                  className="bg-green-700 hover:bg-green-800"
                >
                  {submitting ? 'Obrada...' : 'Obradi i upisi ocene'}
                </Button>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-700">{success}</p>}
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">Rezultat obrade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <p>Procitano redova: <strong>{result.processedRows}</strong></p>
                <p>Azurirano prijava: <strong>{result.updatedRows}</strong></p>
                <p>Nepostojeci studenti: <strong>{result.missingStudents.length}</strong></p>
                <p>Bez prijave: <strong>{result.missingPrijava.length}</strong></p>
              </div>

              {result.invalidRows.length > 0 && (
                <div>
                  <p className="font-medium text-red-700">Nevalidni redovi:</p>
                  <ul className="mt-2 list-disc pl-5 text-red-700">
                    {result.invalidRows.slice(0, 20).map(item => (
                      <li key={`${item.rowNumber}-${item.reason}`}>
                        Red {item.rowNumber}: {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.missingStudents.length > 0 && (
                <div>
                  <p className="font-medium text-amber-700">Brojevi indeksa koji ne postoje:</p>
                  <p className="mt-1 text-amber-700">{result.missingStudents.join(', ')}</p>
                </div>
              )}

              {result.missingPrijava.length > 0 && (
                <div>
                  <p className="font-medium text-amber-700">Studenti bez prijave za izabrani rok/predmet:</p>
                  <p className="mt-1 text-amber-700">{result.missingPrijava.join(', ')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
