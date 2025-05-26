'use client'

import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function UserBar() {
  const router = useRouter();
  const pathname = usePathname();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };
  // Only render null after all hooks have been called
  if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/login')) return null;
  return null;
} 