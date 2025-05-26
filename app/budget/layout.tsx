import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container maxWidth="xl" disableGutters sx={{ minHeight: '100vh', bgcolor: '#f9fafb', p: 0 }}>
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: '#f9fafb',
        }}
      >
        {children}
      </Box>
    </Container>
  );
}
