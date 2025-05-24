import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  family: string;
  relationship: string;
  invited_by: string;
  events: string[];
  tags: string[];
  additional_participants: any[];
  sub_events: string[];
}

function BubbleList({ items, color }: { items: string[]; color: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items && items.length > 0 ? items.map((item, i) => (
        <span key={i} style={{ background: color, color: 'white', borderRadius: 16, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>{item}</span>
      )) : <span style={{ color: '#a1a1aa', fontSize: 13 }}>—</span>}
    </div>
  );
}

export default function ParticipantList() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchParticipants() {
      setLoading(true);
      const { data, error } = await supabase.from('participants').select('*');
      if (!error && data) setParticipants(data);
      setLoading(false);
    }
    fetchParticipants();
  }, []);

  return (
    <div style={{ width: '100vw', padding: 0, margin: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: '#fce7f3', color: '#db2777' }}>
            <th style={{ padding: 16, fontWeight: 700 }}>First Name</th>
            <th style={{ padding: 16, fontWeight: 700 }}>Last Name</th>
            <th style={{ padding: 16, fontWeight: 700 }}>Email</th>
            <th style={{ padding: 16, fontWeight: 700 }}>Phone</th>
            <th style={{ padding: 16, fontWeight: 700 }}>Family</th>
            <th style={{ padding: 16, fontWeight: 700 }}>Relationship</th>
            <th style={{ padding: 16, fontWeight: 700 }}>Invited By</th>
            <th style={{ padding: 16, fontWeight: 700 }}>Events</th>
            <th style={{ padding: 16, fontWeight: 700 }}>Tags</th>
            <th style={{ padding: 16, fontWeight: 700 }}>Additional Participants</th>
            <th style={{ padding: 16, fontWeight: 700 }}>Sub-Events</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={11} style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
          ) : participants.length === 0 ? (
            <tr><td colSpan={11} style={{ textAlign: 'center', padding: 32, color: '#a1a1aa' }}>No participants found.</td></tr>
          ) : (
            participants.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f3e8ff' }}>
                <td style={{ padding: 14 }}>{p.first_name}</td>
                <td style={{ padding: 14 }}>{p.last_name}</td>
                <td style={{ padding: 14 }}>{p.email}</td>
                <td style={{ padding: 14 }}>{p.phone}</td>
                <td style={{ padding: 14 }}>{p.family}</td>
                <td style={{ padding: 14 }}>{p.relationship}</td>
                <td style={{ padding: 14 }}>{p.invited_by}</td>
                <td style={{ padding: 14 }}><BubbleList items={p.events || []} color="#db2777" /></td>
                <td style={{ padding: 14 }}><BubbleList items={p.tags || []} color="#f472b6" /></td>
                <td style={{ padding: 14, textAlign: 'center' }}>{p.additional_participants ? p.additional_participants.length : 0}</td>
                <td style={{ padding: 14 }}><BubbleList items={p.sub_events || []} color="#a78bfa" /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 