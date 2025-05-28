"use client";
import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Chip, Alert, MenuItem } from '@mui/material';
import { supabase } from '../../src/lib/supabase';

const initialForm = {
  purchase: '',
  vendor_id: '',
  date: '',
  event_id: '',
  category: '',
  cost: '',
  tags: [] as string[],
  payment_for: '',
  payment_by: '',
};

export default function BudgetForm({ open, onClose, onSuccess, initialData, vendors = [] }: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  vendors?: { id: string, name: string }[];
}) {
  const [form, setForm] = useState(initialData ? { ...initialForm, ...initialData } : initialForm);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
    }
    setTagInput('');
  };

  const handleDeleteTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t: string) => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Validate required fields
    if (!form.purchase || !form.date || !form.category || !form.cost) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    // Insert or update
    let result;
    if (initialData && initialData.id) {
      result = await supabase.from('budgets').update({ ...form, cost: Number(form.cost) }).eq('id', initialData.id);
    } else {
      result = await supabase.from('budgets').insert([{ ...form, cost: Number(form.cost) }]);
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
      <DialogTitle>{initialData ? 'Edit Budget Entry' : 'Add Budget Entry'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <TextField label="Purchase" name="purchase" value={form.purchase} onChange={handleChange} required fullWidth />
            <TextField
              select
              label="Vendor"
              name="vendor_id"
              value={form.vendor_id}
              onChange={handleChange}
              required
              fullWidth
            >
              <MenuItem value="">Select Vendor</MenuItem>
              {vendors.map(vendor => (
                <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Date" name="date" type="date" value={form.date} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Event ID" name="event_id" value={form.event_id} onChange={handleChange} fullWidth />
            <TextField label="Category" name="category" value={form.category} onChange={handleChange} required fullWidth />
            <TextField label="Cost" name="cost" value={form.cost} onChange={handleChange} required fullWidth type="number" inputProps={{ min: 0, step: '0.01' }} />
            <Box>
              <TextField label="Add Tag" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} size="small" sx={{ mr: 1, width: 180 }} />
              <Button onClick={handleAddTag} size="small" variant="outlined">Add</Button>
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {form.tags.map((tag: string) => (
                  <Chip key={tag} label={tag} onDelete={() => handleDeleteTag(tag)} />
                ))}
              </Box>
            </Box>
            <TextField label="Payment For" name="payment_for" value={form.payment_for} onChange={handleChange} fullWidth />
            <TextField label="Payment By" name="payment_by" value={form.payment_by} onChange={handleChange} fullWidth />
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