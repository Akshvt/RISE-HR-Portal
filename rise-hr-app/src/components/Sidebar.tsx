'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Calendar, FileText, Megaphone, BarChart2,
  ClipboardList, Users, LogOut, Lock
} from 'lucide-react'
import { avatarInitials } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

const nav = [
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/my-leave', label: 'My Leave', icon: FileText },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
]
const adminNav = [
  { href: '/team-leaves', label: 'Manage Leaves', icon: ClipboardList },
  { href: '/insights', label: 'Insights', icon: BarChart2 },
  { href: '/audit', label: 'Audit Log', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'Admin'

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'var(--surface-mid)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="rise-logo" />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10,
              background: active ? 'var(--brand-green-dim)' : 'transparent',
              color: active ? 'var(--brand-green)' : 'var(--text-secondary)',
              fontWeight: active ? 600 : 500,
              fontSize: 14, textDecoration: 'none',
              border: active ? '1px solid rgba(28,124,84,0.2)' : '1px solid transparent',
              transition: 'all 150ms ease',
            }}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div style={{ margin: '12px 0 6px', padding: '0 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Admin
            </div>
            {adminNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10,
                  background: active ? 'var(--brand-green-dim)' : 'transparent',
                  color: active ? 'var(--brand-green)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14, textDecoration: 'none',
                  border: active ? '1px solid var(--brand-green-dim)' : '1px solid transparent',
                  transition: 'all 150ms ease',
                }}>
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              padding: '6px', borderRadius: 8, margin: '-6px',
              transition: 'background 150ms ease'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-low)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--brand-green-dim)',
                border: '1px solid rgba(28,124,84,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--brand-green)', flexShrink: 0,
              }}>
                {avatarInitials(session?.user?.name || 'U')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session?.user?.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {session?.user?.role}
                </div>
              </div>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="start" side="top" sideOffset={12} style={{
              background: 'var(--surface-high)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: 6, minWidth: 200,
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
              zIndex: 50, fontFamily: 'Red Hat Display, sans-serif'
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{session?.user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{session?.user?.email}</div>
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
        <ThemeToggle />
      </div>
    </aside>
  )
}
