import React from 'react';

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 32px rgba(80, 60, 120, 0.10)', padding: 40, minWidth: 400, maxWidth: 600, width: '100%' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 32, color: '#7c3aed', letterSpacing: 1 }}>Events</h1>
        {children}
      </div>
    </section>
  );
} 