import React from 'react';

export default function EventsPage() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#7c3aed', marginBottom: 12 }}>Your Events</h1>
        <p style={{ color: '#6b7280', fontSize: 18, marginBottom: 24 }}>
          Plan, organize, and manage your main event days in style.
        </p>
        <button style={{ background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 18, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.10)', cursor: 'pointer' }}>
          + Add New Event
        </button>
      </div>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed', marginBottom: 16 }}>All Events</h2>
        <p style={{ color: '#a1a1aa' }}>Event table/list will go here.</p>
      </div>
    </div>
  );
} 