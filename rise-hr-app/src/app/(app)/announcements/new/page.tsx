'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create post')
      }
      router.push('/announcements')
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TopBar title="New Announcement" />
      <div style={{ padding: 24, maxWidth: 640 }}>
        <Link href="/announcements" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back to feed
        </Link>

        <div className="glass-card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Post Title
              </label>
              <input
                className="input-glass"
                placeholder="Brief, catchy title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={120}
                required
                style={{ fontSize: 16, fontWeight: 500 }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
                {title.length}/120
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Content
              </label>
              <textarea
                className="input-glass"
                placeholder="Share your update with the team..."
                value={body}
                onChange={e => setBody(e.target.value)}
                required
                rows={10}
                style={{ resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#F87171' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
              <Link href="/announcements" className="btn-glass" style={{ textDecoration: 'none' }}>Cancel</Link>
              <button type="submit" className="btn-gold" disabled={loading} style={{ minWidth: 140, justifyContent: 'center' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
