import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Only one row in settings table (id=1)
const SETTINGS_ID = 1;

export async function GET() {
  const { data, error } = await supabase
    .from('settings')
    .select('religion_enabled, floorplan_enabled')
    .eq('id', SETTINGS_ID)
    .single();
  if (error) {
    // If no row, return defaults
    return NextResponse.json({ religion_enabled: true, floorplan_enabled: true });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { religion_enabled, floorplan_enabled } = body;
  // Upsert the single row
  const { data, error } = await supabase
    .from('settings')
    .upsert({ id: SETTINGS_ID, religion_enabled, floorplan_enabled, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select('religion_enabled, floorplan_enabled')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
} 