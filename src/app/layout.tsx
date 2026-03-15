'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import NoteButton from "@/components/NoteButton";
import HistoryAutoSave from "@/components/HistoryAutoSave";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <HistoryAutoSave />
        <div className="fixed top-6 right-6 z-50 flex gap-3 items-center">
          <LanguageSwitcher />
          <NoteButton />
        </div>
        <main className="min-h-screen bg-white">
          {children}
        </main>
      </body>
    </html>
  );
}
