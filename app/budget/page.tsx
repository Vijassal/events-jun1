import React from 'react';

export default function BudgetPage() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#ca8a04', marginBottom: 12 }}>Budget & Expenses</h1>
        <p style={{ color: '#6b7280', fontSize: 18, marginBottom: 24 }}>
          Track your event costs, payments, and itemized expenses in one place.
        </p>
        <button style={{ background: 'linear-gradient(90deg, #fde68a, #ca8a04)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 18, boxShadow: '0 2px 8px rgba(202, 138, 4, 0.10)', cursor: 'pointer' }}>
          + Add Budget Entry
        </button>
      </div>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#ca8a04', marginBottom: 16 }}>All Budget Entries</h2>
        <p style={{ color: '#a1a1aa' }}>Budget table/list will go here.</p>
      </div>
    </div>
  );
} 