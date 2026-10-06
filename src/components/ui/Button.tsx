import { Link } from 'react-router'
import type { ComponentProps, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { track } from '../../lib/analytics'

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'outline-inverse'
type Size = 'md' | 'lg' | 'sm'

const base =
  'group inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition-[background,color,transform,box-shadow] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap'
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover shadow-[0_8px_24px_-10px_var(--accent)]',
  secondary: 'bg-ink text-bg hover:opacity-90',
  ghost: 'bg-surface-2 text-ink hover:bg-surface-3',
  inverse: 'bg-white text-[#141517] hover:bg-white/90',
  'outline-inverse': 'border border-white/40 text-white hover:bg-white/10 backdrop-blur-sm',
}
const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 text-[0.9375rem]',
  md: 'h-12 px-5 text-base',
  lg: 'h-14 px-7 text-[1.0625rem]',
}

interface Common {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconLeft?: IconName
  children: ReactNode
  className?: string
  /** Analytics label for CTA tracking */
  cta?: string
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra = '') => `${base} ${variants[variant]} ${sizes[size]} ${extra}`

function Inner({ icon, iconLeft, children }: Pick<Common, 'icon' | 'iconLeft' | 'children'>) {
  return (
    <>
      {iconLeft && <Icon name={iconLeft} className="h-5 w-5 shrink-0" />}
      <span>{children}</span>
      {icon && <Icon name={icon} className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />}
    </>
  )
}

export function ButtonLink({ to, variant, size, icon, iconLeft, children, className = '', cta, ...rest }: Common & Omit<ComponentProps<typeof Link>, 'className' | 'children'>) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)} onClick={() => cta && track('cta_click', { cta })} {...rest}>
      <Inner icon={icon} iconLeft={iconLeft}>{children}</Inner>
    </Link>
  )
}

export function ButtonA({ href, variant, size, icon, iconLeft, children, className = '', cta, onClick, ...rest }: Common & Omit<ComponentProps<'a'>, 'className' | 'children'>) {
  return (
    <a href={href} className={buttonClass(variant, size, className)} onClick={(e) => { if (cta) track('cta_click', { cta }); onClick?.(e) }} {...rest}>
      <Inner icon={icon} iconLeft={iconLeft}>{children}</Inner>
    </a>
  )
}

export function Button({ variant, size, icon, iconLeft, children, className = '', type = 'button', ...rest }: Common & Omit<ComponentProps<'button'>, 'className' | 'children'>) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      <Inner icon={icon} iconLeft={iconLeft}>{children}</Inner>
    </button>
  )
}
