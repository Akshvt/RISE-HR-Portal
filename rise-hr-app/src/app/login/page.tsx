'use client'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const params = useSearchParams()
  const error = params.get('error')

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative glass orbs */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--brand-green-dim) 0%, transparent 70%)',
        top: '-15%', left: '-10%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--surface-low) 0%, transparent 70%)',
        bottom: '-10%', right: '-8%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--brand-green-dim) 0%, transparent 70%)',
        top: '40%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none',
      }} />

      {/* Login card */}
      <div className="animate-fadeIn" style={{
        width: '100%', maxWidth: 420, margin: '0 20px',
        background: 'var(--surface-mid)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        borderRadius: 24, padding: '48px 40px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="rise-logo" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.03em', fontWeight: 500 }}>
            People. Purpose. Progress.
          </p>
        </div>

        {/* Error */}
        {error === 'unauthorized' && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 20,
            fontSize: 13, color: '#F87171', textAlign: 'center',
          }}>
            Access denied. Only RISE Research employees may sign in.
          </div>
        )}

        {/* Google button */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/calendar' })}
          style={{
            width: '100%', padding: '13px 20px',
            background: 'var(--surface-mid)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            color: 'var(--text-primary)', fontWeight: 600, fontSize: 15,
            fontFamily: 'Red Hat Display, sans-serif',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--surface-low)'
            e.currentTarget.style.borderColor = 'var(--border-strong)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--surface-mid)'
            e.currentTarget.style.borderColor = 'var(--border-strong)'
          }}>
          {/* Google icon */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid var(--border-subtle)' }} />
          <span style={{ position: 'relative', background: 'var(--surface-mid)', padding: '0 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            OR
          </span>
        </div>

        {/* Demo button */}
        <button
          onClick={() => signIn('credentials', { callbackUrl: '/calendar' })}
          style={{
            width: '100%', padding: '13px 20px',
            background: 'var(--brand-green)',
            border: 'none',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            color: '#FFFFFF', fontWeight: 600, fontSize: 15,
            fontFamily: 'Red Hat Display, sans-serif',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--brand-green-light)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--brand-green)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          Demo Admin Access
        </button>

        <button
          onClick={() => signIn('credentials', { role: 'employee', callbackUrl: '/calendar' })}
          style={{
            width: '100%', padding: '13px 20px', marginTop: '12px',
            background: 'var(--surface-mid)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            color: 'var(--text-primary)', fontWeight: 600, fontSize: 15,
            fontFamily: 'Red Hat Display, sans-serif',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--surface-low)'
            e.currentTarget.style.borderColor = 'var(--brand-green)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--surface-mid)'
            e.currentTarget.style.borderColor = 'var(--border-strong)'
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Demo Employee Access
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 24, fontWeight: 500 }}>
          Access restricted to RISE Research employees
        </p>
      </div>

      {/* Footer */}
      <p style={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500
      }}>
        © {new Date().getFullYear()} RISE Research. All rights reserved.
      </p>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
