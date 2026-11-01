import { useEffect, useState } from 'react'
import {
  getWebsiteCustomization,
  toggleMaintenanceMode,
  type WebsiteCustomization,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface MaintenanceModeTabProps {
  onNotify: (msg: string) => void
  onBroadcastCustomization?: (customization: WebsiteCustomization) => void
}

export function MaintenanceModeTab({ onNotify, onBroadcastCustomization }: MaintenanceModeTabProps) {
  const [data, setData] = useState<WebsiteCustomization | null>(null)
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('Campus Fixit is currently undergoing scheduled infrastructure upgrades. We will return online shortly.')
  const [estimated, setEstimated] = useState('30 minutes')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    getWebsiteCustomization()
      .then((res) => {
        if (mounted) {
          setData(res)
          setEnabled(res.maintenance_mode.enabled)
          setMessage(res.maintenance_mode.message)
          setEstimated(res.maintenance_mode.estimated_completion || '30 minutes')
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoading(false)
          onNotify(`Error loading maintenance config: ${err.message}`)
        }
      })
    return () => {
      mounted = false
    }
  }, [onNotify])

  async function handleToggle(nextEnabled: boolean) {
    try {
      setSaving(true)
      await toggleMaintenanceMode(nextEnabled, message, estimated)
      setEnabled(nextEnabled)
      if (data) {
        const nextCustomization = {
          ...data,
          maintenance_mode: {
            enabled: nextEnabled,
            message,
            estimated_completion: estimated,
          },
        }
        setData(nextCustomization)
        if (onBroadcastCustomization) {
          onBroadcastCustomization(nextCustomization)
        }
      }
      onNotify(`Maintenance mode is now ${nextEnabled ? 'ACTIVE (Site Locked for standard users)' : 'DEACTIVATED (Platform Public)'}`)
    } catch (err: any) {
      onNotify(`Failed to change maintenance mode: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--color-text-muted)', padding: '24px 0' }}>Checking maintenance lock state...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: enabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: enabled ? '#DC2626' : '#10B981',
                }}
              >
                {enabled ? 'MAINTENANCE SHIELD ACTIVE' : 'SYSTEM FULLY OPERATIONAL'}
              </span>
            </div>
            <h2 className={styles.cardTitle} style={{ marginTop: '4px' }}>
              Campus Platform Maintenance Mode Controller
            </h2>
            <div className={styles.cardSubtitle}>
              Restrict public student/faculty traffic during system migrations while keeping developer tools online
            </div>
          </div>

          <button
            className={`${styles.actionBtn} ${enabled ? styles.actionBtnDanger : styles.actionBtnPrimary}`}
            onClick={() => handleToggle(!enabled)}
            disabled={saving}
          >
            {saving ? 'Updating...' : enabled ? 'Disable Maintenance (Go Live)' : '🔒 Lock Site for Maintenance'}
          </button>
        </div>

        {/* Configuration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 className={styles.cardTitle}>Notice Banner & Estimated Duration</h3>

            <div>
              <label className={styles.label}>Broadcast Maintenance Message</label>
              <textarea
                className={styles.input}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div>
              <label className={styles.label}>Estimated Resumption Horizon</label>
              <input
                type="text"
                className={styles.input}
                value={estimated}
                onChange={(e) => setEstimated(e.target.value)}
                placeholder="e.g. 45 minutes / 11:30 PM"
              />
            </div>

            <button
              className={styles.actionBtn}
              style={{ alignSelf: 'flex-start' }}
              onClick={() => handleToggle(enabled)}
            >
              Update Notice Message
            </button>
          </div>

          {/* Normal User Screen Simulation */}
          <div style={{ background: 'var(--color-bg)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Standard User Screen Preview
            </div>

            <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: '#DC2626', fontSize: '32px', marginBottom: '12px' }}>
              🚧
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800 }}>Platform Maintenance Underway</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
              {message}
            </p>

            <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '20px', background: 'var(--color-surface-muted)', fontSize: '12px', fontWeight: 600 }}>
              ⏱️ Expected Completion: {estimated}
            </div>

            <div style={{ marginTop: '20px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Developer super-admins bypass this screen automatically via token credentials.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
