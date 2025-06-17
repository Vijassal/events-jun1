'use client'

import React, { useState, useRef, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiHome, FiCalendar, FiLogOut, FiUser, FiSettings, FiUserPlus, FiMap, FiCheckSquare, FiDollarSign, FiBriefcase, FiImage, FiMessageSquare } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';

const navLinksTop = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Events', href: '/events', icon: FiCalendar },
  { name: 'Vendors', href: '/vendors', icon: FiBriefcase },
];

const baseSections = [
  { name: 'Invite', href: '/invite', icon: FiUserPlus },
  { name: 'Plan', href: '/plan', icon: FiMap },
  { name: 'Chat', href: '/chat', icon: FiMessageSquare },
  { name: 'Budget', href: '/budget', icon: FiDollarSign },
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
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null);

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

  // Fetch the user's account_instance_id (owner first, then member)
  useEffect(() => {
    async function fetchAccountInstanceId() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      // Try to find an instance where the user is the owner
      let { data: ownedInstances } = await supabase
        .from('account_instances')
        .select('id')
        .eq('owner_user_id', userId)
        .limit(1);
      if (ownedInstances && ownedInstances.length > 0) {
        setAccountInstanceId(ownedInstances[0].id);
        return;
      }
      // Otherwise, find an instance where the user is a member
      let { data: memberships } = await supabase
        .from('account_instance_members')
        .select('account_instance_id')
        .eq('user_id', userId)
        .limit(1);
      if (memberships && memberships.length > 0) {
        setAccountInstanceId(memberships[0].account_instance_id);
      }
    }
    fetchAccountInstanceId();
  }, []);

  // Fetch settings for the current account_instance_id
  const fetchSettings = async (instanceId: string | null) => {
    if (!instanceId) return;
    const { data, error } = await supabase
      .from('settings')
      .select('religion_enabled, floorplan_enabled')
      .eq('account_instance_id', instanceId)
      .single<any>();
    setReligionEnabled(data?.religion_enabled ?? true);
    setFloorplanEnabled(data?.floorplan_enabled ?? true);
  };

  // Fetch settings on mount and when accountInstanceId changes
  useEffect(() => {
    if (accountInstanceId) {
      fetchSettings(accountInstanceId);
    }
  }, [accountInstanceId]);

  // Listen for featureToggleChanged event and re-fetch settings
  useEffect(() => {
    const handler = () => {
      if (accountInstanceId) fetchSettings(accountInstanceId);
    };
    window.addEventListener('featureToggleChanged', handler);
    return () => window.removeEventListener('featureToggleChanged', handler);
  }, [accountInstanceId]);

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

  const renderSectionLink = (section: typeof sections[number]) => {
    const Icon = section.icon as React.ComponentType<{ size?: number }>; 
    const isActive = pathname === section.href;
    if (open) {
      return (
        <div className="relative flex items-center w-full mb-1 h-12" key={section.name}>
          <Link
            href={section.href}
            className={`flex-1 w-full h-full flex items-center justify-center rounded-md border border-transparent transition-colors text-sm font-medium pl-4 pr-12
              ${isActive ? 'bg-gray-100 text-black font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}
          >
            <span className="text-sm">{section.name}</span>
          </Link>
          <span className={`absolute right-6 top-1/2 -translate-y-1/2 flex items-center ${isActive ? 'text-black' : 'text-gray-600'}`}>
            <Icon size={20} />
          </span>
        </div>
      );
    }
    return (
      <Link
        key={section.name}
        href={section.href}
        className={`group relative flex items-center justify-center w-10 h-10 rounded-md transition-colors mb-1
          ${isActive ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}
      >
        <Icon size={20} />
        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 z-50">
          {section.name}
        </span>
      </Link>
    );
  };

  return (
    <aside
      className={`h-screen fixed left-0 top-0 z-40 flex flex-col justify-between transition-all duration-300 bg-white border-r border-gray-200
        ${open ? 'w-60' : 'w-16'}
      `}
    >
      {/* Toggle button at the very top */}
      <div className="flex flex-col items-center pt-4 pb-2 px-4 gap-2">
        <button
          className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 text-black transition mb-2"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {/* Sidebar icon: square with a vertical bar on the left (open) or right (closed) */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="14" height="14" rx="3" fill="#000" fillOpacity="0.5" />
            {open ? (
              <rect x="3" y="3" width="5" height="14" rx="2" fill="#000" />
            ) : (
              <rect x="12" y="3" width="5" height="14" rx="2" fill="#000" />
            )}
          </svg>
        </button>
        {/* Divider above icons */}
        <div className="w-full flex justify-center">
          <div className="mt-2 mb-4 w-10/12 border-t-2 border-gray-200" style={{ borderTopWidth: '1.5px' }} />
        </div>
        {/* Top nav buttons in a row */}
        <div className="flex flex-row gap-10 w-full justify-center">
          {navLinksTop
            .filter((link, idx) => open || idx === 0) // Only show dashboard (first) when closed
            .map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative flex items-center justify-center w-9 h-9 rounded-md transition-colors
                    ${isActive ? 'bg-gray-100 text-black font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}
                >
                  {React.createElement(Icon as any, { size: 20 })}
                  {/* Tooltip on hover */}
                  <span className="absolute left-1/2 -translate-x-1/2 top-10 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {link.name}
                  </span>
                </Link>
              );
            })}
        </div>
        {/* Divider below icons */}
        <div className="w-full flex justify-center">
          <div className="mt-4 mb-2 w-10/12 border-t-2 border-gray-200" style={{ borderTopWidth: '1.5px' }} />
        </div>
        {/* Page Sections Buttons */}
        <div className="flex flex-col items-center w-full mt-8 gap-2">
          {sections.map(renderSectionLink)}
        </div>
      </div>
      {/* Center section: Events */}
      {/* Bottom section: Logout and Collapse */}
      <div className="flex flex-col items-center mb-4 gap-2">
        <ul className="w-full">
          <li>
            {open ? (
              <div className="relative flex items-center w-full mb-1 h-12">
                <Link
                  href="/settings"
                  className="flex-1 w-full h-full flex items-center justify-center rounded-md border border-transparent text-gray-600 hover:bg-gray-100 hover:text-black transition-colors text-sm font-medium pl-4 pr-12"
                >
                  <span className="text-sm">Settings</span>
                </Link>
                <span className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center text-gray-600">
                  {React.createElement(FiSettings as any, { size: 20 })}
                </span>
              </div>
            ) : (
              <Link
                href="/settings"
                className="group relative flex items-center justify-center w-full h-16 rounded-md border border-transparent text-gray-600 hover:bg-gray-100 hover:text-black transition-colors p-0 leading-none"
              >
                {React.createElement(FiSettings as any, { size: 20 })}
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 z-50">
                  Settings
                </span>
              </Link>
            )}
          </li>
          <li>
            {open ? (
              <div className="relative flex items-center w-full mb-1 h-12">
                <button
                  onClick={handleLogout}
                  type="button"
                  className="flex-1 w-full h-full flex items-center justify-center rounded-md border border-transparent text-red-600 hover:bg-gray-100 transition-colors text-sm font-medium pl-4 pr-12 bg-transparent appearance-none"
                >
                  <span className="text-sm">Logout</span>
                </button>
                <span className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center text-red-600">
                  {React.createElement(FiLogOut as any, { size: 20 })}
                </span>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                type="button"
                className="group relative flex items-center justify-center w-full h-16 rounded-md border border-transparent text-red-600 hover:bg-gray-100 transition-colors bg-transparent p-0 leading-none appearance-none"
              >
                {React.createElement(FiLogOut as any, { size: 20 })}
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 z-50">
                  Logout
                </span>
              </button>
            )}
          </li>
        </ul>
      </div>
    </aside>
  );
} 