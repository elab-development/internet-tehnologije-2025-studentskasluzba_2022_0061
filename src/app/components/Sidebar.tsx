'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

type Props = {
  role: 'STUDENT' | 'ADMINISTRATOR';
};

export function Sidebar({ role }: any) {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    router.replace('/login');
  }

  return (
    <>
      <aside className="w-64 bg-green-700 text-white flex flex-col p-4 h-screen sticky top-0">
        <div className="text-xl font-semibold mb-6">
          {role === 'ADMINISTRATOR' ? 'Administrator' : 'Student'}ski Servisi
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto">
          <Link
            href="/home"
            className="block rounded px-3 py-2 hover:bg-green-600"
          >
            Početna 
          </Link>
          
          {role === 'ADMINISTRATOR' && (
            <>
              <Link
                href="/admin/notifications/create"
                className="block rounded px-3 py-2 hover:bg-green-600"
              >
                Dodaj obaveštenje
              </Link>
              <Link
                href="/admin/molbe"
                className="block rounded px-3 py-2 hover:bg-green-600"
              >
                Molbe
              </Link>
            </>
          )}
          
          {role === 'STUDENT' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between rounded px-3 py-2 hover:bg-green-600">
                  Molbe
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-green-600 text-white border-green-500">
                <DropdownMenuItem asChild>
                  <Link href="/student/molbe" className="cursor-pointer">
                    Moje molbe
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/student/molbe/nova" className="cursor-pointer">
                    Nova molba
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
        <Button
          variant="ghost"
          className="justify-start text-white hover:bg-green-600 mt-4"
          onClick={() => setShowLogoutConfirm(true)}
        >
          Odjava
        </Button>
      </aside>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogout}
        title="Potvrda odjave"
        description="Da li ste sigurni da želite da se odjavite?"
      />
    </>
  );
}