'use client';
import React from 'react';
import TopToolbar from '../../src/components/TopToolbar';

export default function GalleryPage() {
  const navItems = [
    { label: 'Gallery', href: '/gallery', active: true },
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