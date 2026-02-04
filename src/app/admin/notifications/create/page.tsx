// app/admin/notifications/create/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import { Sidebar } from '../../../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type NotificationGroup = {
  id: number;
  nivoStudija: string;
  fakultet: { naziv: string };
};

export default function CreateNotificationPage() {
  const { user, status } = useAuthState();
  const router = useRouter();

  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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
      loadGroups();
    }
  }, [status, user]);

  async function loadGroups() {
    const res = await fetch('/api/notifications/groups', { credentials: 'include' });
    const data = await res.json();
    setGroups(data.groups || []);
    if (data.groups?.length > 0) {
      setSelectedGroup(data.groups[0].id.toString());
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!selectedGroup || !title.trim() || !content.trim() || submitting) return;

    setSubmitting(true);

    const res = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        grupaNotifikacijaId: parseInt(selectedGroup),
        naslov: title,
        sadrzaj: content,
      }),
    });

    if (res.ok) {
      router.push('/home');
    } else {
      alert('Greška pri kreiranju obaveštenja');
      setSubmitting(false);
    }
  }

  if (status === 'loading' || loading) {
    return <h1 className="text-center mt-20">Učitavanje...</h1>;
  }

  if (status === 'unauthenticated' || user?.tip !== 'ADMINISTRATOR') {
    return <h1 className="text-center mt-20">Preusmeravanje...</h1>;
  }

  const levelLabels: Record<string, string> = {
    OSNOVNE: 'Osnovne studije',
    MASTER: 'Master studije',
    DOKTORSKE: 'Doktorske studije',
    SPECIJALISTIČKE: 'Specijalističke studije',
  };

  const isValid = selectedGroup && title.trim() && content.trim();

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role="ADMINISTRATOR" />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-green-800 mb-6">
          Kreiraj novo obaveštenje
        </h1>

        <Card className="max-w-2xl border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Detalji obaveštenja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Grupa notifikacija</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.fakultet.naziv} - {levelLabels[group.nivoStudija]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Naslov</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Unesite naslov obaveštenja"
              />
            </div>

            <div className="space-y-2">
              <Label>Sadržaj</Label>
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Unesite sadržaj obaveštenja"
                rows={8}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Kreiranje...' : 'Kreiraj obaveštenje'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/home')}
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