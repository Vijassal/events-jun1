"use client";
import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Alert } from '@mui/material';
import { supabase } from '../../src/lib/supabase';

const initialForm = {
  item: '',
  per_cost: '',
  subtotal: '',
  total: '',
};

export default function ItemCostForm({ open, onClose, onSuccess, initialData, paymentId }: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  paymentId: string;
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
    if (!form.item || !form.per_cost || !form.subtotal || !form.total) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    // Insert or update
    let result;
    if (initialData && initialData.id) {
      result = await supabase.from('logged_item_costs').update({ ...form, per_cost: Number(form.per_cost), subtotal: Number(form.subtotal), total: Number(form.total) }).eq('id', initialData.id);
    } else {
      result = await supabase.from('logged_item_costs').insert([{ ...form, per_cost: Number(form.per_cost), subtotal: Number(form.subtotal), total: Number(form.total), logged_payment_id: paymentId }]);
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
      <DialogTitle>{initialData ? 'Edit Item Cost' : 'Add Item Cost'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <TextField label="Payment ID" name="logged_payment_id" value={paymentId} disabled fullWidth />
            <TextField label="Item" name="item" value={form.item} onChange={handleChange} required fullWidth />
            <TextField label="Per Cost" name="per_cost" value={form.per_cost} onChange={handleChange} required fullWidth type="number" inputProps={{ min: 0 }} />
            <TextField label="Subtotal" name="subtotal" value={form.subtotal} onChange={handleChange} required fullWidth type="number" inputProps={{ min: 0 }} />
            <TextField label="Total" name="total" value={form.total} onChange={handleChange} required fullWidth type="number" inputProps={{ min: 0 }} />
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