import { useEffect, useState } from 'react'
import { applyTheme, isDark, readTheme } from '../../lib/theme'
import { Icon } from '../ui/Icon'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null)
  useEffect(() => {
    setDark(isDark())
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => readTheme() === 'system' && setDark(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const toggle = () => {
    const next = !isDark()
    applyTheme(next ? 'dark' : 'light')
    setDark(next)
  }
  return (
    <button type="button" onClick={toggle} className={`grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-current/10 ${className}`} aria-label={dark ? 'Светла тема' : 'Тъмна тема'} title={dark ? 'Светла тема' : 'Тъмна тема'}>
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  )
}
