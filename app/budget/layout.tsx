import React from 'react';

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #fef9c3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 32px rgba(180, 160, 60, 0.10)', padding: 40, minWidth: 400, maxWidth: 600, width: '100%' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 32, color: '#ca8a04', letterSpacing: 1 }}>Budget</h1>
        {children}
      </div>
    </section>
  );
} 