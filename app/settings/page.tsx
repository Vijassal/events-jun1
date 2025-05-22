import React from "react";

export default function SettingsPage() {
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
    </div>
  );
} 