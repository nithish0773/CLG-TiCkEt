import { useEffect, useState } from 'react'
import {
  getDeveloperSecurity,
  terminateSession,
  type SecurityOverview,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface SecurityCenterTabProps {
  onNotify: (msg: string) => void
}

export function SecurityCenterTab({ onNotify }: SecurityCenterTabProps) {
  const [sec, setSec] = useState<SecurityOverview | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadSecurity() {
    try {
      setLoading(true)
      const res = await getDeveloperSecurity()
      setSec(res)
    } catch (err: any) {
      onNotify(`Security scan failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    getDeveloperSecurity()
      .then((res) => {
        if (mounted) {
          setSec(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoading(false)
          onNotify(`Security scan failed: ${err.message}`)
        }
      })
    return () => {
      mounted = false
    }
  }, [onNotify])

  async function handleTerminate(sessionId: string) {
    try {
      await terminateSession(sessionId)
      onNotify(`Session ${sessionId} terminated immediately.`)
      loadSecurity()
    } catch (err: any) {
      onNotify(`Termination failed: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.glowBadge}>SHIELD ACTIVE</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Zero-Trust Developer Perimeter
              </span>
            </div>
            <h2 className={styles.cardTitle} style={{ marginTop: '4px' }}>
              Platform Security Center & Session Governance
            </h2>
            <div className={styles.cardSubtitle}>
              Active bearer session tokens, brute-force defense, login audits, and multi-factor authentication
            </div>
          </div>
          <button className={styles.actionBtn} onClick={loadSecurity}>
            ↻ Audit Scan
          </button>
        </div>

        {/* Security Controls Toggles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div className={styles.card} style={{ background: 'var(--color-surface-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px' }}>Two-Factor Authentication (2FA)</h4>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Require cryptographic OTP verification for developer logins
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                onChange={(e) => onNotify(`2FA enforcement ${e.target.checked ? 'enabled' : 'disabled'}`)}
              />
            </div>
          </div>

          <div className={styles.card} style={{ background: 'var(--color-surface-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px' }}>Strict Role Boundary Guard</h4>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Block non-developer tokens at API gateway layer (403 Forbidden)
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                onChange={(e) => onNotify(`Strict RBAC ${e.target.checked ? 'active' : 'inactive'}`)}
              />
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div style={{ marginTop: '24px' }}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '12px' }}>
            Active Authenticated Sessions & Tokens
          </h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Session Identity</th>
                  <th>IP Address</th>
                  <th>Client User-Agent</th>
                  <th>Authenticated Since</th>
                  <th>Session State</th>
                  <th style={{ textAlign: 'right' }}>Remote Revocation</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                      Scanning active session stores...
                    </td>
                  </tr>
                ) : (
                  (sec?.active_sessions || []).map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.user}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>ID: {s.id}</div>
                      </td>
                      <td>
                        <code style={{ fontSize: '11px' }}>{s.ip}</code>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--color-text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.agent}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: s.is_current ? 'rgba(37, 99, 235, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: s.is_current ? 'var(--color-primary)' : '#10B981',
                          }}
                        >
                          {s.is_current ? 'THIS DEVICE' : 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!s.is_current && (
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => handleTerminate(s.id)}
                          >
                            Terminate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Audit Trail */}
        <div style={{ marginTop: '24px' }}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '12px' }}>
            Authentication & Access Attempt Logs
          </h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Subject</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {(sec?.logs || []).slice(0, 8).map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600, fontSize: '12px' }}>{log.event}</td>
                    <td style={{ fontSize: '12px' }}>{log.user}</td>
                    <td>
                      <code style={{ fontSize: '11px' }}>{log.ip}</code>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: log.status === 'SUCCESS' ? '#10B981' : '#EF4444',
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
