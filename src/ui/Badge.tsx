import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Badge.module.css'

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'muted'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  variant?: 'primary' | 'info' | 'success' | 'warning' | 'critical' | 'danger' | 'neutral' | 'muted' | 'default'
  size?: 'sm' | 'md'
  dot?: boolean
  children: ReactNode
}

export function Badge({
  tone,
  variant,
  size = 'md',
  dot = true,
  className,
  children,
  ...rest
}: BadgeProps) {
  let resolvedTone: BadgeTone = 'neutral'

  if (tone) {
    resolvedTone = tone
  } else if (variant) {
    if (variant === 'info' || variant === 'primary') resolvedTone = 'primary'
    else if (variant === 'critical' || variant === 'danger') resolvedTone = 'danger'
    else if (variant === 'success') resolvedTone = 'success'
    else if (variant === 'warning') resolvedTone = 'warning'
    else if (variant === 'muted') resolvedTone = 'muted'
    else resolvedTone = 'neutral'
  }

  return (
    <span
      className={[
        styles.badge,
        styles[resolvedTone],
        styles[size],
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}
