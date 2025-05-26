'use client'

import React, { useState, useRef, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiHome, FiCalendar, FiLogOut, FiUser, FiSettings, FiUserPlus, FiMap, FiCheckSquare, FiDollarSign, FiBriefcase, FiImage } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinksTop = [
  { name: 'Dashboard', href: '/dashboard', icon: <FiHome size={20} /> },
  { name: 'Events', href: '/events', icon: <FiCalendar size={20} /> },
  { name: 'Settings', href: '/settings', icon: <FiSettings size={20} /> },
];

const baseSections = [
  { name: 'Invite', href: '/invite', icon: FiUserPlus },
  { name: 'Plan', href: '/plan', icon: FiMap },
  { name: 'Tasks', href: '/tasks', icon: FiCheckSquare },
  { name: 'Budget', href: '/budget', icon: FiDollarSign },
  { name: 'Vendors', href: '/vendors', icon: FiBriefcase },
  { name: 'Gallery', href: '/gallery', icon: FiImage },
];

export default function Sidebar({ open: controlledOpen, setOpen: controlledSetOpen }: { open?: boolean, setOpen?: (open: boolean) => void } = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(true);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setUncontrolledOpen;
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [religionEnabled, setReligionEnabled] = useState(true);
  const [floorplanEnabled, setFloorplanEnabled] = useState(true);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  // Fetch settings from API on mount and on featureToggleChanged event
  useEffect(() => {
    const fetchSettings = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          setReligionEnabled(data.religion_enabled);
          setFloorplanEnabled(data.floorplan_enabled);
        });
    };
    fetchSettings();
    window.addEventListener('featureToggleChanged', fetchSettings);
    return () => window.removeEventListener('featureToggleChanged', fetchSettings);
  }, []);

  const sections = [
    ...baseSections,
    ...(religionEnabled ? [{ name: 'Religion', href: '/religion', icon: FiUser }] : []),
    ...(floorplanEnabled ? [{ name: 'Floorplan', href: '/floorplan', icon: FiMap }] : []),
  ];

  // Add this to force re-render on featureToggleChanged event
  const [_, setRerender] = useState(0);
  useEffect(() => {
    const handler = () => setRerender(x => x + 1);
    window.addEventListener('featureToggleChanged', handler);
    return () => window.removeEventListener('featureToggleChanged', handler);
  }, []);

  return (
    <aside
      className={`h-screen fixed left-0 top-0 z-40 flex flex-col justify-between transition-all duration-300 bg-neutral-900 border-r border-neutral-800
        ${open ? 'w-60' : 'w-16'}
      `}
    >
      {/* Toggle button at the very top */}
      <div className="flex flex-col items-center pt-4 pb-2 px-4 gap-2">
        <button
          className="flex items-center justify-center w-8 h-8 rounded-md bg-neutral-700 hover:bg-neutral-600 text-white transition mb-2"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {/* Sidebar icon: square with a vertical bar on the left (open) or right (closed) */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="14" height="14" rx="3" fill="#fff" fillOpacity="0.5" />
            {open ? (
              <rect x="3" y="3" width="5" height="14" rx="2" fill="#555" />
            ) : (
              <rect x="12" y="3" width="5" height="14" rx="2" fill="#555" />
            )}
          </svg>
        </button>
        {/* Divider above icons */}
        <div className="w-full flex justify-center">
          <div className="mt-2 mb-4 w-10/12 border-t-2 border-neutral-700" style={{ borderTopWidth: '1.5px' }} />
        </div>
        {/* Top nav buttons in a row */}
        <div className="flex flex-row gap-10 w-full justify-center">
          {navLinksTop
            .filter((link, idx) => open || idx === 0) // Only show dashboard (first) when closed
            .map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative flex items-center justify-center w-9 h-9 rounded-md transition-colors
                    ${isActive ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}`}
                >
                  {link.icon}
                  {/* Tooltip on hover */}
                  <span className="absolute left-1/2 -translate-x-1/2 top-10 whitespace-nowrap bg-neutral-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {link.name}
                  </span>
                </Link>
              );
            })}
        </div>
        {/* Divider below icons */}
        <div className="w-full flex justify-center">
          <div className="mt-4 mb-2 w-10/12 border-t-2 border-neutral-700" style={{ borderTopWidth: '1.5px' }} />
        </div>
        {/* Page Sections Buttons */}
        <div className="flex flex-col items-center w-full mt-8 gap-2">
          {sections.map((section) => {
            const Icon = section.icon as React.ComponentType<{ size?: number }>;
            return open ? (
              <div key={section.name} className="relative flex items-center w-full" style={{ marginBottom: '4px' }}>
                <Link
                  href={section.href}
                  className="flex-1 text-center py-2 rounded-md border border-neutral-700/60 text-neutral-200 hover:bg-neutral-800 transition-colors text-sm"
                  style={{ marginRight: '36px' }}
                >
                  {section.name}
                </Link>
                <span className="absolute right-0 flex items-center text-neutral-200">
                  <Icon size={20} />
                </span>
              </div>
            ) : (
              <Link
                key={section.name}
                href={section.href}
                className="group flex items-center justify-center w-9 h-9 rounded-md border border-neutral-700/60 text-neutral-200 hover:bg-neutral-800 transition-colors text-sm relative"
                style={{ marginBottom: '4px' }}
              >
                <span className="text-neutral-200"><Icon size={20} /></span>
                <span className="absolute left-full ml-2 whitespace-nowrap bg-neutral-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {section.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Center section: Events */}
      {/* Bottom section: Logout and Collapse */}
      <div className="flex flex-col items-center mb-4 gap-2">
        <ul className="w-full">
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 rounded-md transition-colors group text-red-600 hover:bg-red-50 font-medium w-full justify-center"
            >
              <FiLogOut size={20} />
              {open && <span className="text-sm">Logout</span>}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
} 