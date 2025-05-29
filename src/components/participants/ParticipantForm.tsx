import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AdditionalParticipant {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  family: string;
  relationship: string;
  invited_by: string;
  tags: string[];
  events: string[];
  sub_events: string[];
  is_child?: boolean;
  child_age?: string;
}

const mockEvents = ["Wedding Day", "Reception", "Rehearsal Dinner"];
const mockSubEvents = ["Ceremony", "Cocktail Hour", "Dinner", "Dancing"];
const mockUsers = ["Alice", "Bob", "Charlie"];
const mockTags = ["Family", "VIP", "Friend", "Colleague"];

const initialAdditional: AdditionalParticipant = {
  first_name: '', last_name: '', email: '', phone: '', family: '', relationship: '', invited_by: '', tags: [], events: [], sub_events: []
};

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  family: '',
  relationship: '',
  invited_by: '',
  events: [] as string[],
  tags: [] as string[],
  sub_events: [] as string[],
  additional_participants: [] as AdditionalParticipant[],
  is_child: false,
  child_age: '',
};

function MultiSelectBubbles({ options, value, onChange, placeholder, color }: { options: string[]; value: string[]; onChange: (v: string[]) => void; placeholder: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, minHeight: 20, alignItems: 'center', background: '#f8fafc', borderRadius: 4, padding: 2 }}>
      {options.map(opt => (
        <span
          key={opt}
          onClick={() => value.includes(opt) ? onChange(value.filter(v => v !== opt)) : onChange([...value, opt])}
          style={{
            background: value.includes(opt) ? '#e5e7eb' : '#fff',
            color: '#444',
            borderRadius: 8,
            padding: '2px 7px',
            fontWeight: 400,
            fontSize: 11,
            cursor: 'pointer',
            userSelect: 'none',
            border: value.includes(opt) ? '1px solid #6366f1' : '1px solid #e5e7eb',
            transition: 'background 0.2s',
          }}
        >{opt}</span>
      ))}
      {value.length === 0 && <span style={{ color: '#a1a1aa', fontSize: 11 }}>{placeholder}</span>}
    </div>
  );
}

// Utility to strip frontend-only fields before DB operations
function stripFrontendFields(obj: any) {
  const { _rowType, _apIndex, isExpanded, ...dbFields } = obj;
  return dbFields;
}

// Utility to check for empty object
function isEmptyObject(obj: any) {
  return obj && typeof obj === 'object' && Object.keys(obj).length === 0 && obj.constructor === Object;
}

// Map form fields to DB columns for main and additional participants
const participantFieldMap = [
  'first_name', 'last_name', 'email', 'phone', 'family', 'relationship', 'invited_by',
  'tags', 'events', 'sub_events', 'custom_fields', 'account_instance_id'
];
const additionalFieldMap = [
  'first_name', 'last_name', 'email', 'phone', 'family', 'relationship', 'invited_by',
  'tags', 'events', 'sub_events', 'custom_fields', 'account_instance_id', 'main_participant_id', 'is_child', 'child_age'
];

export default function ParticipantForm({ accountInstanceId, onSuccess, onCancel, tagList, setTagList, initialData, isEdit, isAdditional, mainParticipantId, additionalIndex, onDelete, customFields = [] }: { accountInstanceId: string; onSuccess?: () => void; onCancel?: () => void; tagList: string[]; setTagList: (tags: string[]) => void; initialData?: any; isEdit?: boolean; isAdditional?: boolean; mainParticipantId?: string; additionalIndex?: number; onDelete?: () => void; customFields?: any[]; }) {
  const [form, setForm] = useState<typeof initialForm>(initialData ? { ...initialForm, ...initialData, is_child: initialData.is_child ?? false, child_age: initialData.child_age ?? '' } : initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdditionalModal, setShowAdditionalModal] = useState(false);
  const [additionalForm, setAdditionalForm] = useState<AdditionalParticipant>({ ...initialAdditional });
  const [additionalIsChild, setAdditionalIsChild] = useState(false);
  const [additionalChildAge, setAdditionalChildAge] = useState('');
  const [saved, setSaved] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<{ [key: string]: any }>(initialData?.custom_fields || {});
  const [dbAdditionalParticipants, setDbAdditionalParticipants] = useState<AdditionalParticipant[]>([]);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialForm,
        ...initialData,
        is_child: initialData.is_child ?? false,
        child_age: initialData.child_age ?? '',
      });
      setCustomFieldValues(initialData.custom_fields || {});
    }
  }, [initialData]);

  useEffect(() => {
    async function fetchAdditionalParticipants() {
      if (!isAdditional && initialData?.id) {
        const { data, error } = await supabase
          .from('additional_participants')
          .select('*')
          .eq('main_participant_id', initialData.id);
        if (!error && data) setDbAdditionalParticipants(data);
      }
    }
    fetchAdditionalParticipants();
  }, [initialData, isAdditional]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleMultiChange = (name: string, value: string[]) => {
    setForm({ ...form, [name]: value });
  };

  // Additional Participants
  const handleAddAdditional = () => {
    setAdditionalForm({ ...initialAdditional });
    setAdditionalIsChild(false);
    setAdditionalChildAge('');
    setShowAdditionalModal(true);
  };
  const handleAdditionalFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAdditionalForm({ ...additionalForm, [name]: value });
  };
  const handleAdditionalMultiChange = (name: string, value: string[]) => {
    setAdditionalForm({ ...additionalForm, [name]: value });
  };
  const handleAdditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!additionalForm.first_name || !additionalForm.last_name) return;
    if (!initialData?.id) return; // main participant must be saved first
    const newAp = {
      ...additionalForm,
      is_child: additionalIsChild,
      child_age: additionalIsChild ? additionalChildAge : undefined,
      main_participant_id: initialData.id,
      account_instance_id: accountInstanceId,
    };
    const { error } = await supabase.from('additional_participants').insert([newAp]);
    setLoading(false);
    if (error && error.message) {
      console.error('Insert additional_participants error:', error);
      setError(error.message);
    } else if (error && typeof error === 'object' && Object.keys(error).length > 0) {
      console.error('Insert additional_participants error (unknown object):', error);
      setError(typeof error === 'string' ? error : 'Unknown error');
    } else {
      setSaved(true);
      setTimeout(async () => {
        setSaved(false);
        setAdditionalForm({ ...initialAdditional });
        setAdditionalIsChild(false);
        setAdditionalChildAge('');
        setShowAdditionalModal(false);
        // Refresh list
        const { data } = await supabase
          .from('additional_participants')
          .select('*')
          .eq('main_participant_id', initialData.id);
        setDbAdditionalParticipants(data || []);
        if (onSuccess) onSuccess();
      }, 2000);
    }
  };
  const handleRemoveAdditional = async (idx: number) => {
    const ap = dbAdditionalParticipants[idx];
    if (!ap?.id) return;
    // Delete from additional_participants table by id
    const { error } = await supabase.from('additional_participants').delete().eq('id', ap.id);
    if (!error) {
      // Refresh list after deletion
      const { data } = await supabase
        .from('additional_participants')
        .select('*')
        .eq('main_participant_id', initialData.id);
      setDbAdditionalParticipants(data || []);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tagList.includes(newTag.trim())) {
      setTagList([...tagList, newTag.trim()]);
    }
    setNewTag('');
  };

  // Render custom fields
  const renderCustomFields = () => customFields.map((field: any) => {
    if (field.type === 'dropdown') {
      return (
        <select
          key={field.id}
          value={customFieldValues[field.label] || ''}
          onChange={e => setCustomFieldValues(v => ({ ...v, [field.label]: e.target.value }))}
          style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, marginBottom: 8 }}
        >
          <option value="">Select {field.label}</option>
          {(field.options || []).map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (field.type === 'checkbox') {
      return (
        <div key={field.id} style={{ marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={!!customFieldValues[field.label]}
            onChange={e => setCustomFieldValues(v => ({ ...v, [field.label]: e.target.checked }))}
            id={`cf_${field.id}`}
            style={{ width: 16, height: 16 }}
          />
          <label htmlFor={`cf_${field.id}`} style={{ marginLeft: 8 }}>{field.label}</label>
        </div>
      );
    }
    return (
      <input
        key={field.id}
        type="text"
        value={customFieldValues[field.label] || ''}
        onChange={e => setCustomFieldValues(v => ({ ...v, [field.label]: e.target.value }))}
        placeholder={field.label}
        style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, marginBottom: 8 }}
      />
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (isAdditional) {
      // Insert into additional_participants table
      const additionalData = stripFrontendFields({ ...form, main_participant_id: mainParticipantId, account_instance_id: accountInstanceId, ...(customFieldValues && Object.keys(customFieldValues).length > 0 ? { custom_fields: customFieldValues } : {}) });
      const { is_child, child_age, ...apRest } = additionalData;
      const additionalDataToInsert = additionalFieldMap.reduce((acc, key) => {
        if (apRest[key] !== undefined) acc[key] = apRest[key];
        return acc;
      }, {} as any);
      additionalDataToInsert.is_child = is_child;
      additionalDataToInsert.child_age = child_age ? Number(child_age) : null;
      const { error } = await supabase.from('additional_participants').insert([additionalDataToInsert]);
      setLoading(false);
      if (error && error.message) {
        console.error('Insert additional_participants error:', error);
        setError(error.message);
      } else if (error && typeof error === 'object' && Object.keys(error).length > 0) {
        console.error('Insert additional_participants error (unknown object):', error);
        setError(typeof error === 'string' ? error : 'Unknown error');
      } else {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setForm(initialForm);
          setCustomFieldValues({});
          if (onSuccess) onSuccess();
        }, 2000);
      }
      return;
    }
    // Main participant insert
    const participantData = stripFrontendFields({ ...form, account_instance_id: accountInstanceId, ...(customFieldValues && Object.keys(customFieldValues).length > 0 ? { custom_fields: customFieldValues } : {}) });
    const { is_child, child_age, ...rest } = participantData;
    const participantDataToInsert = participantFieldMap.reduce((acc, key) => {
      if (rest[key] !== undefined) acc[key] = rest[key];
      return acc;
    }, {} as any);
    participantDataToInsert.is_child = is_child;
    participantDataToInsert.child_age = child_age ? Number(child_age) : null;
    const { data, error } = await supabase.from('participants').insert([participantDataToInsert]);
    setLoading(false);
    if (error && error.message) {
      console.error('Insert participants error:', error);
      setError(error.message);
    } else if (error && typeof error === 'object' && Object.keys(error).length > 0) {
      console.error('Insert participants error (unknown object):', error);
      setError(typeof error === 'string' ? error : 'Unknown error');
    } else {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setForm(initialForm);
        setCustomFieldValues({});
        if (onSuccess) onSuccess();
      }, 2000);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (isAdditional && initialData?.id) {
      // Update additional_participants row
      const apUpdateData = stripFrontendFields({ ...form, custom_fields: customFieldValues });
      const { is_child, child_age, ...apUpdRest } = apUpdateData;
      const additionalUpdateData = additionalFieldMap.reduce((acc, key) => {
        if (apUpdRest[key] !== undefined) acc[key] = apUpdRest[key];
        return acc;
      }, {} as any);
      additionalUpdateData.is_child = is_child;
      additionalUpdateData.child_age = child_age ? Number(child_age) : null;
      console.log('Updating ID:', initialData.id); // Debug log
      const { error } = await supabase.from('additional_participants').update(additionalUpdateData).eq('id', initialData.id);
      setLoading(false);
      if (error && error.message) {
        console.error('Update additional_participants error:', error);
        setError(error.message);
      } else if (error && typeof error === 'object' && Object.keys(error).length > 0) {
        console.error('Update additional_participants error (unknown object):', error);
        setError(typeof error === 'string' ? error : 'Unknown error');
      } else {
        if (onSuccess) onSuccess();
      }
      return;
    }
    // Main participant update
    const updateData = stripFrontendFields({ ...form, custom_fields: customFieldValues });
    const { is_child, child_age, ...updRest } = updateData;
    const participantUpdateData = participantFieldMap.reduce((acc, key) => {
      if (updRest[key] !== undefined) acc[key] = updRest[key];
      return acc;
    }, {} as any);
    participantUpdateData.is_child = is_child;
    participantUpdateData.child_age = child_age ? Number(child_age) : null;
    const { error } = await supabase.from('participants').update(participantUpdateData).eq('id', initialData.id);
    setLoading(false);
    if (error && error.message) {
      console.error('Update participants error:', error);
      setError(error.message);
    } else if (error && typeof error === 'object' && Object.keys(error).length > 0) {
      console.error('Update participants error (unknown object):', error);
      setError(typeof error === 'string' ? error : 'Unknown error');
    } else {
      if (onSuccess) onSuccess();
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    if (!isAdditional && initialData?.id) {
      // Delete all additional participants for this main participant
      const { error: addErr } = await supabase
        .from('additional_participants')
        .delete()
        .eq('main_participant_id', initialData.id);
      // Delete the main participant
      const { error: mainErr } = await supabase
        .from('participants')
        .delete()
        .eq('id', initialData.id);
      setLoading(false);
      if (mainErr && mainErr.message) {
        console.error('Main participant delete error:', mainErr);
        setError(mainErr.message);
      } else if (mainErr && typeof mainErr === 'object' && Object.keys(mainErr).length > 0) {
        console.error('Main participant delete error (unknown object):', mainErr);
        setError('Could not delete participant (unknown error).');
      } else if (addErr && addErr.message) {
        console.error('Additional participants delete error:', addErr);
        setError(addErr.message);
        if (onDelete) onDelete();
      } else if (addErr && typeof addErr === 'object' && Object.keys(addErr).length > 0) {
        console.error('Additional participants delete error (unknown object):', addErr);
        setError('Participant deleted, but some additional members may not have been.');
        if (onDelete) onDelete();
      } else {
        if (onDelete) onDelete();
      }
      return;
    }
    if (isAdditional && initialData?.id) {
      // Delete only this additional participant
      const { error } = await supabase
        .from('additional_participants')
        .delete()
        .eq('id', initialData.id);
      setLoading(false);
      if (error && error.message) {
        console.error('Additional participant delete error:', error);
        setError(error.message);
      } else if (error && typeof error === 'object' && Object.keys(error).length > 0) {
        // Non-empty object, treat as unknown error
        console.error('Additional participant delete error (unknown object):', error);
        setError('Could not delete additional participant (unknown error).');
      } else {
        // error is null, undefined, or empty object: treat as success
        if (onDelete) onDelete();
      }
      return;
    }
  };

  // Add a helper to check if main participant is filled
  const mainFilled = form.first_name && form.last_name && form.email;

  return (
    <>
      <form onSubmit={isEdit ? handleUpdate : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, background: '#fff', borderRadius: 6, padding: 24, border: '1px solid #e5e7eb', marginBottom: 16, width: '100%', maxWidth: 540, minWidth: 340, position: 'relative' }}>
        {saved && <div style={{ position: 'absolute', top: 12, right: 18, color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 18 }}>✔</span>Saved</div>}
        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" required style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" required style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
        <input name="family" value={form.family} onChange={handleChange} placeholder="Family" style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
        <input name="relationship" value={form.relationship} onChange={handleChange} placeholder="Relationship" style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
        <select name="invited_by" value={form.invited_by} onChange={handleChange} style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}>
          <option value="">Invited By</option>
          {mockUsers.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <MultiSelectBubbles options={mockEvents} value={form.events} onChange={v => handleMultiChange('events', v)} placeholder="Select Events" color="#e5e7eb" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <MultiSelectBubbles options={tagList} value={form.tags} onChange={v => handleMultiChange('tags', v)} placeholder="Select Tags" color="#e5e7eb" />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add new tag" style={{ flex: 1, padding: 4, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 12 }} />
            <button type="button" onClick={handleAddTag} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#f4f6fb', fontWeight: 500, fontSize: 12, cursor: 'pointer' }}>Add</button>
          </div>
        </div>
        <MultiSelectBubbles options={mockSubEvents} value={form.sub_events} onChange={v => handleMultiChange('sub_events', v)} placeholder="Select Sub-Events" color="#e5e7eb" />
        {/* Only show additional participants section if not editing/adding an additional participant */}
        {!isAdditional && (
          <>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#444' }}>Additional Participants</span>
              <button
                type="button"
                onClick={handleAddAdditional}
                disabled={!mainFilled}
                title={!mainFilled ? 'Please fill in participant information first.' : ''}
                style={{ background: '#f4f4f5', color: '#444', fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 4, padding: '3px 10px', fontSize: 12, cursor: !mainFilled ? 'not-allowed' : 'pointer' }}
              >
                + Add
              </button>
            </div>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {dbAdditionalParticipants.length === 0 && <div style={{ color: '#a1a1aa', fontSize: 12 }}>No additional participants yet.</div>}
              {dbAdditionalParticipants.map((ap, idx) => (
                <div key={idx} style={{ background: '#f8fafc', borderRadius: 6, padding: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ flex: 1 }}>{ap.first_name} {ap.last_name} {ap.email && `(${ap.email})`}</span>
                  <button type="button" onClick={() => handleRemoveAdditional(idx)} style={{ background: '#fff', color: '#db2777', fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 8px', fontSize: 12, cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button type="submit" disabled={loading} style={{ background: '#f4f4f5', color: '#222', fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 4, padding: '7px 18px', fontSize: 14, cursor: 'pointer' }}>{loading ? 'Saving...' : 'Save Participant'}</button>
          {onCancel && <button type="button" onClick={onCancel} style={{ background: '#fff', color: '#db2777', fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 4, padding: '7px 18px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>}
        </div>
        {isEdit && isAdditional && (
          <button type="button" onClick={handleDelete} style={{ background: '#fff', color: '#db2777', fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 4, padding: '7px 18px', fontSize: 14, cursor: 'pointer', marginTop: 8 }}>Delete Additional Participant</button>
        )}
        {isEdit && !isAdditional && (
          <button type="button" onClick={handleDelete} style={{ background: '#fff', color: '#db2777', fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 4, padding: '7px 18px', fontSize: 14, cursor: 'pointer', marginTop: 8 }}>Delete Participant</button>
        )}
        {isEdit && !isAdditional && dbAdditionalParticipants && dbAdditionalParticipants.length > 0 && (
          <div style={{ color: '#db2777', fontSize: 13, marginTop: 8 }}>
            Warning: Deleting this participant will also remove all additional participants.
          </div>
        )}
        {error && <div style={{ color: 'red', marginTop: 6, fontSize: 12 }}>{error}</div>}
        {isAdditional && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <input
              type="checkbox"
              checked={!!form.is_child}
              onChange={e => setForm(f => ({ ...f, is_child: e.target.checked, child_age: e.target.checked ? f.child_age : '' }))}
              id="additionalIsChildCheckbox"
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="additionalIsChildCheckbox" style={{ fontWeight: 500, fontSize: 13, color: '#374151' }}>Child?</label>
          </div>
        )}
        {form.is_child && (
          <>
            <span style={{ marginLeft: 8, fontSize: 13, color: '#374151' }}>Child Age:</span>
            <input
              type="number"
              min={0}
              required
              value={form.child_age || ''}
              onChange={e => setForm(f => ({ ...f, child_age: e.target.value }))}
              style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, width: 80, marginLeft: 4 }}
            />
          </>
        )}
        {renderCustomFields()}
      </form>
      {/* Modal for additional participant */}
      {showAdditionalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 0 }}>
            <form /* main form here, or empty div for spacing */ style={{ width: 540, minWidth: 340, marginRight: 0 }} />
            <form onSubmit={handleAdditionalSubmit} style={{ background: '#fff', borderRadius: 8, boxShadow: '0 4px 24px rgba(60,120,180,0.10)', padding: 24, minWidth: 260, maxWidth: 340, width: '100%', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', marginTop: 0 }}>
              <button type="button" onClick={() => setShowAdditionalModal(false)} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>&times;</button>
              <input name="first_name" value={additionalForm.first_name} onChange={handleAdditionalFormChange} placeholder="First Name" required style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <input name="last_name" value={additionalForm.last_name} onChange={handleAdditionalFormChange} placeholder="Last Name" required style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <input name="email" value={additionalForm.email} onChange={handleAdditionalFormChange} placeholder="Email" type="email" style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <input name="phone" value={additionalForm.phone} onChange={handleAdditionalFormChange} placeholder="Phone" style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <input name="family" value={additionalForm.family} onChange={handleAdditionalFormChange} placeholder="Family" style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <input name="relationship" value={additionalForm.relationship} onChange={handleAdditionalFormChange} placeholder="Relationship" style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <select name="invited_by" value={additionalForm.invited_by} onChange={handleAdditionalFormChange} style={{ padding: 5, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}>
                <option value="">Invited By</option>
                {mockUsers.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <MultiSelectBubbles options={tagList} value={additionalForm.tags} onChange={v => handleAdditionalMultiChange('tags', v)} placeholder="Select Tags" color="#e5e7eb" />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add new tag" style={{ flex: 1, padding: 4, borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <button type="button" onClick={handleAddTag} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#f4f6fb', fontWeight: 500, fontSize: 12, cursor: 'pointer' }}>Add</button>
              </div>
              <MultiSelectBubbles options={mockEvents} value={additionalForm.events} onChange={v => handleAdditionalMultiChange('events', v)} placeholder="Select Events" color="#e5e7eb" />
              <MultiSelectBubbles options={mockSubEvents} value={additionalForm.sub_events} onChange={v => handleAdditionalMultiChange('sub_events', v)} placeholder="Select Sub-Events" color="#e5e7eb" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={additionalIsChild} onChange={e => setAdditionalIsChild(e.target.checked)} id="additionalIsChildCheckbox" style={{ width: 16, height: 16 }} />
                <label htmlFor="additionalIsChildCheckbox" style={{ fontWeight: 500, fontSize: 13, color: '#374151' }}>Child?</label>
              </div>
              {additionalIsChild && (
                <>
                  <span style={{ marginLeft: 8, fontSize: 13, color: '#374151' }}>Child Age:</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={additionalChildAge}
                    onChange={e => setAdditionalChildAge(e.target.value)}
                    style={{ padding: '4px 7px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, width: 80, marginLeft: 4 }}
                  />
                </>
              )}
              <button type="submit" disabled={!additionalForm.first_name || !additionalForm.last_name || !mainFilled} title={!mainFilled ? 'Please fill in participant information first.' : (!additionalForm.first_name || !additionalForm.last_name ? 'Please fill in additional participant name.' : '')} style={{ background: '#f4f4f5', color: '#222', fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 4, padding: '7px 18px', fontSize: 14, cursor: !additionalForm.first_name || !additionalForm.last_name || !mainFilled ? 'not-allowed' : 'pointer', marginTop: 8 }}>Add Participant</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 