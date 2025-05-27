"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Stack, Divider, Dialog, DialogTitle, DialogContent, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert } from '@mui/material';
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

  // State for column persistence
  const [columnState, setColumnState] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('budgetColumnState');
      return saved ? JSON.parse(saved) : undefined;
    }
    return undefined;
  });

  const budgetColumns: GridColDef[] = [
    { field: 'purchase', headerName: 'Purchase', flex: 1, minWidth: 140, headerClassName: 'center-header' },
    { field: 'vendor_id', headerName: 'Vendor', flex: 1, minWidth: 120, headerClassName: 'center-header' },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 110, headerClassName: 'center-header' },
    { field: 'event_id', headerName: 'Event/Sub-Event', flex: 1, minWidth: 150, headerClassName: 'center-header' },
    { field: 'category', headerName: 'Category', flex: 1, minWidth: 110, headerClassName: 'center-header' },
    { field: 'cost', headerName: `Cost (${currencySymbol})`, flex: 1, minWidth: 100, type: 'number',
      valueFormatter: ({ value }) => value,
      cellClassName: 'center-cell',
      headerClassName: 'center-header',
    },
    { field: 'tags', headerName: 'Tags', flex: 1, minWidth: 120, valueFormatter: ({ value }) => Array.isArray(value) ? (value as any[]).join(', ') : (value ?? ''), cellClassName: 'center-cell', headerClassName: 'center-header' },
    { field: 'payment_for', headerName: 'Payment For', flex: 1, minWidth: 120, cellClassName: 'center-cell', headerClassName: 'center-header' },
    { field: 'payment_by', headerName: 'Payment By', flex: 1, minWidth: 120, cellClassName: 'center-cell', headerClassName: 'center-header' },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Button variant="outlined" size="small" color="warning" onClick={() => params.api.getRow(params.id).openModal(params.id)}>
          View Details
        </Button>
      ),
      cellClassName: 'center-cell',
      headerClassName: 'center-header',
    },
  ];

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

  // Fetch budgets from Supabase
  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('date', { ascending: false });
    console.log('Fetched budgets:', data);
    if (error) {
      setError(error.message);
      setBudgets([]);
    } else {
      const mapped = (data || []).map(row => {
        console.log('Row before mapping:', row);
        return {
          ...row,
          cost: row.cost != null ? row.cost.toString() : '0.00',
        };
      });
      console.log('Mapped budgets:', mapped);
      setBudgets(mapped);
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchBudgets();
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

  // Patch DataGrid columns to inject handler and always apply headerClassName
  const columnsWithHandler = budgetColumns.map((col) => ({
    ...col,
    headerClassName: col.headerClassName || 'center-header',
    ...(col.field === 'actions' && {
      renderCell: (params: GridRenderCellParams) => (
        <>
          <Button variant="outlined" size="small" color="warning" onClick={() => handleViewDetails(params.row.id)} sx={{ mr: 1 }}>
            View Details
          </Button>
          <Button variant="outlined" size="small" color="primary" onClick={() => handleEditBudget(params.row)}>
            Edit
          </Button>
        </>
      ),
    }),
  }));

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

  return (
    <Box sx={{ width: '100%', maxWidth: 'none', mx: 0, py: 6, px: { xs: 1, sm: 3, md: 6 } }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3, bgcolor: '#fffbe6', width: '100%' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="warning.main" gutterBottom>
              Budget & Expenses
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Track your event costs, payments, and itemized expenses in one place.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 14, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.10)', cursor: 'pointer', marginTop: 6, alignSelf: 'flex-end' }}
            onClick={handleAddBudget}
          >
            Add Budget Entry
          </Button>
        </Stack>
      </Paper>

      {/* Budget Table Section */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 3, bgcolor: '#fff', width: '100%' }}>
        <Typography variant="h5" fontWeight={575} color="warning.main" mb={2}>
          All Budget Entries
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress color="warning" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box sx={{ height: 420, width: '100%' }}>
            <DataGrid
              rows={budgets}
              columns={columnsWithHandler}
              getRowId={(row) => row.id}
              initialState={columnState ? { ...columnState, pagination: { paginationModel: { pageSize: 5, page: 0 } } } : { pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
              disableRowSelectionOnClick
              onColumnOrderChange={handleColumnOrderChange}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
              onColumnWidthChange={handleColumnWidthChange}
              sx={{
                border: 'none',
                fontSize: 16,
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#fef3c7', color: '#a16207', fontWeight: 700 },
                '& .MuiDataGrid-row': { bgcolor: '#fff' },
                '& .MuiDataGrid-footerContainer': { bgcolor: '#fef3c7' },
                '& .center-cell': { textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center' },
                width: '100%',
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Modal for Budget Details (still using mock data for now) */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          {selectedBudget ? `${selectedBudget.purchase} - Details` : 'Budget Details'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Payments" />
            <Tab label="Item Costs" />
          </Tabs>
          {modalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress color="warning" />
            </Box>
          ) : modalError ? (
            <Alert severity="error">{modalError}</Alert>
          ) : (
            <>
              {/* Payments Tab */}
              {tab === 0 && selectedBudget && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <Button variant="contained" color="warning" onClick={handleAddPayment}>
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
                                <Button variant="outlined" size="small" color="primary" onClick={() => handleEditPayment(log)}>
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
                      color="warning"
                      onClick={() => {
                        // If there are payments, default to first payment; else, disable
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
                                <Button variant="outlined" size="small" color="primary" onClick={() => handleEditItemCost(cost)}>
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
      <BudgetForm open={formOpen} onClose={() => setFormOpen(false)} onSuccess={handleFormSuccess} initialData={editData} />
    </Box>
  );
}

export default function BudgetPage() {
  return (
    <CurrencyProvider>
      <BudgetPageInner />
    </CurrencyProvider>
  );
} 