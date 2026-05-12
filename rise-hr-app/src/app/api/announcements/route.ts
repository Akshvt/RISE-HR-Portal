import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select(`
      id, title, body_json, created_at, edited_at, author_name, author_airtable_id,
      replies(id, body_json, created_at, author_name, author_airtable_id)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const postIds = posts?.map(p => p.id) || []
  const replyIds = posts?.flatMap(p => p.replies.map((r: any) => r.id)) || []
  const allTargetIds = [...postIds, ...replyIds]

  let allReactions: any[] = []
  if (allTargetIds.length > 0) {
    const { data: reactionsData } = await supabaseAdmin
      .from('reactions')
      .select('reaction_type, user_airtable_id, target_id, target_type')
      .in('target_id', allTargetIds)
    if (reactionsData) allReactions = reactionsData
  }

  const postsWithReactions = posts?.map(post => {
    return {
      ...post,
      reactions: allReactions.filter(r => r.target_id === post.id && r.target_type === 'post'),
      replies: post.replies.map((reply: any) => ({
        ...reply,
        reactions: allReactions.filter(r => r.target_id === reply.id && r.target_type === 'reply')
      }))
    }
  }) || []

  return NextResponse.json(postsWithReactions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body } = await req.json()
  if (!title?.trim() || !body?.trim()) return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
  if (title.length > 120) return NextResponse.json({ error: 'Title must be ≤ 120 characters' }, { status: 400 })

  const airtableId = (session.user as any).airtableId || session.user.email

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      title: title.trim(),
      body_json: { text: body.trim() },
      author_airtable_id: airtableId,
      author_name: session.user.name,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log
  await supabaseAdmin.from('audit_log').insert({
    actor_airtable_id: airtableId,
    actor_name: session.user.name ?? '',
    actor_role: (session.user as any).role ?? '',
    action_type: 'post_created',
    target: data.id,
    after_json: { title: data.title },
  })

  // Email admins/HR
  try {
    const { getTeamMembers } = await import('@/lib/airtable')
    const { sendEmail } = await import('@/lib/mailer')
    
    const team = await getTeamMembers()
    const adminEmails = team
      .filter(m => ['Admin', 'HR'].includes(m.role))
      .map(m => m.email)
      .filter(Boolean)

    if (adminEmails.length > 0) {
      await sendEmail({
        to: adminEmails,
        subject: `New Announcement: ${title}`,
        html: `<p><strong>${session.user.name}</strong> just posted a new announcement:</p>
               <h3>${title}</h3>
               <p>${body.trim()}</p>
               <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/announcements">View in Portal →</a></p>`
      })
    }
  } catch (emailErr) {
    console.error('[Announcements POST] Email notification failed:', emailErr)
  }

  return NextResponse.json(data, { status: 201 })
}
