import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { listTickets, type Ticket, useAuth } from '@/core'
import { Button, Badge, EmptyState, Spinner } from '@/ui'
import styles from './AllTicketsScreen.module.css'

export function MyTicketsScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'acknowledged'>('all')

  const userEmail = user?.email?.toLowerCase()

  const fetchTickets = useCallback(() => {
    setLoading(true)
    listTickets()
      .then((all) => {
        const filtered = all.filter((t) => t.reporter?.email?.toLowerCase() === userEmail)
        setTickets(filtered)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [userEmail])

  useEffect(() => {
    let active = true
    listTickets()
      .then((all) => {
        if (!active) return
        const filtered = all.filter((t) => t.reporter?.email?.toLowerCase() === userEmail)
        setTickets(filtered)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        console.error(err)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userEmail])

  const openTickets = tickets.filter((t) => t.status === 'open')
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved')
  const ackTickets = tickets.filter((t) => t.status === 'acknowledged')

  const displayed = statusFilter === 'all' ? tickets : tickets.filter((t) => t.status === statusFilter)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>My Maintenance Tickets</h1>
          <p className={styles.subheading}>
            Track the real-time resolution status of infrastructure issues you reported across campus.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={fetchTickets}>
            🔄 Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/tracks/fixit/raise')}>
            ➕ Raise New Issue
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <div
          style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          onClick={() => setStatusFilter('all')}
        >
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Submitted
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            {tickets.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Lifetime reports
          </div>
        </div>

        <div
          style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          onClick={() => setStatusFilter('open')}
        >
          <div style={{ fontSize: 12, color: 'var(--amber-500)', textTransform: 'uppercase', fontWeight: 600 }}>
            In Progress / Open
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--amber-500)', marginTop: 4 }}>
            {openTickets.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Dispatched to technicians
          </div>
        </div>

        <div
          style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          onClick={() => setStatusFilter('resolved')}
        >
          <div style={{ fontSize: 12, color: 'var(--color-success)', textTransform: 'uppercase', fontWeight: 600 }}>
            Ready for Acknowledgment
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)', marginTop: 4 }}>
            {resolvedTickets.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Requires your inspection
          </div>
        </div>

        <div
          style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          onClick={() => setStatusFilter('acknowledged')}
        >
          <div style={{ fontSize: 12, color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Fully Acknowledged
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', marginTop: 4 }}>
            {ackTickets.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Closed &amp; confirmed
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
        {(['all', 'open', 'resolved', 'acknowledged'] as const).map((st) => (
          <button
            key={st}
            type="button"
            className={[
              styles.actionBtn,
              statusFilter === st && styles.pageBtnActive,
            ].filter(Boolean).join(' ')}
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => setStatusFilter(st)}
          >
            {st.toUpperCase()} ({st === 'all' ? tickets.length : tickets.filter((t) => t.status === st).length})
          </button>
        ))}
      </div>

      {/* Ticket List */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
            <Spinner label="Loading your tickets..." />
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon="🎫"
            title="No tickets found"
            description={
              statusFilter === 'all'
                ? 'You have not reported any maintenance issues yet.'
                : `No tickets in '${statusFilter}' status.`
            }
            action={
              <Button variant="primary" size="sm" onClick={() => navigate('/tracks/fixit/raise')}>
                Report an Issue
              </Button>
            }
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Ticket ID</th>
                  <th className={styles.th}>Issue Title</th>
                  <th className={styles.th}>Facility / Location</th>
                  <th className={styles.th}>Category</th>
                  <th className={styles.th}>Target TAT</th>
                  <th className={styles.th}>Current Status</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((t) => (
                  <tr key={t.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span
                        className={styles.ticketIdCell}
                        onClick={() => navigate(`/tracks/fixit/tickets/${t.id}`)}
                      >
                        {t.id}
                      </span>
                    </td>

                    <td className={styles.td} style={{ fontWeight: 600 }}>
                      {t.title}
                    </td>

                    <td className={styles.td} style={{ fontSize: 12 }}>
                      {t.building} {t.location ? `(${t.location})` : ''}
                    </td>

                    <td className={styles.td} style={{ fontSize: 12 }}>
                      {t.issue_type}
                    </td>

                    <td className={styles.td} style={{ fontSize: 12 }}>
                      {t.expected_completion_date
                        ? new Date(t.expected_completion_date).toLocaleDateString(undefined, { dateStyle: 'short' })
                        : 'Under scheduling'}
                    </td>

                    <td className={styles.td}>
                      <Badge
                        size="sm"
                        tone={
                          t.status === 'resolved'
                            ? 'success'
                            : t.status === 'acknowledged'
                            ? 'primary'
                            : 'warning'
                        }
                      >
                        {t.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/tracks/fixit/tickets/${t.id}`)}
                        >
                          Details
                        </Button>

                        {t.status === 'resolved' && (
                          <Button
                            variant="primary"
                            size="sm"
                            style={{ background: 'var(--color-success)' }}
                            onClick={() => navigate(`/tracks/fixit/tickets/${t.id}`)}
                          >
                            Verify &amp; Acknowledge
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

