import React from 'react';

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {children}
    </div>
  );
} 