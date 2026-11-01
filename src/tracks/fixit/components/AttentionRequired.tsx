import { useNavigate } from 'react-router'
import type { Ticket } from '@/core'
import { Badge, Button } from '@/ui'
import styles from './CommandCenterComponents.module.css'

export interface AttentionRequiredProps {
  tickets: Ticket[]
}

export function AttentionRequired({ tickets }: AttentionRequiredProps) {
  const navigate = useNavigate()
  const overdueTickets = tickets.filter((t) => t.is_overdue)

  if (overdueTickets.length === 0) {
    return null
  }

  return (
    <div className={styles.attentionBanner} role="alert">
      <div className={styles.attentionLeft}>
        <div className={styles.attentionIcon} aria-hidden="true">⚠️</div>
        <div>
          <div className={styles.attentionTitle}>
            Attention Required: {overdueTickets.length} Maintenance {overdueTickets.length === 1 ? 'Issue' : 'Issues'} Exceeded Target TAT
          </div>
          <div className={styles.attentionDesc}>
            Committed completion deadlines have lapsed for {overdueTickets.map((t) => t.id).join(', ')}. Immediate technician reassignment or status update required.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Badge tone="danger" size="md">
          {overdueTickets.length} Overdue
        </Badge>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/tracks/fixit/tickets?status=open&overdue=true')}
        >
          View Overdue Tickets
        </Button>
      </div>
    </div>
  )
}

