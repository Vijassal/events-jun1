"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Stack, Divider, Dialog, DialogTitle, DialogContent, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { supabase } from '../../src/lib/supabase';
import BudgetForm from './BudgetForm';
import PaymentForm from './PaymentForm';
import ItemCostForm from './ItemCostForm';
import { CurrencyProvider, useCurrency } from '../../src/context/CurrencyContext';
import { useFormatCurrency, useCurrencySymbol } from '../../src/lib/currency';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchConversionRate as fetchConversionRateUtil } from '../../src/lib/currencyUtils';
import TopToolbar from '../../src/components/TopToolbar';

function BudgetPageInner() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [tab, setTab] = useState(0);
  const [paymentLogs, setPaymentLogs] = useState<any[]>([]);
  const [itemCosts, setItemCosts] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [editPaymentData, setEditPaymentData] = useState<any>(null);
  const [itemCostFormOpen, setItemCostFormOpen] = useState(false);
  const [editItemCostData, setEditItemCostData] = useState<any>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const formatCurrency = useFormatCurrency();
  const currencySymbol = useCurrencySymbol();
  const [columnState, setColumnState] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('budgetColumnState');
      return saved ? JSON.parse(saved) : undefined;
    }
    return undefined;
  });
  // Inline editing state
  const [inlineEditRowId, setInlineEditRowId] = useState<string | null>(null);
  const [inlineEditRow, setInlineEditRow] = useState<any | null>(null);
  const [inlineEditLoading, setInlineEditLoading] = useState(false);
  // Add inline form state for new budget
  const initialInlineForm = {
    purchase: '',
    vendor_id: '',
    date: '',
    event_id: '',
    sub_event_id: '',
    category: '',
    cost: '',
    currency: 'USD',
    conversion_rate: 1,
    converted_amount: '',
    tags: [] as string[],
    payment_for: '',
    payment_by: '',
  };
  const [inlineForm, setInlineForm] = useState(initialInlineForm);
  const [inlineTagInput, setInlineTagInput] = useState('');
  const [inlineFormError, setInlineFormError] = useState<string | null>(null);
  const [inlineFormSuccess, setInlineFormSuccess] = useState<string | null>(null);
  const [inlineFormLoading, setInlineFormLoading] = useState(false);
  const [inlineConversionLoading, setInlineConversionLoading] = useState(false);
  const [vendors, setVendors] = useState<{ id: string, name: string }[]>([]);
  const [events, setEvents] = useState<{ id: string, name: string }[]>([]);
  const [subEvents, setSubEvents] = useState<{ id: string, name: string, parentEventId: string }[]>([]);
  const [userCurrency, setUserCurrency] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedCurrency') || 'USD';
    }
    return 'USD';
  });
  const [accountInstances, setAccountInstances] = useState<{ id: string, name: string }[]>([]);
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null);
  const [accountInstanceError, setAccountInstanceError] = useState<string | null>(null);
  const [fetchingAccountInstance, setFetchingAccountInstance] = useState(true);
  const [settingsCurrency, setSettingsCurrency] = useState<string>('USD');

  // Top 25 currencies (ISO codes)
  const topCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD',
    'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
    'TWD', 'DKK', 'PLN', 'THB', 'IDR'
  ];
  const baseCurrency = 'USD';

  useEffect(() => {
    const updateConversionRate = async () => {
      if (
        !inlineEditRowId &&
        settingsCurrency &&
        inlineForm.currency &&
        settingsCurrency !== inlineForm.currency
      ) {
        setInlineConversionLoading(true);
        const rate = await fetchConversionRateUtil(inlineForm.currency, settingsCurrency, supabase);
        setInlineForm(f => ({
          ...f,
          conversion_rate: rate,
          converted_amount: f.cost ? (parseFloat(f.cost) * rate).toFixed(2) : '',
        }));
        setInlineConversionLoading(false);
      } else if (!inlineEditRowId && settingsCurrency === inlineForm.currency) {
        setInlineForm(f => ({ ...f, conversion_rate: 1 }));
      }
    };
    updateConversionRate();
  }, [settingsCurrency, inlineForm.currency, inlineForm.cost, inlineEditRowId]);

  // Remove fetchUserCurrency from profiles by email
  // Instead, get userCurrency from localStorage (set in settings)
  useEffect(() => {
    const currencyChangeHandler = () => {
      if (typeof window !== 'undefined') {
        setUserCurrency(localStorage.getItem('selectedCurrency') || 'USD');
      }
    };
    window.addEventListener('currencyChanged', currencyChangeHandler);
    return () => window.removeEventListener('currencyChanged', currencyChangeHandler);
  }, []);

  useEffect(() => {
    async function fetchAccountInstance() {
      setFetchingAccountInstance(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session); // Debug: show session
      if (!session?.user?.email) {
        setAccountInstanceError('User not logged in');
        setAccountInstanceId(null);
        setFetchingAccountInstance(false);
        return;
      }
      // Query account_instances by name (which stores the email)
      const { data: accounts, error } = await supabase
        .from('account_instances')
        .select('id, name')
        .eq('name', session.user.email);
      console.log('Account instances for name (email):', session.user.email, accounts); // Debug: show account instances
      if (error || !accounts || accounts.length === 0) {
        setAccountInstanceError('No account instance found for this user email');
        setAccountInstanceId(null);
        setFetchingAccountInstance(false);
        return;
      }
      setAccountInstanceId(accounts[0].id); // Use the first match
      console.log('Using accountInstanceId:', accounts[0].id); // Debug: show selected accountInstanceId
      setAccountInstanceError(null);
      setFetchingAccountInstance(false);
    }
    fetchAccountInstance();
  }, []);

  // Fetch settings currency when accountInstanceId changes
  useEffect(() => {
    async function fetchSettingsCurrency() {
      if (!accountInstanceId) return;
      const { data, error } = await supabase
        .from('settings')
        .select('currency')
        .eq('account_instance_id', accountInstanceId)
        .single();
      if (data && data.currency) {
        setSettingsCurrency(data.currency);
      } else {
        setSettingsCurrency('USD');
      }
    }
    fetchSettingsCurrency();
  }, [accountInstanceId]);

  // Use accountInstanceId for all budget queries
  const fetchBudgets = async () => {
    if (!accountInstanceId) {
      setAccountInstanceError('No account instance selected.');
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setAccountInstanceError(null);
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('account_instance_id', accountInstanceId)
      .order('date', { ascending: false });
    console.log('Budgets for accountInstanceId:', accountInstanceId, data); // Debug: show budgets fetched
    if (error) {
      setError(error.message);
      setBudgets([]);
    } else {
      const mapped = (data || []).map(row => ({
        ...row,
        cost: row.cost != null ? row.cost.toString() : '0.00',
      }));
      setBudgets(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBudgets();
    // Fetch vendors for dropdown
    const fetchVendors = async () => {
      const { data, error } = await supabase.from('vendors').select('id, name').order('name');
      if (!error && data) setVendors(data);
    };
    fetchVendors();
    // Fetch events for dropdown
    const fetchEvents = async () => {
      const { data, error } = await supabase.from('events').select('id, name').order('name');
      if (!error && data) setEvents(data);
    };
    fetchEvents();
    // Fetch sub-events for dropdown
    const fetchSubEvents = async () => {
      const { data, error } = await supabase.from('sub_events').select('id, name, parent_event_id').order('name');
      if (!error && data) setSubEvents(data.map(se => ({ ...se, parentEventId: se.parent_event_id })));
    };
    fetchSubEvents();
  }, []);

  useEffect(() => {
    if (modalOpen as boolean && selectedBudget as any) {
      fetchModalData((selectedBudget as any).id);
    }
  }, [modalOpen as boolean, selectedBudget as any]);

  // Handler for View Details
  const handleViewDetails = (id: string) => {
    const budget = budgets.find((row) => row.id === id);
    setSelectedBudget(budget);
    setTab(0);
    setModalOpen(true);
  };

  // Add handler
  const handleAddBudget = () => {
    setEditData(null);
    setFormOpen(true);
  };

  // Edit handler
  const handleEditBudget = (row: any) => {
    setEditData(row);
    setFormOpen(true);
  };

  // Success handler (refresh budgets)
  const handleFormSuccess = () => {
    // Re-fetch budgets after add/edit
    fetchBudgets();
  };

  // Payment add handler
  const handleAddPayment = () => {
    setEditPaymentData(null);
    setPaymentFormOpen(true);
  };

  // Payment edit handler
  const handleEditPayment = (row: any) => {
    setEditPaymentData(row);
    setPaymentFormOpen(true);
  };

  // Payment form success handler (refresh payments)
  const handlePaymentFormSuccess = () => {
    // Re-fetch payment logs for the selected budget
    if (selectedBudget) {
      fetchModalData(selectedBudget.id);
    }
  };

  // Item cost add handler
  const handleAddItemCost = (paymentId: string) => {
    setEditItemCostData(null);
    setSelectedPaymentId(paymentId);
    setItemCostFormOpen(true);
  };

  // Item cost edit handler
  const handleEditItemCost = (row: any) => {
    setEditItemCostData(row);
    setSelectedPaymentId(row.logged_payment_id);
    setItemCostFormOpen(true);
  };

  // Item cost form success handler (refresh item costs)
  const handleItemCostFormSuccess = () => {
    if (selectedBudget) {
      fetchModalData(selectedBudget.id);
    }
  };

  // Handlers to persist column changes
  const handleColumnOrderChange = (params: any) => {
    const newState = { ...columnState, order: params.columnOrder };
    setColumnState(newState);
    localStorage.setItem('budgetColumnState', JSON.stringify(newState));
  };
  const handleColumnVisibilityModelChange = (model: any) => {
    const newState = { ...columnState, visibility: model };
    setColumnState(newState);
    localStorage.setItem('budgetColumnState', JSON.stringify(newState));
  };
  const handleColumnWidthChange = (params: any) => {
    const newState = { ...columnState, width: { ...(columnState?.width || {}), [params.colDef.field]: params.width } };
    setColumnState(newState);
    localStorage.setItem('budgetColumnState', JSON.stringify(newState));
  };

  const handleInlineFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cost' || name === 'conversion_rate') {
      const newCost = name === 'cost' ? value : inlineForm.cost;
      const newRate = name === 'conversion_rate' ? parseFloat(value) || 1 : inlineForm.conversion_rate;
      setInlineForm({
        ...inlineForm,
        [name]: value,
        converted_amount: newCost && newRate ? (parseFloat(newCost) * newRate).toFixed(2) : '',
      });
    } else {
      setInlineForm({ ...inlineForm, [name]: value });
    }
  };
  const handleInlineAddTag = () => {
    if (inlineTagInput.trim() && !inlineForm.tags.includes(inlineTagInput.trim())) {
      setInlineForm({ ...inlineForm, tags: [...inlineForm.tags, inlineTagInput.trim()] });
    }
    setInlineTagInput('');
  };
  const handleInlineDeleteTag = (tag: string) => {
    setInlineForm({ ...inlineForm, tags: inlineForm.tags.filter((t: string) => t !== tag) });
  };
  const cleanUUID = (value: string) => value === "" ? null : value;
  const handleInlineFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineFormLoading(true);
    setInlineFormError(null);
    setInlineFormSuccess(null);
    if (!accountInstanceId) {
      setInlineFormError('No account instance selected.');
      setInlineFormLoading(false);
      return;
    }
    if (!inlineForm.purchase || !inlineForm.date || !inlineForm.category || !inlineForm.cost) {
      setInlineFormError('Please fill in all required fields.');
      setInlineFormLoading(false);
      return;
    }
    const data = {
      purchase: inlineForm.purchase,
      vendor_id: cleanUUID(inlineForm.vendor_id),
      date: inlineForm.date,
      event_id: cleanUUID(inlineForm.event_id),
      sub_event_id: cleanUUID(inlineForm.sub_event_id),
      category: inlineForm.category,
      cost: Number(inlineForm.cost),
      converted_amount: inlineForm.converted_amount && !isNaN(Number(inlineForm.converted_amount)) ? Number(inlineForm.converted_amount) : 0,
      tags: inlineForm.tags,
      payment_for: inlineForm.payment_for,
      payment_by: inlineForm.payment_by,
      account_instance_id: accountInstanceId
    };
    const { error } = await supabase.from('budgets').insert([data]);
    if (error) {
      setInlineFormError(error.message);
    } else {
      setInlineFormSuccess('Budget added!');
      setInlineForm(initialInlineForm);
      setInlineTagInput('');
      fetchBudgets();
    }
    setInlineFormLoading(false);
  };

  // Refactor fetchModalData to be callable
  const fetchModalData = async (budgetId: string) => {
    setModalLoading(true);
    setModalError(null);
    setPaymentLogs([]);
    setItemCosts([]);
    // Fetch payment logs for this budget
    const { data: payments, error: paymentsError } = await supabase
      .from('logged_payments')
      .select('*')
      .eq('budget_id', budgetId);
    if (paymentsError) {
      setModalError(paymentsError.message);
      setModalLoading(false);
      return;
    }
    setPaymentLogs(payments || []);
    // Fetch item costs for all payment logs
    if (payments && payments.length > 0) {
      const paymentIds = payments.map((p: any) => p.id);
      const { data: items, error: itemsError } = await supabase
        .from('logged_item_costs')
        .select('*')
        .in('logged_payment_id', paymentIds);
      if (itemsError) {
        setModalError(itemsError.message);
      } else {
        setItemCosts(items || []);
      }
    }
    setModalLoading(false);
  };

  // Budget columns for DataGrid
  const budgetColumns: GridColDef[] = [
    { field: 'purchase', headerName: 'Purchase', flex: 1, minWidth: 140, headerClassName: 'center-header', cellClassName: 'center-cell', editable: true },
    { field: 'vendor_id', headerName: 'Vendor', flex: 1, minWidth: 120, headerClassName: 'center-header', cellClassName: 'center-cell', editable: true, 
      renderCell: (params: GridRenderCellParams) => {
        const vendor = vendors.find(v => v.id === params.value);
        return vendor ? vendor.name : '';
      },
    },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 110, headerClassName: 'center-header', cellClassName: 'center-cell', editable: true },
    {
      field: 'event_id',
      headerName: 'Event',
      flex: 1,
      minWidth: 150,
      headerClassName: 'center-header',
      cellClassName: 'center-cell',
      editable: true,
      renderCell: (params: GridRenderCellParams) => {
        const event = events.find(ev => ev.id === params.value);
        return event ? event.name : '';
      },
    },
    {
      field: 'sub_event_id',
      headerName: 'Sub-Event',
      flex: 1,
      minWidth: 150,
      headerClassName: 'center-header',
      cellClassName: 'center-cell',
      editable: true,
      renderCell: (params: GridRenderCellParams) => {
        const subEvent = subEvents.find(se => se.id === params.value);
        return subEvent ? subEvent.name : '';
      },
    },
    { field: 'category', headerName: 'Category', flex: 1, minWidth: 110, headerClassName: 'center-header', cellClassName: 'center-cell', editable: true },
    {
      field: 'converted_amount',
      headerName: `Converted Amount`,
      flex: 1,
      minWidth: 140,
      type: 'number',
      editable: false,
      cellClassName: 'center-cell',
      headerClassName: 'center-header',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.row.converted_amount;
        return value && !isNaN(Number(value)) ? Number(value).toFixed(2) : '0.00';
      },
    },
    { field: 'tags', headerName: 'Tags', flex: 1, minWidth: 120, editable: true, valueFormatter: ({ value }) => Array.isArray(value) ? (value as any[]).join(', ') : (value ?? ''), cellClassName: 'center-cell', headerClassName: 'center-header' },
    { field: 'payment_for', headerName: 'Payment For', flex: 1, minWidth: 120, cellClassName: 'center-cell', headerClassName: 'center-header', editable: true },
    { field: 'payment_by', headerName: 'Payment By', flex: 1, minWidth: 120, cellClassName: 'center-cell', headerClassName: 'center-header', editable: true },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 340,
      maxWidth: 360,
      sortable: false,
      filterable: false,
      cellClassName: 'center-cell',
      headerClassName: 'center-header',
      renderCell: (params: GridRenderCellParams) => {
        const isEditing = inlineEditRowId === params.row.id;
        return (
          <Stack direction="row" spacing={0.5}>
            {isEditing ? (
              <Button
                variant="contained"
                color="success"
                size="small"
                disabled={inlineEditLoading}
                onClick={async () => {
                  setInlineEditLoading(true);
                  const { error } = await supabase.from('budgets').update(inlineEditRow).eq('id', params.row.id).eq('account_instance_id', accountInstanceId);
                  if (!error) {
                    setInlineEditRowId(null);
                    setInlineEditRow(null);
                    fetchBudgets();
                  } else {
                    setError('Failed to update budget.');
                  }
                  setInlineEditLoading(false);
                }}
                sx={{ fontWeight: 600, textTransform: 'none', fontSize: 12, px: 1.5 }}
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
                sx={{ fontWeight: 600, textTransform: 'none', fontSize: 12, px: 1.5 }}
              >
                Edit
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={async () => {
                const { error } = await supabase.from('budgets').delete().eq('id', params.row.id).eq('account_instance_id', accountInstanceId);
                if (!error) {
                  fetchBudgets();
                } else {
                  setError('Failed to delete budget.');
                }
              }}
              sx={{ fontWeight: 600, textTransform: 'none', fontSize: 12, px: 1.5 }}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => handleViewDetails(params.row.id)}
              sx={{ fontWeight: 600, textTransform: 'none', fontSize: 12, px: 1.5 }}
            >
              View Details
            </Button>
          </Stack>
        );
      },
    },
  ];

  // Patch DataGrid columns to always apply headerClassName
  const columnsWithHandler = budgetColumns.map((col: GridColDef) => ({
    ...col,
    headerClassName: col.headerClassName || 'center-header',
    editable: col.field !== 'actions',
  }));

  // Only allow editing for the selected row
  const isCellEditable = (params: any) => {
    return inlineEditRowId === params.row.id && params.field !== 'actions';
  };

  // Track changes to the inline edit row
  const handleInlineEditChange = (params: any) => {
    if (inlineEditRowId === params.id) {
      setInlineEditRow((prev: any) => ({ ...prev, [params.field]: params.value }));
    }
    return params.value;
  };

  // Add this after accountInstanceId is set up and fetchBudgets is defined
  useEffect(() => {
    if (accountInstanceId) {
      fetchBudgets();
    }
  }, [accountInstanceId]);

  // Show loading or error if fetching account instance
  if (fetchingAccountInstance) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress color="secondary" /></Box>;
  }

  const navItems = [
    { label: 'Budget', href: '/budget', active: true },
  ];
  const tempButtons = [
    { label: 'Temp1' },
    { label: 'Temp2' },
    { label: 'Temp3' },
  ];

  return (
    <>
      <TopToolbar
        navItems={navItems}
        tempButtons={tempButtons}
        searchButton={{ onClick: () => alert('Search clicked!') }}
      />
      <div style={{
        width: '100%',
        maxWidth: 'none',
        margin: 0,
        marginTop: 32,
        marginBottom: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        paddingLeft: 32,
        paddingRight: 32,
        boxSizing: 'border-box',
      }}>
        {accountInstances.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 500, color: '#4b5563', marginRight: 8 }}>Account Instance:</label>
            <select
              value={accountInstanceId || ''}
              onChange={e => setAccountInstanceId(e.target.value)}
              style={{ height: 36, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', background: '#fff', color: '#222' }}
            >
              {accountInstances.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name || inst.id}</option>
              ))}
            </select>
          </div>
        )}
        {accountInstanceError && <Alert severity="error">{accountInstanceError}</Alert>}
        {/* Inline Add Budget Form */}
        <form
          style={{
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
          }}
          onSubmit={handleInlineFormSubmit}
          id="budget-inline-form"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(11, 1fr)',
            gap: 12,
            alignItems: 'end',
            width: '100%',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 }}>Purchase *</label>
              <input style={{ height: 38, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', marginBottom: 4, background: '#fff', color: '#222' }} name="purchase" value={inlineForm.purchase} onChange={handleInlineFormChange} placeholder="Purchase" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 }}>Vendor *</label>
              <select
                name="vendor_id"
                value={inlineForm.vendor_id}
                onChange={e => setInlineForm({ ...inlineForm, vendor_id: e.target.value })}
                style={{ height: 38, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', marginBottom: 4, background: '#fff', color: '#222' }}
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 }}>Date *</label>
              <input style={{ height: 38, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', marginBottom: 4, background: '#fff', color: '#222' }} name="date" type="date" value={inlineForm.date} onChange={handleInlineFormChange} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 }}>Event *</label>
              <select
                name="event_id"
                value={inlineForm.event_id}
                onChange={e => setInlineForm({ ...inlineForm, event_id: e.target.value, sub_event_id: '' })}
                style={{ height: 38, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', marginBottom: 4, background: '#fff', color: '#222' }}
                required
              >
                <option value="">Select Event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 }}>Sub-Event</label>
              <select
                name="sub_event_id"
                value={inlineForm.sub_event_id || ''}
                onChange={e => setInlineForm({ ...inlineForm, sub_event_id: e.target.value })}
                style={{ height: 38, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', marginBottom: 4, background: '#fff', color: '#222' }}
              >
                <option value="">Select Sub-Event</option>
                {subEvents.filter(se => se.parentEventId === inlineForm.event_id).map(se => (
                  <option key={se.id} value={se.id}>{se.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 }}>Category *</label>
              <input style={{ height: 38, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', marginBottom: 4, background: '#fff', color: '#222' }} name="category" value={inlineForm.category} onChange={handleInlineFormChange} placeholder="Category" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 }}>Cost *</label>
              <input style={{ height: 38, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', marginBottom: 4, background: '#fff', color: '#222' }} name="cost" value={inlineForm.cost} onChange={handleInlineFormChange} placeholder="Cost" type="number" min={0} step="0.01" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 }}>Currency *</label>
              <select
                name="currency"
                value={inlineForm.currency}
                onChange={e => setInlineForm({ ...inlineForm, currency: e.target.value })}
                style={{ height: 38, lineHeight: '38px', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', marginBottom: 0, background: '#fff', color: '#222', verticalAlign: 'middle' }}
                required
              >
                {topCurrencies.map(cur => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 }}>Conversion Rate ({inlineForm.currency} → {userCurrency})</label>
              <input
                name="conversion_rate"
                type="number"
                step="0.0001"
                value={inlineForm.conversion_rate}
                readOnly
                style={{ height: 38, lineHeight: '38px', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', background: '#f3f4f6', color: '#222', width: 120, marginRight: 6, fontWeight: 600, marginBottom: 0 }}
                disabled={inlineConversionLoading}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, color: '#4b5563', marginBottom: 2, fontSize: 13 }}>Converted Amount ({userCurrency})</label>
              <input
                name="converted_amount"
                type="number"
                value={inlineForm.converted_amount}
                onChange={e => setInlineForm({ ...inlineForm, converted_amount: e.target.value })}
                style={{ height: 38, lineHeight: '38px', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', background: '#fff', color: '#222', marginBottom: 0 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
            <button
              style={{ background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 14, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.10)', cursor: 'pointer', marginTop: 6, alignSelf: 'flex-end' }}
              type="submit"
              disabled={inlineFormLoading}
            >
              Add Budget
            </button>
            {inlineFormError && <span style={{ color: '#ef4444', fontWeight: 500, fontSize: 13 }}>{inlineFormError}</span>}
            {inlineFormSuccess && <span style={{ color: '#22c55e', fontWeight: 500, fontSize: 13 }}>{inlineFormSuccess}</span>}
          </div>
        </form>
        {/* Modal BudgetForm for editing only */}
        <BudgetForm open={formOpen} onClose={() => setFormOpen(false)} onSuccess={handleFormSuccess} initialData={editData} vendors={vendors} />
        <div style={{ width: '100%', overflowX: 'auto', marginTop: 32 }}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 3, bgcolor: '#fff', width: '100%' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress color="secondary" />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <DataGrid
                rows={budgets}
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
            )}
          </Paper>
        </div>
        {/* Modal for Budget Details (payments/items) remains unchanged */}
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xl" fullWidth>
          <DialogTitle>
            {selectedBudget ? <span style={{ color: '#7c3aed' }}>{`${selectedBudget.purchase} - Details`}</span> : <span style={{ color: '#7c3aed' }}>Budget Details</span>}
          </DialogTitle>
          <DialogContent>
            {/* --- Summary Indicators --- */}
            {selectedBudget && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 3,
                mb: 3,
                p: 2,
                bgcolor: '#f3e8ff',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.06)',
              }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#7c3aed', fontWeight: 700, fontSize: 15 }}>Total Budgeted</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#4b5563', fontSize: 18 }}>
                    {formatCurrency(selectedBudget.converted_amount || selectedBudget.cost)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#7c3aed', fontWeight: 700, fontSize: 15 }}>Total Paid</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e', fontSize: 18 }}>
                    {formatCurrency(paymentLogs.reduce((sum, p) => sum + (Number(p.payment_amount) || 0), 0))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#7c3aed', fontWeight: 700, fontSize: 15 }}>Remaining</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#ef4444', fontSize: 18 }}>
                    {formatCurrency((Number(selectedBudget.converted_amount || selectedBudget.cost) || 0) - paymentLogs.reduce((sum, p) => sum + (Number(p.payment_amount) || 0), 0))}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" sx={{ color: '#7c3aed', fontWeight: 700, fontSize: 15, mb: 0.5 }}>Progress</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={
                          ((paymentLogs.reduce((sum, p) => sum + (Number(p.payment_amount) || 0), 0)) /
                            (Number(selectedBudget.converted_amount || selectedBudget.cost) || 1)) * 100
                        }
                        sx={{ height: 10, borderRadius: 5, bgcolor: '#ede9fe', '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed' } }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#7c3aed', minWidth: 40 }}>
                      {Math.round(
                        ((paymentLogs.reduce((sum, p) => sum + (Number(p.payment_amount) || 0), 0)) /
                          (Number(selectedBudget.converted_amount || selectedBudget.cost) || 1)) * 100
                      )}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            {/* --- End Summary Indicators --- */}
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label={<span style={{ color: '#7c3aed' }}>Payments</span>} />
              <Tab label={<span style={{ color: '#7c3aed' }}>Item Costs</span>} />
            </Tabs>
            {modalLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress color="secondary" />
              </Box>
            ) : modalError ? (
              <Alert severity="error">{modalError}</Alert>
            ) : (
              <>
                {/* Payments Tab */}
                {tab === 0 && selectedBudget && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <Button
                        variant="contained"
                        sx={{ background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 14, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.10)', cursor: 'pointer', marginTop: 6, alignSelf: 'flex-end' }}
                        onClick={handleAddPayment}
                      >
                        Add Payment
                      </Button>
                    </Box>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, width: '100%' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell className="center-header">Payment Amount</TableCell>
                            <TableCell className="center-header">Payment By</TableCell>
                            <TableCell className="center-header">Payment For</TableCell>
                            <TableCell className="center-header">Payment Date</TableCell>
                            <TableCell className="center-header">Item</TableCell>
                            <TableCell className="center-header">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paymentLogs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ color: 'text.disabled' }}>
                                No payment logs found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paymentLogs.map((log: any) => (
                              <TableRow key={log.id}>
                                <TableCell>{formatCurrency(log.payment_amount)}</TableCell>
                                <TableCell>{log.payment_by}</TableCell>
                                <TableCell>{log.payment_for}</TableCell>
                                <TableCell>{log.payment_date}</TableCell>
                                <TableCell>{log.item}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ color: '#7c3aed', borderColor: '#a78bfa', fontWeight: 600, textTransform: 'none' }}
                                    onClick={() => handleEditPayment(log)}
                                  >
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <PaymentForm
                      open={paymentFormOpen}
                      onClose={() => setPaymentFormOpen(false)}
                      onSuccess={handlePaymentFormSuccess}
                      initialData={editPaymentData}
                      budgetId={selectedBudget.id}
                    />
                  </>
                )}
                {/* Item Costs Tab */}
                {tab === 1 && selectedBudget && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <Button
                        variant="contained"
                        sx={{ background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 14, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.10)', cursor: 'pointer', marginTop: 6, alignSelf: 'flex-end' }}
                        onClick={() => {
                          if (paymentLogs.length > 0) {
                            handleAddItemCost(paymentLogs[0].id);
                          }
                        }}
                        disabled={paymentLogs.length === 0}
                      >
                        Add Item Cost
                      </Button>
                    </Box>
                    <TableContainer component={Paper} variant="outlined" sx={{ width: '100%' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell className="center-header">Item</TableCell>
                            <TableCell className="center-header">Per Cost</TableCell>
                            <TableCell className="center-header">Subtotal</TableCell>
                            <TableCell className="center-header">Total</TableCell>
                            <TableCell className="center-header">Payment</TableCell>
                            <TableCell className="center-header">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {itemCosts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ color: 'text.disabled' }}>
                                No item costs found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            itemCosts.map((cost: any) => (
                              <TableRow key={cost.id}>
                                <TableCell>{cost.item}</TableCell>
                                <TableCell>{formatCurrency(cost.per_cost)}</TableCell>
                                <TableCell>{formatCurrency(cost.subtotal)}</TableCell>
                                <TableCell>{formatCurrency(cost.total)}</TableCell>
                                <TableCell>{cost.logged_payment_id}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ color: '#7c3aed', borderColor: '#a78bfa', fontWeight: 600, textTransform: 'none' }}
                                    onClick={() => handleEditItemCost(cost)}
                                  >
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <ItemCostForm
                      open={itemCostFormOpen}
                      onClose={() => setItemCostFormOpen(false)}
                      onSuccess={handleItemCostFormSuccess}
                      initialData={editItemCostData}
                      paymentId={selectedPaymentId || ''}
                    />
                  </>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default function BudgetPage() {
  return (
    <CurrencyProvider>
      <BudgetPageInner />
    </CurrencyProvider>
  );
} 