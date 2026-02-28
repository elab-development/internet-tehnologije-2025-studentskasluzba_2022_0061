'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import { Sidebar } from '@/app/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Fakultet = {
    id: number;
    naziv: string;
};

//pretpostavlja se da nova godina uvek pocinje u oktobru
function vratiAkademskuGodinu(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (month >= 9 && month <= 11) {
        return `${year}/${year + 1}`;
    }

    return `${year - 1}/${year}`;
}

export default function NoviPeriodPage() {
    const { user, status } = useAuthState();
    const router = useRouter();

    const [fakulteti, setFakulteti] = useState<Fakultet[]>([]);
    const [loadingFakulteti, setLoadingFakulteti] = useState(true);

    const [form, setForm] = useState({
        fakultetId: '',
        nivoStudija: '',
        pocetakPerioda: '',
        krajPerioda: '',
    });

    const [error, setError] = useState('');

    const akademskaGodina = useMemo(() => vratiAkademskuGodinu(), []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            if (user?.tip !== 'ADMINISTRATOR') {
                router.replace('/');
                return;
            }
            loadFakulteti();
        }
    }, [status, user]);

    async function loadFakulteti() {
        const res = await fetch('/api/fakulteti', {
            credentials: 'include',
        });
        const data = await res.json();
        setFakulteti(data.fakulteti || []);
        setLoadingFakulteti(false);
    }

    function validate(): string | null {
        if (
            !form.fakultetId ||
            !form.nivoStudija ||
            !form.pocetakPerioda ||
            !form.krajPerioda
        ) {
            return 'Sva polja su obavezna.';
        }

        const now = new Date();
        const start = new Date(form.pocetakPerioda);
        const end = new Date(form.krajPerioda);

        if (start <= now) {
            return 'Datum početka mora biti u budućnosti.';
        }

        if (end <= start) {
            return 'Datum kraja mora biti nakon početka.';
        }

        const diffDays =
            (end.getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24);

        if (diffDays < 3) {
            return 'Period mora trajati najmanje 3 dana.';
        }

        return null;
    }

    const validationError = validate();
    const isFormValid = !validationError;

    useEffect(() => {
        setError(validationError || '');
    }, [form]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isFormValid) return;

        // interpret datetime-local as local time
        const startLocal = new Date(form.pocetakPerioda);
        const endLocal = new Date(form.krajPerioda);

        const res = await fetch('/api/admin/periodi-prijava/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                fakultetId: Number(form.fakultetId),
                nivoStudija: form.nivoStudija,
                akademskaGodina,
                pocetakPerioda: startLocal.toISOString(),
                krajPerioda: endLocal.toISOString(),
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error || 'Greška prilikom kreiranja.');
            return;
        }

        router.replace('/admin/periodi-prijava');
    }

    if (status === 'loading' || loadingFakulteti) {
        return <h1 className="text-center mt-20">Učitavanje...</h1>;
    }

    if (status === 'unauthenticated') {
        return <h1 className="text-center mt-20">Preusmeravanje...</h1>;
    }

    return (
        <div className="min-h-screen flex bg-green-50">
            <Sidebar role={user!.tip} />

            <main className="flex-1 p-8">
                <Card className="max-w-xl border-green-200">
                    <CardHeader>
                        <CardTitle className="text-green-700">
                            Novi period biranja
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Fakultet
                                </label>
                                <Select
                                    onValueChange={value =>
                                        setForm({ ...form, fakultetId: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Izaberi fakultet" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fakulteti.map(f => (
                                            <SelectItem key={f.id} value={f.id.toString()}>
                                                {f.naziv}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Nivo studija
                                </label>
                                <Select
                                    onValueChange={value =>
                                        setForm({ ...form, nivoStudija: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Izaberi nivo studija" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OSNOVNE">
                                            Osnovne studije
                                        </SelectItem>
                                        <SelectItem value="MASTER">
                                            Master studije
                                        </SelectItem>
                                        <SelectItem value="DOKTORSKE">
                                            Doktorske studije
                                        </SelectItem>
                                        <SelectItem value="SPECIJALISTIČKE">
                                            Specijalističke studije
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Akademska godina
                                </label>
                                <div className="border rounded px-3 py-2 bg-gray-100 text-gray-700">
                                    {akademskaGodina}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Datum početka
                                </label>
                                <input
                                    type="datetime-local"
                                    className={`w-full border rounded px-3 py-2 ${form.pocetakPerioda &&
                                            new Date(form.pocetakPerioda) <= new Date()
                                            ? 'border-red-500'
                                            : ''
                                        }`}
                                    onChange={e =>
                                        setForm({ ...form, pocetakPerioda: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Datum kraja
                                </label>
                                <input
                                    type="datetime-local"
                                    className={`w-full border rounded px-3 py-2 ${form.krajPerioda &&
                                            form.pocetakPerioda &&
                                            new Date(form.krajPerioda) <=
                                            new Date(form.pocetakPerioda)
                                            ? 'border-red-500'
                                            : ''
                                        }`}
                                    onChange={e =>
                                        setForm({ ...form, krajPerioda: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-red-600 text-sm">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={!isFormValid}
                                className={`px-4 py-2 rounded text-white ${isFormValid
                                        ? 'bg-green-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Kreiraj period
                            </button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}