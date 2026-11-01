import type { Ticket } from '@/core'
import { Badge, type BadgeTone } from '@/ui'
import styles from './CommandCenterComponents.module.css'

export interface CampusPulseProps {
  tickets: Ticket[]
}

export function CampusPulse({ tickets }: CampusPulseProps) {
  const total = tickets.length
  const openCount = tickets.filter((t) => t.status === 'open').length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length
  const acknowledgedCount = tickets.filter((t) => t.status === 'acknowledged').length
  const overdueCount = tickets.filter((t) => t.is_overdue).length

  const openPct = total ? Math.round((openCount / total) * 100) : 0
  const resolvedPct = total ? Math.round((resolvedCount / total) * 100) : 0
  const ackPct = total ? Math.round((acknowledgedCount / total) * 100) : 0
  const overduePct = total ? Math.round((overdueCount / total) * 100) : 0

  const cards = [
    {
      label: 'Campus Pulse Total',
      value: total,
      subtext: 'Active infrastructure load',
      icon: '🏛️',
      badge: '100% Volume',
      badgeTone: 'neutral' as const,
      color: 'var(--color-primary)',
    },
    {
      label: 'Open Requests',
      value: openCount,
      subtext: `${openPct}% of total tickets`,
      icon: '⏳',
      badge: openPct > 50 ? 'Action Needed' : 'Normal',
      badgeTone: (openPct > 50 ? 'warning' : 'neutral') as BadgeTone,
      color: 'var(--amber-500)',
    },
    {
      label: 'Resolved Issues',
      value: resolvedCount,
      subtext: `${resolvedPct}% awaiting signoff`,
      icon: '✅',
      badge: 'Pending Review',
      badgeTone: 'success' as BadgeTone,
      color: 'var(--green-600)',
    },
    {
      label: 'Acknowledged',
      value: acknowledgedCount,
      subtext: `${ackPct}% closed with verification`,
      icon: '🎉',
      badge: 'Fully Closed',
      badgeTone: 'primary' as BadgeTone,
      color: 'var(--blue-500)',
    },
    {
      label: 'Attention: Overdue',
      value: overdueCount,
      subtext: `${overduePct}% breached committed TAT`,
      icon: '⚠️',
      badge: overdueCount > 0 ? 'TAT Breached' : 'On Track',
      badgeTone: (overdueCount > 0 ? 'danger' : 'success') as BadgeTone,
      color: 'var(--color-danger)',
    },
  ]

  return (
    <section aria-label="Campus Pulse Telemetry">
      <div className={styles.pulseGrid}>
        {cards.map((c) => (
          <div key={c.label} className={styles.pulseCard}>
            <div className={styles.pulseHeader}>
              <span className={styles.pulseLabel}>{c.label}</span>
              <div
                className={styles.pulseIcon}
                style={{ background: 'var(--color-surface-muted)' }}
              >
                {c.icon}
              </div>
            </div>
            <div className={styles.pulseValue}>{c.value}</div>
            <div className={styles.pulseMeta}>
              <Badge size="sm" tone={c.badgeTone}>
                {c.badge}
              </Badge>
              <span>{c.subtext}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
