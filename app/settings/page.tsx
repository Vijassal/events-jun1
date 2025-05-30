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
  const [currency, setCurrency] = useState('USD');
  const [theme, setTheme] = useState('light');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null);
  const [instances, setInstances] = useState<{ id: string, name: string }[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [members, setMembers] = useState<{ user_id: string, email: string, role: string }[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [roleStatus, setRoleStatus] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setTab(newValue);
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

  // Fetch the user's account_instance_id (owner first, then member)
  useEffect(() => {
    async function fetchAccountInstanceId() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      // Try to find an instance where the user is the owner
      let { data: ownedInstances, error: ownerError } = await supabase
        .from('account_instances')
        .select('id')
        .eq('owner_user_id', userId)
        .limit(1);
      console.log('Owned instances:', ownedInstances, ownerError);
      if (ownedInstances && ownedInstances.length > 0) {
        setAccountInstanceId(ownedInstances[0].id);
        return;
      }
      // Otherwise, find an instance where the user is a member
      let { data: memberships, error: memberError } = await supabase
        .from('account_instance_members')
        .select('account_instance_id')
        .eq('user_id', userId)
        .limit(1);
      console.log('Memberships:', memberships, memberError);
      if (memberships && memberships.length > 0) {
        setAccountInstanceId(memberships[0].account_instance_id);
      }
    }
    fetchAccountInstanceId();
  }, []);

  // Fetch settings for the current account_instance_id
  useEffect(() => {
    async function fetchSettings() {
      if (!accountInstanceId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('account_instance_id', accountInstanceId)
        .single<any>();
      console.log('Settings fetch result:', data, error);
      if (error && error.code === 'PGRST116') {
        // No settings row exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('settings')
          .insert({ account_instance_id: accountInstanceId })
          .single<any>();
        if (!insertError && newData) {
          setReligionEnabled(newData.religion_enabled ?? true);
          setFloorplanEnabled(newData.floorplan_enabled ?? true);
          setCurrency(newData.currency ?? 'USD');
          setTheme(newData.theme ?? 'light');
          setEmailNotifications(newData.email_notifications_enabled ?? true);
          setSmsNotifications(newData.sms_notifications_enabled ?? true);
          setProfilePrivate(newData.profile_private ?? false);
        }
      } else if (data) {
        setReligionEnabled(data.religion_enabled ?? true);
        setFloorplanEnabled(data.floorplan_enabled ?? true);
        setCurrency(data.currency ?? 'USD');
        setTheme(data.theme ?? 'light');
        setEmailNotifications(data.email_notifications_enabled ?? true);
        setSmsNotifications(data.sms_notifications_enabled ?? true);
        setProfilePrivate(data.profile_private ?? false);
      }
      setLoading(false);
    }
    fetchSettings();
  }, [accountInstanceId]);

  useEffect(() => {
    async function fetchInstances() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      const { data: memberships } = await supabase
        .from('account_instance_members')
        .select('account_instance_id, account_instances(name)')
        .eq('user_id', userId);
      console.log('Fetched memberships:', memberships);
      if (memberships) {
        const insts = memberships.map((m: any) => ({ id: m.account_instance_id, name: m.account_instances?.name || 'Unnamed Instance' }));
        console.log('Mapped instances:', insts);
        setInstances(insts);
        // Set default instance from localStorage or first
        const stored = typeof window !== 'undefined' ? localStorage.getItem('account_instance_id') : null;
        setSelectedInstance(stored || (insts[0]?.id ?? null));
        if (!stored && insts[0]?.id) localStorage.setItem('account_instance_id', insts[0].id);
      }
    }
    fetchInstances();
  }, []);

  useEffect(() => {
    async function fetchMembers() {
      if (!selectedInstance) return;
      setMembersLoading(true);
      const { data, error } = await supabase
        .from('account_instance_members')
        .select('user_id, role, profiles(email)')
        .eq('account_instance_id', selectedInstance);
      if (data) {
        setMembers(data.map((m: any) => ({ user_id: m.user_id, email: m.profiles?.email || '', role: m.role })));
      }
      setMembersLoading(false);
    }
    fetchMembers();
  }, [selectedInstance]);

  useEffect(() => {
    async function fetchCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    }
    fetchCurrentUser();
  }, []);

  // Update settings for the current account_instance_id
  const updateSettings = async (fields: Partial<any>) => {
    setSaving(true);
    const payload = {
      religion_enabled: religionEnabled,
      floorplan_enabled: floorplanEnabled,
      currency,
      theme,
      email_notifications_enabled: emailNotifications,
      sms_notifications_enabled: smsNotifications,
      profile_private: profilePrivate,
      ...fields,
      account_instance_id: accountInstanceId,
    };
    const { data, error } = await supabase
      .from('settings')
      .upsert([payload], { onConflict: 'account_instance_id' })
      .select()
      .single<any>();
    if (!error && data) {
      setReligionEnabled(data.religion_enabled ?? true);
      setFloorplanEnabled(data.floorplan_enabled ?? true);
      setCurrency(data.currency ?? 'USD');
      setTheme(data.theme ?? 'light');
      setEmailNotifications(data.email_notifications_enabled ?? true);
      setSmsNotifications(data.sms_notifications_enabled ?? true);
      setProfilePrivate(data.profile_private ?? false);
    }
    setSaving(false);
    window.dispatchEvent(new Event('featureToggleChanged'));
  };

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteStatus('');
    if (!inviteEmail) {
      setInviteStatus('Please enter an email.');
      return;
    }
    if (!selectedInstance) {
      setInviteStatus('No account instance selected.');
      return;
    }
    // 1. Look up user by email in the profiles table
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', inviteEmail)
      .single();
    if (userError || !userProfile || !userProfile.user_id) {
      setInviteStatus('User not found. They must register first.');
      return;
    }
    // 2. Insert into account_instance_members
    const { error: memberError } = await supabase
      .from('account_instance_members')
      .insert({
        account_instance_id: selectedInstance,
        user_id: userProfile.user_id,
        role: 'member',
      });
    if (memberError) {
      setInviteStatus('Failed to add member: ' + memberError.message);
    } else {
      setInviteStatus('User invited successfully!');
      setInviteEmail('');
    }
  };

  const handleInstanceSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInstance(e.target.value);
    localStorage.setItem('account_instance_id', e.target.value);
    window.location.reload(); // reload to re-fetch data for new instance
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleStatus('');
    const { error } = await supabase
      .from('account_instance_members')
      .update({ role: newRole })
      .eq('account_instance_id', selectedInstance)
      .eq('user_id', userId);
    if (error) {
      setRoleStatus('Failed to update role: ' + error.message);
    } else {
      setRoleStatus('Role updated successfully!');
    }
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
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>Current Account Instance:</label>
        <select value={selectedInstance || ''} onChange={handleInstanceSwitch} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }}>
          {instances.map(inst => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </select>
      </div>
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
              <input type="checkbox" checked={emailNotifications} onChange={e => { setEmailNotifications(e.target.checked); updateSettings({ email_notifications_enabled: e.target.checked }); }} /> Email Notifications
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={smsNotifications} onChange={e => { setSmsNotifications(e.target.checked); updateSettings({ sms_notifications_enabled: e.target.checked }); }} /> SMS Notifications
            </label>
          </div>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Privacy</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={profilePrivate} onChange={e => { setProfilePrivate(e.target.checked); updateSettings({ profile_private: e.target.checked }); }} /> Make profile private
            </label>
          </div>
        </section>
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Theme</h2>
          <div style={{ display: "flex", flexDirection: "row", gap: 16, marginTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="radio" name="theme" checked={theme === 'light'} onChange={() => { setTheme('light'); updateSettings({ theme: 'light' }); }} /> Light
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="radio" name="theme" checked={theme === 'dark'} onChange={() => { setTheme('dark'); updateSettings({ theme: 'dark' }); }} /> Dark
            </label>
          </div>
        </section>
      </TabPanel>
      <TabPanel value={tab} index={1}>
        {/* Team Tab Content */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Invite Team Member</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }} onSubmit={handleInvite}>
            <label>
              Email
              <input type="email" placeholder="team@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }} />
            </label>
            <button type="submit" style={{ padding: 10, borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Send Invite
            </button>
            {inviteStatus && <div style={{ marginTop: 8, color: inviteStatus.includes('success') ? 'green' : 'red' }}>{inviteStatus}</div>}
          </form>
        </section>
        <section style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Team Members</h3>
          {membersLoading ? (
            <div>Loading members...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.user_id}>
                    <td style={{ padding: 8 }}>{member.email}</td>
                    <td style={{ padding: 8 }}>
                      <select
                        value={member.role}
                        onChange={e => handleRoleChange(member.user_id, e.target.value)}
                        disabled={member.user_id === currentUserId && member.role === 'owner'}
                        style={{ padding: 4, borderRadius: 4 }}
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {roleStatus && <div style={{ marginTop: 8, color: roleStatus.includes('success') ? 'green' : 'red' }}>{roleStatus}</div>}
        </section>
      </TabPanel>
      <TabPanel value={tab} index={2}>
        {/* Configurations Tab Content */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Feature Toggles</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 12 }}>
            <Toggle
              checked={religionEnabled}
              onChange={checked => { setReligionEnabled(checked); updateSettings({ religion_enabled: checked }); }}
              label="Enable Religion Page"
            />
            <Toggle
              checked={floorplanEnabled}
              onChange={checked => { setFloorplanEnabled(checked); updateSettings({ floorplan_enabled: checked }); }}
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
              onChange={e => { setCurrency(e.target.value); updateSettings({ currency: e.target.value }); localStorage.setItem('selectedCurrency', e.target.value); window.dispatchEvent(new Event('currencyChanged')); }}
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