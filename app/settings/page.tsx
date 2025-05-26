'use client';
import React, { useEffect, useState } from "react";
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
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
  const [currency, setCurrency] = useState('USD');
  const [profileId, setProfileId] = useState<string | null>(null);
  const currencyList = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'INR', name: 'Indian Rupee' },
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
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'MXN', name: 'Mexican Peso' },
    { code: 'RUB', name: 'Russian Ruble' },
    { code: 'TRY', name: 'Turkish Lira' },
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'PLN', name: 'Polish Zloty' },
    { code: 'NOK', name: 'Norwegian Krone' },
    { code: 'DKK', name: 'Danish Krone' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'IDR', name: 'Indonesian Rupiah' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'PHP', name: 'Philippine Peso' },
    { code: 'VND', name: 'Vietnamese Dong' },
    { code: 'TWD', name: 'Taiwan Dollar' },
    { code: 'HUF', name: 'Hungarian Forint' },
    { code: 'CZK', name: 'Czech Koruna' },
    { code: 'ILS', name: 'Israeli Shekel' },
    { code: 'CLP', name: 'Chilean Peso' },
    { code: 'PKR', name: 'Pakistani Rupee' },
    { code: 'EGP', name: 'Egyptian Pound' },
    { code: 'NGN', name: 'Nigerian Naira' },
    { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'GHS', name: 'Ghanaian Cedi' },
    { code: 'COP', name: 'Colombian Peso' },
    { code: 'ARS', name: 'Argentine Peso' },
    { code: 'PEN', name: 'Peruvian Sol' },
    { code: 'UAH', name: 'Ukrainian Hryvnia' },
    { code: 'QAR', name: 'Qatari Riyal' },
    { code: 'BHD', name: 'Bahraini Dinar' },
    { code: 'OMR', name: 'Omani Rial' },
    { code: 'KWD', name: 'Kuwaiti Dinar' },
    { code: 'LKR', name: 'Sri Lankan Rupee' },
    { code: 'BDT', name: 'Bangladeshi Taka' },
    { code: 'MAD', name: 'Moroccan Dirham' },
    { code: 'RON', name: 'Romanian Leu' },
    { code: 'HRK', name: 'Croatian Kuna' },
    { code: 'RSD', name: 'Serbian Dinar' },
    { code: 'BGN', name: 'Bulgarian Lev' },
    { code: 'ISK', name: 'Icelandic Krona' },
    { code: 'GEL', name: 'Georgian Lari' },
    { code: 'UZS', name: 'Uzbekistani Som' },
    { code: 'KZT', name: 'Kazakhstani Tenge' },
    { code: 'BYN', name: 'Belarusian Ruble' },
    { code: 'AZN', name: 'Azerbaijani Manat' },
    { code: 'AMD', name: 'Armenian Dram' },
    { code: 'MKD', name: 'Macedonian Denar' },
    { code: 'ALL', name: 'Albanian Lek' },
    { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark' },
    { code: 'MDL', name: 'Moldovan Leu' },
    { code: 'MNT', name: 'Mongolian Tugrik' },
    { code: 'MOP', name: 'Macanese Pataca' },
    { code: 'JMD', name: 'Jamaican Dollar' },
    { code: 'XOF', name: 'West African CFA franc' },
    { code: 'XAF', name: 'Central African CFA franc' },
    { code: 'XCD', name: 'East Caribbean Dollar' },
    { code: 'XPF', name: 'CFP Franc' },
    { code: 'XUA', name: 'ADB Unit of Account' },
    { code: 'XAG', name: 'Silver (troy ounce)' },
    { code: 'XAU', name: 'Gold (troy ounce)' },
    { code: 'XDR', name: 'IMF Special Drawing Rights' },
    { code: 'XTS', name: 'Testing Currency Code' },
    { code: 'XXX', name: 'No Currency' },
  ];

  useEffect(() => {
    // Fetch user profile and currency from Supabase
    async function fetchProfile() {
      setLoading(true);
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
        }
      }
      setLoading(false);
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
    setSaving(true);
    if (profileId) {
      await supabase.from('profiles').update({ currency: newCurrency }).eq('id', profileId);
    }
    setSaving(false);
    window.dispatchEvent(new Event('currencyChanged'));
  };

  if (loading) return <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>Loading settings...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Settings</h1>
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
    </div>
  );
} 