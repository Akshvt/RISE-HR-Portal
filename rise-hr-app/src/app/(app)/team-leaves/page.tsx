import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TopBar } from '@/components/TopBar'
import { redirect } from 'next/navigation'
import { TeamLeavesTable } from './TeamLeavesTable'

export const dynamic = 'force-dynamic'

export default async function TeamLeavesPage() {
  const session = await auth()
  if (!session || !['Admin', 'HR'].includes(session.user.role ?? '')) {
    redirect('/calendar')
  }

  const { data: leaves } = await supabaseAdmin
    .from('leave_requests')
    .select('id, employee_name, employee_email, type, start_date, end_date, days_deducted, status, reason, rejection_reason, approved_by, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <TopBar title="Manage Team Leaves" />
      <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>All Leave Requests</h2>
          <TeamLeavesTable initialLeaves={leaves || []} />
        </div>
      </div>
    </>
  )
}
