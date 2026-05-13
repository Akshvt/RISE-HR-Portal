import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  // Try to query the information schema
  const { data, error } = await supabaseAdmin
    .from('leave_requests')
    .select('*')
    .limit(1)

  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 500 })
  }

  return NextResponse.json({ 
    message: "Table exists",
    sample: data[0] || "No records yet",
    columns: data[0] ? Object.keys(data[0]) : "Unknown"
  })
}
