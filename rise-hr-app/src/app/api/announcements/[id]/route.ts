import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session || !['Admin', 'HR'].includes((session.user as any).role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, body } = await req.json()
  
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Title and body required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('posts')
    .update({
      title: title.trim(),
      body_json: { text: body.trim() },
      edited_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log
  await supabaseAdmin.from('audit_log').insert({
    actor_airtable_id: (session.user as any).airtableId || session.user.email || '',
    actor_name: session.user.name ?? '',
    actor_role: (session.user as any).role ?? '',
    action_type: 'post_updated',
    target: id,
    after_json: { title: title.trim() },
  })

  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session || !['Admin', 'HR'].includes((session.user as any).role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log
  await supabaseAdmin.from('audit_log').insert({
    actor_airtable_id: (session.user as any).airtableId || session.user.email || '',
    actor_name: session.user.name ?? '',
    actor_role: (session.user as any).role ?? '',
    action_type: 'post_deleted',
    target: id,
    before_json: { id },
  })

  return NextResponse.json({ success: true })
}
