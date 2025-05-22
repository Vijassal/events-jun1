import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Try to get the definition of the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .limit(1)

    if (error) {
      console.error('Schema check error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the structure of the returned data
    const columnNames = data && data[0] ? Object.keys(data[0]) : []

    return NextResponse.json({
      message: 'Schema check completed',
      columns: columnNames,
      sampleData: data
    })
  } catch (error) {
    console.error('Schema check error:', error)
    return NextResponse.json(
      { error: 'Failed to check schema' },
      { status: 500 }
    )
  }
} 