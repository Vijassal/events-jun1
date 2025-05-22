'use client'

import React, { useState, useRef, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiHome, FiCalendar, FiLogOut, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinksCenter = [
  { name: 'Events', href: '/events', icon: <FiCalendar size={20} /> },
];
const navLinksBottom = [
  { name: 'Logout', href: '/auth/logout', icon: <FiLogOut size={20} /> },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  return (
    <aside
      className={`h-screen fixed left-0 top-0 z-40 flex flex-col justify-between transition-all duration-300 bg-neutral-900 border-r border-neutral-800
        ${open ? 'w-60' : 'w-16'}
      `}
    >
      {/* Top row: Dashboard (left), Profile (right) */}
      <div className="pt-4 pb-2 px-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 py-2 rounded-md transition-colors group
            ${pathname === '/dashboard' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}
            ${!open ? 'justify-center w-9 p-0' : 'px-0'}
          `}
        >
          <FiHome size={20} />
          {open && <span className="text-sm">Dashboard</span>}
        </Link>
        {/* Profile icon at top right of sidebar */}
        <div className="relative ml-2" ref={profileRef}>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur-md shadow border border-neutral-200 text-neutral-700 hover:bg-neutral-100 focus:outline-none"
            onClick={() => setProfileOpen((v) => !v)}
            aria-label="Profile"
          >
            <FiUser size={20} />
          </button>
          {profileOpen && (
            <div className={`absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-3 px-4 flex flex-col items-start animate-fade-in z-50 ${open ? '' : 'left-12 right-auto'}`}>
              <span className="font-semibold text-neutral-900 text-base mb-1">Vishal Jassal</span>
              <span className="text-xs text-neutral-500">@vishaljassal</span>
            </div>
          )}
        </div>
      </div>
      {/* Center section: Events */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <ul className="flex flex-col gap-1 w-full">
          {navLinksCenter.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors group
                    ${isActive ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}
                    ${!open ? 'justify-center px-2' : ''}
                    justify-center
                  `}
                >
                  {link.icon}
                  {open && <span className="text-sm">{link.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Bottom section: Logout and Collapse */}
      <div className="flex flex-col items-center mb-4 gap-2">
        <ul className="w-full">
          {navLinksBottom.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors group
                    ${isActive ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}
                    ${!open ? 'justify-center px-2' : ''}
                  `}
                >
                  {link.icon}
                  {open && <span className="text-sm">{link.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
} 