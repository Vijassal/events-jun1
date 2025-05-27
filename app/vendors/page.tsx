'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';

interface VendorData {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  type: string;
  category: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [vendorForm, setVendorForm] = useState<Omit<VendorData, 'id'>>({
    name: '', date: '', time: '', location: '', type: '', category: ''
  });
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    const { data, error } = await supabase.from('vendors').select('*').order('date', { ascending: true });
    if (error) setError('Failed to fetch vendors.');
    else setVendors(data || []);
  }

  async function handleVendorSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorForm.name || !vendorForm.date || !vendorForm.time) {
      setError('Please fill out all required fields.');
      return;
    }
    setError('');
    setSuccess('');
    if (editingVendorId) {
      const { error } = await supabase.from('vendors').update(vendorForm).eq('id', editingVendorId);
      if (error) setError('Failed to update vendor.');
      else {
        setSuccess('Vendor updated!');
        setEditingVendorId(null);
        setVendorForm({ name: '', date: '', time: '', location: '', type: '', category: '' });
        fetchVendors();
      }
    } else {
      const { error } = await supabase.from('vendors').insert([{ ...vendorForm }]);
      if (error) setError('Failed to add vendor.');
      else {
        setSuccess('Vendor added!');
        setVendorForm({ name: '', date: '', time: '', location: '', type: '', category: '' });
        fetchVendors();
      }
    }
  }

  function handleEditVendor(vendor: VendorData) {
    setVendorForm({ ...vendor, id: undefined } as Omit<VendorData, 'id'>);
    setEditingVendorId(vendor.id);
    setError('');
    setSuccess('');
  }

  async function handleDeleteVendor(id: string) {
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) setError('Failed to delete vendor.');
    else {
      setSuccess('Vendor deleted!');
      fetchVendors();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setVendorForm({ ...vendorForm, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  }

  // Styles copied/adapted from Events
  const labelStyle: React.CSSProperties = { fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 };
  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: 13,
    outline: 'none',
    marginBottom: 4,
    background: '#fff',
    color: '#222',
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
    maxWidth: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(124, 58, 237, 0.06)',
    marginTop: 32,
    fontSize: 14,
    color: '#222',
    overflow: 'hidden',
  };
  const thStyle: React.CSSProperties = {
    fontWeight: 600,
    textAlign: 'left',
    padding: '12px 10px',
    background: '#ede9fe',
    color: '#7c3aed',
    borderBottom: '1.5px solid #a78bfa',
  };
  const tdStyle: React.CSSProperties = {
    padding: '10px 10px',
    borderBottom: '1px solid #f3f4f6',
    background: '#fff',
  };
  const actionsTdStyle: React.CSSProperties = {
    ...tdStyle,
    minWidth: 120,
  };
  const pageWrapperStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 'none',
    margin: '0',
    marginTop: 32,
    marginBottom: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    paddingLeft: 32,
    paddingRight: 32,
    boxSizing: 'border-box',
  };

  return (
    <div style={pageWrapperStyle}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed', marginBottom: 8, letterSpacing: 0.2 }}>Vendors</h2>
      <form style={formStyle} onSubmit={handleVendorSubmit} id="vendor-form">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} name="name" value={vendorForm.name} onChange={handleChange} placeholder="Vendor Name" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Date *</label>
            <input style={inputStyle} name="date" type="date" value={vendorForm.date} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Time *</label>
            <input style={inputStyle} name="time" type="time" value={vendorForm.time} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Location</label>
            <input style={inputStyle} name="location" value={vendorForm.location} onChange={handleChange} placeholder="Location" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Type</label>
            <input style={inputStyle} name="type" value={vendorForm.type} onChange={handleChange} placeholder="Type" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Category</label>
            <input style={inputStyle} name="category" value={vendorForm.category} onChange={handleChange} placeholder="Category" />
          </div>
        </div>
        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
          <button style={buttonStyle} type="submit">{editingVendorId ? 'Update Vendor' : 'Add Vendor'}</button>
          {editingVendorId && (
            <button
              type="button"
              style={{ ...buttonStyle, background: '#f3f4f6', color: '#7c3aed', boxShadow: 'none', border: '1px solid #a78bfa' }}
              onClick={() => {
                setEditingVendorId(null);
                setVendorForm({ name: '', date: '', time: '', location: '', type: '', category: '' });
                setError('');
                setSuccess('');
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#a1a1aa', fontSize: 15 }}>No vendors found.</td></tr>
            ) : vendors.map(vendor => (
              <tr key={vendor.id}>
                <td style={tdStyle}>{vendor.name}</td>
                <td style={tdStyle}>{vendor.date}</td>
                <td style={tdStyle}>{vendor.time}</td>
                <td style={tdStyle}>{vendor.location}</td>
                <td style={tdStyle}>{vendor.type}</td>
                <td style={tdStyle}>{vendor.category}</td>
                <td style={actionsTdStyle}>
                  <button onClick={() => handleEditVendor(vendor)} style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #a78bfa', borderRadius: 6, padding: '4px 12px', fontWeight: 600, cursor: 'pointer', fontSize: 13, marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDeleteVendor(vendor.id)} style={{ background: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, padding: '4px 12px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 