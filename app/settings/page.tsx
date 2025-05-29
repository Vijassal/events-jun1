'use client';
import React, { useEffect, useState } from "react";
import { MenuItem, Select, FormControl, InputLabel, Tabs, Tab, Box } from '@mui/material';
import { supabase } from '../../src/lib/supabase';

const Toggle = ({ checked, onChange, label }: { checked: boolean, onChange: (checked: boolean) => void, label: string }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
    <span>{label}</span>
    <span style={{ position: 'relative', width: 44, height: 24, display: 'inline-block' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ opacity: 0, width: 44, height: 24, position: 'absolute', left: 0, top: 0, margin: 0, cursor: 'pointer' }}
      />
      <span style={{
        display: 'block',
        width: 44,
        height: 24,
        background: checked ? '#7c3aed' : '#d1d5db',
        borderRadius: 12,
        transition: 'background 0.2s',
        position: 'absolute',
        top: 0,
        left: 0,
      }} />
      <span style={{
        position: 'absolute',
        left: checked ? 22 : 2,
        top: 2,
        width: 20,
        height: 20,
        background: '#fff',
        borderRadius: '50%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        transition: 'left 0.2s',
      }} />
    </span>
  </label>
);

export default function SettingsPage() {
  const [religionEnabled, setReligionEnabled] = useState(true);
  const [floorplanEnabled, setFloorplanEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedCurrency') || 'USD';
    }
    return 'USD';
  });
  const [profileId, setProfileId] = useState<string | null>(null);
  const currencyList = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'HKD', name: 'Hong Kong Dollar' },
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'KRW', name: 'South Korean Won' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'NOK', name: 'Norwegian Krone' },
    { code: 'MXN', name: 'Mexican Peso' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'RUB', name: 'Russian Ruble' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'TRY', name: 'Turkish Lira' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'TWD', name: 'Taiwan Dollar' },
    { code: 'DKK', name: 'Danish Krone' },
    { code: 'PLN', name: 'Polish Zloty' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'IDR', name: 'Indonesian Rupiah' },
  ];
  const [tab, setTab] = useState(0);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setTab(newValue);

  useEffect(() => {
    // Fetch feature toggles from API
    async function fetchToggles() {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      setReligionEnabled(data.religion_enabled);
      setFloorplanEnabled(data.floorplan_enabled);
      setLoading(false);
    }
    fetchToggles();
  }, []);

  useEffect(() => {
    // Fetch user profile and currency from Supabase
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, currency')
          .eq('email', user.email)
          .single();
        if (profile) {
          setProfileId(profile.id);
          setCurrency(profile.currency || 'USD');
          if (profile.currency) {
            localStorage.setItem('selectedCurrency', profile.currency);
          }
        }
      }
    }
    fetchProfile();
  }, []);

  const updateSettings = (newReligion: boolean, newFloorplan: boolean) => {
    setSaving(true);
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ religion_enabled: newReligion, floorplan_enabled: newFloorplan })
    })
      .then(res => res.json())
      .then(data => {
        setReligionEnabled(data.religion_enabled);
        setFloorplanEnabled(data.floorplan_enabled);
        setSaving(false);
        window.dispatchEvent(new Event('featureToggleChanged'));
      });
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('selectedCurrency', newCurrency);
    setSaving(true);
    if (profileId) {
      await supabase.from('profiles').update({ currency: newCurrency }).eq('id', profileId);
    }
    setSaving(false);
    window.dispatchEvent(new Event('currencyChanged'));
  };

  function TabPanel(props: { children: React.ReactNode; value: number; index: number }) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`settings-tabpanel-${index}`}
        aria-labelledby={`settings-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
      </div>
    );
  }

  if (loading) return <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>Loading settings...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Settings</h1>
      <Tabs value={tab} onChange={handleTabChange} aria-label="settings tabs" sx={{ mb: 2 }}>
        <Tab label="Profile" id="settings-tab-0" aria-controls="settings-tabpanel-0" />
        <Tab label="Team" id="settings-tab-1" aria-controls="settings-tabpanel-1" />
        <Tab label="Configurations" id="settings-tab-2" aria-controls="settings-tabpanel-2" />
      </Tabs>
      <TabPanel value={tab} index={0}>
        {/* Profile Tab Content */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Profile</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <label>
              Name
              <input type="text" placeholder="Your Name" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }} disabled />
            </label>
            <label>
              Email
              <input type="email" placeholder="you@example.com" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }} disabled />
            </label>
          </div>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Account</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <label>
              Password
              <input type="password" placeholder="********" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }} disabled />
            </label>
          </div>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Notifications</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" disabled /> Email Notifications
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" disabled /> SMS Notifications
            </label>
          </div>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Privacy</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" disabled /> Make profile private
            </label>
          </div>
        </section>
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Theme</h2>
          <div style={{ display: "flex", flexDirection: "row", gap: 16, marginTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="radio" name="theme" disabled /> Light
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="radio" name="theme" disabled /> Dark
            </label>
          </div>
        </section>
      </TabPanel>
      <TabPanel value={tab} index={1}>
        {/* Team Tab Content */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Invite Team Member</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }} onSubmit={e => e.preventDefault()}>
            <label>
              Email
              <input type="email" placeholder="team@example.com" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }} />
            </label>
            <button type="submit" style={{ padding: 10, borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }} disabled>
              Send Invite (Coming Soon)
            </button>
          </form>
        </section>
      </TabPanel>
      <TabPanel value={tab} index={2}>
        {/* Configurations Tab Content */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Feature Toggles</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 12 }}>
            <Toggle
              checked={religionEnabled}
              onChange={checked => updateSettings(checked, floorplanEnabled)}
              label="Enable Religion Page"
            />
            <Toggle
              checked={floorplanEnabled}
              onChange={checked => updateSettings(religionEnabled, checked)}
              label="Enable Floorplan Page"
            />
            {saving && <span style={{ color: '#7c3aed', fontSize: 14 }}>Saving...</span>}
          </div>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Currency</h2>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="currency-label">Currency</InputLabel>
            <Select
              labelId="currency-label"
              value={currency}
              label="Currency"
              onChange={e => handleCurrencyChange(e.target.value)}
            >
              {currencyList.map(c => (
                <MenuItem key={c.code} value={c.code}>{c.code} - {c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <div style={{ marginTop: 8, color: '#6b7280', fontSize: 14 }}>
            Selected currency: <b>{currency}</b>
            {saving && <span style={{ color: '#7c3aed', fontSize: 14, marginLeft: 12 }}>Saving...</span>}
          </div>
        </section>
      </TabPanel>
    </div>
  );
} 