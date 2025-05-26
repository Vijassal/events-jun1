import React from 'react';
import Box from '@mui/material/Box';

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sidebar-main-content">
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'auto',
          bgcolor: '#f9fafb',
        }}
      >
        {children}
      </Box>
    </div>
  );
}
