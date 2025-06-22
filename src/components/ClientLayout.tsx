'use client';

import UserBar from './UserBar';
import Sidebar from './Sidebar';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FeatureToggleProvider } from '../context/FeatureToggleContext';
import Link from 'next/link';

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
    // Not signed in: show minimal navigation bar
    return (
      <div className="min-h-screen">
        {/* Minimal navigation bar for unauthenticated users */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/auth/login" className="text-xl font-bold text-amber-600">
                  Events Planning
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/auth/login" 
                  className="text-gray-700 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/register" 
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
      </div>
    );
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
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <UserBar />
          <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            {children}
          </main>
        </div>
      </div>
    </FeatureToggleProvider>
  );
} 