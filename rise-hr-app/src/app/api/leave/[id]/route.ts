import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/mailer'

// Shared helper — restore leave_balances when a leave is cancelled/rejected
async function restoreBalance(
  airtableId: string,
  startDate: string,
  type: string,
  daysDeducted: number
) {
  const year = new Date(startDate).getFullYear()
  const field = type === 'wfh' ? 'wfh_taken' : 'pto_taken'

  const { data: bal } = await supabaseAdmin
    .from('leave_balances')
    .select('pto_taken, wfh_taken')
    .eq('employee_airtable_id', airtableId)
    .eq('year', year)
    .single()

  if (bal) {
    const current = Number(type === 'wfh' ? bal.wfh_taken : bal.pto_taken)
    const restored = Math.max(0, current - daysDeducted)
    await supabaseAdmin
      .from('leave_balances')
      .update({ [field]: restored })
      .eq('employee_airtable_id', airtableId)
      .eq('year', year)
  }
}

// PATCH — approve / reject / revert-to-pending
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session || !['Admin', 'HR'].includes((session.user as any).role ?? '')) {
    return NextResponse.json({ error: 'Forbidden: Admin or HR role required' }, { status: 403 })
  }

  const body = await req.json()
  const { action, reason } = body // action: 'approve' | 'reject' | 'pending'

  if (!['approve', 'reject', 'pending'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  if (action === 'reject' && !reason?.trim()) {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
  }

  const { data: request, error: fetchError } = await supabaseAdmin
    .from('leave_requests')
    .select('employee_email, employee_name, type, days_deducted, employee_airtable_id, start_date, end_date, status')
    .eq('id', id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
  }

  // Removed self-approval restriction per user request
  // if (action === 'approve' && request.employee_email === session.user.email && request.type !== 'sick') {
  //   return NextResponse.json({ error: 'Cannot approve your own leave request' }, { status: 400 })
  // }

  const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending'

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('leave_requests')
    .update({
      status: newStatus,
      rejection_reason: action === 'reject' ? reason?.trim() : null,
      approved_by: action === 'approve' ? session.user.email : null,
      approved_at: action === 'approve' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Balance management: restore days when rejecting an approved leave or reverting to pending
  if ((action === 'reject' || action === 'pending') && request.status === 'approved' && request.employee_airtable_id) {
    await restoreBalance(
      request.employee_airtable_id,
      request.start_date,
      request.type,
      Number(request.days_deducted)
    )
  }

  // Audit log
  await supabaseAdmin.from('audit_log').insert({
    actor_airtable_id: (session.user as any).airtableId || session.user.email || '',
    actor_name: session.user.name ?? '',
    actor_role: (session.user as any).role ?? '',
    action_type: `leave_${action}d`,
    target: id,
    before_json: { status: request.status },
    after_json: { status: newStatus, reason: reason || null },
  })

  // Notify employee
  if (updated?.employee_email) {
    let subject = ''
    let html = ''

    if (action === 'pending') {
      subject = 'Leave Request Reverted to Pending ⏳'
      html = `<p>Your <strong>${request.type.replace(/_/g, ' ')}</strong> leave from <strong>${request.start_date}</strong> to <strong>${request.end_date}</strong> has been reverted to <strong>pending</strong> status by an administrator.</p>`
    } else {
      const isApproved = action === 'approve'
      subject = `Your Leave Request Has Been ${isApproved ? 'Approved ✅' : 'Rejected ❌'}`
      html = `<p>Your <strong>${request.type.replace(/_/g, ' ')}</strong> leave from <strong>${request.start_date}</strong> to <strong>${request.end_date}</strong> has been <strong>${isApproved ? 'approved' : 'rejected'}</strong>.</p>
             ${!isApproved ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}`
    }

    await sendEmail({ to: updated.employee_email, subject, html })
      .catch(e => console.error('[Leave PATCH] Email failed:', e))
  }

  return NextResponse.json(updated)
}

// DELETE — permanently remove a leave request (Admin/HR only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session || !['Admin', 'HR'].includes((session.user as any).role ?? '')) {
    return NextResponse.json({ error: 'Forbidden: Admin or HR role required' }, { status: 403 })
  }

  const { data: request, error: fetchError } = await supabaseAdmin
    .from('leave_requests')
    .select('employee_email, employee_name, type, days_deducted, employee_airtable_id, start_date, status')
    .eq('id', id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
  }

  // Restore balance if we're deleting an approved leave
  if (request.status === 'approved' && request.employee_airtable_id) {
    await restoreBalance(
      request.employee_airtable_id,
      request.start_date,
      request.type,
      Number(request.days_deducted)
    )
  }

  const { error: deleteError } = await supabaseAdmin
    .from('leave_requests')
    .delete()
    .eq('id', id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  // Audit log
  await supabaseAdmin.from('audit_log').insert({
    actor_airtable_id: (session.user as any).airtableId || session.user.email || '',
    actor_name: session.user.name ?? '',
    actor_role: (session.user as any).role ?? '',
    action_type: 'leave_deleted',
    target: id,
    before_json: { employee: request.employee_email, type: request.type, status: request.status },
  })

  return NextResponse.json({ success: true })
}
