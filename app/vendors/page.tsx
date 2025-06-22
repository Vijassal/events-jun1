'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Button, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TopToolbar from '../../src/components/TopToolbar';

interface VendorData {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  type: string;
  category: string;
  account_instance_id: string;
}

export default function VendorsPage() {
  // Add state for active tab
  const [activeTab, setActiveTab] = useState<'vendors' | 'spotlight' | 'hot'>('vendors');
  
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [vendorForm, setVendorForm] = useState<Omit<VendorData, 'id' | 'account_instance_id'>>({
    name: '', date: '', start_time: '', end_time: '', location: '', type: '', category: ''
  });
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inlineEditRowId, setInlineEditRowId] = useState<string | null>(null);
  const [inlineEditRow, setInlineEditRow] = useState<Partial<VendorData> | null>(null);
  const [inlineEditLoading, setInlineEditLoading] = useState(false);
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null);
  const [fetchingAccountInstance, setFetchingAccountInstance] = useState(true);

  // DataGrid column state persistence
  const [columnState, setColumnState] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vendorColumnState');
      return saved ? JSON.parse(saved) : undefined;
    }
    return undefined;
  });

  // Fetch account_instance_id like in budget page
  useEffect(() => {
    async function fetchAccountInstance() {
      setFetchingAccountInstance(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setAccountInstanceId(null);
        setFetchingAccountInstance(false);
        setError('User not logged in');
        return;
      }
      const { data: accounts, error } = await supabase
        .from('account_instances')
        .select('id, name')
        .eq('name', session.user.email);
      if (error || !accounts || accounts.length === 0) {
        setAccountInstanceId(null);
        setFetchingAccountInstance(false);
        setError('No account instance found for this user email');
        return;
      }
      setAccountInstanceId(accounts[0].id);
      setFetchingAccountInstance(false);
    }
    fetchAccountInstance();
  }, []);

  useEffect(() => {
    if (accountInstanceId) fetchVendors();
  }, [accountInstanceId]);

  // DataGrid columns for vendors
  const vendorColumns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140, headerClassName: 'center-header', editable: true },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 110, headerClassName: 'center-header', editable: true },
    { field: 'start_time', headerName: 'Start Time', flex: 1, minWidth: 100, headerClassName: 'center-header', editable: true },
    { field: 'end_time', headerName: 'End Time', flex: 1, minWidth: 100, headerClassName: 'center-header', editable: true },
    { field: 'location', headerName: 'Location', flex: 1, minWidth: 120, headerClassName: 'center-header', editable: true },
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 110, headerClassName: 'center-header', editable: true },
    { field: 'category', headerName: 'Category', flex: 1, minWidth: 110, headerClassName: 'center-header', editable: true },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 140,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const isEditing = inlineEditRowId === params.row.id;
        return (
          <Stack direction="row" spacing={1}>
            {isEditing ? (
              <Button
                variant="contained"
                color="success"
                size="small"
                disabled={inlineEditLoading}
                onClick={async () => {
                  setInlineEditLoading(true);
                  const { error } = await supabase.from('vendors').update(inlineEditRow).eq('id', params.row.id).eq('account_instance_id', accountInstanceId);
                  if (!error) {
                    setSuccess('Vendor updated!');
                    setInlineEditRowId(null);
                    setInlineEditRow(null);
                    fetchVendors();
                  } else {
                    setError('Failed to update vendor.');
                  }
                  setInlineEditLoading(false);
                }}
                sx={{ fontWeight: 600, textTransform: 'none' }}
              >
                Save
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => {
                  setInlineEditRowId(params.row.id);
                  setInlineEditRow(params.row);
                }}
                sx={{ fontWeight: 600, textTransform: 'none' }}
              >
                Edit
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteVendor(params.row.id)}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Delete
            </Button>
          </Stack>
        );
      },
      cellClassName: 'center-cell',
      headerClassName: 'center-header',
    },
  ];

  // Patch DataGrid columns to always apply headerClassName
  const columnsWithHandler = vendorColumns.map((col) => ({
    ...col,
    headerClassName: col.headerClassName || 'center-header',
    editable: col.field !== 'actions',
  }));

  // Only allow editing for the selected row
  const isCellEditable = (params: any) => {
    return inlineEditRowId === params.row.id && params.field !== 'actions';
  };

  // Track changes to the inline edit row
  const handleInlineEditChange = (updatedRow: any) => {
    setInlineEditRow(updatedRow);
    return updatedRow;
  };

  // Handlers to persist column changes
  const handleColumnOrderChange = (params: any) => {
    const newState = { ...columnState, order: params.columnOrder };
    setColumnState(newState);
    localStorage.setItem('vendorColumnState', JSON.stringify(newState));
  };
  const handleColumnVisibilityModelChange = (model: any) => {
    const newState = { ...columnState, visibility: model };
    setColumnState(newState);
    localStorage.setItem('vendorColumnState', JSON.stringify(newState));
  };
  const handleColumnWidthChange = (params: any) => {
    const newState = { ...columnState, width: { ...(columnState?.width || {}), [params.colDef.field]: params.width } };
    setColumnState(newState);
    localStorage.setItem('vendorColumnState', JSON.stringify(newState));
  };

  async function fetchVendors() {
    if (!accountInstanceId) return setVendors([]);
    const { data, error } = await supabase.from('vendors').select('*').eq('account_instance_id', accountInstanceId).order('date', { ascending: true });
    if (error) setError('Failed to fetch vendors.');
    else setVendors(data || []);
  }

  async function handleVendorSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorForm.name || !vendorForm.date || !vendorForm.start_time) {
      setError('Please fill out all required fields.');
      return;
    }
    setError('');
    setSuccess('');
    if (!accountInstanceId) {
      setError('No account instance selected.');
      return;
    }
    if (editingVendorId) {
      const { error } = await supabase.from('vendors').update(vendorForm).eq('id', editingVendorId).eq('account_instance_id', accountInstanceId);
      if (error) setError('Failed to update vendor.');
      else {
        setSuccess('Vendor updated!');
        setEditingVendorId(null);
        setVendorForm({ name: '', date: '', start_time: '', end_time: '', location: '', type: '', category: '' });
        fetchVendors();
      }
    } else {
      const { error } = await supabase.from('vendors').insert([{ ...vendorForm, account_instance_id: accountInstanceId }]);
      if (error) setError('Failed to add vendor.');
      else {
        setSuccess('Vendor added!');
        setVendorForm({ name: '', date: '', start_time: '', end_time: '', location: '', type: '', category: '' });
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
    if (!accountInstanceId) {
      setError('No account instance selected.');
      return;
    }
    const { error } = await supabase.from('vendors').delete().eq('id', id).eq('account_instance_id', accountInstanceId);
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

  const navItems = [
    { 
      label: 'Vendors', 
      href: '/vendors', 
      active: activeTab === 'vendors',
      onClick: () => setActiveTab('vendors')
    },
  ];
  const tempButtons = [
    { 
      label: 'Spotlight',
      onClick: () => setActiveTab('spotlight'),
      active: activeTab === 'spotlight'
    },
    { 
      label: 'Hot!',
      onClick: () => setActiveTab('hot'),
      active: activeTab === 'hot'
    },
  ];

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'vendors':
        return (
          <>
            <form style={formStyle} onSubmit={handleVendorSubmit} id="vendor-form">
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 18 
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Name *</label>
                  <input style={inputStyle} name="name" value={vendorForm.name} onChange={handleChange} placeholder="Vendor Name" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Date *</label>
                  <input style={inputStyle} name="date" type="date" value={vendorForm.date} onChange={handleChange} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Start Time *</label>
                  <input style={inputStyle} name="start_time" type="time" value={vendorForm.start_time} onChange={handleChange} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>End Time</label>
                  <input style={inputStyle} name="end_time" type="time" value={vendorForm.end_time} onChange={handleChange} />
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
                      setVendorForm({ name: '', date: '', start_time: '', end_time: '', location: '', type: '', category: '' });
                      setError('');
                      setSuccess('');
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <div style={{ width: '100%', overflowX: 'auto', marginTop: 32 }}>
              <DataGrid
                rows={vendors}
                columns={columnsWithHandler}
                getRowId={(row) => row.id}
                initialState={columnState ? { ...columnState, pagination: { paginationModel: { pageSize: 5, page: 0 } } } : { pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                disableRowSelectionOnClick
                onColumnOrderChange={handleColumnOrderChange}
                onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
                onColumnWidthChange={handleColumnWidthChange}
                isCellEditable={isCellEditable}
                processRowUpdate={handleInlineEditChange}
                onProcessRowUpdateError={(error) => {
                  setError('Failed to update vendor: ' + (error?.message || error));
                }}
                sx={{
                  border: 'none',
                  fontSize: 16,
                  '& .MuiDataGrid-columnHeaders': { bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700 },
                  '& .MuiDataGrid-row': { bgcolor: '#fff' },
                  '& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row[data-rowindex][data-id].Mui-selected': { bgcolor: '#f3e8ff !important' },
                  '& .MuiDataGrid-row.editing-row': { bgcolor: '#f3e8ff !important' },
                  '& .MuiDataGrid-footerContainer': { bgcolor: '#ede9fe' },
                  '& .center-cell': { textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center' },
                  width: '100%',
                }}
                getRowClassName={(params) => (inlineEditRowId === params.id ? 'editing-row' : '')}
              />
            </div>
          </>
        );

      case 'spotlight':
        return (
          <>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px 32px',
              boxShadow: '0 4px 24px rgba(60, 120, 180, 0.08)',
              border: '1.2px solid #e5e7eb',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Vendor Spotlight</h1>
                  <p style={{ fontSize: 16, color: '#6b7280' }}>Featured vendors and special promotions</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{
                    background: 'linear-gradient(90deg, #6366f1 0%, #db2777 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                  }}>
                    + Add to Spotlight
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(60, 120, 180, 0.08)',
              border: '1.2px solid #e5e7eb',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>Featured Vendors</h2>
                  <button style={{
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}>
                    + Add Featured
                  </button>
                </div>
                
                {/* Featured Vendor Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  {/* Sample Featured Vendor Card */}
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 20,
                    background: '#fff',
                    transition: 'box-shadow 0.2s',
                    cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Elegant Catering Co.</h3>
                        <p style={{ fontSize: 13, color: '#6b7280' }}>Featured since: June 15, 2025</p>
                      </div>
                      <span style={{
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                      }}>
                        Featured
                      </span>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                        <strong>Special Offer:</strong> 15% off for wedding receptions
                      </p>
                      <p style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                        <strong>Rating:</strong> ⭐⭐⭐⭐⭐ (4.9/5)
                      </p>
                      <p style={{ fontSize: 14, color: '#374151' }}>
                        <strong>Contact:</strong> info@elegantcatering.com
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        View Details
                      </button>
                      <button style={{
                        background: '#f4f6fb',
                        color: '#374151',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        Contact
                      </button>
                    </div>
                  </div>

                  {/* Empty State */}
                  <div style={{
                    border: '2px dashed #e5e7eb',
                    borderRadius: 12,
                    padding: 40,
                    background: '#f9fafb',
                    textAlign: 'center',
                    color: '#6b7280',
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                      No Featured Vendors Yet
                    </h3>
                    <p style={{ fontSize: 14, marginBottom: 16 }}>
                      Add vendors to your spotlight to highlight special offers and promotions
                    </p>
                    <button style={{
                      background: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                      Add Featured Vendor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'hot':
        return (
          <>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px 32px',
              boxShadow: '0 4px 24px rgba(60, 120, 180, 0.08)',
              border: '1.2px solid #e5e7eb',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Hot Vendors</h1>
                  <p style={{ fontSize: 16, color: '#6b7280' }}>Trending and popular vendors in your area</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{
                    background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.15)',
                  }}>
                    🔥 Trending Now
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(60, 120, 180, 0.08)',
              border: '1.2px solid #e5e7eb',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>Trending Vendors</h2>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <select style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                      fontSize: 13,
                      background: '#fff',
                    }}>
                      <option>All Categories</option>
                      <option>Catering</option>
                      <option>Photography</option>
                      <option>Music</option>
                      <option>Decoration</option>
                    </select>
                    <button style={{
                      background: '#f4f6fb',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                      Filter
                    </button>
                  </div>
                </div>
                
                {/* Trending Vendor Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  {/* Sample Trending Vendor Card */}
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 20,
                    background: '#fff',
                    transition: 'box-shadow 0.2s',
                    cursor: 'pointer',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: '#ef4444',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      🔥 HOT
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Dream Photography</h3>
                        <p style={{ fontSize: 13, color: '#6b7280' }}>Trending this week</p>
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                        <strong>Rating:</strong> ⭐⭐⭐⭐⭐ (4.8/5)
                      </p>
                      <p style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                        <strong>Bookings:</strong> 47 this month
                      </p>
                      <p style={{ fontSize: 14, color: '#374151' }}>
                        <strong>Specialty:</strong> Wedding Photography
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        Book Now
                      </button>
                      <button style={{
                        background: '#f4f6fb',
                        color: '#374151',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        View Portfolio
                      </button>
                    </div>
                  </div>

                  {/* Empty State */}
                  <div style={{
                    border: '2px dashed #e5e7eb',
                    borderRadius: 12,
                    padding: 40,
                    background: '#f9fafb',
                    textAlign: 'center',
                    color: '#6b7280',
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔥</div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                      No Trending Vendors
                    </h3>
                    <p style={{ fontSize: 14, marginBottom: 16 }}>
                      Check back later for trending vendors in your area
                    </p>
                    <button style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <TopToolbar
        navItems={navItems}
        tempButtons={tempButtons}
        searchButton={{ onClick: () => alert('Search clicked!') }}
      />
      <div style={pageWrapperStyle}>
        {renderTabContent()}
      </div>
    </>
  );
} 