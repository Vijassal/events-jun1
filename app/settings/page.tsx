'use client';
import React, { useEffect, useState } from "react";

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

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setReligionEnabled(data.religion_enabled);
        setFloorplanEnabled(data.floorplan_enabled);
        setLoading(false);
      });
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
    </div>
  );
} 