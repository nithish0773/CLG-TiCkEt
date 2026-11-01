import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth, listTickets, listIssueTypes, type Ticket, type IssueType } from '@/core'
import { Button, Badge, Spinner } from '@/ui'
import { CampusPulse } from '../components/CampusPulse'
import { AttentionRequired } from '../components/AttentionRequired'
import { LiveIssueMonitor } from '../components/LiveIssueMonitor'
import { CampusIntelligence } from '../components/CampusIntelligence'
import { MaintenanceHeatmap } from '../components/MaintenanceHeatmap'
import { ResolutionPerformance } from '../components/ResolutionPerformance'
import { isFixitManager } from '../utils/roles'
import styles from './OverviewScreen.module.css'

export function OverviewScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [categories, setCategories] = useState<IssueType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [tList, cList] = await Promise.all([listTickets(), listIssueTypes()])
      setTickets(tList)
      setCategories(cList)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect to campus infrastructure database.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <Spinner label="Loading Campus Infrastructure Command Center..." />
      </div>
    )
  }

  const isManager = isFixitManager(user)
  const myTickets = tickets.filter((t) => t.reporter?.email?.toLowerCase() === user?.email?.toLowerCase())
  const myOpenCount = myTickets.filter((t) => t.status === 'open').length
  const myResolvedCount = myTickets.filter((t) => t.status === 'resolved').length

  return (
    <div>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.heading}>
            {isManager ? 'Campus Operations Command Center' : `Welcome, ${user?.name || 'Member'}`}
          </h1>
          <p className={styles.subheading}>
            {isManager
              ? 'Real-time telemetry, predictive maintenance, and facility resolution dispatch'
              : 'FIXIT Campus Infrastructure Intelligence Portal'}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={loadData}>
            🔄 Refresh Live Data
          </Button>
          <Button variant="primary" onClick={() => navigate('/tracks/fixit/raise')}>
            ➕ Raise an Issue
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 'var(--space-4)', background: 'var(--red-100)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-6)' }}>
          {error}
        </div>
      )}

      {/* Role Banner */}
      <div className={styles.roleAlertBar}>
        <div>
          <span>Active Role: <strong>{user?.role?.toUpperCase()}</strong></span>
          <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>
            ({user?.email})
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge tone="primary" size="sm">Live Connected</Badge>
          <Badge tone="neutral" size="sm">{tickets.length} Registered Issues</Badge>
        </div>
      </div>

      {/* Attention Required Banner (Overdue Items) */}
      <AttentionRequired tickets={tickets} />

      {/* USER DASHBOARD SPECIFIC SECTION (Student / Faculty / Office Staff) */}
      {!isManager && (
        <section aria-label="Personal Maintenance Tracking">
          <div className={styles.userWidgetsGrid}>
            <div className={styles.userWidgetCard}>
              <div className={styles.widgetHeader}>
                <span className={styles.widgetTitle}>My Active Issues</span>
                <Badge tone={myOpenCount > 0 ? 'warning' : 'success'}>
                  {myOpenCount} Open
                </Badge>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {myTickets.length}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {myOpenCount} pending resolution • {myResolvedCount} ready for your acknowledgement
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/tracks/fixit/my-tickets')}
              >
                Inspect My Tickets →
              </Button>
            </div>

            <div className={styles.userWidgetCard}>
              <div className={styles.widgetHeader}>
                <span className={styles.widgetTitle}>Action Needed</span>
                <Badge tone={myResolvedCount > 0 ? 'success' : 'neutral'}>
                  {myResolvedCount} Resolved
                </Badge>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text)' }}>
                {myResolvedCount > 0
                  ? 'Operations team has fixed your reported issues. Please inspect the work and submit verification sign-off.'
                  : 'All your submitted requests are being processed by campus technicians.'}
              </div>
              {myResolvedCount > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/tracks/fixit/my-tickets')}
                >
                  Verify &amp; Acknowledge Now
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* A. CAMPUS PULSE */}
      <CampusPulse tickets={tickets} />

      {/* Two Column Grid: Live Issue Monitor + Campus Intelligence */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* C. LIVE ISSUE MONITOR */}
        <LiveIssueMonitor tickets={tickets} limit={5} />

        {/* B. CAMPUS INTELLIGENCE */}
        <CampusIntelligence tickets={tickets} categories={categories} />
      </div>

      {/* Two Column Grid: Maintenance Heatmap + Resolution Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* F. MAINTENANCE HEATMAP */}
        <MaintenanceHeatmap tickets={tickets} />

        {/* E. RESOLUTION PERFORMANCE */}
        <ResolutionPerformance tickets={tickets} />
      </div>
    </div>
  )
}

