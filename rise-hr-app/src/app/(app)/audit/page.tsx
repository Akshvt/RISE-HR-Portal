import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { AuditLogClient } from './AuditLogClient'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  const session = await auth()
  if (session?.user?.role !== 'Admin') redirect('/calendar')

  const { data: entries } = await supabaseAdmin
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <>
      <TopBar title="Audit Log" />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AuditLogClient entries={entries || []} />
      </div>
    </>
  )
}
