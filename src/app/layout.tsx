import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
/**
 * Load Inter font from Google Fonts
 * Optimized by Next.js
 */
const inter = Inter({ subsets: ["latin"] });

/**
 * Metadata for SEO and browser tabs
 */
export const metadata: Metadata = {
  title: "FON Portal",
  description: "Studentski portal Fakulteta Organizacionih Nauka",
};

/**
 * Root layout wraps all pages
 * Shared across entire app
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body className={inter.className}>
        {/* Wrap app in session provider so useSession() works */}
        {children}
      </body>
    </html>
  );
}