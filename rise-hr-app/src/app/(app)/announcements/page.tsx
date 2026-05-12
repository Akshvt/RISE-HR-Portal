import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TopBar } from '@/components/TopBar'
import { AnnouncementCard } from '@/components/AnnouncementCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AnnouncementsPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'Admin'

  const { data: posts, error: postsError } = await supabaseAdmin
    .from('posts')
    .select(`
      id, title, body_json, created_at, edited_at, author_name, author_airtable_id,
      replies(id, body_json, created_at, author_name, author_airtable_id)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (postsError) {
    console.error('Error fetching posts:', postsError)
  }

  // Fetch reactions separately because of polymorphic target_id
  const postIds = posts?.map(p => p.id) || []
  const replyIds = posts?.flatMap(p => p.replies.map((r: any) => r.id)) || []
  const allTargetIds = [...postIds, ...replyIds]

  let allReactions: any[] = []
  if (allTargetIds.length > 0) {
    const { data: reactionsData, error: reactionsError } = await supabaseAdmin
      .from('reactions')
      .select('reaction_type, user_airtable_id, target_id, target_type')
      .in('target_id', allTargetIds)
    
    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError)
    } else {
      allReactions = reactionsData || []
    }
  }

  // Merge reactions into posts and replies
  const postsWithReactions = posts?.map(post => {
    const postReactions = allReactions.filter(r => r.target_id === post.id && r.target_type === 'post')
    const repliesWithReactions = post.replies.map((reply: any) => ({
      ...reply,
      reactions: allReactions.filter(r => r.target_id === reply.id && r.target_type === 'reply')
    }))
    return {
      ...post,
      reactions: postReactions,
      replies: repliesWithReactions
    }
  }) || []

  const currentUserAirtableId = (session?.user as any)?.airtableId || session?.user?.email || ''

  return (
    <>
      <TopBar title="Announcements" actions={
        <Link href="/announcements/new" className="btn-gold" style={{ textDecoration: 'none', fontSize: 13, padding: '8px 16px' }}>
          + New Post
        </Link>
      } />
      <div style={{ padding: 24, maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <input className="input-glass" placeholder="🔍  Search announcements..." style={{ width: '100%' }} />
        </div>

        {(!postsWithReactions || postsWithReactions.length === 0) && (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            No announcements yet. Be the first to post!
          </div>
        )}

        {postsWithReactions.map((post: any) => (
          <AnnouncementCard 
            key={post.id} 
            post={post} 
            currentUserAirtableId={currentUserAirtableId} 
            isAdmin={isAdmin} 
          />
        ))}
      </div>
    </>
  )
}
