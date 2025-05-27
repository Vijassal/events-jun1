import React from 'react';
import Box from '@mui/material/Box';

export default function PlanLayout({ children }: { children: React.ReactNode }) {
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
