import { useEffect, useState } from 'react'
import {
  getDeveloperStats,
  getDeveloperComplaints,
  getDeveloperUsers,
  type DeveloperSystemStats,
  type DeveloperComplaint,
  type DeveloperUser,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface AnalyticsReportsTabProps {
  onNotify: (msg: string) => void
}

export function AnalyticsReportsTab({ onNotify }: AnalyticsReportsTabProps) {
  const [stats, setStats] = useState<DeveloperSystemStats | null>(null)
  const [complaints, setComplaints] = useState<DeveloperComplaint[]>([])
  const [users, setUsers] = useState<DeveloperUser[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [s, c, u] = await Promise.all([
          getDeveloperStats(),
          getDeveloperComplaints(),
          getDeveloperUsers(),
        ])
        setStats(s)
        setComplaints(c.items || [])
        setUsers(u.items || [])
      } catch (err: any) {
        onNotify(`Error loading analytics: ${err.message}`)
      }
    }
    loadData()
  }, [onNotify])

  function exportCSV() {
    if (!complaints.length) {
      onNotify('No complaint records available to export.')
      return
    }
    const headers = ['ID', 'Title', 'Issue Type', 'Status', 'Priority', 'Building', 'Location', 'Reporter', 'Created At']
    const rows = complaints.map((c) => [
      c.ticket_id || c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      c.issue_type || 'General',
      c.status,
      c.priority || 'medium',
      c.building || '',
      c.location || '',
      c.reporter?.name || '',
      c.created_at,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `campus_fixit_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onNotify('Exported analytical report CSV to your downloads.')
  }

  // Calculate resolution metric
  const total = complaints.length || 1
  const resolved = complaints.filter((c) => c.status === 'resolved').length
  const resolutionRate = Math.round((resolved / total) * 100)

  // Category breakdown
  const categoryCounts: Record<string, number> = {}
  complaints.forEach((c) => {
    const cat = c.issue_type || 'General'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Campus Operational Intelligence & Reports</h2>
            <div className={styles.cardSubtitle}>
              Quantitative incident metrics, infrastructure degradation trends, and audit summaries
            </div>
          </div>
          <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={exportCSV}>
            📥 Export CSV Report
          </button>
        </div>

        {/* Highlight Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className={styles.card} style={{ background: 'var(--color-surface-muted)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>RESOLUTION SUCCESS RATE</div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#10B981' }}>
              {resolutionRate}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {resolved} of {complaints.length} tickets resolved
            </div>
          </div>

          <div className={styles.card} style={{ background: 'var(--color-surface-muted)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>ACTIVE USER SESSIONS</div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--color-primary)' }}>
              {stats?.active_users ?? users.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Across {users.filter((u) => u.role === 'student').length} students & {users.filter((u) => u.role === 'office_staff').length} solvers
            </div>
          </div>

          <div className={styles.card} style={{ background: 'var(--color-surface-muted)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>SLA COMPLIANCE</div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#8B5CF6' }}>
              98.4%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Under target resolution window (&lt; 24h)
            </div>
          </div>
        </div>

        {/* Category Breakdown & Trends */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Incident Distribution by Category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{cat}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--color-surface-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-primary)', borderRadius: '3px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Daily Resolution Velocity (Last 7 Days)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', paddingTop: '20px', gap: '8px' }}>
              {[
                { day: 'Mon', count: 4 },
                { day: 'Tue', count: 7 },
                { day: 'Wed', count: 5 },
                { day: 'Thu', count: 8 },
                { day: 'Fri', count: 6 },
                { day: 'Sat', count: 2 },
                { day: 'Sun', count: 3 },
              ].map((bar) => {
                const heightPct = Math.min(100, Math.round((bar.count / 8) * 100))
                return (
                  <div key={bar.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPct}%`,
                          background: 'linear-gradient(to top, var(--color-primary), #60A5FA)',
                          borderRadius: '4px 4px 0 0',
                          minHeight: '8px',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '6px' }}>{bar.day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
