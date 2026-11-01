import { useEffect, useState } from 'react'
import {
  getDeveloperAnnouncements,
  createDeveloperAnnouncement,
  deleteDeveloperAnnouncement,
  type WebsiteAnnouncement,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface AnnouncementCenterTabProps {
  onNotify: (msg: string) => void
}

export function AnnouncementCenterTab({ onNotify }: AnnouncementCenterTabProps) {
  const [announcements, setAnnouncements] = useState<WebsiteAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)

  const [newAnn, setNewAnn] = useState({
    title: '',
    message: '',
    target_role: 'all' as const,
    priority: 'normal' as const,
  })

  async function loadAnnouncements() {
    try {
      setLoading(true)
      const res = await getDeveloperAnnouncements()
      setAnnouncements(res.items || [])
    } catch (err: any) {
      onNotify(`Error loading announcements: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    getDeveloperAnnouncements()
      .then((res) => {
        if (mounted) {
          setAnnouncements(res.items || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoading(false)
          onNotify(`Error loading announcements: ${err.message}`)
        }
      })
    return () => {
      mounted = false
    }
  }, [onNotify])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newAnn.title || !newAnn.message) {
      onNotify('Title and message are required.')
      return
    }
    try {
      await createDeveloperAnnouncement(newAnn)
      onNotify(`Announcement '${newAnn.title}' broadcasted to campus!`)
      setIsBroadcastOpen(false)
      setNewAnn({ title: '', message: '', target_role: 'all', priority: 'normal' })
      loadAnnouncements()
    } catch (err: any) {
      onNotify(`Broadcast failed: ${err.message}`)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDeveloperAnnouncement(id)
      onNotify('Announcement withdrawn.')
      loadAnnouncements()
    } catch (err: any) {
      onNotify(`Failed to delete: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Campus Announcement & Notification Center</h2>
            <div className={styles.cardSubtitle}>
              Push real-time critical maintenance notices, water/power outage alerts, and updates to user groups
            </div>
          </div>
          <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => setIsBroadcastOpen(true)}>
            📢 Broadcast Announcement
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ color: 'var(--color-text-muted)', padding: '24px 0' }}>Loading notifications feed...</div>
          ) : announcements.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', padding: '24px 0', textAlign: 'center' }}>
              No announcements currently active.
            </div>
          ) : (
            announcements.map((a) => {
              const isUrgent = a.priority === 'urgent'
              return (
                <div
                  key={a.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: isUrgent ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: isUrgent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.12)',
                          color: isUrgent ? '#DC2626' : 'var(--color-primary)',
                        }}
                      >
                        {a.priority}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Target: <strong>{a.target_role.toUpperCase()}</strong> · Delivered to {a.delivered_count} accounts
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>{a.title}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      {a.message}
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                      Published on {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>

                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => handleDelete(a.id)}
                  >
                    Withdraw
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      {isBroadcastOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Dispatch Campus-Wide Announcement</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }} onClick={() => setIsBroadcastOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSend}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className={styles.label}>Notice Headline</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    placeholder="e.g. Scheduled Water Pipeline Maintenance"
                    value={newAnn.title}
                    onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.label}>Target Recipient Audience</label>
                  <select
                    className={styles.input}
                    value={newAnn.target_role}
                    onChange={(e) => setNewAnn({ ...newAnn, target_role: e.target.value as any })}
                  >
                    <option value="all">Entire Campus (All Users)</option>
                    <option value="students">Students Only</option>
                    <option value="solvers">Problem Solvers & Staff</option>
                    <option value="faculty">Faculty Members</option>
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Broadcast Priority</label>
                  <select
                    className={styles.input}
                    value={newAnn.priority}
                    onChange={(e) => setNewAnn({ ...newAnn, priority: e.target.value as any })}
                  >
                    <option value="normal">Normal Information</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent / Emergency P0</option>
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Broadcast Message Body</label>
                  <textarea
                    className={styles.input}
                    rows={4}
                    required
                    placeholder="Details, affected blocks, and estimated resumption time..."
                    value={newAnn.message}
                    onChange={(e) => setNewAnn({ ...newAnn, message: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setIsBroadcastOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
                  Broadcast Now 📢
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
