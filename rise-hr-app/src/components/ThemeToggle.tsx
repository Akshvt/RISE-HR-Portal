'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', padding: 4, borderRadius: 6,
        display: 'flex', alignItems: 'center', width: 23, height: 23
      }} />
    )
  }

  const isDark = theme === 'dark'

  const toggleTheme = (e: React.MouseEvent) => {
    const newTheme = isDark ? 'light' : 'dark'

    // @ts-ignore
    if (!document.startViewTransition) {
      setTheme(newTheme)
      return
    }

    const x = e.clientX
    const y = e.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      setTheme(newTheme)
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 700,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      )
    })
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'var(--surface-mid)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        padding: 6,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 150ms ease',
        boxShadow: 'var(--shadow-sm)',
      }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--text-primary)'
        e.currentTarget.style.borderColor = 'var(--border-strong)'
        e.currentTarget.style.background = 'var(--surface-low)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-secondary)'
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.background = 'var(--surface-mid)'
      }}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}
