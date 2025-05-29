import React from 'react';

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
    style={{
      width: 'auto',
      height: 'auto',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {children}
  </div>
);
}
