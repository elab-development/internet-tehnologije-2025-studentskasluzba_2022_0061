// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FON Portal',
  description: 'Portal Studentske Službe',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body className="flex flex-col min-h-screen">
        <div className="flex-1">
          {children}
        </div>
        <footer className="bg-green-800 text-white py-4 text-center text-sm sticky top-[100vh]">
          © {new Date().getFullYear()} Fakultet Organizacionih Nauka. Sva prava zadržana.
        </footer>
      </body>
    </html>
  );
}