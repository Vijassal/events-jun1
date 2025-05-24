import React from 'react';

export default function VendorsPage() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#059669', marginBottom: 12 }}>Vendors</h1>
        <p style={{ color: '#6b7280', fontSize: 18, marginBottom: 24 }}>
          Manage all your event vendors and their details here.
        </p>
        <button style={{ background: 'linear-gradient(90deg, #6ee7b7, #059669)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 18, boxShadow: '0 2px 8px rgba(5, 150, 105, 0.10)', cursor: 'pointer' }}>
          + Add Vendor
        </button>
      </div>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#059669', marginBottom: 16 }}>All Vendors</h2>
        <p style={{ color: '#a1a1aa' }}>Vendor table/list will go here.</p>
      </div>
    </div>
  );
} 