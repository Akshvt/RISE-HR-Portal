'use client'
import { Bell } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

interface TopBarProps {
  title: string
  actions?: React.ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  const { data: session } = useSession()
  const [isRead, setIsRead] = useState(false)

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 60, flexShrink: 0,
      background: 'var(--surface-mid)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        {title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {actions}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button style={{
              position: 'relative', background: 'var(--surface-mid)',
              border: '1px solid var(--border-subtle)', borderRadius: 10,
              padding: '7px 9px', cursor: 'pointer', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', transition: 'background 150ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-low)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-mid)'}>
              <Bell size={16} />
              {!isRead && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, width: 16, height: 16,
                  background: 'var(--brand-green)', borderRadius: '50%',
                  fontSize: 10, fontWeight: 700, color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>1</span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={12} style={{
              background: 'var(--surface-high)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: 12, minWidth: 300,
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
              zIndex: 50, fontFamily: 'Red Hat Display, sans-serif'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  Notifications
                </div>
                {!isRead && (
                  <button onClick={() => setIsRead(true)} style={{
                    background: 'none', border: 'none', color: 'var(--brand-green)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ 
                  padding: '12px', 
                  background: isRead ? 'transparent' : 'rgba(201, 168, 76, 0.05)', 
                  borderLeft: isRead ? '2px solid transparent' : '2px solid var(--brand-green)',
                  borderRadius: 4,
                  display: 'flex', flexDirection: 'column', gap: 4,
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ fontWeight: 500, color: isRead ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 13 }}>
                    Welcome to the RISE HR Portal!
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>2 hours ago</div>
                </div>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        {session?.user && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, borderRadius: '50%', outline: 'none' }}>
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" referrerPolicy="no-referrer" style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-strong)', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-green-dim)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-green)', fontWeight: 700, fontSize: 13 }}>
                    {session.user.name?.charAt(0) || 'U'}
                  </div>
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={12} style={{
                background: 'var(--surface-high)', border: '1px solid var(--border-subtle)',
                borderRadius: 12, padding: 6, minWidth: 200,
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                zIndex: 50, fontFamily: 'Red Hat Display, sans-serif'
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{session.user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{session.user.email}</div>
                </div>
                <DropdownMenu.Item onClick={() => signOut()} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderRadius: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                  cursor: 'pointer', outline: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-low)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} /> Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </header>
  )
}
