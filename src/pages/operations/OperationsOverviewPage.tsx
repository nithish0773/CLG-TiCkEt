import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router'
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  FileText,
  Calendar,
  AlertOctagon,
  Activity,
  Sliders,
} from 'lucide-react'
import { listTickets, type TicketView } from '../../core/api/ticketsApi'
import { listIssueTypes, type IssueType } from '../../core/api/issueTypesApi'
import { formatRelativeIST, formatDateIST } from '../../core/utils/date'
import { Badge } from '../../ui/Badge'
import styles from './OperationsOverviewPage.module.css'

export const OperationsOverviewPage: React.FC = () => {
  const [tickets, setTickets] = useState<TicketView[]>([])
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([])
  const [_loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [ticketsRes, typesRes] = await Promise.all([
        listTickets({ limit: 100 }),
        listIssueTypes(),
      ])
      setTickets(ticketsRes)
      setIssueTypes(typesRes)
      setLastUpdated(new Date())
    } catch (err: any) {
      setError(err?.message || 'Failed to synchronize operations telemetry.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Derived Telemetry Metrics
  const metrics = useMemo(() => {
    const total = tickets.length
    const openTickets = tickets.filter((t) => t.status === 'open')
    const resolvedTickets = tickets.filter((t) => t.status === 'resolved')
    const acknowledgedTickets = tickets.filter((t) => t.status === 'acknowledged')

    const now = Date.now()
    const overdueTickets = openTickets.filter((t) => {
      if (!t.tat?.estimated_completion_at) return false
      return new Date(t.tat.estimated_completion_at).getTime() < now
    })

    const needsTat = openTickets.filter((t) => !t.tat?.estimated_completion_at)
    const inProgressWithNotes = openTickets.filter((t) => !!t.update?.note)

    return {
      total,
      open: openTickets.length,
      resolved: resolvedTickets.length,
      acknowledged: acknowledgedTickets.length,
      overdue: overdueTickets.length,
      needsTat: needsTat.length,
      inProgressWithNotes: inProgressWithNotes.length,
    }
  }, [tickets])

  // Category Distribution
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    tickets.forEach((t) => {
      const name = t.issue_type_name || 'Uncategorized'
      counts[name] = (counts[name] || 0) + 1
    })

    const total = tickets.length || 1
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [tickets])

  // Overdue and Priority attention tickets
  const attentionTickets = useMemo(() => {
    const now = Date.now()
    return tickets
      .filter((t) => {
        if (t.status !== 'open') return false
        if (t.tat?.estimated_completion_at && new Date(t.tat.estimated_completion_at).getTime() < now) return true
        if (!t.tat?.estimated_completion_at) return true
        return false
      })
      .slice(0, 5)
  }, [tickets])

  // Recent Activity Feed
  const recentUpdates = useMemo(() => {
    const items: Array<{
      ticketId: string
      title: string
      author: string
      note?: string
      type: 'update' | 'tat' | 'created'
      timestamp: string
    }> = []

    tickets.forEach((t) => {
      if (t.update?.note && t.update.updated_at) {
        items.push({
          ticketId: t.id,
          title: t.title,
          author: t.update.updated_by_name || 'Maintenance Specialist',
          note: t.update.note,
          type: 'update',
          timestamp: t.update.updated_at,
        })
      }
      if (t.tat?.estimated_completion_at && t.tat.updated_at) {
        items.push({
          ticketId: t.id,
          title: t.title,
          author: t.tat.updated_by_name || 'Operations Lead',
          note: `Target TAT set to ${formatDateIST(t.tat.estimated_completion_at)}`,
          type: 'tat',
          timestamp: t.tat.updated_at,
        })
      }
      if (t.created_at) {
        items.push({
          ticketId: t.id,
          title: t.title,
          author: t.reported_by_name || 'Reporter',
          type: 'created',
          timestamp: t.created_at,
        })
      }
    })

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6)
  }, [tickets])

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badgeGroup}>
            <span className={styles.liveBadge}>
              <span className={styles.pulseDot} />
              Operations Telemetry Active
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)' }}>
              Updated {formatRelativeIST(lastUpdated.toISOString())}
            </span>
          </div>
          <h1 className={styles.title}>Campus Maintenance Operations</h1>
          <p className={styles.subtitle}>
            Real-time incident dispatch, SLA target tracking, and facilities resolution pipeline.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Reload telemetry from cloud backend"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
          <Link to="/operations/issue-types" className={styles.actionBtn}>
            <Sliders size={15} />
            Issue Types Master
          </Link>
          <Link to="/operations/tickets" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
            <Layers size={15} />
            Ticket Board ({metrics.open} Open)
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '1rem', color: '#b91c1c', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Primary Telemetry Metrics */}
      <div className={styles.metricGrid}>
        <div className={`${styles.metricCard} ${styles.criticalBorder}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Overdue Work Orders</span>
            <AlertOctagon size={18} style={{ color: 'var(--critical)' }} />
          </div>
          <div className={styles.metricValue} style={{ color: metrics.overdue > 0 ? 'var(--critical)' : 'inherit' }}>
            {metrics.overdue}
          </div>
          <div className={styles.metricFooter}>Past scheduled resolution TAT</div>
        </div>

        <div className={`${styles.metricCard} ${styles.accentBorder}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Active Work Orders</span>
            <Wrench size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>{metrics.open}</div>
          <div className={styles.metricFooter}>{metrics.inProgressWithNotes} with field updates posted</div>
        </div>

        <div className={`${styles.metricCard} ${styles.warningBorder}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Needs TAT Commitment</span>
            <Clock size={18} style={{ color: 'var(--warning)' }} />
          </div>
          <div className={styles.metricValue} style={{ color: metrics.needsTat > 0 ? 'var(--warning)' : 'inherit' }}>
            {metrics.needsTat}
          </div>
          <div className={styles.metricFooter}>Unscheduled dispatch targets</div>
        </div>

        <div className={`${styles.metricCard} ${styles.successBorder}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Resolved Awaiting Sign-off</span>
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div className={styles.metricValue}>{metrics.resolved}</div>
          <div className={styles.metricFooter}>Awaiting reporter confirmation</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Lifetime Log</span>
            <FileText size={18} style={{ color: 'var(--muted-text)' }} />
          </div>
          <div className={styles.metricValue}>{metrics.total}</div>
          <div className={styles.metricFooter}>{metrics.acknowledged} closed & confirmed</div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className={styles.contentGrid}>
        {/* Urgent & Attention Work Orders */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                Priority Dispatch Queue
              </h2>
              <div className={styles.cardSubtitle}>
                Tickets requiring immediate scheduling or turnaround action
              </div>
            </div>
            <Link to="/operations/tickets" className={styles.viewAllLink}>
              View All Work Orders &rarr;
            </Link>
          </div>

          {attentionTickets.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem', opacity: 0.8 }} />
              <div>All open work orders have active, on-schedule TAT commitments.</div>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Work Order</th>
                    <th>Reporter</th>
                    <th>Issue Type</th>
                    <th>TAT Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionTickets.map((t) => {
                    const isOverdue =
                      t.tat?.estimated_completion_at &&
                      new Date(t.tat.estimated_completion_at).getTime() < Date.now()

                    return (
                      <tr key={t.id} className={styles.tableRow}>
                        <td>
                          <div>
                            <Link to={`/tickets/${t.id}`} className={styles.ticketLink}>
                              {t.title}
                            </Link>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted-text)', fontFamily: 'monospace' }}>
                              #{t.id.slice(0, 8)}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.reporterInfo}>
                            <span className={styles.reporterName}>{t.reported_by_name || 'Reporter'}</span>
                            <span className={styles.reporterDept}>{t.reported_by_dept || 'Campus'}</span>
                          </div>
                        </td>
                        <td>
                          <Badge variant="neutral">{t.issue_type_name || 'General'}</Badge>
                        </td>
                        <td>
                          {isOverdue ? (
                            <span className={styles.tatBadgeOverdue}>
                              <AlertOctagon size={12} />
                              Overdue ({formatRelativeIST(t.tat!.estimated_completion_at)})
                            </span>
                          ) : t.tat?.estimated_completion_at ? (
                            <span className={styles.tatBadgeNormal}>
                              <Clock size={12} />
                              Due {formatDateIST(t.tat.estimated_completion_at)}
                            </span>
                          ) : (
                            <span className={styles.tatBadgeNone}>No TAT Scheduled</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/tickets/${t.id}`}
                            className={styles.actionBtn}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            Dispatch <ArrowUpRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Category Distribution & Live Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Category Distribution */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <TrendingUp size={18} />
                Volume by Category
              </h2>
              <Link to="/operations/issue-types" className={styles.viewAllLink}>
                Manage ({issueTypes.length})
              </Link>
            </div>

            <div className={styles.categoryList}>
              {categoryDistribution.length === 0 ? (
                <div className={styles.emptyState}>No category telemetry available.</div>
              ) : (
                categoryDistribution.map((cat) => (
                  <div key={cat.name} className={styles.categoryItem}>
                    <div className={styles.categoryMeta}>
                      <span className={styles.categoryName}>{cat.name}</span>
                      <span className={styles.categoryCount}>
                        {cat.count} ticket{cat.count !== 1 ? 's' : ''} ({cat.percent}%)
                      </span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${Math.min(100, Math.max(5, cat.percent))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Operations Activity */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Activity size={18} />
                Recent Operations Feed
              </h2>
            </div>

            <div className={styles.activityList}>
              {recentUpdates.length === 0 ? (
                <div className={styles.emptyState}>No recent maintenance log entries.</div>
              ) : (
                recentUpdates.map((act, idx) => (
                  <div key={`${act.ticketId}-${idx}`} className={styles.activityItem}>
                    <div className={styles.activityIconWrap}>
                      {act.type === 'tat' ? (
                        <Calendar size={16} />
                      ) : act.type === 'update' ? (
                        <Wrench size={16} />
                      ) : (
                        <FileText size={16} />
                      )}
                    </div>
                    <div className={styles.activityBody}>
                      <div className={styles.activityHeader}>
                        <strong>{act.author}</strong>{' '}
                        {act.type === 'tat'
                          ? 'updated turnaround commitment for'
                          : act.type === 'update'
                          ? 'logged work update on'
                          : 'submitted new incident'}{' '}
                        <Link to={`/tickets/${act.ticketId}`} className={styles.ticketLink}>
                          "{act.title}"
                        </Link>
                      </div>
                      {act.note && <div className={styles.activityNote}>{act.note}</div>}
                      <span className={styles.activityTime}>{formatRelativeIST(act.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default OperationsOverviewPage
