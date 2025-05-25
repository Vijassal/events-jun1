'use client';
import React, { useState } from 'react';
import { supabase } from '../../src/lib/supabase';

// Event and Sub-Event Types
interface EventData {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  type: string;
  category: string;
  participantLimit: string;
  tags: string;
}

interface SubEventData {
  id: string;
  parentEventId: string;
  name: string;
  date: string;
  time: string;
  location: string;
  type: string;
  category: string;
  participantLimit: string;
  tags: string;
}

export default function EventsPage() {
  // State for Events and Sub-Events
  const [events, setEvents] = useState<EventData[]>([]);
  const [subEvents, setSubEvents] = useState<SubEventData[]>([]);

  // Event Form State
  const [eventForm, setEventForm] = useState<Omit<EventData, 'id'>>({
    name: '', date: '', time: '', location: '', type: '', category: '', participantLimit: '', tags: ''
  });
  const [eventError, setEventError] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');

  // Sub-Event Form State
  const [subEventForm, setSubEventForm] = useState<Omit<SubEventData, 'id'>>({
    parentEventId: '', name: '', date: '', time: '', location: '', type: '', category: '', participantLimit: '', tags: ''
  });
  const [subEventError, setSubEventError] = useState('');
  const [subEventSuccess, setSubEventSuccess] = useState('');

  // Smaller form internals
  const labelStyle: React.CSSProperties = { fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 };
  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: 13,
    outline: 'none',
    marginBottom: 4,
  };
  const buttonStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
    color: 'white',
    fontWeight: 600,
    border: 'none',
    borderRadius: 7,
    padding: '8px 18px',
    fontSize: 14,
    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.10)',
    cursor: 'pointer',
    marginTop: 6,
    alignSelf: 'flex-end',
  };
  const errorStyle: React.CSSProperties = { color: '#ef4444', fontWeight: 500, fontSize: 13, marginBottom: 2 };
  const successStyle: React.CSSProperties = { color: '#22c55e', fontWeight: 500, fontSize: 13, marginBottom: 2 };
  const formStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(124, 58, 237, 0.06)',
    padding: 24,
    marginBottom: 0,
    width: '100%',
    minHeight: 420,
    maxHeight: 540,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflowY: 'auto',
  };
  const formsRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'center',
    marginBottom: 32,
  };
  const bubbleRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
    flexWrap: 'wrap',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
  };
  const bubbleStyle: React.CSSProperties = {
    background: '#ede9fe',
    color: '#7c3aed',
    borderRadius: 20,
    padding: '7px 18px',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    border: '1px solid #a78bfa',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'background 0.2s',
  };
  const bubbleActiveStyle: React.CSSProperties = {
    ...bubbleStyle,
    background: '#7c3aed',
    color: '#fff',
    border: '1px solid #7c3aed',
  };
  const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    cursor: 'pointer',
    fontSize: 16,
    marginLeft: 2,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  };

  // Edit state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'input' | 'diagram'>('input');

  // Edit event logic
  const handleEditEvent = (eventId: string) => {
    const event = events.find(ev => ev.id === eventId);
    if (event) {
      setEventForm({ ...event });
      setEditingEventId(eventId);
      setEventError('');
      setEventSuccess('');
    }
  };

  // Delete event logic
  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(ev => ev.id !== eventId));
    setSubEvents(subEvents.filter(se => se.parentEventId !== eventId));
    if (editingEventId === eventId) {
      setEventForm({ name: '', date: '', time: '', location: '', type: '', category: '', participantLimit: '', tags: '' });
      setEditingEventId(null);
    }
  };

  // Update event submit logic
  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.name || !eventForm.date || !eventForm.time || !eventForm.location || !eventForm.type || !eventForm.category || !eventForm.participantLimit) {
      setEventError('Please fill out all required fields.');
      return;
    }
    if (editingEventId) {
      setEvents(events.map(ev => ev.id === editingEventId ? { ...eventForm, id: editingEventId } : ev));
      setEventSuccess('Event updated successfully!');
      setEditingEventId(null);
    } else {
      setEvents([
        ...events,
        { ...eventForm, id: Date.now().toString() },
      ]);
      setEventSuccess('Event added successfully!');
    }
    setEventForm({ name: '', date: '', time: '', location: '', type: '', category: '', participantLimit: '', tags: '' });
  };

  // Handlers for Event Form
  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });
    setEventError('');
    setEventSuccess('');
  };

  // Handlers for Sub-Event Form
  const handleSubEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSubEventForm({ ...subEventForm, [e.target.name]: e.target.value });
    setSubEventError('');
    setSubEventSuccess('');
  };

  const handleSubEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (!subEventForm.parentEventId) {
      setSubEventError('Please select a parent Event.');
      return;
    }
    if (!subEventForm.name || !subEventForm.date || !subEventForm.time || !subEventForm.location || !subEventForm.type || !subEventForm.category || !subEventForm.participantLimit) {
      setSubEventError('Please fill out all required fields.');
      return;
    }
    // Add Sub-Event
    setSubEvents([
      ...subEvents,
      { ...subEventForm, id: Date.now().toString() },
    ]);
    setSubEventForm({ parentEventId: '', name: '', date: '', time: '', location: '', type: '', category: '', participantLimit: '', tags: '' });
    setSubEventSuccess('Sub-Event added successfully!');
  };

  // Tab style variables
  const tabRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: 0,
    borderBottom: '1.5px solid #e5e7eb',
    marginBottom: 18,
  };
  const tabStyle: React.CSSProperties = {
    padding: '10px 28px',
    fontWeight: 600,
    fontSize: 15,
    color: '#7c3aed',
    background: 'none',
    border: 'none',
    borderBottom: '2.5px solid transparent',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border 0.2s, color 0.2s',
  };
  const tabActiveStyle: React.CSSProperties = {
    ...tabStyle,
    borderBottom: '2.5px solid #7c3aed',
    color: '#4b5563',
    background: '#f9fafb',
  };
  const tagRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
    alignItems: 'center',
  };
  const tagStyle: React.CSSProperties = {
    background: '#ede9fe',
    color: '#7c3aed',
    borderRadius: 16,
    padding: '4px 14px',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid #a78bfa',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  };
  const tagSubStyle: React.CSSProperties = {
    ...tagStyle,
    background: '#f3f4f6',
    color: '#4b5563',
    border: '1px solid #a1a1aa',
  };

  // TODO: Integrate Supabase CRUD operations for events and sub-events below

  return (
    <div style={{ width: '100%', maxWidth: 1100, minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', margin: '0 auto', marginTop: 32 }}>
      {/* Tabs */}
      <div style={tabRowStyle}>
        <button style={activeTab === 'input' ? tabActiveStyle : tabStyle} onClick={() => setActiveTab('input')}>Event Input</button>
        <button style={activeTab === 'diagram' ? tabActiveStyle : tabStyle} onClick={() => setActiveTab('diagram')}>All Events</button>
      </div>
      {/* Tab Content */}
      {activeTab === 'input' && (
        <>
          {/* Bubble/tag list above forms */}
          <div style={{ marginBottom: 28, minHeight: 60 }}>
            <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: 15, marginBottom: 6 }}>Events</div>
            <div style={{ ...tagRowStyle, minHeight: 36 }}>
              {events.length === 0 ? <span style={{ color: '#a1a1aa', fontSize: 13 }}>No events yet.</span> : events.map(ev => (
                <span key={ev.id} style={tagStyle}>{ev.name}</span>
              ))}
            </div>
            <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: 15, marginBottom: 6, marginTop: 12 }}>Sub-Events</div>
            <div style={{ ...tagRowStyle, minHeight: 36 }}>
              {subEvents.length === 0 ? <span style={{ color: '#a1a1aa', fontSize: 13 }}>No sub-events yet.</span> : subEvents.map(se => (
                <span key={se.id} style={tagSubStyle}>{se.name}</span>
              ))}
            </div>
          </div>
          {/* Forms side by side, now can use more space */}
          <div style={{ ...formsRowStyle, maxWidth: '100%', justifyContent: 'flex-start', gap: 48 }}>
            {/* Event Form */}
            <form style={{ ...formStyle, maxWidth: 520 }} onSubmit={handleEventSubmit}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>{editingEventId ? 'Edit Event' : 'Add Event'}</h2>
              {eventError && <div style={errorStyle}>{eventError}</div>}
              {eventSuccess && <div style={successStyle}>{eventSuccess}</div>}
              <label style={labelStyle}>Name *</label>
              <input style={inputStyle} name="name" value={eventForm.name} onChange={handleEventChange} placeholder="Event Name" />
              <label style={labelStyle}>Date *</label>
              <input style={inputStyle} name="date" type="date" value={eventForm.date} onChange={handleEventChange} />
              <label style={labelStyle}>Time *</label>
              <input style={inputStyle} name="time" type="time" value={eventForm.time} onChange={handleEventChange} />
              <label style={labelStyle}>Location *</label>
              <input style={inputStyle} name="location" value={eventForm.location} onChange={handleEventChange} placeholder="Location" />
              <label style={labelStyle}>Type *</label>
              <input style={inputStyle} name="type" value={eventForm.type} onChange={handleEventChange} placeholder="Type" />
              <label style={labelStyle}>Category *</label>
              <input style={inputStyle} name="category" value={eventForm.category} onChange={handleEventChange} placeholder="Category" />
              <label style={labelStyle}>Participant Limit *</label>
              <input style={inputStyle} name="participantLimit" type="number" min="1" value={eventForm.participantLimit} onChange={handleEventChange} placeholder="Participant Limit" />
              <label style={labelStyle}>Tags</label>
              <input style={inputStyle} name="tags" value={eventForm.tags} onChange={handleEventChange} placeholder="Tags (comma separated)" />
              <button style={buttonStyle} type="submit">{editingEventId ? 'Update Event' : 'Add Event'}</button>
            </form>
            {/* Sub-Event Form */}
            <form style={{ ...formStyle, maxWidth: 520 }} onSubmit={handleSubEventSubmit}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>Add Sub-Event</h2>
              {events.length === 0 ? (
                <div style={errorStyle}>Please add an Event before adding a Sub-Event.</div>
              ) : null}
              {subEventError && <div style={errorStyle}>{subEventError}</div>}
              {subEventSuccess && <div style={successStyle}>{subEventSuccess}</div>}
              <label style={labelStyle}>Parent Event *</label>
              <select
                style={{ ...inputStyle, background: '#f9fafb' }}
                name="parentEventId"
                value={subEventForm.parentEventId}
                onChange={handleSubEventChange}
                disabled={events.length === 0}
              >
                <option value="">Select Event</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
              <label style={labelStyle}>Name *</label>
              <input style={inputStyle} name="name" value={subEventForm.name} onChange={handleSubEventChange} placeholder="Sub-Event Name" disabled={events.length === 0} />
              <label style={labelStyle}>Date *</label>
              <input style={inputStyle} name="date" type="date" value={subEventForm.date} onChange={handleSubEventChange} disabled={events.length === 0} />
              <label style={labelStyle}>Time *</label>
              <input style={inputStyle} name="time" type="time" value={subEventForm.time} onChange={handleSubEventChange} disabled={events.length === 0} />
              <label style={labelStyle}>Location *</label>
              <input style={inputStyle} name="location" value={subEventForm.location} onChange={handleSubEventChange} placeholder="Location" disabled={events.length === 0} />
              <label style={labelStyle}>Type *</label>
              <input style={inputStyle} name="type" value={subEventForm.type} onChange={handleSubEventChange} placeholder="Type" disabled={events.length === 0} />
              <label style={labelStyle}>Category *</label>
              <input style={inputStyle} name="category" value={subEventForm.category} onChange={handleSubEventChange} placeholder="Category" disabled={events.length === 0} />
              <label style={labelStyle}>Participant Limit *</label>
              <input style={inputStyle} name="participantLimit" type="number" min="1" value={subEventForm.participantLimit} onChange={handleSubEventChange} placeholder="Participant Limit" disabled={events.length === 0} />
              <label style={labelStyle}>Tags</label>
              <input style={inputStyle} name="tags" value={subEventForm.tags} onChange={handleSubEventChange} placeholder="Tags (comma separated)" disabled={events.length === 0} />
              <button style={buttonStyle} type="submit" disabled={events.length === 0}>Add Sub-Event</button>
            </form>
          </div>
        </>
      )}
      {activeTab === 'diagram' && (
        <div style={{ marginTop: 32, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'flex-start' }}>
          {events.length === 0 ? (
            <span style={{ color: '#a1a1aa', fontSize: 16 }}>No events to display.</span>
          ) : (
            events.map(ev => {
              const subList = subEvents.filter(se => se.parentEventId === ev.id);
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
                  {/* Event Box */}
                  <div style={{
                    background: '#ede9fe',
                    border: '1.5px solid #a78bfa',
                    borderRadius: 12,
                    padding: '18px 28px',
                    minWidth: 180,
                    fontWeight: 700,
                    color: '#7c3aed',
                    fontSize: 17,
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.06)',
                    position: 'relative',
                  }}>
                    {ev.name}
                    <div style={{ color: '#6b7280', fontWeight: 400, fontSize: 14, marginTop: 4 }}>{ev.date} {ev.time}</div>
                    <div style={{ color: '#a1a1aa', fontWeight: 400, fontSize: 13 }}>{ev.location} | {ev.type} | {ev.category}</div>
                  </div>
                  {/* Connection and Sub-Events */}
                  {subList.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                      {/* Vertical line */}
                      <div style={{ width: 18, display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 2, height: 48 * subList.length, background: '#a78bfa', marginTop: 8 }} />
                      </div>
                      {/* Sub-Event Boxes */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {subList.map(se => (
                          <div key={se.id} style={{
                            background: '#f3f4f6',
                            border: '1.5px solid #a1a1aa',
                            borderRadius: 10,
                            padding: '12px 20px',
                            minWidth: 140,
                            fontWeight: 600,
                            color: '#4b5563',
                            fontSize: 15,
                            boxShadow: '0 1px 4px rgba(124, 58, 237, 0.04)',
                          }}>
                            {se.name}
                            <div style={{ color: '#6b7280', fontWeight: 400, fontSize: 13, marginTop: 2 }}>{se.date} {se.time}</div>
                            <div style={{ color: '#a1a1aa', fontWeight: 400, fontSize: 12 }}>{se.location} | {se.type} | {se.category}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
} 