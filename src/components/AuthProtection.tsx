'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthProtection({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session and not on auth pages, redirect to login
      if (!session && !pathname.startsWith('/auth/')) {
        router.replace('/auth/login');
        return;
      }

      // If has session and on auth pages, redirect to dashboard
      if (session && pathname.startsWith('/auth/')) {
        router.replace('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !pathname.startsWith('/auth/')) {
        router.replace('/auth/login');
      } else if (session && pathname.startsWith('/auth/')) {
        router.replace('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return <>{children}</>;
} 