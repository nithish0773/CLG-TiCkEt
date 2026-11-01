import { useEffect, useState } from 'react'
import {
  getDeveloperStats,
  getDeveloperActivity,
  type DeveloperSystemStats,
  type DeveloperActivityItem,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface OverviewTabProps {
  onNavigateTab: (tabId: string) => void
  onOpenQuickAction: (action: string) => void
}

export function OverviewTab({ onNavigateTab, onOpenQuickAction }: OverviewTabProps) {
  const [stats, setStats] = useState<DeveloperSystemStats | null>(null)
  const [activities, setActivities] = useState<DeveloperActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        setLoading(true)
        const [statsData, actData] = await Promise.all([
          getDeveloperStats(),
          getDeveloperActivity(),
        ])
        if (!mounted) return
        setStats(statsData)
        setActivities(actData.items || [])
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message || 'Failed to load system overview')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    const timer = setInterval(loadData, 20_000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-muted)' }}>
          <span style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>⚙️</span>
          <span>Loading telemetry & live platform metrics...</span>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className={styles.card} style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
        <h3 style={{ color: '#EF4444', margin: '0 0 8px 0' }}>Telemetry Connection Alert</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{error}</p>
      </div>
    )
  }

  const uptimeHours = stats ? Math.floor(stats.uptime_seconds / 3600) : 0
  const uptimeMinutes = stats ? Math.floor((stats.uptime_seconds % 3600) / 60) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Platform Banner */}
      <div
        className={styles.card}
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderColor: 'rgba(37, 99, 235, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className={styles.glowDot} />
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                Campus OS Fixit Engine v{stats?.api_version || '1.1.2'}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
                Env: {stats?.environment || 'production'}
              </span>
              {stats?.maintenance_mode && (
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#DC2626', fontWeight: 600 }}>
                  Maintenance Active
                </span>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Developer Central Command & Intelligence</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Full administrative authority over platform infrastructure, live configurations, database, and complaint resolution lifecycle.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => onNavigateTab('customization')}>
              🎨 Website Studio
            </button>
            <button className={styles.actionBtn} onClick={() => onOpenQuickAction('backup')}>
              💾 Quick Backup
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className={styles.card} style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('users')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Registered Students</div>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', color: 'var(--color-text)' }}>
                {stats?.students_count ?? 0}
              </div>
            </div>
            <span style={{ fontSize: '22px' }}>🎓</span>
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>●</span> Active campus population
          </div>
        </div>

        <div className={styles.card} style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('solvers')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Problem Solvers</div>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', color: 'var(--color-text)' }}>
                {stats?.solvers_count ?? 0}
              </div>
            </div>
            <span style={{ fontSize: '22px' }}>🛠️</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>●</span> Maintenance crew & supervisors
          </div>
        </div>

        <div className={styles.card} style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('complaints')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Complaints</div>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', color: 'var(--color-text)' }}>
                {stats?.complaints_count ?? 0}
              </div>
            </div>
            <span style={{ fontSize: '22px' }}>📋</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            {stats?.pending_complaints ?? 0} Pending · {stats?.resolved_complaints ?? 0} Resolved
          </div>
        </div>

        <div className={styles.card} style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('monitoring')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Platform Health & SLA</div>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', color: '#10B981' }}>
                {stats?.uptime_percentage || '99.98%'}
              </div>
            </div>
            <span style={{ fontSize: '22px' }}>⚡</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Uptime: {uptimeHours}h {uptimeMinutes}m · Health: {stats?.system_health || 'OPTIMAL'}
          </div>
        </div>
      </div>

      {/* System Telemetry & Live Activity Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Real-time System Metrics */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Engine Performance & Architecture</h3>
              <div className={styles.cardSubtitle}>Node.js V8 runtime memory and process telemetry</div>
            </div>
            <span className={styles.glowBadge}>LIVE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Heap Memory Utilization</span>
                <span style={{ fontWeight: 600 }}>
                  {stats?.memory_usage.heap_used_mb || '28.4'} MB / {stats?.memory_usage.heap_total_mb || '48.1'} MB
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--color-surface-muted)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round(((parseFloat(stats?.memory_usage.heap_used_mb || '28') / Math.max(1, parseFloat(stats?.memory_usage.heap_total_mb || '48'))) * 100)))}%`,
                    background: 'var(--color-primary)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '8px' }}>
              <div style={{ padding: '10px 12px', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Database Driver</div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px', color: '#10B981' }}>
                  {stats?.db_status || 'CONNECTED'} (JSON KV)
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Active Worker Crons</div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                  {stats?.background_tasks?.length || 3} Tasks Running
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Need deep server telemetry?</span>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                onClick={() => onNavigateTab('monitoring')}
              >
                Inspect System Monitoring →
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log Preview */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Recent Developer Audit Log</h3>
              <div className={styles.cardSubtitle}>Immutable trail of high-privilege configuration changes</div>
            </div>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => onNavigateTab('security')}
            >
              Full Security Log
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No developer actions recorded yet in this session.
              </div>
            ) : (
              activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: act.result === 'SUCCESS' ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                      {act.result === 'SUCCESS' ? '✓' : '✗'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{act.action}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>{act.affected_resource}</div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

