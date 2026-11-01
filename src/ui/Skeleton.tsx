import type { HTMLAttributes } from 'react'
import styles from './Skeleton.module.css'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  variant?: 'rect' | 'circle' | 'text'
}

export function Skeleton({
  width,
  height,
  borderRadius,
  variant = 'rect',
  className,
  style,
  ...rest
}: SkeletonProps) {
  const isCircle = variant === 'circle'
  const isText = variant === 'text'

  return (
    <div
      className={[
        styles.skeleton,
        isCircle && styles.circle,
        isText && styles.text,
        className,
      ].filter(Boolean).join(' ')}
      style={{
        width: width ?? (isCircle ? 40 : '100%'),
        height: height ?? (isCircle ? 40 : isText ? 16 : 24),
        borderRadius: borderRadius ?? (isCircle ? '50%' : isText ? 4 : 'var(--radius-sm)'),
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  )
}

