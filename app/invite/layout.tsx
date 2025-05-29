import React from 'react';

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
    style={{
      width: 'auto',
      height: '100vh',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {children}
  </div>
);
}
