import { useEffect, useState } from 'react'
import {
  getDeveloperDatabase,
  createDatabaseBackup,
  restoreDatabase,
  type DatabaseOverview,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface DatabaseManagementTabProps {
  onNotify: (msg: string) => void
}

export function DatabaseManagementTab({ onNotify }: DatabaseManagementTabProps) {
  const [dbData, setDbData] = useState<DatabaseOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [backingUp, setBackingUp] = useState(false)
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null)

  async function loadDb() {
    try {
      setLoading(true)
      const res = await getDeveloperDatabase()
      setDbData(res)
    } catch (err: any) {
      onNotify(`Database error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    getDeveloperDatabase()
      .then((res) => {
        if (mounted) {
          setDbData(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoading(false)
          onNotify(`Database error: ${err.message}`)
        }
      })
    return () => {
      mounted = false
    }
  }, [onNotify])

  async function handleCreateBackup() {
    try {
      setBackingUp(true)
      const res = await createDatabaseBackup()
      onNotify(`Backup ${res.id || 'snapshot'} generated (${res.file_size || '32KB'})`)
      loadDb()
    } catch (err: any) {
      onNotify(`Backup failed: ${err.message}`)
    } finally {
      setBackingUp(false)
    }
  }

  async function handleRestore(backupId: string) {
    try {
      await restoreDatabase(backupId)
      onNotify(`Database successfully restored from ${backupId}!`)
      setRestoreConfirm(null)
      loadDb()
    } catch (err: any) {
      onNotify(`Restore failed: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.glowBadge}>ENGINE: ATOMIC JSON STORAGE</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Status: {dbData?.connection || 'CONNECTED'}
              </span>
            </div>
            <h2 className={styles.cardTitle} style={{ marginTop: '4px' }}>
              Database Architecture, Tables & Cold Snapshots
            </h2>
            <div className={styles.cardSubtitle}>
              Inspect relational collections, generate immutable point-in-time backups, and manage restoration
            </div>
          </div>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={handleCreateBackup}
            disabled={backingUp}
          >
            {backingUp ? 'Capturing Snapshot...' : '💾 Create Instant Backup'}
          </button>
        </div>

        {/* Database Tables Overview */}
        <h3 className={styles.cardTitle} style={{ marginBottom: '12px' }}>
          Registered Collections & Volume Footprints
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {loading ? (
            <div style={{ color: 'var(--color-text-muted)' }}>Querying schema metadata...</div>
          ) : (
            (dbData?.tables || []).map((t) => (
              <div
                key={t.name}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>{t.name}</span>
                  <code style={{ fontSize: '10px', color: 'var(--color-primary)' }}>{t.size_kb} KB</code>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px' }}>
                  {t.count.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Total records stored
                </div>
              </div>
            ))
          )}
        </div>

        {/* Backups Table */}
        <div style={{ marginTop: '24px' }}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '12px' }}>
            Snapshot Archive & Disaster Recovery Point
          </h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Backup Identifier</th>
                  <th>Snapshot Label</th>
                  <th>Total Records</th>
                  <th>File Size</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Disaster Recovery</th>
                </tr>
              </thead>
              <tbody>
                {(dbData?.backups || []).map((b) => (
                  <tr key={b.id}>
                    <td>
                      <code style={{ fontSize: '11px', fontWeight: 600 }}>{b.id}</code>
                    </td>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td>{b.record_count.toLocaleString()} rows</td>
                    <td>{b.file_size}</td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        style={{ padding: '3px 10px', fontSize: '11px' }}
                        onClick={() => setRestoreConfirm(b.id)}
                      >
                        Restore Snapshot
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {restoreConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '460px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#DC2626' }}>Restore Database Snapshot?</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Restoring backup <strong>{restoreConfirm}</strong> will replace current live records with the snapshot point. A safety pre-restore backup will be automatically captured. Are you sure you wish to proceed?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className={styles.actionBtn} onClick={() => setRestoreConfirm(null)}>
                Cancel
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                onClick={() => handleRestore(restoreConfirm)}
              >
                Yes, Restore Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
