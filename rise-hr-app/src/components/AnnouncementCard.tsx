'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Lightbulb, MessageSquare, Loader2, Edit2, Trash2 } from 'lucide-react'
import { formatDate, avatarInitials } from '@/lib/utils'

interface Reaction {
  reaction_type: 'love' | 'knowledge'
  user_airtable_id: string
}

interface Reply {
  id: string
  body_json: { text: string }
  created_at: string
  author_name: string
  author_airtable_id: string
}

interface PostProps {
  post: {
    id: string
    title: string
    body_json: { text: string }
    created_at: string
    edited_at?: string
    author_name: string
    author_airtable_id: string
    reactions: Reaction[]
    replies: Reply[]
  }
  currentUserAirtableId?: string
  isAdmin?: boolean
}

export function AnnouncementCard({ post, currentUserAirtableId, isAdmin }: PostProps) {
  const router = useRouter()
  const [reactions, setReactions] = useState(post.reactions || [])
  const [loadingReaction, setLoadingReaction] = useState<string | null>(null)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editBody, setEditBody] = useState(post.body_json?.text || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loves = reactions.filter(r => r.reaction_type === 'love').length
  const knowledge = reactions.filter(r => r.reaction_type === 'knowledge').length
  const hasLoved = reactions.some(r => r.user_airtable_id === currentUserAirtableId && r.reaction_type === 'love')
  const hasKnowledge = reactions.some(r => r.user_airtable_id === currentUserAirtableId && r.reaction_type === 'knowledge')

  async function toggleReaction(type: 'love' | 'knowledge') {
    if (!currentUserAirtableId) return
    setLoadingReaction(type)
    try {
      const res = await fetch(`/api/announcements/${post.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, targetType: 'post' }),
      })
      if (res.ok) {
        const { reactions: newReactions } = await res.json()
        setReactions(newReactions || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReaction(null)
    }
  }

  async function handleSaveEdit() {
    if (!editTitle.trim() || !editBody.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/announcements/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, body: editBody }),
      })
      if (res.ok) {
        setIsEditing(false)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to permanently delete this announcement?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/announcements/${post.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isDeleting) {
    return (
      <div className="glass-card animate-fadeIn" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: 150 }}>
        <Loader2 size={20} className="animate-spin" />
        <span style={{ marginLeft: 10, fontSize: 14 }}>Deleting...</span>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="glass-card animate-fadeIn" style={{ padding: 24 }}>
        <input
          className="input-glass"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          placeholder="Announcement Title"
          style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}
          autoFocus
        />
        <textarea
          className="input-glass"
          value={editBody}
          onChange={e => setEditBody(e.target.value)}
          placeholder="Announcement content..."
          rows={5}
          style={{ resize: 'vertical', lineHeight: 1.6, marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setIsEditing(false)} className="btn-glass" disabled={isSaving} style={{ padding: '6px 14px', fontSize: 13 }}>
            Cancel
          </button>
          <button onClick={handleSaveEdit} className="btn-gold" disabled={isSaving} style={{ padding: '6px 14px', fontSize: 13 }}>
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    )
  }

  const postBody = post.body_json?.text || ''

  return (
    <div className="glass-card animate-fadeIn" style={{ padding: 24 }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--border-strong), rgba(201,168,76,0.1))',
          border: '1px solid var(--brand-green-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: 'var(--brand-green)',
        }}>
          {avatarInitials(post.author_name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{post.author_name}</span>
            {isAdmin && post.author_name === 'Demo Admin' && (
              <span className="pill pill-admin" style={{ fontSize: 10 }}>Admin</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatDate(post.created_at, 'dd MMM yyyy, h:mm a')}
            {post.edited_at && <span style={{ marginLeft: 6, fontStyle: 'italic' }}>(edited)</span>}
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              onClick={() => setIsEditing(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-muted)' }}
              title="Edit Announcement"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={handleDelete}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'rgba(248,113,113,0.8)' }}
              title="Delete Announcement"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.01em' }}>{post.title}</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 16 }}>{postBody}</p>

      {/* Reactions + reply count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
        <button 
          className={`btn-glass ${hasLoved ? 'active' : ''}`} 
          onClick={() => toggleReaction('love')}
          disabled={loadingReaction === 'love'}
          style={{ padding: '5px 12px', fontSize: 12, gap: 5, color: hasLoved ? '#F87171' : 'inherit', borderColor: hasLoved ? 'rgba(248,113,113,0.3)' : '' }}>
          {loadingReaction === 'love' ? <Loader2 size={13} className="animate-spin" /> : <Heart size={13} fill={hasLoved ? 'currentColor' : 'none'} />} 
          {loves}
        </button>
        <button 
          className={`btn-glass ${hasKnowledge ? 'active' : ''}`}
          onClick={() => toggleReaction('knowledge')}
          disabled={loadingReaction === 'knowledge'}
          style={{ padding: '5px 12px', fontSize: 12, gap: 5, color: hasKnowledge ? '#FBBF24' : 'inherit', borderColor: hasKnowledge ? 'rgba(251,191,36,0.3)' : '' }}>
          {loadingReaction === 'knowledge' ? <Loader2 size={13} className="animate-spin" /> : <Lightbulb size={13} fill={hasKnowledge ? 'currentColor' : 'none'} />} 
          {knowledge}
        </button>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MessageSquare size={13} /> {post.replies?.length || 0}
          </span>
          <button className="btn-gold" style={{ padding: '4px 12px', fontSize: 11 }}>Reply</button>
        </div>
      </div>

      {/* Replies list */}
      {post.replies && post.replies.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '2px solid var(--border-subtle)', paddingLeft: 16 }}>
          {post.replies.map(reply => (
            <div key={reply.id} style={{ fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{reply.author_name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDate(reply.created_at, 'h:mm a')}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{reply.body_json?.text || ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
