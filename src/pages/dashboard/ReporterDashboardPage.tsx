import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Ticket as TicketIcon,
  Activity,
} from 'lucide-react'
import { useAuth } from '@/core/auth'
import { listTickets, type Ticket } from '@/core/api/ticketsApi'
import { formatRelativeIST } from '@/core/utils/date'
import styles from './ReporterDashboardPage.module.css'

export function ReporterDashboardPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // By default for reporters, GET /tickets returns their own tickets
      const data = await listTickets()
      setTickets(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load tickets from the campus server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Derive real statistics directly from actual tickets
  const totalCount = tickets.length
  const openCount = tickets.filter((t) => t.status === 'open').length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length
  const ackCount = tickets.filter((t) => t.status === 'acknowledged').length
  const overdueCount = tickets.filter((t) => t.overdue && t.status === 'open').length

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const recentUpdates = tickets
    .filter((t) => t.update && t.update.note)
    .sort(
      (a, b) =>
        new Date(b.update?.updated_at || b.updated_at).getTime() -
        new Date(a.update?.updated_at || a.updated_at).getTime(),
    )
    .slice(0, 4)

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.kicker}>CAMPUS MAINTENANCE TRACKING</span>
          <h1 className={styles.title}>Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className={styles.subtitle}>
            Monitor your reported campus issues, review technician progress, and confirm completed repairs.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={loadData}
            disabled={loading}
            title="Refresh tickets"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            <span>Refresh</span>
          </button>

          <Link to="/raise-ticket" className={styles.raiseBtn}>
            <PlusCircle size={16} />
            <span>Raise Complaint</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={loadData} className={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {/* Real Statistics Ribbon */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardTop}>
            <span className={styles.statLabel}>TOTAL TICKETS</span>
            <TicketIcon size={18} className={styles.statIcon} />
          </div>
          <span className={styles.statValue}>{loading ? '—' : totalCount}</span>
          <span className={styles.statSub}>Reported under your account</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardTop}>
            <span className={styles.statLabel}>OPEN TICKETS</span>
            <Clock size={18} className={styles.statIconOpen} />
          </div>
          <span className={styles.statValue}>{loading ? '—' : openCount}</span>
          <span className={styles.statSub}>Awaiting maintenance resolution</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardTop}>
            <span className={styles.statLabel}>RESOLVED (PENDING YOU)</span>
            <CheckCircle2 size={18} className={styles.statIconResolved} />
          </div>
          <span className={`${styles.statValue} ${styles.valResolved}`}>
            {loading ? '—' : resolvedCount}
          </span>
          <span className={styles.statSub}>Needs your fix confirmation</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardTop}>
            <span className={styles.statLabel}>ACKNOWLEDGED</span>
            <CheckCircle2 size={18} className={styles.statIconAck} />
          </div>
          <span className={`${styles.statValue} ${styles.valSuccess}`}>
            {loading ? '—' : ackCount}
          </span>
          <span className={styles.statSub}>Verified & closed</span>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className={styles.overdueAlert}>
          <AlertCircle size={18} className={styles.overdueIcon} />
          <div>
            <strong>Attention: {overdueCount} ticket is past committed turnaround time.</strong>
            <p>Campus Maintenance has been alerted to prioritize these past-due work orders.</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Recent Tickets Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Recent Maintenance Tickets</h3>
              <p className={styles.panelSub}>Latest reports submitted from your portal</p>
            </div>
            <Link to="/my-tickets" className={styles.viewAllLink}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className={styles.loadingBox}>
              <RefreshCw size={20} className={styles.spinning} />
              <span>Loading campus tickets...</span>
            </div>
          ) : recentTickets.length === 0 ? (
            <div className={styles.emptyBox}>
              <TicketIcon size={32} className={styles.emptyIcon} />
              <h4>No maintenance tickets yet</h4>
              <p>Experience an electrical, plumbing or lab fault? Submit your first report.</p>
              <Link to="/raise-ticket" className={styles.emptyActionBtn}>
                Raise a Complaint
              </Link>
            </div>
          ) : (
            <div className={styles.ticketList}>
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className={styles.ticketItem}
                >
                  <div className={styles.ticketItemLeft}>
                    <div className={styles.ticketTitleRow}>
                      <span className={styles.ticketId}>{ticket.id}</span>
                      <strong className={styles.ticketTitle}>{ticket.title}</strong>
                    </div>
                    <div className={styles.ticketMetaRow}>
                      <span className={styles.catPill}>{ticket.issue_type_name}</span>
                      <span className={styles.dateMeta}>
                        Reported {formatRelativeIST(ticket.created_at)}
                      </span>
                      {ticket.tat?.expected_by && (
                        <span className={styles.tatMeta}>
                          Target: {ticket.tat.expected_by}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.ticketItemRight}>
                    {ticket.overdue && (
                      <span className={styles.badgeCritical}>OVERDUE</span>
                    )}
                    <span
                      className={`${styles.badgeStatus} ${
                        ticket.status === 'open'
                          ? styles.badgeOpen
                          : ticket.status === 'resolved'
                          ? styles.badgeResolved
                          : styles.badgeAck
                      }`}
                    >
                      {ticket.status.toUpperCase()}
                    </span>
                    <ArrowRight size={14} className={styles.itemArrow} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Latest Maintenance Updates Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Maintenance Dispatches</h3>
              <p className={styles.panelSub}>Direct progress notes from technicians</p>
            </div>
            <Activity size={18} className={styles.activityIcon} />
          </div>

          {loading ? (
            <div className={styles.loadingBox}>
              <RefreshCw size={20} className={styles.spinning} />
              <span>Loading updates...</span>
            </div>
          ) : recentUpdates.length === 0 ? (
            <div className={styles.emptyBox}>
              <Activity size={32} className={styles.emptyIcon} />
              <h4>No updates posted yet</h4>
              <p>Technician progress updates and work logs will appear here as tickets are serviced.</p>
            </div>
          ) : (
            <div className={styles.updateList}>
              {recentUpdates.map((ticket) => (
                <div key={ticket.id} className={styles.updateItem}>
                  <div className={styles.updateHeader}>
                    <span className={styles.updateSource}>
                      {ticket.update?.updated_by_name || 'Campus Maintenance'}
                    </span>
                    <span className={styles.updateTime}>
                      {formatRelativeIST(ticket.update?.updated_at || ticket.updated_at)}
                    </span>
                  </div>
                  <p className={styles.updateNote}>"{ticket.update?.note}"</p>
                  <div className={styles.updateFooter}>
                    <Link to={`/tickets/${ticket.id}`} className={styles.updateTicketLink}>
                      <span>For ticket {ticket.id} ({ticket.title})</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
