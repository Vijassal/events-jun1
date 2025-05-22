'use client'

import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function UserBar() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  // Only render null after all hooks have been called
  if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/login')) return null;

  return (
    <div className="fixed top-4 right-8 z-50" ref={ref}>
      <button
        className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 shadow border border-neutral-700 text-white hover:bg-neutral-700 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile"
      >
        <FiUser size={22} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-3 px-4 flex flex-col items-start animate-fade-in">
          <span className="font-semibold text-neutral-900 text-base mb-1">Vishal Jassal</span>
          <span className="text-xs text-neutral-500 mb-3">@vishaljassal</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 mt-2 px-3 py-2 rounded-md text-red-600 hover:bg-red-50 transition-colors font-medium w-full"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
} 