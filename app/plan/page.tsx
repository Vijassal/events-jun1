import React from 'react';

export default function PlanPage() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#2563eb', marginBottom: 12 }}>Events & Vendor Itinerary</h1>
        <p style={{ color: '#6b7280', fontSize: 18, marginBottom: 24 }}>
          Organizes your event schedule and vendor logistics for a seamless experience.
        </p>
        <button style={{ background: 'linear-gradient(90deg, #60a5fa, #2563eb)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 18, boxShadow: '0 2px 8px rgba(37, 99, 235, 0.10)', cursor: 'pointer' }}>
          + Add Itinerary Item
        </button>
      </div>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', marginBottom: 16 }}>All Itinerary Items</h2>
        <p style={{ color: '#a1a1aa' }}>Itinerary table/list will go here.</p>
      </div>
    </div>
  );
} 