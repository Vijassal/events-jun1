'use client';
import React from 'react';
import TopToolbar from '../../src/components/TopToolbar';

export default function ChatPage() {
  const navItems = [
    { label: 'Chat', href: '/chat', active: true },
  ];
  const tempButtons = [
    { label: 'Temp1' },
    { label: 'Temp2' },
    { label: 'Temp3' },
  ];
  return (
    <>
      <TopToolbar
        navItems={navItems}
        tempButtons={tempButtons}
        searchButton={{ onClick: () => alert('Search clicked!') }}
      />
      <div>
        <p>Page is still under construction.</p>
      </div>
    </>
  );
} 