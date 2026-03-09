'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sidebar } from '@/app/components/Sidebar';
import { useAuthState } from '@/hooks/useAuthState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AnalyticsItem = {
  level: string;
  label: string;
  count: number;
};

type AnalyticsResponse = {
  totalStudents: number;
  items: AnalyticsItem[];
};

const COLORS = ['#16a34a', '#0284c7', '#ea580c', '#7c3aed'];

export default function AnalitikaPage() {
  const { user, status } = useAuthState();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<AnalyticsResponse | null>(null);

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
        void loadAnalytics();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [status, user]);

  async function loadAnalytics() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/analitika/nivoi', {
        credentials: 'include',
      });
      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || 'Greska pri ucitavanju analitike.');
        setLoading(false);
        return;
      }

      setData(payload as AnalyticsResponse);
    } catch {
      setError('Greska pri ucitavanju analitike.');
    } finally {
      setLoading(false);
    }
  }

  const chartData = useMemo(
    () =>
      (data?.items ?? [])
        .filter(item => item.count > 0)
        .map(item => ({
          name: item.label,
          value: item.count,
        })),
    [data]
  );

  if (status === 'loading' || loading) {
    return <h1 className="mt-20 text-center">Ucitavanje...</h1>;
  }

  if (status === 'unauthenticated' || user?.tip !== 'ADMINISTRATOR') {
    return <h1 className="mt-20 text-center">Preusmeravanje...</h1>;
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="ADMINISTRATOR" />

      <main className="flex-1 p-8 space-y-6">
        <h1 className="text-2xl font-semibold text-green-800">Analitika</h1>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">
              Studenti po nivou studija
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Ukupan broj studenata sa evidentiranim upisom: <strong>{data?.totalStudents ?? 0}</strong>
            </p>

            {chartData.length === 0 ? (
              <p className="text-sm text-gray-600">
                Nema podataka za prikaz grafikona.
              </p>
            ) : (
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {(data?.items ?? []).map(item => (
                <div key={item.level} className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm">
                  <p className="text-gray-700">{item.label}</p>
                  <p className="font-semibold text-green-800">{item.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
