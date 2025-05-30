"use client";
import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../../src/lib/supabase';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Typography, Box } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';

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
  const [settingsTab, setSettingsTab] = useState<'table' | 'stats' | 'customField'>('table');
  // Add a separate state for the view name input
  const [viewNameInput, setViewNameInput] = useState('');
  const [viewsLoading, setViewsLoading] = useState(false);
  // 1. Add new state for selected views, default view, and views to delete
  const [selectedViewIds, setSelectedViewIds] = useState<string[]>([]);
  const [pendingDefaultViewId, setPendingDefaultViewId] = useState<string | null>(null);
  const [viewsToDelete, setViewsToDelete] = useState<string[]>([]);
  // Add state for editing view
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

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
    // Get all account_instances for this user (should only be one)
    let { data: accounts, error: accErr } = await supabase
      .from('account_instances')
      .select('id')
      .eq('owner_user_id', session.user.id);
    if (accErr) return;
    let account = null;
    if (accounts && accounts.length > 0) {
      // Use the first account_instance if multiple exist (should not happen if DB is correct)
      account = accounts[0];
      if (accounts.length > 1) {
        console.warn('Multiple account_instances found for user:', session.user.id, accounts);
      }
    } else {
      // Only create if none exists
      const insertObj = { name: session.user.email || 'My Account', owner_user_id: session.user.id };
      const { data: newAcc, error: newAccErr } = await supabase
        .from('account_instances')
        .insert([insertObj])
        .select('id')
        .single();
      if (newAccErr) return;
      account = newAcc;
    }
    setAccount(account);
    // Fetch main participants for this account_instance
    const { data: mainParticipants, error: mainErr } = await supabase
      .from('participants')
      .select('*')
      .eq('account_instance_id', account.id);
    if (mainErr) return;
    // Fetch all additional participants for this account_instance
    const { data: allAdditional, error: addErr } = await supabase
      .from('additional_participants')
      .select('*')
      .eq('account_instance_id', account.id);
    if (addErr) return;
    // Group additional participants by main_participant_id
    const additionalByMain: Record<string, any[]> = {};
    (allAdditional || []).forEach(ap => {
      if (!additionalByMain[ap.main_participant_id]) additionalByMain[ap.main_participant_id] = [];
      additionalByMain[ap.main_participant_id].push(ap);
    });
    // Attach to main participants
    const participantsWithAdditional = (mainParticipants || []).map(mp => ({
      ...mp,
      additional_participants: (additionalByMain[mp.id] || []).map(ap => ({
        ...ap,
        isChild: ap.is_child,
        childAge: ap.child_age,
      })),
    }));
    setParticipants(participantsWithAdditional);
  }

  useEffect(() => {
    fetchParticipants();
  }, []);

  // Add handleAddAdditional function
  const handleAddAdditional = async (additional: any) => {
    if (!mainParticipantId || !account?.id) {
      setAdditionalError('Please save the main participant before adding additional participants.');
      setTimeout(() => setAdditionalError(null), 2000);
      return;
    }
    // Map camelCase to snake_case for DB and strip frontend-only fields
    const { isChild, childAge, _rowType, _apIndex, isExpanded, id: _id, ...rest } = additional;
    const dbAdditional = {
      ...rest,
      is_child: isChild,
      child_age: childAge,
      main_participant_id: mainParticipantId,
      account_instance_id: account.id,
    };
    console.log('Inserting additional_participant:', dbAdditional); // Debug log
    const { error: insertErr } = await supabase
      .from('additional_participants')
      .insert([dbAdditional]);
    if (insertErr) {
      setAdditionalError('Could not save additional participant.');
      setTimeout(() => setAdditionalError(null), 2000);
      return;
    }
    setAdditionalSaved(true);
    setTimeout(() => setAdditionalSaved(false), 3000);
    await fetchParticipants();
  };

  // Edit an additional participant
  const handleEditAdditional = async (id: string, updated: any) => {
    const { isChild: updIsChild, childAge: updChildAge, ...updRest } = updated;
    // Strip frontend-only fields
    const { _rowType, _apIndex, isExpanded, id: _id, ...dbFields } = updRest;
    const dbUpdate = {
      ...dbFields,
      is_child: updIsChild,
      child_age: updChildAge,
    };
    console.log('Updating additional_participant:', dbUpdate); // Debug log
    const { error: updateErr } = await supabase
      .from('additional_participants')
      .update(dbUpdate)
      .eq('id', id);
    if (updateErr) {
      setAdditionalError('Could not update additional participant.');
      setTimeout(() => setAdditionalError(null), 2000);
      return;
    }
    await fetchParticipants();
  };

  // Delete an additional participant
  const handleDeleteAdditional = async (id: string) => {
    const { error: deleteErr } = await supabase
      .from('additional_participants')
      .delete()
      .eq('id', id);
    if (deleteErr) {
      setAdditionalError('Could not delete additional participant.');
      setTimeout(() => setAdditionalError(null), 2000);
      return;
    }
    await fetchParticipants();
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

  // Helper to flatten participants and additional participants for DataGrid
  const getDataGridRows = () => {
    const rows: any[] = [];
    participants.forEach((p) => {
      rows.push({
        ...p,
        _rowType: 'main',
        isExpanded: expandedRows.includes(p.id),
      });
      if (expandedRows.includes(p.id) && Array.isArray(p.additional_participants)) {
        p.additional_participants.forEach((ap: any, idx: number) => {
          rows.push({
            ...ap,
            isChild: ap.is_child ?? ap.isChild ?? false,
            childAge: ap.child_age ?? ap.childAge ?? '',
            is_child: ap.is_child ?? ap.isChild ?? false,
            child_age: ap.child_age ?? ap.childAge ?? '',
            _rowType: 'additional',
            _apIndex: idx,
            id: ap.id, // Use the real UUID from the DB
          });
        });
      }
    });
    return rows;
  };

  // DataGrid columns based on orderedFields
  const columns: GridColDef[] = [
    {
      field: 'expand',
      headerName: '',
      width: 40,
      sortable: false,
      filterable: false,
      renderCell: (params: any) => {
        if (params.row._rowType !== 'main') return null;
        // Only show expand/collapse if there are additional participants
        if (!Array.isArray(params.row.additional_participants) || params.row.additional_participants.length === 0) return null;
        const isExpanded = expandedRows.includes(params.row.id);
        return (
          <button
            onClick={e => {
              e.stopPropagation();
              handleToggleExpand(params.row.id);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, margin: 0 }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
          </button>
        );
      },
    },
    // Only include real participant fields and custom fields, never client-only fields like _mainId, _rowType, _apIndex, isExpanded
    ...orderedFields
      .filter(field => !['_mainId', '_rowType', '_apIndex', 'isExpanded'].includes(field))
      .map((field) => ({
        field: fieldMap[field] || field,
        headerName: field,
        flex: 1,
        minWidth: colWidths[field] || 120,
        renderCell: (params: any) => {
          if ((field === 'Additional Participants' || fieldMap[field] === 'additional_participants') && params.row._rowType === 'main') {
            const count = Array.isArray(params.row.additional_participants) ? params.row.additional_participants.length : 0;
            return (
              <span style={{ fontWeight: 600, color: '#6366f1', textAlign: 'center', width: '100%' }}>
                {count > 0 ? count : ''}
              </span>
            );
          }
          let value = params.value;
          if (Array.isArray(value)) value = value.join(', ');
          if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
          return (
            <span
              style={{
                fontStyle: params.row._rowType === 'additional' ? 'italic' : 'normal',
                color: params.row._rowType === 'additional' ? '#6366f1' : '#374151',
                marginLeft: params.row._rowType === 'additional' ? 24 : 0,
                fontSize: params.row._rowType === 'additional' ? '87%' : '100%',
              }}
            >
              {value || ''}
            </span>
          );
        },
      })),
  ];

  // 2. When views are loaded, update selectedViewIds and pendingDefaultViewId
  useEffect(() => {
    if (views.length > 0) {
      setSelectedViewIds(views.map(v => v.id)); // All views selected by default
      const defaultView = views.find(v => v.isDefault);
      setPendingDefaultViewId(defaultView ? defaultView.id : null);
    }
  }, [views]);

  // 3. Add handler for checkbox select, default select, delete mark
  const handleViewCheckbox = (id: string) => {
    setSelectedViewIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };
  const handleDefaultCheckbox = (id: string) => {
    setPendingDefaultViewId(id);
  };
  const handleMarkDeleteView = (id: string) => {
    setViewsToDelete(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
    // Also unselect and unset as default if deleted
    setSelectedViewIds(prev => prev.filter(v => v !== id));
    if (pendingDefaultViewId === id) setPendingDefaultViewId(null);
  };

  // 4. Save all changes at once
  const handleSaveViewsSettings = async () => {
    if (!account?.id) return;
    // Delete marked views
    for (const id of viewsToDelete) {
      await supabase.from('views').delete().eq('id', id);
    }
    // Set default (only one)
    for (const v of views) {
      if (!viewsToDelete.includes(v.id)) {
        await supabase.from('views').update({ isDefault: v.id === pendingDefaultViewId }).eq('id', v.id);
      }
    }
    // Optionally, could also update a 'selected' property if needed
    await fetchViews(account.id);
    setViewsToDelete([]);
    setNotification('Settings saved!');
    setTimeout(() => setNotification(null), 1800);
  };

  // 5. On page load, always apply the default view if set
  useEffect(() => {
    if (views.length > 0 && !currentView) {
      const defaultView = views.find(v => v.isDefault);
      if (defaultView) {
        handleSelectView(defaultView.name);
      }
    }
    // eslint-disable-next-line
  }, [views]);

  // Handler for starting edit
  const handleEditView = (id: string) => {
    const view = views.find(v => v.id === id);
    if (view) {
      setEditingViewId(id);
      setViewNameInput(view.name);
      setFieldOrder(view.fields);
      setVisibleFields(view.visible);
      setStatsConfig(view.statsConfig || []);
      setCustomFields(view.customFields || []);
      setChildExclusionAge(view.childExclusionAge || 5);
    }
  };
  // Handler for saving (new or edit)
  const handleSaveViewWithName = async () => {
    if (!account?.id) return;
    if (!viewNameInput.trim()) {
      setNotification('Please enter a view name.');
      setTimeout(() => setNotification(null), 1800);
      return;
    }
    const isEdit = !!editingViewId;
    const viewObj = {
      account_instance_id: account.id,
      name: viewNameInput.trim(),
      fields: fieldOrder,
      visible: visibleFields,
      isDefault: false, // default is set separately
      statsConfig,
      customFields,
      childExclusionAge,
      ...(isEdit ? { id: editingViewId } : {}),
    };
    if (isEdit) {
      // If renaming, delete old if name changed
      const oldView = views.find(v => v.id === editingViewId);
      if (oldView && oldView.name !== viewNameInput.trim()) {
        await supabase.from('views').delete().eq('id', oldView.id);
      }
    }
    const { error } = await supabase.from('views').upsert([viewObj], { onConflict: 'account_instance_id,name' });
    if (error) {
      setNotification('Error saving view: ' + error.message);
      return;
    }
    await fetchViews(account.id);
    setCurrentView(viewNameInput.trim());
    setViewNameInput('');
    setEditingViewId(null);
    setNotification('View saved!');
    setTimeout(() => setNotification(null), 1800);
  };
  const handleCancelEditView = () => {
    setEditingViewId(null);
    setViewNameInput('');
  };

  const handleToggleExpand = (participantId: string) => {
    setExpandedRows(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  return (
    <>
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
      {/* Table Title */}
      <div style={{
        width: '100%',
        marginTop: 32,
        marginBottom: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        paddingLeft: 32,
        paddingRight: 32,
        boxSizing: 'border-box',
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed', marginTop: 0, marginBottom: 0, letterSpacing: 0.2 }}>
          Invite Management
        </h2>
        {/* Locked padding below title */}
        <div style={{ width: '100%', height: 32, minHeight: 32, maxHeight: 32, pointerEvents: 'none', userSelect: 'none' }} />
        {/* Stat Blocks Gap/Area, centered and fixed height only if stat blocks exist */}
        <div style={{
          width: '100%',
          height: 146,
          minHeight: 146,
          maxHeight: 146,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          boxSizing: 'border-box',
          overflow: 'hidden',
          transition: 'height 0.2s',
        }}>
          {statsConfig.length > 0 && statsConfig.map((stat, idx) => (
            <div key={idx} style={{ minWidth: 220, maxWidth: 220, height: 110, background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px rgba(60,120,180,0.10)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12, border: '1.5px solid #e5e7eb', transition: 'box-shadow 0.2s', fontWeight: 700, overflow: 'hidden', wordBreak: 'break-word', textAlign: 'center' }}>
              <div style={{ fontSize: 16, color: '#6366f1', fontWeight: 700, marginBottom: 8, letterSpacing: 0.2, width: '100%', wordBreak: 'break-word', whiteSpace: 'pre-line', textAlign: 'center', minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stat.field}</div>
              <div style={{ fontSize: 38, fontWeight: 800, color: '#374151', letterSpacing: 0.5, width: '100%', textAlign: 'center', wordBreak: 'break-word', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getStatValue(stat)}</div>
            </div>
          ))}
        </div>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ width: '100%', maxWidth: 1600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* New button layout: Settings left, Add center, Refresh right */}
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
                flex: '0 0 auto',
                minWidth: 120,
                alignSelf: 'flex-start',
              }}
            >
              ⚙️ Settings
            </button>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleAddClick}
                style={{
                  background: 'linear-gradient(90deg, #6366f1 0%, #db2777 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 54px', // 3x longer than before
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 6px rgba(99,102,241,0.08)',
                  letterSpacing: 0.2,
                  transition: 'background 0.2s',
                  minWidth: 270,
                  maxWidth: 400,
                }}
              >
                + Add Participant
              </button>
            </div>
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
                minWidth: 120,
                alignSelf: 'flex-end',
              }}
              disabled={refreshing}
            >
              {refreshing ? <span className="spinner" style={{ width: 16, height: 16, border: '2px solid #6366f1', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} /> : '⟳'}
              Refresh
            </button>
          </div>
        </div>
      </div>
      {/* Table container: stretches end to end with gap on sides and bottom */}
      <div
        className="horizontal-scroll-container"
        style={{
          width: 'auto',
          height: 'calc(70vh)', // Fill most of the viewport height
          margin: '0 24px',
          paddingBottom: 32,
          background: 'transparent',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          overflowX: 'auto',
          overflowY: 'auto',
          minHeight: 60,
          WebkitOverflowScrolling: 'touch',
          maxHeight: '70vh',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>
          <div
            style={{
              borderRadius: '0 0 32px 32px',
              boxShadow: '0 4px 24px rgba(60, 120, 180, 0.08)',
              background: '#fff',
              overflow: 'hidden',
              border: '1.2px solid #e5e7eb',
              marginBottom: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              width: '100%',
              height: '100%',
            }}
          >
            <DataGrid
              rows={getDataGridRows()}
              columns={columns}
              getRowId={(row) => row.id || `${row.main_participant_id}-ap-${row._apIndex}`}
              hideFooter
              disableRowSelectionOnClick
              onRowClick={(params) => {
                if (params.row._rowType === 'main') {
                  setEditParticipant(params.row);
                } else if (params.row._rowType === 'additional') {
                  setEditAdditional({ mainId: params.row.main_participant_id, index: params.row._apIndex, data: params.row });
                }
              }}
              getRowClassName={(params) => params.row._rowType === 'additional' ? 'additional-participant-row' : ''}
              getRowHeight={(params: any) => params.model._rowType === 'additional' ? 35 : 50}
              sx={{
                '& .additional-participant-row': {
                  fontStyle: 'italic',
                  background: '#f8fafc',
                  color: '#6366f1',
                  borderBottom: '1px solid #bdbdbd',
                },
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                },
                '& .MuiDataGrid-cell': {
                  borderRight: '1px solid #f1f1f1',
                  borderBottom: 'none',
                  borderTop: 'none',
                },
                '& .MuiDataGrid-cell:first-of-type': {
                  borderRight: 'none',
                  borderTop: 'none',
                  borderBottom: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: '1px solid #e5e7eb',
                },
                '& .MuiDataGrid-columnHeader': {
                  borderRight: '1px solid #e5e7eb',
                },
                '& .MuiDataGrid-virtualScrollerRenderZone': {
                  borderBottom: 'none',
                },
                '& .MuiDataGrid-row:not(:last-child)': {
                  borderBottom: 'none',
                },
                fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
                fontSize: 14,
                color: '#222',
                background: 'transparent',
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        </div>
      </div>
      {showForm && account && !editParticipant && !editAdditional && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
            <ParticipantForm
              accountInstanceId={account.id}
              isEdit={false}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              tagList={tagList}
              setTagList={setTagList}
              customFields={customFields}
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
              onDelete={async () => {
                console.log("Delete clicked for participant", editParticipant?.id);
                if (!editParticipant?.id) return;
                const { error } = await supabase.from('participants').delete().eq('id', editParticipant.id);
                if (!error) {
                  setEditParticipant(null);
                  await fetchParticipants();
                } else {
                  console.error("Failed to delete participant:", error.message);
                }
              }}
              onSuccess={() => { setEditParticipant(null); fetchParticipants(); }}
              onCancel={() => setEditParticipant(null)}
              tagList={tagList}
              setTagList={setTagList}
              customFields={customFields}
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
              onDelete={async () => {
                console.log("Delete clicked for additional participant", editAdditional?.data?.id);
                if (!editAdditional?.data?.id) return;
                const { error } = await supabase.from('additional_participants').delete().eq('id', editAdditional.data.id);
                if (!error) {
                  setEditAdditional(null);
                  await fetchParticipants();
                } else {
                  console.error("Failed to delete additional participant:", error.message);
                }
              }}
              onSuccess={() => { setEditAdditional(null); fetchParticipants(); }}
              onCancel={() => setEditAdditional(null)}
              tagList={tagList}
              setTagList={setTagList}
              customFields={customFields}
            />
          </div>
        </div>
      )}
      {showAddAdditional && account && mainParticipantId && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
              <ParticipantForm
                accountInstanceId={account.id}
                isAdditional={true}
                mainParticipantId={mainParticipantId}
                onSuccess={async () => { setShowAddAdditional(false); await fetchParticipants(); }}
                onCancel={() => setShowAddAdditional(false)}
                tagList={tagList}
                setTagList={setTagList}
                customFields={customFields}
              />
            </div>
          </div>
        </>
      )}
      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleSettingsClose}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', padding: 24, minWidth: 380, maxWidth: 440, width: '100%', position: 'relative', fontSize: 14, zIndex: 2110 }} onClick={e => e.stopPropagation()}>
            <button onClick={handleSettingsClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, color: '#222', cursor: 'pointer', zIndex: 10 }}>&times;</button>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderBottom: '1.5px solid #e5e7eb' }}>
              <button onClick={() => setSettingsTab('table')} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: settingsTab === 'table' ? '3px solid #6366f1' : 'none', color: settingsTab === 'table' ? '#6366f1' : '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'color 0.2s' }}>Table Settings</button>
              <button onClick={() => setSettingsTab('customField')} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: settingsTab === 'customField' ? '3px solid #6366f1' : 'none', color: settingsTab === 'customField' ? '#6366f1' : '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'color 0.2s' }}>Custom Field</button>
              <button onClick={() => setSettingsTab('stats')} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: settingsTab === 'stats' ? '3px solid #6366f1' : 'none', color: settingsTab === 'stats' ? '#6366f1' : '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'color 0.2s' }}>Stat Blocks</button>
            </div>
            {/* Tab Content */}
            {settingsTab === 'table' && (
              <>
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
            {settingsTab === 'customField' && (
              <>
                {/* Custom Fields */}
                <div style={{ marginBottom: 14, maxHeight: 260, overflowY: 'auto' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Custom Fields</div>
                  <AddCustomFieldForm
                    newField={newField}
                    setNewField={setNewField}
                    onAdd={handleAddCustomField}
                  />
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {customFields.map(f => (
                      <CustomFieldListItem
                        key={f.id}
                        field={f}
                        onDelete={handleDeleteCustomField}
                        onEdit={handleEditCustomField}
                      />
                    ))}
                  </ul>
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
            {/* Saved Views: always visible below tab content */}
            <div style={{ marginBottom: 14, marginTop: 12, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
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
            <button onClick={handleSettingsClose} style={{ background: '#f4f6fb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, padding: '7px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 12, width: '100%' }}>Close</button>
            {notification && (
              <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', background: '#e0e7ff', color: '#374151', borderRadius: 6, padding: '7px 18px', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(60,120,180,0.08)', marginTop: 12, textAlign: 'center' }}>{notification}</div>
            )}
          </div>
        </div>
      )}
      <style>{`
        .horizontal-scroll-container::-webkit-scrollbar {
          height: 12px;
          background: #f3f4f6;
        }
        .horizontal-scroll-container::-webkit-scrollbar-thumb {
          background: #a5b4fc;
          border-radius: 6px;
        }
        .horizontal-scroll-container::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 6px;
        }
        .horizontal-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: #a5b4fc #f3f4f6;
        }
      `}</style>
    </>
  );
}

function CustomFieldListItem({ field, onDelete, onEdit }: { field: CustomField, onDelete: (id: string) => void, onEdit: (id: string, label: string, type: CustomField['type'], options: string) => void }) {
  const [editing, setEditing] = React.useState(false);
  const [label, setLabel] = React.useState(field.label);
  const [type, setType] = React.useState(field.type);
  const [optionsArr, setOptionsArr] = React.useState<string[]>(field.options ? [...field.options] : []);
  React.useEffect(() => {
    setLabel(field.label);
    setType(field.type);
    setOptionsArr(field.options ? [...field.options] : []);
  }, [field]);
  if (!editing) {
    return (
      <li style={{ marginBottom: 4, display: 'flex', alignItems: 'center', fontSize: 13 }}>
        <span style={{ marginRight: 8 }}>{field.label} ({field.type}{field.type === 'dropdown' && field.options ? ': ' + field.options.join(', ') : ''})</span>
        <button onClick={() => setEditing(true)} style={{ marginLeft: 8, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Edit</button>
        <button onClick={() => onDelete(field.id)} style={{ marginLeft: 8, color: '#db2777', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Delete</button>
      </li>
    );
  }
  return (
    <li style={{ marginBottom: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: 13, background: '#f4f6fb', borderRadius: 6, padding: '8px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, marginRight: 6, minWidth: 80 }}
        />
        <select
          value={type}
          onChange={e => setType(e.target.value as CustomField['type'])}
          style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, marginRight: 6 }}
        >
          <option value="text">Text</option>
          <option value="dropdown">Dropdown</option>
          <option value="checkbox">Checkbox</option>
        </select>
      </div>
      {type === 'dropdown' && (
        <div style={{ marginTop: 8, width: '100%' }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Dropdown Options:</div>
          {optionsArr.map((opt, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <input
                type="text"
                value={opt}
                onChange={e => {
                  const newArr = [...optionsArr];
                  newArr[idx] = e.target.value;
                  setOptionsArr(newArr);
                }}
                style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, minWidth: 120 }}
              />
              <button
                onClick={() => setOptionsArr(arr => arr.filter((_, i) => i !== idx))}
                style={{ marginLeft: 6, color: '#db2777', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                title="Remove"
                onMouseOver={e => (e.currentTarget.style.background = '#fbeff2')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" stroke="#db2777" strokeWidth="1.5"/><path d="M7 7L13 13M13 7L7 13" stroke="#db2777" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}
          <button
            onClick={() => setOptionsArr(arr => [...arr, ''])}
            style={{ marginTop: 4, color: '#6366f1', background: 'none', border: '1px solid #6366f1', borderRadius: 4, cursor: 'pointer', fontSize: 13, padding: '2px 10px' }}
          >+ Add Option</button>
        </div>
      )}
      {type !== 'dropdown' && (
        <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0 0 0', width: '100%', height: 1 }} />
      )}
      {type !== 'dropdown' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 10 }}>
          <button
            onClick={() => { setEditing(false); onDelete(field.id); }}
            style={{ color: '#db2777', background: 'none', border: '1px solid #db2777', borderRadius: 4, cursor: 'pointer', fontSize: 13, padding: '2px 16px', fontWeight: 600 }}
          >Delete</button>
          <button
            onClick={() => {
              onEdit(field.id, label, type, '');
              setEditing(false);
            }}
            style={{ color: '#fff', background: 'linear-gradient(90deg, #6366f1 0%, #db2777 100%)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, padding: '2px 18px', fontWeight: 600 }}
          >Save</button>
        </div>
      )}
    </li>
  );
}

// Add this component above InvitePage
function AddCustomFieldForm({ newField, setNewField, onAdd }: { newField: { label: string; type: CustomField['type']; options: string }, setNewField: (f: any) => void, onAdd: () => void }) {
  const [optionsArr, setOptionsArr] = React.useState<string[]>(() => newField.type === 'dropdown' && newField.options ? newField.options.split(',').map(o => o.trim()).filter(Boolean) : []);
  React.useEffect(() => {
    if (newField.type === 'dropdown') {
      setOptionsArr(newField.options ? newField.options.split(',').map(o => o.trim()).filter(Boolean) : []);
    }
  }, [newField.type, newField.options]);
  const handleSave = () => {
    if (newField.type === 'dropdown') {
      setNewField((f: any) => ({ ...f, options: optionsArr.join(',') }));
    }
    onAdd();
    setOptionsArr([]);
  };
  const handleClear = () => {
    setNewField({ label: '', type: 'text', options: '' });
    setOptionsArr([]);
  };
  const canSave = newField.label.trim() && (newField.type !== 'dropdown' || optionsArr.filter(opt => opt.trim()).length > 0);
  return (
    <div style={{ marginBottom: 18, background: '#f8fafc', borderRadius: 6, padding: '10px 10px 0 10px', border: '1px solid #e5e7eb', maxWidth: 420 }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Field label"
          value={newField.label}
          onChange={e => setNewField((f: any) => ({ ...f, label: e.target.value }))}
          style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, marginRight: 6, minWidth: 80 }}
        />
        <select
          value={newField.type}
          onChange={e => setNewField((f: any) => ({ ...f, type: e.target.value as CustomField['type'], options: '' }))}
          style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, marginRight: 6 }}
        >
          <option value="text">Text</option>
          <option value="dropdown">Dropdown</option>
          <option value="checkbox">Checkbox</option>
        </select>
      </div>
      {newField.type === 'dropdown' && (
        <div style={{ width: '100%' }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Dropdown Options:</div>
          {optionsArr.map((opt, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <input
                type="text"
                value={opt}
                onChange={e => {
                  const newArr = [...optionsArr];
                  newArr[idx] = e.target.value;
                  setOptionsArr(newArr);
                }}
                style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, minWidth: 120 }}
              />
              <button
                onClick={() => setOptionsArr(arr => arr.filter((_, i) => i !== idx))}
                style={{ marginLeft: 6, color: '#db2777', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                title="Remove"
                onMouseOver={e => (e.currentTarget.style.background = '#fbeff2')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" stroke="#db2777" strokeWidth="1.5"/><path d="M7 7L13 13M13 7L7 13" stroke="#db2777" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}
          <button
            onClick={() => setOptionsArr(arr => [...arr, ''])}
            style={{ marginTop: 4, color: '#6366f1', background: 'none', border: '1px solid #6366f1', borderRadius: 4, cursor: 'pointer', fontSize: 13, padding: '2px 10px' }}
          >+ Add Option</button>
        </div>
      )}
      <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0 0 0', width: '100%', height: 1 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 10, marginBottom: 4 }}>
        <button
          onClick={handleClear}
          style={{ color: '#db2777', background: 'none', border: '1px solid #db2777', borderRadius: 4, cursor: 'pointer', fontSize: 13, padding: '2px 16px', fontWeight: 600 }}
        >Clear</button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{ color: canSave ? '#fff' : '#aaa', background: canSave ? 'linear-gradient(90deg, #6366f1 0%, #db2777 100%)' : '#e5e7eb', border: 'none', borderRadius: 4, cursor: canSave ? 'pointer' : 'not-allowed', fontSize: 13, padding: '2px 18px', fontWeight: 600 }}
        >Save</button>
      </div>
    </div>
  );
} 