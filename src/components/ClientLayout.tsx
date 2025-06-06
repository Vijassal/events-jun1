'use client';

import UserBar from './UserBar';
import Sidebar from './Sidebar';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FeatureToggleProvider } from '../context/FeatureToggleContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  if (!session) {
    // Not signed in: don't render sidebar or user bar
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <FeatureToggleProvider>
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div
          style={{
            marginLeft: sidebarOpen ? 240 : 64, // 60*4=240px, 16*4=64px
            transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
            width: `calc(100vw - ${sidebarOpen ? 240 : 64}px)`,
            minHeight: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <UserBar />
          <main style={{ height: '100vh', overflow: 'hidden' }}>
            {children}
          </main>
        </div>
      </div>
    </FeatureToggleProvider>
  );
} 