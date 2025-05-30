import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to get account_instance_id from user
async function getAccountInstanceId(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  // Find account_instance for this user (by email)
  const { data: account } = await supabase
    .from('account_instances')
    .select('id')
    .eq('owner_user_id', user.id)
    .single();
  return account?.id || null;
}

const SETTINGS_FIELDS = [
  'religion_enabled',
  'floorplan_enabled',
  'currency',
  'theme',
  'email_notifications_enabled',
  'sms_notifications_enabled',
  'profile_private',
];

export async function GET(req: NextRequest) {
  const accountInstanceId = await getAccountInstanceId(req);
  if (!accountInstanceId) {
    // Return defaults
    return NextResponse.json({
      religion_enabled: true,
      floorplan_enabled: true,
      currency: 'USD',
      theme: 'light',
      email_notifications_enabled: true,
      sms_notifications_enabled: true,
      profile_private: false,
    });
  }
  const { data, error } = await supabase
    .from('settings')
    .select(SETTINGS_FIELDS.join(','))
    .eq('account_instance_id', accountInstanceId)
    .single();
  if (error || !data) {
    // If no row, return defaults
    return NextResponse.json({
      religion_enabled: true,
      floorplan_enabled: true,
      currency: 'USD',
      theme: 'light',
      email_notifications_enabled: true,
      sms_notifications_enabled: true,
      profile_private: false,
    });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const accountInstanceId = await getAccountInstanceId(req);
  if (!accountInstanceId) {
    return NextResponse.json({ error: 'No account instance found' }, { status: 401 });
  }
  const body = await req.json();
  // Only allow updating known fields
  const updateObj: any = { account_instance_id: accountInstanceId, updated_at: new Date().toISOString() };
  for (const field of SETTINGS_FIELDS) {
    if (body[field] !== undefined) updateObj[field] = body[field];
  }
  const { data, error } = await supabase
    .from('settings')
    .upsert(updateObj, { onConflict: 'account_instance_id' })
    .select(SETTINGS_FIELDS.join(','))
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
} 