import React from 'react';

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 'auto',
        height: 'auto',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}
