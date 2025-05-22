'use client';

import { SessionProvider } from 'next-auth/react';
import UserBar from './UserBar';
import Sidebar from './Sidebar';
import React from 'react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  return (
    <SessionProvider>
      <div className="flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className={sidebarOpen ? 'ml-60 flex-1' : 'ml-16 flex-1'}>
          <UserBar />
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
} 