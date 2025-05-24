"use client";
import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../../src/lib/supabase';

const ParticipantForm = dynamic(() => import('../../src/components/participants/ParticipantForm'), { ssr: false });

const DEFAULT_FIELDS = [
  'First Name',
  'Last Name',
  'Email',
  'Phone',
  'Family',
  'Relationship',
  'Invited By',
  'Events',
  'Sub-Events',
  'Tags',
  'Additional Participants',
];

export type CustomField = {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'checkbox';
  options?: string[];
};

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Add this mapping near the top of the component, after DEFAULT_FIELDS
const fieldMap: Record<string, string> = {
  'First Name': 'first_name',
  'Last Name': 'last_name',
  'Email': 'email',
  'Phone': 'phone',
  'Family': 'family',
  'Relationship': 'relationship',
  'Invited By': 'invited_by',
  'Events': 'events',
  'Sub-Events': 'sub_events',
  'Tags': 'tags',
  'Additional Participants': 'additional_participants',
};

// Add localStorage keys
const LS_VIEWS = 'invite_views';
const LS_CURRENT_VIEW = 'invite_current_view';
const LS_CUSTOM_FIELDS = 'invite_custom_fields';
const LS_FIELD_ORDER = 'invite_field_order';
const LS_VISIBLE_FIELDS = 'invite_visible_fields';
const LS_STATS_CONFIG = 'invite_stats_config';
const LS_CHILD_EXCLUSION_AGE = 'invite_child_exclusion_age';

export default function InvitePage() {
  // State for fields, custom fields, and visible fields
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [visibleFields, setVisibleFields] = useState<string[]>([...DEFAULT_FIELDS]);
  const [fieldOrder, setFieldOrder] = useState<string[]>([...DEFAULT_FIELDS]);
  const [filters, setFilters] = useState(Object.fromEntries(DEFAULT_FIELDS.map(f => [f, ''])));
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newField, setNewField] = useState<{ label: string; type: CustomField['type']; options: string }>({ label: '', type: 'text', options: '' });
  const [views, setViews] = useState<{ id: string; name: string; fields: string[]; visible: string[]; isDefault: boolean; statsConfig: any[]; customFields: CustomField[]; childExclusionAge: number }[]>([]);
  const [currentView, setCurrentView] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const dragFieldRef = useRef<string | null>(null);
  const [statsConfig, setStatsConfig] = useState<{ field: string; value?: string; type: 'count' | 'checkbox-true' | 'checkbox-false' }[]>([]);
  const [showStatsConfig, setShowStatsConfig] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]); // Placeholder for participant data
  const [formData, setFormData] = useState<any>({});
  const [additionalUsers, setAdditionalUsers] = useState<any[]>([]); // Now an array of objects
  const [showAddAdditional, setShowAddAdditional] = useState(false);
  const [additionalForm, setAdditionalForm] = useState<any>({});
  const [childExclusionAge, setChildExclusionAge] = useState<number>(5);
  const [participantSaved, setParticipantSaved] = useState(false);
  const [additionalSaved, setAdditionalSaved] = useState(false);
  const [additionalError, setAdditionalError] = useState<string | null>(null);
  const [mainParticipantId, setMainParticipantId] = useState<string | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [tagList, setTagList] = useState<string[]>(['Family', 'VIP', 'Friend', 'Colleague']);
  const [refreshing, setRefreshing] = useState(false);
  const [editParticipant, setEditParticipant] = useState<any>(null);
  const [editAdditional, setEditAdditional] = useState<{ mainId: string, index: number, data: any } | null>(null);
  // Add state for settings tab
  const [settingsTab, setSettingsTab] = useState<'table' | 'stats'>('table');
  // Add a separate state for the view name input
  const [viewNameInput, setViewNameInput] = useState('');
  const [viewsLoading, setViewsLoading] = useState(false);

  // Derived fields list
  const allFields = [...DEFAULT_FIELDS, ...customFields.map(f => f.label)];
  const orderedFields = fieldOrder.filter(f => visibleFields.includes(f));

  // Add after fieldOrder and before filters
  const initialColWidths = Object.fromEntries(DEFAULT_FIELDS.map(f => [f, 140]));
  const [colWidths, setColWidths] = useState<{ [key: string]: number }>(initialColWidths);
  const resizingCol = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  const handleResizeStart = (field: string, e: React.MouseEvent) => {
    resizingCol.current = field;
    startX.current = e.clientX;
    startWidth.current = colWidths[field] || 140;
    document.body.style.cursor = 'col-resize';
  };

  const handleResize = (e: MouseEvent) => {
    if (!resizingCol.current) return;
    const dx = e.clientX - startX.current;
    setColWidths(w => ({ ...w, [resizingCol.current!]: Math.max(60, startWidth.current + dx) }));
  };

  const handleResizeEnd = () => {
    resizingCol.current = null;
    document.body.style.cursor = '';
  };

  useEffect(() => {
    const move = (e: MouseEvent) => handleResize(e);
    const up = () => handleResizeEnd();
    if (resizingCol.current) {
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      return () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
    }
  }, [resizingCol.current]);

  // Handlers for participant form
  const handleAddClick = () => setShowForm(true);
  const handleFormSuccess = async () => {
    await fetchParticipants();
    setParticipantSaved(true);
    setNotification('Participant saved!');
    // Get the latest participant (assuming it's the last one)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const { data: account } = await supabase
      .from('account_instances')
      .select('id')
      .eq('owner_user_id', session.user.id)
      .single();
    if (!account?.id) return;
    const { data: participantsList } = await supabase
      .from('participants')
      .select('id')
      .eq('account_instance_id', account.id)
      .order('id', { ascending: false });
    if (participantsList && participantsList.length > 0) {
      setMainParticipantId(participantsList[0].id);
    }
    console.log('handleFormSuccess: participantsList', participantsList);
  };
  const handleFormCancel = () => setShowForm(false);

  // Settings modal handlers
  const handleSettingsClick = () => setShowSettings(true);
  const handleSettingsClose = () => setShowSettings(false);

  // Custom field logic
  const handleAddCustomField = () => {
    if (!newField.label.trim()) return;
    setCustomFields(prev => [
      ...prev,
      {
        id: generateId(),
        label: newField.label,
        type: newField.type,
        options: newField.type === 'dropdown' ? newField.options.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      },
    ]);
    setFieldOrder(prev => [...prev, newField.label]);
    setVisibleFields(prev => [...prev, newField.label]);
    setNewField({ label: '', type: 'text', options: '' });
  };
  const handleDeleteCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
    setFieldOrder(prev => prev.filter(f => !customFields.find(cf => cf.id === id && cf.label === f)));
    setVisibleFields(prev => prev.filter(f => !customFields.find(cf => cf.id === id && cf.label === f)));
  };
  const handleEditCustomField = (id: string, label: string, type: CustomField['type'], options: string) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, label, type, options: type === 'dropdown' ? options.split(',').map(o => o.trim()).filter(Boolean) : undefined } : f));
  };

  // Field visibility
  const handleToggleField = (field: string) => {
    setVisibleFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
  };

  // Drag-and-drop logic (simple, not using a library)
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('fieldIdx', idx.toString());
  };
  const handleDrop = (e: React.DragEvent, idx: number) => {
    const fromIdx = parseInt(e.dataTransfer.getData('fieldIdx'), 10);
    if (fromIdx === idx) return;
    const newOrder = [...fieldOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(idx, 0, moved);
    setFieldOrder(newOrder);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Drag-and-drop for field visibility list in settings
  const handleFieldDragStart = (field: string) => {
    dragFieldRef.current = field;
  };
  const handleFieldDrop = (field: string) => {
    if (!dragFieldRef.current || dragFieldRef.current === field) return;
    const fromIdx = visibleFields.indexOf(dragFieldRef.current);
    const toIdx = visibleFields.indexOf(field);
    if (fromIdx === -1 || toIdx === -1) return;
    const newOrder = [...visibleFields];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setVisibleFields(newOrder);
    dragFieldRef.current = null;
  };
  const handleFieldDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Remove all localStorage logic for views (get/set)
  // Only use localStorage for other UI-only settings if needed
  useEffect(() => {
    const currentView = localStorage.getItem(LS_CURRENT_VIEW);
    if (currentView) setCurrentView(currentView);
    const customFields = localStorage.getItem(LS_CUSTOM_FIELDS);
    if (customFields) setCustomFields(JSON.parse(customFields));
    const fieldOrder = localStorage.getItem(LS_FIELD_ORDER);
    if (fieldOrder) setFieldOrder(JSON.parse(fieldOrder));
    const visibleFields = localStorage.getItem(LS_VISIBLE_FIELDS);
    if (visibleFields) setVisibleFields(JSON.parse(visibleFields));
    const statsConfig = localStorage.getItem(LS_STATS_CONFIG);
    if (statsConfig) setStatsConfig(JSON.parse(statsConfig));
    const childAge = localStorage.getItem(LS_CHILD_EXCLUSION_AGE);
    if (childAge) setChildExclusionAge(Number(childAge));
  }, []);

  // Remove useEffect for localStorage views
  // useEffect(() => {
  //   localStorage.setItem(LS_VIEWS, JSON.stringify(views));
  // }, [views]);

  // Save and load views
  const handleSaveView = async (name: string) => {
    if (!account?.id) return;
    const existing = views.find(v => v.name === currentView);
    const viewObj = {
      account_instance_id: account.id,
      name,
      fields: fieldOrder,
      visible: visibleFields,
      isDefault: existing ? existing.isDefault : false,
      statsConfig,
      customFields,
      childExclusionAge,
      ...(existing && existing.id ? { id: existing.id } : {}),
    };
    // If name changed, delete old and insert new
    if (existing && name !== currentView) {
      await supabase.from('views').delete().eq('id', existing.id);
    }
    const { error } = await supabase.from('views').upsert([viewObj], { onConflict: 'account_instance_id,name' });
    if (error) {
      setNotification('Error saving view: ' + error.message);
      return;
    }
    await fetchViews(account.id);
    setCurrentView(name);
    setViewNameInput(name);
    setNotification('View saved!');
    setTimeout(() => setNotification(null), 1800);
  };
  // Add error handling to fetchViews
  async function fetchViews(accountId: string) {
    const { data, error } = await supabase
      .from('views')
      .select('*')
      .eq('account_instance_id', accountId);
    if (error) {
      setNotification('Error loading views: ' + error.message);
      setViews([]);
      return;
    }
    setViews(data || []);
  }

  // Filter logic
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Stats calculation (placeholder logic)
  const getStatValue = (config: { field: string; value?: string; type: string }) => {
    if (config.field === 'All Participants') {
      // Count all main and additional participants
      let count = 0;
      participants.forEach(p => {
        count++;
        if (Array.isArray(p.additional_participants)) {
          count += p.additional_participants.length;
        }
      });
      return count;
    }
    if (config.field === 'All Participants (Age Exclusion)') {
      // Count all main and additional participants, excluding those with isChild true and childAge <= childExclusionAge
      let count = 0;
      participants.forEach(p => {
        const isMainChild = p.isChild && Number(p.childAge) <= childExclusionAge;
        if (!isMainChild) count++;
        if (Array.isArray(p.additional_participants)) {
          count += p.additional_participants.filter((ap: any) => !(ap.isChild && Number(ap.childAge) <= childExclusionAge)).length;
        }
      });
      return count;
    }
    if (config.field === `Children > Age ${childExclusionAge}`) {
      // Count all additional participants with isChild true and childAge > exclusion age
      return participants.reduce((acc, p) => acc + (Array.isArray(p.additional_participants) ? p.additional_participants.filter((ap: any) => ap.isChild && Number(ap.childAge) > childExclusionAge).length : 0), 0);
    }
    if (config.field === `Children ≤ Age ${childExclusionAge}`) {
      // Count all additional participants with isChild true and childAge <= exclusion age
      return participants.reduce((acc, p) => acc + (Array.isArray(p.additional_participants) ? p.additional_participants.filter((ap: any) => ap.isChild && Number(ap.childAge) <= childExclusionAge).length : 0), 0);
    }
    // Count for all main and additional participants for a field
    const countField = (field: string, predicate: (val: any) => boolean) => {
      let count = 0;
      participants.forEach(p => {
        if (predicate(p[fieldMap[field] || field])) count++;
        if (Array.isArray(p.additional_participants)) {
          p.additional_participants.forEach((ap: any) => {
            if (predicate(ap[fieldMap[field] || field])) count++;
          });
        }
      });
      return count;
    };
    // Checkbox logic
    if (config.type === 'checkbox-true') {
      return countField(config.field, v => v === true);
    }
    if (config.type === 'checkbox-false') {
      return countField(config.field, v => v === false);
    }
    // Count logic for all other fields (non-empty)
    if (config.type === 'count') {
      return countField(config.field, v => v !== undefined && v !== null && v !== '');
    }
    return 0;
  };

  // Additional Participant form fields
  const additionalFields = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Family',
    'Relationship',
    'Invited By',
    'Tags',
    'Events',
    'Sub-Events',
  ];

  // Stats config: allow all fields
  const specialStatFields = [
    `All Participants (Age Exclusion)`,
    `Children > Age ${childExclusionAge}`,
    `Children ≤ Age ${childExclusionAge}`
  ];
  const allStatFields = ['All Participants', ...DEFAULT_FIELDS, ...customFields.map(f => f.label), ...specialStatFields];

  // 1. Prevent adding additional participant unless main participant has required fields
  const canAddAdditional = formData['First Name'] && formData['Last Name'] && formData['Email'];

  // Placeholder event/sub-event options (to be replaced with dynamic fetch later)
  const eventOptions = ['Wedding Day', 'Reception', 'Rehearsal Dinner'];
  const subEventOptions = ['Ceremony', 'Cocktail Hour', 'Dinner', 'Dancing'];

  // Form field render logic
  const renderFieldInput = (field: string) => {
    // Custom field
    const custom = customFields.find(f => f.label === field);
    if (custom) {
      if (custom.type === 'dropdown') {
        return (
          <select
            value={formData[field] || ''}
            onChange={e => setFormData((d: any) => ({ ...d, [field]: e.target.value }))}
            style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}
          >
            <option value="">Select</option>
            {(custom.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      }
      if (custom.type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={!!formData[field]}
            onChange={e => setFormData((d: any) => ({ ...d, [field]: e.target.checked }))}
            style={{ width: 16, height: 16 }}
          />
        );
      }
      return (
        <input
          type="text"
          value={formData[field] || ''}
          onChange={e => setFormData((d: any) => ({ ...d, [field]: e.target.value }))}
          style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}
        />
      );
    }
    // Built-in fields
    if (field === 'Events') {
      return (
        <select
          multiple
          value={formData[field] || []}
          onChange={e => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            setFormData((d: any) => ({ ...d, [field]: selected }));
          }}
          style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}
        >
          {eventOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (field === 'Sub-Events') {
      return (
        <select
          multiple
          value={formData[field] || []}
          onChange={e => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            setFormData((d: any) => ({ ...d, [field]: selected }));
          }}
          style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}
        >
          {subEventOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (field === 'Tags') {
      // Bubble multi-select
      const tagOptions = ['Family', 'Friend', 'VIP', 'Vendor'];
      return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tagOptions.map(tag => (
            <span
              key={tag}
              onClick={() => {
                setFormData((d: any) => {
                  const tags = Array.isArray(d[field]) ? d[field] : [];
                  return {
                    ...d,
                    [field]: tags.includes(tag)
                      ? tags.filter((t: string) => t !== tag)
                      : [...tags, tag],
                  };
                });
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 12,
                background: Array.isArray(formData[field]) && formData[field].includes(tag) ? '#6366f1' : '#f4f6fb',
                color: Array.isArray(formData[field]) && formData[field].includes(tag) ? '#fff' : '#374151',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                border: '1px solid #e5e7eb',
                userSelect: 'none',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      );
    }
    if (field === 'Additional Participants') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>Use the button below to add additional participants.</div>
          <button
            type="button"
            onClick={() => setShowAddAdditional(true)}
            disabled={!canAddAdditional}
            style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #e5e7eb', background: canAddAdditional ? '#f4f6fb' : '#f1f1f1', fontWeight: 600, fontSize: 13, cursor: canAddAdditional ? 'pointer' : 'not-allowed', width: '100%', marginBottom: 6 }}
          >
            + Add Additional Participant
          </button>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {additionalUsers.map((user, idx) => (
              <li key={idx} style={{ background: '#f4f6fb', borderRadius: 10, padding: '4px 10px', fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontStyle: 'italic' }}>
                <span>{user['First Name']} {user['Last Name']} ({user['Email']})</span>
                <button
                  type="button"
                  onClick={() => setAdditionalUsers(users => users.filter((_, i) => i !== idx))}
                  style={{ marginLeft: 6, color: '#db2777', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    if (field === 'Child?') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={!!formData.isChild}
            onChange={e => setFormData((f: any) => ({ ...f, isChild: e.target.checked, childAge: e.target.checked ? f.childAge : '' }))}
            id="mainIsChildCheckbox"
            style={{ width: 16, height: 16 }}
          />
          <label htmlFor="mainIsChildCheckbox" style={{ fontWeight: 500, fontSize: 13, color: '#374151' }}>Child?</label>
          {formData.isChild && (
            <>
              <span style={{ marginLeft: 8, fontSize: 13, color: '#374151' }}>Child Age:</span>
              <input
                type="number"
                min={0}
                required
                value={formData.childAge || ''}
                onChange={e => setFormData((f: any) => ({ ...f, childAge: e.target.value }))}
                style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, width: 80, marginLeft: 4 }}
              />
            </>
          )}
        </div>
      );
    }
    // Default: text input
    return (
      <input
        type="text"
        value={formData[field] || ''}
        onChange={e => setFormData((d: any) => ({ ...d, [field]: e.target.value }))}
        style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}
      />
    );
  };

  // Move fetchParticipants to component scope
  async function fetchParticipants() {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    // Get account_instance_id
    let { data: account, error: accErr } = await supabase
      .from('account_instances')
      .select('id')
      .eq('owner_user_id', session.user.id)
      .single();
    if (!account?.id) {
      // Try to create one if not found
      const insertObj = { name: session.user.email || 'My Account', owner_user_id: session.user.id };
      console.log('Attempting to insert account_instance:', insertObj);
      const { data: newAcc, error: newAccErr } = await supabase
        .from('account_instances')
        .insert([insertObj])
        .select('id')
        .single();
      if (newAccErr) {
        console.error('fetchParticipants: failed to create account', newAccErr);
        return;
      }
      account = newAcc;
    }
    setAccount(account);
    // Fetch participants for this account_instance_id
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('account_instance_id', account.id);
    if (error) console.error('fetchParticipants: participants error', error);
    console.log('fetchParticipants: participants', data);
    setParticipants(data || []);
  }

  useEffect(() => {
    fetchParticipants();
  }, []);

  // Add handleAddAdditional function
  const handleAddAdditional = async (additional: any) => {
    if (!mainParticipantId) {
      setAdditionalError('Please save the main participant before adding additional participants.');
      setTimeout(() => setAdditionalError(null), 2000);
      return;
    }
    // Fetch current additional_participants from DB
    const { data: participant, error: fetchErr } = await supabase
      .from('participants')
      .select('additional_participants')
      .eq('id', mainParticipantId)
      .single();
    if (fetchErr) {
      setAdditionalError('Could not fetch participant.');
      setTimeout(() => setAdditionalError(null), 2000);
      return;
    }
    const updatedAdditional = Array.isArray(participant.additional_participants)
      ? [...participant.additional_participants, additional]
      : [additional];
    // Update in DB
    const { error: updateErr } = await supabase
      .from('participants')
      .update({ additional_participants: updatedAdditional })
      .eq('id', mainParticipantId);
    if (updateErr) {
      setAdditionalError('Could not save additional participant.');
      setTimeout(() => setAdditionalError(null), 2000);
      return;
    }
    setAdditionalSaved(true);
    setTimeout(() => setAdditionalSaved(false), 3000);
  };

  // Fix refresh button to always call fetchParticipants
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchParticipants();
    setRefreshing(false);
  };

  // After loading views and currentView, apply the settings from the selected/default view
  useEffect(() => {
    if (views.length === 0) return;
    let viewToApply = views.find(v => v.name === currentView);
    if (!viewToApply) {
      viewToApply = views.find(v => v.isDefault);
    }
    if (viewToApply) {
      setFieldOrder(viewToApply.fields);
      setVisibleFields(viewToApply.visible);
      setStatsConfig(viewToApply.statsConfig || []);
      setCustomFields(viewToApply.customFields || []);
      setChildExclusionAge(viewToApply.childExclusionAge || 5);
    }
    if (!currentView && viewToApply) {
      setCurrentView(viewToApply.name);
    }
    // eslint-disable-next-line
  }, [views, currentView]);

  // Restore and update handleSelectView, handleSetDefaultView, handleDeleteView with error handling
  const handleSelectView = (name: string) => {
    const view = views.find(v => v.name === name);
    if (view) {
      setFieldOrder(view.fields);
      setVisibleFields(view.visible);
      setStatsConfig(view.statsConfig || []);
      setCustomFields(view.customFields || []);
      setChildExclusionAge(view.childExclusionAge || 5);
      setCurrentView(name);
      setViewNameInput(name);
    }
  };
  const handleSetDefaultView = async (name: string) => {
    if (!account?.id) return;
    const { data: allViews, error } = await supabase.from('views').select('*').eq('account_instance_id', account.id);
    if (error) {
      setNotification('Error loading views: ' + error.message);
      return;
    }
    if (allViews) {
      for (const v of allViews) {
        await supabase.from('views').update({ isDefault: v.name === name }).eq('id', v.id);
      }
    }
    await fetchViews(account.id);
    setCurrentView(name);
  };
  const handleDeleteView = async (name: string) => {
    if (!account?.id) return;
    const view = views.find(v => v.name === name);
    if (view) {
      const { error } = await supabase.from('views').delete().eq('id', view.id);
      if (error) {
        setNotification('Error deleting view: ' + error.message);
        return;
      }
      await fetchViews(account.id);
      if (currentView === name) setCurrentView('');
    }
  };

  // Fetch views when account is loaded
  useEffect(() => {
    if (account?.id) {
      setViewsLoading(true);
      fetchViews(account.id).finally(() => setViewsLoading(false));
    }
  }, [account?.id]);

  return (
    <>
      {/* Stats Area at the top (larger, cleaner, more professional) */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 32, gap: 36, flexWrap: 'wrap' }}>
        {statsConfig.map((stat, idx) => (
          <div key={idx} style={{ minWidth: 220, maxWidth: 220, minHeight: 110, maxHeight: 110, background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px rgba(60,120,180,0.10)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 18, border: '1.5px solid #e5e7eb', transition: 'box-shadow 0.2s', fontWeight: 700, overflow: 'hidden', wordBreak: 'break-word', textAlign: 'center' }}>
            <div style={{ fontSize: 16, color: '#6366f1', fontWeight: 700, marginBottom: 8, letterSpacing: 0.2, width: '100%', wordBreak: 'break-word', whiteSpace: 'pre-line', textAlign: 'center', minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stat.field}</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: '#374151', letterSpacing: 0.5, width: '100%', textAlign: 'center', wordBreak: 'break-word', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getStatValue(stat)}</div>
          </div>
        ))}
      </div>
      {/* Stats Config Modal */}
      {showStatsConfig && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', padding: 24, minWidth: 340, maxWidth: 420, width: '100%', position: 'relative', fontSize: 14 }}>
            <button onClick={() => setShowStatsConfig(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, color: '#222', cursor: 'pointer', zIndex: 10 }}>&times;</button>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#374151', letterSpacing: 0.1, textAlign: 'center' }}>Configure Stats</h2>
            {/* List of current stats */}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', marginBottom: 12 }}>
              {statsConfig.map((stat, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ flex: 1 }}>{stat.field} ({stat.type}{stat.value ? `: ${stat.value}` : ''})</span>
                  <button onClick={() => setStatsConfig(cfg => cfg.filter((_, i) => i !== idx))} style={{ color: '#db2777', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginLeft: 8 }}>Delete</button>
                </li>
              ))}
            </ul>
            {/* Add new stat config */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}>
                {allStatFields.map(f => <option key={f}>{f}</option>)}
              </select>
              {/* TODO: Add logic for value/type selection */}
              <button style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#f4f6fb', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Add Stat</button>
            </div>
          </div>
        </div>
      )}
      {/* Move table and buttons up by about 3 inches (72px) */}
      <div style={{ height: 24 }} />
      {/* Table Title, centered */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#374151', letterSpacing: 0.2, margin: 0, textAlign: 'center' }}>Invite / Participants</h2>
      </div>
      {/* Button Row centered and aligned with table */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ width: '100%', maxWidth: 1600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleSettingsClick}
              style={{
                background: '#f4f6fb',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                padding: '7px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: 0,
                boxShadow: '0 1px 6px rgba(60,120,180,0.04)',
                transition: 'background 0.2s',
              }}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={handleRefresh}
              style={{
                background: '#e0e7ff',
                color: '#374151',
                border: '1px solid #c7d2fe',
                borderRadius: 6,
                padding: '7px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: 0,
                boxShadow: '0 1px 6px rgba(99,102,241,0.08)',
                letterSpacing: 0.2,
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 90,
              }}
              disabled={refreshing}
            >
              {refreshing ? <span className="spinner" style={{ width: 16, height: 16, border: '2px solid #6366f1', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} /> : '⟳'}
              Refresh
            </button>
          </div>
          <button
            onClick={handleAddClick}
            style={{
              background: 'linear-gradient(90deg, #6366f1 0%, #db2777 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '7px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 6px rgba(99,102,241,0.08)',
              letterSpacing: 0.2,
              transition: 'background 0.2s',
            }}
          >
            + Add Participant
          </button>
        </div>
      </div>
      {/* Table container: stretches end to end with gap on sides and bottom */}
      <div style={{ flex: 1, width: 'calc(100% - 48px)', margin: '0 24px 0 24px', paddingBottom: 32, background: 'transparent', display: 'flex', justifyContent: 'center', minHeight: '0', overflowX: 'scroll', scrollbarColor: '#6366f1 #e5e7eb', scrollbarWidth: 'thin' }}>
        <div style={{ width: '100%', minWidth: 900, maxWidth: 1600, borderRadius: '0 0 32px 32px', boxShadow: '0 4px 24px rgba(60, 120, 180, 0.08)', background: '#fff', overflow: 'hidden', border: '1.2px solid #e5e7eb', minHeight: '60vh', marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <table style={{ width: '100%', minWidth: 900, tableLayout: 'fixed', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', fontSize: 14, color: '#222', background: 'transparent' }}>
            <thead>
              {/* Filter Row above headers */}
              <tr>
                {orderedFields.map((field, idx) => (
                  <th key={field + '-filter'} style={{ background: '#f4f6fb', padding: '7px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 500, fontSize: 13, borderTop: 'none', borderRight: idx !== orderedFields.length - 1 ? '1px solid #e5e7eb' : undefined, textAlign: 'center' }}>
                    <select
                      value={filters[field] || ''}
                      onChange={e => handleFilterChange(field, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 5,
                        fontSize: 13,
                        background: '#fff',
                        fontWeight: 500,
                        color: '#374151',
                        outline: 'none',
                        boxShadow: '0 1px 2px rgba(60,120,180,0.02)',
                        transition: 'border 0.2s',
                      }}
                    >
                      <option value="">All {field}</option>
                      <option value="Option 1">Option 1</option>
                      <option value="Option 2">Option 2</option>
                    </select>
                  </th>
                ))}
              </tr>
              {/* Header Row with drag-and-drop */}
              <tr>
                {orderedFields.map((field, idx) => (
                  <th
                    key={field}
                    draggable
                    onDragStart={e => handleDragStart(e, idx)}
                    onDrop={e => handleDrop(e, idx)}
                    onDragOver={handleDragOver}
                    style={{
                      textAlign: 'center',
                      padding: '10px 8px',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#222',
                      borderBottom: '2px solid #e5e7eb',
                      background: '#f4f6fb',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      cursor: 'grab',
                      borderTop: 'none',
                      borderRadius: 0,
                      borderRight: idx !== orderedFields.length - 1 ? '1px solid #e5e7eb' : undefined,
                      transition: 'background 0.18s',
                      userSelect: 'none',
                      width: colWidths[field],
                      minWidth: 60,
                      maxWidth: 400,
                    }}
                  >
                    <span style={{ marginRight: 7 }}>{field}</span>
                    <span
                      onMouseDown={e => handleResizeStart(field, e)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 8,
                        height: '100%',
                        cursor: 'col-resize',
                        zIndex: 10,
                        userSelect: 'none',
                        background: 'transparent',
                        display: 'inline-block',
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Placeholder for participant rows */}
              {participants.map((p, idx) => (
                <React.Fragment key={p.id}>
                  <tr style={{ transition: 'background 0.14s', cursor: 'pointer', borderRadius: 8 }} onClick={() => setEditParticipant(p)}>
                    {orderedFields.map((field, fidx) => {
                      const dbKey = fieldMap[field] || field;
                      let value = p[dbKey];
                      if (field === 'Additional Participants') {
                        value = Array.isArray(p.additional_participants) ? p.additional_participants.length : 0;
                      } else {
                        if (Array.isArray(value)) value = value.join(', ');
                        if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
                      }
                      // Center First Name and Last Name
                      const isCenter = field === 'First Name' || field === 'Last Name';
                      return (
                        <td
                          key={field + '-' + fidx}
                          style={{
                            padding: '9px 8px',
                            fontSize: 13,
                            color: '#374151',
                            background: '#fff',
                            borderBottom: '1px solid #e5e7eb',
                            whiteSpace: 'nowrap',
                            maxWidth: colWidths[field],
                            minWidth: 60,
                            width: colWidths[field],
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            borderRadius: fidx === 0 ? '0 0 0 10px' : fidx === orderedFields.length - 1 ? '0 0 10px 0' : 0,
                            fontWeight: 500,
                            transition: 'background 0.14s',
                            borderRight: fidx !== orderedFields.length - 1 ? '1px solid #f1f1f1' : undefined,
                            textAlign: 'center',
                          }}
                        >
                          {value || ''}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Render additional participants as italicized rows */}
                  {Array.isArray(p.additional_participants) && p.additional_participants.length > 0 && p.additional_participants.map((ap: any, apIdx: number) => (
                    <tr key={p.id + '-ap-' + apIdx} style={{ fontStyle: 'italic', background: '#f8fafc' }} onClick={() => setEditAdditional({ mainId: p.id, index: apIdx, data: ap })}>
                      {orderedFields.map((field, fidx) => {
                        const dbKey = fieldMap[field] || field;
                        let value = ap[dbKey];
                        if (Array.isArray(value)) value = value.join(', ');
                        if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
                        // Center First Name and Last Name
                        const isCenter = field === 'First Name' || field === 'Last Name';
                        return (
                          <td
                            key={field + '-ap-' + fidx}
                            style={{
                              padding: '9px 8px',
                              fontSize: 13,
                              color: '#6366f1',
                              background: '#f8fafc',
                              borderBottom: '1px solid #e5e7eb',
                              whiteSpace: 'nowrap',
                              maxWidth: colWidths[field],
                              minWidth: 60,
                              width: colWidths[field],
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              borderRadius: fidx === 0 ? '0 0 0 10px' : fidx === orderedFields.length - 1 ? '0 0 10px 0' : 0,
                              fontWeight: 400,
                              fontStyle: 'italic',
                              borderRight: fidx !== orderedFields.length - 1 ? '1px solid #f1f1f1' : undefined,
                              textAlign: 'center',
                            }}
                          >
                            {value || ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Settings Modal (UI only, with logic for custom fields, visibility, order, and views) */}
      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', padding: 24, minWidth: 380, maxWidth: 440, width: '100%', position: 'relative', fontSize: 14 }}>
            <button onClick={handleSettingsClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, color: '#222', cursor: 'pointer', zIndex: 10 }}>&times;</button>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderBottom: '1.5px solid #e5e7eb' }}>
              <button onClick={() => setSettingsTab('table')} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: settingsTab === 'table' ? '3px solid #6366f1' : 'none', color: settingsTab === 'table' ? '#6366f1' : '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'color 0.2s' }}>Table Settings</button>
              <button onClick={() => setSettingsTab('stats')} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: settingsTab === 'stats' ? '3px solid #6366f1' : 'none', color: settingsTab === 'stats' ? '#6366f1' : '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'color 0.2s' }}>Stat Blocks</button>
            </div>
            {/* Tab Content */}
            {settingsTab === 'table' && (
              <>
                {/* Custom Fields */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Custom Fields</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Field label"
                      value={newField.label}
                      onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                      style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, flex: 1 }}
                    />
                    <select
                      value={newField.type}
                      onChange={e => setNewField(f => ({ ...f, type: e.target.value as CustomField['type'] }))}
                      style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}
                    >
                      <option value="text">Text</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    {newField.type === 'dropdown' && (
                      <input
                        type="text"
                        placeholder="Options (comma separated)"
                        value={newField.options}
                        onChange={e => setNewField(f => ({ ...f, options: e.target.value }))}
                        style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, flex: 1 }}
                      />
                    )}
                    <button onClick={handleAddCustomField} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#f4f6fb', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Add</button>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {customFields.map(f => (
                      <li key={f.id} style={{ marginBottom: 4, display: 'flex', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ marginRight: 8 }}>{f.label} ({f.type})</span>
                        <button onClick={() => handleDeleteCustomField(f.id)} style={{ marginLeft: 8, color: '#db2777', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Delete</button>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Field Visibility and Reorder */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Field Visibility & Order</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', border: '1px solid #e5e7eb', borderRadius: 6, background: '#f8fafc' }}>
                    {visibleFields.map((field, idx) => (
                      <li
                        key={field}
                        draggable
                        onDragStart={() => handleFieldDragStart(field)}
                        onDrop={() => handleFieldDrop(field)}
                        onDragOver={handleFieldDragOver}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px 10px',
                          borderBottom: idx !== visibleFields.length - 1 ? '1px solid #e5e7eb' : undefined,
                          background: '#fff',
                          cursor: 'grab',
                          fontSize: 13,
                          userSelect: 'none',
                          borderRadius: idx === 0 ? '6px 6px 0 0' : idx === visibleFields.length - 1 ? '0 0 6px 6px' : 0,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={visibleFields.includes(field)}
                          onChange={() => handleToggleField(field)}
                          style={{ marginRight: 8 }}
                        />
                        <span style={{ flex: 1 }}>{field}</span>
                        <span style={{ fontSize: 15, color: '#bbb', marginLeft: 8, cursor: 'grab' }}>☰</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Saved Views */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Saved Views</div>
                  {viewsLoading ? (
                    <div>Loading views...</div>
                  ) : views.length === 0 ? (
                    <div>No views found.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f4f6fb' }}>
                          <th style={{ padding: '5px 0', fontWeight: 500 }}>View</th>
                          <th style={{ padding: '5px 0', fontWeight: 500 }}>Select</th>
                          <th style={{ padding: '5px 0', fontWeight: 500 }}>Default</th>
                          <th style={{ padding: '5px 0', fontWeight: 500 }}>Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {views.map(v => (
                          <tr key={v.name} style={{ background: currentView === v.name ? '#e0e7ff' : '#fff' }}>
                            <td style={{ padding: '5px 0', textAlign: 'center' }}>{v.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={currentView === v.name}
                                onChange={() => handleSelectView(v.name)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={v.isDefault}
                                onChange={() => handleSetDefaultView(v.name)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => handleDeleteView(v.name)} style={{ color: '#db2777', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="View name"
                      value={viewNameInput}
                      onChange={e => setViewNameInput(e.target.value)}
                      style={{ marginRight: 8, padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}
                    />
                    <button onClick={() => handleSaveView(viewNameInput)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#f4f6fb', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Save</button>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Child Participant Exclusion Age</div>
                  <input
                    type="number"
                    min={0}
                    value={childExclusionAge}
                    onChange={e => setChildExclusionAge(Number(e.target.value))}
                    style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, width: 80 }}
                  />
                  <span style={{ marginLeft: 8, color: '#888', fontSize: 13 }}>
                    Children at or below this age are excluded from participant stats.
                  </span>
                </div>
              </>
            )}
            {settingsTab === 'stats' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Stat Blocks</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {allStatFields.map(field => {
                    const custom = customFields.find(f => f.label === field);
                    if (specialStatFields.includes(field)) {
                      return (
                        <li key={field} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                          <input type="checkbox" checked={!!statsConfig.find(s => s.field === field)} onChange={e => {
                            if (e.target.checked) setStatsConfig(cfg => [...cfg, { field, type: 'count' }]);
                            else setStatsConfig(cfg => cfg.filter(s => s.field !== field));
                          }} />
                          <span style={{ marginLeft: 8 }}>{field}</span>
                        </li>
                      );
                    }
                    if (custom && custom.type === 'checkbox') {
                      return (
                        <React.Fragment key={field}>
                          <li style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                            <input type="checkbox" checked={!!statsConfig.find(s => s.field === field && s.type === 'checkbox-true')} onChange={e => {
                              if (e.target.checked) setStatsConfig(cfg => [...cfg, { field, type: 'checkbox-true' }]);
                              else setStatsConfig(cfg => cfg.filter(s => !(s.field === field && s.type === 'checkbox-true')));
                            }} />
                            <span style={{ marginLeft: 8 }}>Count Checked: {field}</span>
                          </li>
                          <li style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                            <input type="checkbox" checked={!!statsConfig.find(s => s.field === field && s.type === 'checkbox-false')} onChange={e => {
                              if (e.target.checked) setStatsConfig(cfg => [...cfg, { field, type: 'checkbox-false' }]);
                              else setStatsConfig(cfg => cfg.filter(s => !(s.field === field && s.type === 'checkbox-false')));
                            }} />
                            <span style={{ marginLeft: 8 }}>Count Unchecked: {field}</span>
                          </li>
                        </React.Fragment>
                      );
                    }
                    return (
                      <li key={field} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                        <input type="checkbox" checked={!!statsConfig.find(s => s.field === field && s.type === 'count')} onChange={e => {
                          if (e.target.checked) setStatsConfig(cfg => [...cfg, { field, type: 'count' }]);
                          else setStatsConfig(cfg => cfg.filter(s => !(s.field === field && s.type === 'count')));
                        }} />
                        <span style={{ marginLeft: 8 }}>Count: {field}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <button onClick={handleSettingsClose} style={{ background: '#f4f6fb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, padding: '7px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 12, width: '100%' }}>Close</button>
            {notification && (
              <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', background: '#e0e7ff', color: '#374151', borderRadius: 6, padding: '7px 18px', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(60,120,180,0.08)', marginTop: 12, textAlign: 'center' }}>{notification}</div>
            )}
          </div>
        </div>
      )}
      {showForm && account && !editParticipant && !editAdditional && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
            <ParticipantForm
              accountInstanceId={account.id}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              tagList={tagList}
              setTagList={setTagList}
            />
          </div>
        </div>
      )}
      {editParticipant && account && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
            <ParticipantForm
              accountInstanceId={account.id}
              initialData={editParticipant}
              isEdit={true}
              onDelete={async () => { setEditParticipant(null); fetchParticipants(); }}
              onSuccess={() => { setEditParticipant(null); fetchParticipants(); }}
              onCancel={() => setEditParticipant(null)}
              tagList={tagList}
              setTagList={setTagList}
            />
          </div>
        </div>
      )}
      {editAdditional && account && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
            <ParticipantForm
              accountInstanceId={account.id}
              initialData={editAdditional.data}
              isEdit={true}
              isAdditional={true}
              mainParticipantId={editAdditional.mainId}
              additionalIndex={editAdditional.index}
              onDelete={async () => { setEditAdditional(null); fetchParticipants(); }}
              onSuccess={() => { setEditAdditional(null); fetchParticipants(); }}
              onCancel={() => setEditAdditional(null)}
              tagList={tagList}
              setTagList={setTagList}
            />
          </div>
        </div>
      )}
    </>
  );
} 