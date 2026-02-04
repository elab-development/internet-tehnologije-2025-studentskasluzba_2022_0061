'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Notification = {
  id: number;
  naslov: string;
  sadrzaj: string;
  datumObjavljivanja: string;
};

type NotificationGroup = {
  id: number;
  nivoStudija: string;
  fakultet: { naziv: string };
  _count: { notifikacije: number };
};

export default function HomePage() {
  const { user, status } = useAuthState();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      loadData();
    }
  }, [status, user]);

  async function loadData() {
    setLoading(true);
    
    if (user!.tip === 'STUDENT') {
      const res = await fetch('/api/notifications/student', { credentials: 'include' });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } else {
      const res = await fetch('/api/notifications/groups', { credentials: 'include' });
      const data = await res.json();
      setGroups(data.groups || []);
      
      if (data.groups && data.groups.length > 0) {
        setSelectedGroup(data.groups[0].id.toString());
        loadNotificationsByGroup(data.groups[0].id.toString());
      }
    }
    
    setLoading(false);
  }

  async function loadNotificationsByGroup(groupId: string) {
    const res = await fetch(`/api/notifications/by-group?groupId=${groupId}`, { 
      credentials: 'include' 
    });
    const data = await res.json();
    setNotifications(data.notifications || []);
  }

  function handleGroupChange(groupId: string) {
    setSelectedGroup(groupId);
    loadNotificationsByGroup(groupId);
  }

  if (status === 'loading' || loading) {
    return <h1 className="text-center mt-20">Učitavanje...</h1>;
  }

  if (status === 'unauthenticated') {
    return <h1 className="text-center mt-20">Preusmeravanje...</h1>;
  }

  const levelLabels: Record<string, string> = {
    OSNOVNE: 'Osnovne studije',
    MASTER: 'Master studije',
    DOKTORSKE: 'Doktorske studije',
    SPECIJALISTIČKE: 'Specijalističke studije',
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <Sidebar role={user!.tip} />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-green-800 mb-4">
          Dobro došli, {user!.ime}.
        </h1>
        
        {user!.tip === 'ADMINISTRATOR' && groups.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grupa notifikacija
            </label>
            <Select value={selectedGroup} onValueChange={handleGroupChange}>
              <SelectTrigger className="w-96">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.fakultet.naziv} - {levelLabels[group.nivoStudija]} 
                    ({group._count.notifikacije})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-700">
            Obaveštenja
          </h2>
          
          {notifications.length === 0 ? (
            <p className="text-gray-600">Nema novih obaveštenja.</p>
          ) : (
            notifications.map(notif => (
              <Card key={notif.id} className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700 text-lg">
                    {notif.naslov}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(notif.datumObjavljivanja).toLocaleDateString('sr-RS')}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{notif.sadrzaj}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}