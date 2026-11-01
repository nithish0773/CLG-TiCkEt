import { useNavigate } from 'react-router'
import type { Ticket } from '@/core'
import { Badge } from '@/ui'
import styles from './CommandCenterComponents.module.css'

export interface LiveIssueMonitorProps {
  tickets: Ticket[]
  limit?: number
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function LiveIssueMonitor({ tickets, limit = 5 }: LiveIssueMonitorProps) {
  const navigate = useNavigate()
  const recent = tickets.slice(0, limit)

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <span aria-hidden="true">📡</span>
          <span>Live Issue Monitor</span>
        </div>
        <button
          type="button"
          className={styles.panelAction}
          onClick={() => navigate('/tracks/fixit/tickets')}
        >
          View all {tickets.length} tickets →
        </button>
      </div>

      <div className={styles.panelBody} style={{ padding: '0 var(--space-5)' }}>
        {recent.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            No recent maintenance incidents recorded.
          </div>
        ) : (
          <div className={styles.issueList}>
            {recent.map((ticket) => (
              <div
                key={ticket.id}
                className={styles.issueRow}
                onClick={() => navigate(`/tracks/fixit/tickets/${ticket.id}`)}
              >
                <div className={styles.issueLeft}>
                  <span className={styles.issueId}>{ticket.id}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.issueTitle}>{ticket.title}</div>
                    <div className={styles.issueMeta}>
                      <span>{ticket.building}</span>
                      <span>•</span>
                      <span>{ticket.issue_type}</span>
                      <span>•</span>
                      <span>{timeAgo(ticket.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.issueRight}>
                  {ticket.is_overdue && (
                    <Badge size="sm" tone="danger">
                      Overdue
                    </Badge>
                  )}
                  <Badge
                    size="sm"
                    tone={
                      ticket.status === 'resolved'
                        ? 'success'
                        : ticket.status === 'acknowledged'
                        ? 'primary'
                        : 'warning'
                    }
                  >
                    {ticket.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

