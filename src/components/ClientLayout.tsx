'use client';

import { SessionProvider } from 'next-auth/react';
import UserBar from './UserBar';

export default function ClientLayout({ children, session }: { children: React.ReactNode, session: any }) {
  return (
    <SessionProvider session={session}>
      <UserBar />
      <main className="min-h-screen">{children}</main>
    </SessionProvider>
  );
} 