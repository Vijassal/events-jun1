"use client";
import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Alert } from '@mui/material';
import { supabase } from '../../src/lib/supabase';

const initialForm = {
  payment_amount: '',
  payment_by: '',
  payment_for: '',
  payment_date: '',
  item: '',
};

export default function PaymentForm({ open, onClose, onSuccess, initialData, budgetId }: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  budgetId: string;
}) {
  const [form, setForm] = useState(initialData ? { ...initialForm, ...initialData } : initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Validate required fields
    if (!form.payment_amount || !form.payment_date || !form.item) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    // Insert or update
    let result;
    if (initialData && initialData.id) {
      result = await supabase.from('logged_payments').update({ ...form, payment_amount: Number(form.payment_amount) }).eq('id', initialData.id);
    } else {
      result = await supabase.from('logged_payments').insert([{ ...form, payment_amount: Number(form.payment_amount), budget_id: budgetId }]);
    }
    if (result.error) {
      setError(result.error.message);
    } else {
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <TextField label="Budget ID" name="budget_id" value={budgetId} disabled fullWidth />
            <TextField label="Payment Amount" name="payment_amount" value={form.payment_amount} onChange={handleChange} required fullWidth type="number" inputProps={{ min: 0 }} />
            <TextField label="Payment By" name="payment_by" value={form.payment_by} onChange={handleChange} fullWidth />
            <TextField label="Payment For" name="payment_for" value={form.payment_for} onChange={handleChange} fullWidth />
            <TextField label="Payment Date" name="payment_date" type="date" value={form.payment_date} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Item" name="item" value={form.item} onChange={handleChange} required fullWidth />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="warning" disabled={loading}>
          {initialData ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 