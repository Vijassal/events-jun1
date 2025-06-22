'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import TopToolbar from '../../src/components/TopToolbar';
import { usePathname } from 'next/navigation';

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowWidth;
};

// Event and Sub-Event Types
interface EventData {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
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
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  category: string;
  participantLimit: string;
  tags: string;
  account_instance_id: string;
}

// Helper to format time as h:mm AM/PM
function formatTime12hr(time: string) {
  if (!time) return '';
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

// Modal for editing/deleting an event
type EditEventModalProps = {
  open: boolean;
  event: EventData | null;
  onClose: () => void;
  onUpdate: (e: React.FormEvent) => void;
  onDelete: () => void;
  errorMsg: string;
  successMsg: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  loading: boolean;
};

function EditEventModal({ open, event, onClose, onUpdate, onDelete, errorMsg, successMsg, onChange, loading }: EditEventModalProps) {
  if (!open || !event) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(124, 58, 237, 0.18)', padding: 32, minWidth: 340, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }} onSubmit={onUpdate}>
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#a1a1aa', cursor: 'pointer' }}>&times;</button>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>Edit Event</h2>
        {errorMsg && <div style={{ color: '#ef4444', fontWeight: 500, fontSize: 13 }}>{errorMsg}</div>}
        {successMsg && <div style={{ color: '#22c55e', fontWeight: 500, fontSize: 13 }}>{successMsg}</div>}
        <label>Name *</label>
        <input name="name" value={event.name} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Date *</label>
        <input name="date" type="date" value={event.date} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Start Time *</label>
        <input name="startTime" type="time" value={event.startTime} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>End Time *</label>
        <input name="endTime" type="time" value={event.endTime} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Location *</label>
        <input name="location" value={event.location} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Type</label>
        <input name="type" value={event.type} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Category</label>
        <input name="category" value={event.category} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Participant Limit</label>
        <input name="participantLimit" type="number" min="1" value={event.participantLimit} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Tags</label>
        <input name="tags" value={event.tags} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 12 }}>
          <button type="submit" style={{ background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 14, cursor: 'pointer' }} disabled={loading}>Update</button>
          <button type="button" onClick={onDelete} style={{ background: '#ef4444', color: 'white', fontWeight: 600, border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 14, cursor: 'pointer' }} disabled={loading}>Delete</button>
        </div>
      </form>
    </div>
  );
}

// Modal for editing/deleting a sub-event
type EditSubEventModalProps = {
  open: boolean;
  subEvent: SubEventData | null;
  onClose: () => void;
  onUpdate: (e: React.FormEvent) => void;
  onDelete: () => void;
  errorMsg: string;
  successMsg: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  loading: boolean;
  parentEvents: EventData[];
};

function EditSubEventModal({ open, subEvent, onClose, onUpdate, onDelete, errorMsg, successMsg, onChange, loading, parentEvents }: EditSubEventModalProps) {
  if (!open || !subEvent) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(124, 58, 237, 0.18)', padding: 32, minWidth: 340, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }} onSubmit={onUpdate}>
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#a1a1aa', cursor: 'pointer' }}>&times;</button>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>Edit Sub-Event</h2>
        {errorMsg && <div style={{ color: '#ef4444', fontWeight: 500, fontSize: 13 }}>{errorMsg}</div>}
        {successMsg && <div style={{ color: '#22c55e', fontWeight: 500, fontSize: 13 }}>{successMsg}</div>}
        <label>Parent Event *</label>
        <select name="parentEventId" value={subEvent.parentEventId} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }}>
          <option value="">Select Event</option>
          {parentEvents.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>
        <label>Name *</label>
        <input name="name" value={subEvent.name} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Date *</label>
        <input name="date" type="date" value={subEvent.date} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Start Time *</label>
        <input name="startTime" type="time" value={subEvent.startTime} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>End Time *</label>
        <input name="endTime" type="time" value={subEvent.endTime} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Location *</label>
        <input name="location" value={subEvent.location} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Type *</label>
        <input name="type" value={subEvent.type} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Category *</label>
        <input name="category" value={subEvent.category} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Participant Limit *</label>
        <input name="participantLimit" type="number" min="1" value={subEvent.participantLimit} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <label>Tags</label>
        <input name="tags" value={subEvent.tags} onChange={onChange} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 12 }}>
          <button type="submit" style={{ background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 14, cursor: 'pointer' }} disabled={loading}>Update</button>
          <button type="button" onClick={onDelete} style={{ background: '#ef4444', color: 'white', fontWeight: 600, border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 14, cursor: 'pointer' }} disabled={loading}>Delete</button>
        </div>
      </form>
    </div>
  );
}

export default function EventsPage() {
  const windowWidth = useWindowWidth();
  // Add state for active tab
  const [activeTab, setActiveTab] = useState<'all' | 'addEvent' | 'addSubEvent'>('all');
  
  // State for Events and Sub-Events
  const [events, setEvents] = useState<EventData[]>([]);
  const [subEvents, setSubEvents] = useState<SubEventData[]>([]);
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null);
  const [fetchingAccountInstance, setFetchingAccountInstance] = useState(true);

  // Event Form State
  const [eventForm, setEventForm] = useState<Omit<EventData, 'id'>>({
    name: '', date: '', startTime: '', endTime: '', location: '', type: '', category: '', participantLimit: '', tags: ''
  });
  const [eventError, setEventError] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');

  // Sub-Event Form State
  const [subEventForm, setSubEventForm] = useState<Omit<SubEventData, 'id'>>({
    parentEventId: '', name: '', date: '', startTime: '', endTime: '', location: '', type: '', category: '', participantLimit: '', tags: '', account_instance_id: ''
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
    minHeight: 600,
    maxHeight: 900,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
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

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventData | null>(null);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Edit modal state for sub-events
  const [editSubModalOpen, setEditSubModalOpen] = useState(false);
  const [editSubEvent, setEditSubEvent] = useState<SubEventData | null>(null);
  const [editSubError, setEditSubError] = useState('');
  const [editSubSuccess, setEditSubSuccess] = useState('');
  const [editSubLoading, setEditSubLoading] = useState(false);

  // Add vendors state for dropdowns/associations
  const [vendors, setVendors] = useState<any[]>([]);

  // Fetch account_instance_id like in vendors/budget page
  useEffect(() => {
    async function fetchAccountInstance() {
      setFetchingAccountInstance(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setAccountInstanceId(null);
        setFetchingAccountInstance(false);
        return;
      }
      const { data: accounts, error } = await supabase
        .from('account_instances')
        .select('id, name')
        .eq('name', session.user.email);
      if (error || !accounts || accounts.length === 0) {
        setAccountInstanceId(null);
        setFetchingAccountInstance(false);
        return;
      }
      setAccountInstanceId(accounts[0].id);
      setFetchingAccountInstance(false);
    }
    fetchAccountInstance();
  }, []);

  useEffect(() => {
    if (accountInstanceId) {
      fetchEvents();
      fetchSubEvents();
      fetchVendors();
    }
  }, [accountInstanceId]);

  // Update fetchEvents to filter by account_instance_id
  const fetchEvents = async () => {
    if (!accountInstanceId) return setEvents([]);
    const { data, error } = await supabase.from('events').select('*').eq('account_instance_id', accountInstanceId).order('date', { ascending: true });
    if (error) setEvents([]);
    else setEvents(data || []);
  };

  // Update fetchSubEvents to filter by account_instance_id
  const fetchSubEvents = async () => {
    if (!accountInstanceId) return setSubEvents([]);
    const { data, error } = await supabase.from('sub_events').select('*').eq('account_instance_id', accountInstanceId);
    if (error) setSubEvents([]);
    else setSubEvents(
      (data || []).map(se => ({
        ...se,
        parentEventId: se.parent_event_id,
        startTime: se.start_time,
        endTime: se.end_time,
        participantLimit: se.participant_limit,
      }))
    );
  };

  // Fetch vendors for the current account_instance_id
  const fetchVendors = async () => {
    if (!accountInstanceId) return setVendors([]);
    const { data, error } = await supabase.from('vendors').select('*').eq('account_instance_id', accountInstanceId);
    if (error) setVendors([]);
    else setVendors(data || []);
  };

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
  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (!error) {
      setEvents(events.filter(ev => ev.id !== eventId));
      setSubEvents(subEvents.filter(se => se.parentEventId !== eventId));
      if (editingEventId === eventId) {
        setEventForm({ name: '', date: '', startTime: '', endTime: '', location: '', type: '', category: '', participantLimit: '', tags: '' });
        setEditingEventId(null);
      }
    }
  };

  // Update event submit logic
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.name || !eventForm.date || !eventForm.startTime || !eventForm.endTime || !eventForm.location) {
      setEventError('Please fill out all required fields.');
      return;
    }
    if (editingEventId) {
      // Update event in Supabase
      const { error } = await supabase.from('events').update({ ...eventForm }).eq('id', editingEventId);
      if (error) {
        setEventError('Failed to update event.');
        return;
      }
      setEvents(events.map(ev => ev.id === editingEventId ? { ...eventForm, id: editingEventId } : ev));
      setEventSuccess('Event updated successfully!');
      setEditingEventId(null);
    } else {
      // Prepare payload matching the Supabase table schema
      const payload = {
        name: eventForm.name,
        date: eventForm.date,
        start_time: eventForm.startTime,
        end_time: eventForm.endTime,
        location: eventForm.location,
        type: eventForm.type,
        category: eventForm.category,
        participant_limit: eventForm.participantLimit ? Number(eventForm.participantLimit) : null,
        tags: eventForm.tags || null,
        account_instance_id: accountInstanceId,
      };
      // Validate required fields
      if (
        !payload.name ||
        !payload.date ||
        !payload.start_time ||
        !payload.end_time ||
        !payload.location ||
        !payload.type ||
        !payload.category ||
        payload.participant_limit === null
      ) {
        setEventError('All fields except tags are required.');
        return;
      }
      // Insert into Supabase
      const { data, error } = await supabase.from('events').insert([payload]).select();
      if (error || !data) {
        setEventError('Failed to add event: ' + (error?.message || 'Unknown error'));
        return;
      }
      setEvents([...events, data[0]]);
      setEventSuccess('Event added successfully!');
    }
    setEventForm({ name: '', date: '', startTime: '', endTime: '', location: '', type: '', category: '', participantLimit: '', tags: '' });
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

  const handleSubEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prepare payload matching the Supabase sub_events table schema
    const payload = {
      parent_event_id: subEventForm.parentEventId || null,
      name: subEventForm.name,
      date: subEventForm.date,
      start_time: subEventForm.startTime,
      end_time: subEventForm.endTime,
      location: subEventForm.location,
      type: subEventForm.type,
      category: subEventForm.category,
      participant_limit: subEventForm.participantLimit ? Number(subEventForm.participantLimit) : null,
      tags: subEventForm.tags || null,
      account_instance_id: accountInstanceId,
    };
    // Validate required fields
    if (
      !payload.parent_event_id ||
      !payload.name ||
      !payload.date ||
      !payload.start_time ||
      !payload.end_time ||
      !payload.location ||
      !payload.type ||
      !payload.category ||
      payload.participant_limit === null
    ) {
      setSubEventError('All fields except tags are required.');
      return;
    }
    // Insert into Supabase
    const { data, error } = await supabase.from('sub_events').insert([payload]).select();
    if (error || !data) {
      setSubEventError('Failed to add sub-event: ' + (error?.message || 'Unknown error'));
      return;
    }
    setSubEvents([...subEvents, data[0]]);
    setSubEventSuccess('Sub-Event added successfully!');
    setSubEventForm({ parentEventId: '', name: '', date: '', startTime: '', endTime: '', location: '', type: '', category: '', participantLimit: '', tags: '', account_instance_id: '' });
  };

  // Tab style variables
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

  // Handler to open modal with event data
  const handleOpenEditModal = (event: EventData) => {
    setEditEvent({ ...event });
    setEditModalOpen(true);
    setEditError('');
    setEditSuccess('');
  };
  // Handler for form changes in modal
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editEvent) return;
    setEditEvent({ ...editEvent, [e.target.name]: e.target.value });
    setEditError('');
    setEditSuccess('');
  };
  // Handler for update
  const handleEditUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEvent) return;
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    // Validation
    if (!editEvent.name || !editEvent.date || !editEvent.startTime || !editEvent.endTime || !editEvent.location) {
      setEditError('Please fill out all required fields.');
      setEditLoading(false);
      return;
    }
    // Update in Supabase
    const { error } = await supabase.from('events').update({
      name: editEvent.name,
      date: editEvent.date,
      start_time: editEvent.startTime,
      end_time: editEvent.endTime,
      location: editEvent.location,
      type: editEvent.type,
      category: editEvent.category,
      participant_limit: editEvent.participantLimit ? Number(editEvent.participantLimit) : null,
      tags: editEvent.tags || null,
    }).eq('id', editEvent.id);
    if (error) {
      setEditError('Failed to update event.');
      setEditLoading(false);
      return;
    }
    setEvents(events => events.map(ev => ev.id === editEvent.id ? { ...editEvent } : ev));
    setEditSuccess('Event updated successfully!');
    setEditLoading(false);
    setTimeout(() => { setEditModalOpen(false); }, 800);
  };
  // Handler for delete
  const handleEditDelete = async () => {
    if (!editEvent) return;
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setEditLoading(true);
    const { error } = await supabase.from('events').delete().eq('id', editEvent.id);
    if (error) {
      setEditError('Failed to delete event.');
      setEditLoading(false);
      return;
    }
    setEvents(events => events.filter(ev => ev.id !== editEvent.id));
    setEditModalOpen(false);
    setEditLoading(false);
  };

  // Handler to open modal with sub-event data
  const handleOpenEditSubModal = (subEvent: SubEventData) => {
    setEditSubEvent({ ...subEvent });
    setEditSubModalOpen(true);
    setEditSubError('');
    setEditSubSuccess('');
  };
  // Handler for form changes in modal
  const handleEditSubChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editSubEvent) return;
    setEditSubEvent({ ...editSubEvent, [e.target.name]: e.target.value });
    setEditSubError('');
    setEditSubSuccess('');
  };
  // Handler for update
  const handleEditSubUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubEvent) return;
    setEditSubLoading(true);
    setEditSubError('');
    setEditSubSuccess('');
    // Validation
    if (!editSubEvent.parentEventId || !editSubEvent.name || !editSubEvent.date || !editSubEvent.startTime || !editSubEvent.endTime || !editSubEvent.location || !editSubEvent.type || !editSubEvent.category || !editSubEvent.participantLimit) {
      setEditSubError('Please fill out all required fields.');
      setEditSubLoading(false);
      return;
    }
    // Update in Supabase
    const { error } = await supabase.from('sub_events').update({
      parent_event_id: editSubEvent.parentEventId,
      name: editSubEvent.name,
      date: editSubEvent.date,
      start_time: editSubEvent.startTime,
      end_time: editSubEvent.endTime,
      location: editSubEvent.location,
      type: editSubEvent.type,
      category: editSubEvent.category,
      participant_limit: editSubEvent.participantLimit ? Number(editSubEvent.participantLimit) : null,
      tags: editSubEvent.tags || null,
    }).eq('id', editSubEvent.id);
    if (error) {
      setEditSubError('Failed to update sub-event.');
      setEditSubLoading(false);
      return;
    }
    setSubEvents(subEvents => subEvents.map(se => se.id === editSubEvent.id ? { ...editSubEvent } : se));
    setEditSubSuccess('Sub-Event updated successfully!');
    setEditSubLoading(false);
    setTimeout(() => { setEditSubModalOpen(false); }, 800);
  };
  // Handler for delete
  const handleEditSubDelete = async () => {
    if (!editSubEvent) return;
    if (!window.confirm('Are you sure you want to delete this sub-event?')) return;
    setEditSubLoading(true);
    const { error } = await supabase.from('sub_events').delete().eq('id', editSubEvent.id);
    if (error) {
      setEditSubError('Failed to delete sub-event.');
      setEditSubLoading(false);
      return;
    }
    setSubEvents(subEvents => subEvents.filter(se => se.id !== editSubEvent.id));
    setEditSubModalOpen(false);
    setEditSubLoading(false);
  };

  const pageWrapperStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100vh',
    position: 'relative',
    margin: 0,
    padding: '32px',
    boxSizing: 'border-box',
  };

  const pathname = usePathname();
  const navItems = [
    { 
      label: 'Events', 
      href: '/events', 
      active: true,
      onClick: () => setActiveTab('all')
    },
  ];
  const tempButtons = [
    { 
      label: 'Add Event',
      onClick: () => setActiveTab('addEvent'),
      active: activeTab === 'addEvent'
    },
    { 
      label: 'Add Sub-Event',
      onClick: () => setActiveTab('addSubEvent'),
      active: activeTab === 'addSubEvent'
    },
  ];

  return (
    <>
      <TopToolbar
        navItems={navItems}
        tempButtons={tempButtons}
        searchButton={{ onClick: () => alert('Search clicked!') }}
      />
      <div style={pageWrapperStyle}>
        {/* Tab Content */}
        {activeTab === 'all' && (
          <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                color: '#1f2937', 
                marginBottom: '8px',
                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Event Timeline
              </h1>
              <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>
                {events.length} Events • {subEvents.length} Sub-Events
              </p>
            </div>

            {/* Events Grid */}
            {events.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                borderRadius: '16px',
                border: '2px dashed #cbd5e1'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ color: '#475569', fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                  No Events Yet
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '0' }}>
                  Create your first event to get started
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                gap: '24px',
              }}>
                {events.map((event, index) => {
                  const eventSubEvents = subEvents.filter(se => se.parentEventId === event.id);
                  const eventDate = new Date(event.date);
                  const isToday = new Date().toDateString() === eventDate.toDateString();
                  const isPast = eventDate < new Date();
                  const isUpcoming = eventDate > new Date();
                  
                  return (
                    <div key={event.id} style={{
                      background: 'white',
                      borderRadius: '20px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      border: '1px solid #f1f5f9',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                    }} onClick={() => handleOpenEditModal(event)}>
                      
                      {/* Status Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        ...(isToday ? {
                          background: '#fef3c7',
                          color: '#d97706'
                        } : isPast ? {
                          background: '#fee2e2',
                          color: '#dc2626'
                        } : {
                          background: '#dbeafe',
                          color: '#2563eb'
                        })
                      }}>
                        {isToday ? 'Today' : isPast ? 'Past' : 'Upcoming'}
                      </div>

                      {/* Event Header */}
                      <div style={{
                        background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                        padding: '24px',
                        color: 'white'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '24px' }}>🎯</div>
                          <h3 style={{ 
                            fontSize: '24px', 
                            fontWeight: '700', 
                            margin: '0',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            {event.name}
                          </h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', opacity: '0.9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>📅</span>
                            <span>{new Date(event.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>🕐</span>
                            <span>{formatTime12hr(event.startTime)} - {formatTime12hr(event.endTime)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>📍</span>
                            <span style={{ color: '#374151', fontWeight: '500' }}>{event.location}</span>
                          </div>
                          {event.type && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px' }}>🏷️</span>
                              <span style={{ color: '#374151', fontWeight: '500' }}>{event.type}</span>
                            </div>
                          )}
                          {event.category && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px' }}>📂</span>
                              <span style={{ color: '#374151', fontWeight: '500' }}>{event.category}</span>
                            </div>
                          )}
                          {event.participantLimit && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px' }}>👥</span>
                              <span style={{ color: '#374151', fontWeight: '500' }}>Limit: {event.participantLimit}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {event.tags && (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {event.tags.split(',').map((tag, idx) => (
                                <span key={idx} style={{
                                  background: '#f3f4f6',
                                  color: '#374151',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sub-Events Section */}
                        {eventSubEvents.length > 0 && (
                          <div style={{ 
                            borderTop: '1px solid #e5e7eb', 
                            paddingTop: '20px',
                            marginTop: '20px'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              marginBottom: '16px',
                              color: '#6b7280',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              <span>🔗</span>
                              <span>Connected Sub-Events ({eventSubEvents.length})</span>
                            </div>
                            <div style={{ display: 'grid', gap: '12px' }}>
                              {eventSubEvents.map(subEvent => (
                                <div key={subEvent.id} style={{
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '12px',
                                  padding: '16px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  position: 'relative'
                                }} onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditSubModal(subEvent);
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px' }}>⚡</span>
                                    <h4 style={{ 
                                      fontSize: '16px', 
                                      fontWeight: '600', 
                                      color: '#1f2937',
                                      margin: '0'
                                    }}>
                                      {subEvent.name}
                                    </h4>
                                  </div>
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px', 
                                    fontSize: '13px',
                                    color: '#6b7280'
                                  }}>
                                    <span>📅 {new Date(subEvent.date).toLocaleDateString()}</span>
                                    <span>🕐 {formatTime12hr(subEvent.startTime)} - {formatTime12hr(subEvent.endTime)}</span>
                                    <span>📍 {subEvent.location}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty State for Sub-Events */}
                        {eventSubEvents.length === 0 && (
                          <div style={{ 
                            borderTop: '1px solid #e5e7eb', 
                            paddingTop: '20px',
                            marginTop: '20px',
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '14px'
                          }}>
                            <div style={{ marginBottom: '8px' }}>🔗</div>
                            <span>No sub-events connected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'addEvent' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', maxWidth: '100vw', padding: 0 }}>
            <form style={{ ...formStyle, maxWidth: 520, width: '100%' }} onSubmit={handleEventSubmit}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>{editingEventId ? 'Edit Event' : 'Add Event'}</h2>
              {eventError && <div style={errorStyle}>{eventError}</div>}
              {eventSuccess && <div style={successStyle}>{eventSuccess}</div>}
              <label style={labelStyle}>Name *</label>
              <input style={inputStyle} name="name" value={eventForm.name} onChange={handleEventChange} placeholder="Event Name" />
              <label style={labelStyle}>Date *</label>
              <input style={inputStyle} name="date" type="date" value={eventForm.date} onChange={handleEventChange} />
              <label style={labelStyle}>Start Time *</label>
              <input style={inputStyle} name="startTime" type="time" value={eventForm.startTime} onChange={handleEventChange} />
              <label style={labelStyle}>End Time *</label>
              <input style={inputStyle} name="endTime" type="time" value={eventForm.endTime} onChange={handleEventChange} />
              <label style={labelStyle}>Location *</label>
              <input style={inputStyle} name="location" value={eventForm.location} onChange={handleEventChange} placeholder="Location" />
              <label style={labelStyle}>Type</label>
              <input style={inputStyle} name="type" value={eventForm.type} onChange={handleEventChange} placeholder="Type" />
              <label style={labelStyle}>Category</label>
              <input style={inputStyle} name="category" value={eventForm.category} onChange={handleEventChange} placeholder="Category" />
              <label style={labelStyle}>Participant Limit</label>
              <input style={inputStyle} name="participantLimit" type="number" min="1" value={eventForm.participantLimit} onChange={handleEventChange} placeholder="Participant Limit" />
              <label style={labelStyle}>Tags</label>
              <input style={inputStyle} name="tags" value={eventForm.tags} onChange={handleEventChange} placeholder="Tags (comma separated)" />
              <button style={buttonStyle} type="submit">{editingEventId ? 'Update Event' : 'Add Event'}</button>
            </form>
          </div>
        )}
        {activeTab === 'addSubEvent' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', maxWidth: '100vw', padding: 0 }}>
            <form style={{ ...formStyle, maxWidth: 520, width: '100%' }} onSubmit={handleSubEventSubmit}>
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
              <label style={labelStyle}>Start Time *</label>
              <input style={inputStyle} name="startTime" type="time" value={subEventForm.startTime} onChange={handleSubEventChange} disabled={events.length === 0} />
              <label style={labelStyle}>End Time *</label>
              <input style={inputStyle} name="endTime" type="time" value={subEventForm.endTime} onChange={handleSubEventChange} disabled={events.length === 0} />
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
        )}
        {/* Render the edit modal */}
        <EditEventModal
          open={editModalOpen}
          event={editEvent}
          onClose={() => setEditModalOpen(false)}
          onUpdate={handleEditUpdate}
          onDelete={handleEditDelete}
          errorMsg={editError}
          successMsg={editSuccess}
          onChange={handleEditChange}
          loading={editLoading}
        />
        {/* Render the edit sub-event modal */}
        <EditSubEventModal
          open={editSubModalOpen}
          subEvent={editSubEvent}
          onClose={() => setEditSubModalOpen(false)}
          onUpdate={handleEditSubUpdate}
          onDelete={handleEditSubDelete}
          errorMsg={editSubError}
          successMsg={editSubSuccess}
          onChange={handleEditSubChange}
          loading={editSubLoading}
          parentEvents={events}
        />
      </div>
    </>
  );
} 