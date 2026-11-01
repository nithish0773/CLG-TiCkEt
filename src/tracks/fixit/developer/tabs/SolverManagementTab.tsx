import { useEffect, useState } from 'react'
import {
  getDeveloperSolvers,
  updateDeveloperSolver,
  createDeveloperUser,
  type DeveloperSolver,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface SolverManagementTabProps {
  onNotify: (msg: string) => void
  onNavigateTab: (tabId: string) => void
}

export function SolverManagementTab({ onNotify, onNavigateTab }: SolverManagementTabProps) {
  const [solvers, setSolvers] = useState<DeveloperSolver[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const [newSolver, setNewSolver] = useState({
    name: '',
    email_id: '',
    role: 'office_staff' as const,
    dept: 'Campus Maintenance',
    designation: 'Field Specialist',
    phone_number: '9876543215',
    otp: '123456',
    availability: 'available' as const,
  })

  async function loadSolvers() {
    try {
      setLoading(true)
      const res = await getDeveloperSolvers()
      setSolvers(res.items || [])
    } catch (err: any) {
      onNotify(`Error loading solvers: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    getDeveloperSolvers()
      .then((res) => {
        if (mounted) {
          setSolvers(res.items || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoading(false)
          onNotify(`Error loading solvers: ${err.message}`)
        }
      })
    return () => {
      mounted = false
    }
  }, [onNotify])

  async function handleAvailabilityChange(solverId: string, nextAvailability: 'available' | 'busy' | 'offline') {
    try {
      await updateDeveloperSolver(solverId, { availability: nextAvailability })
      onNotify(`Solver status set to ${nextAvailability.toUpperCase()}`)
      loadSolvers()
    } catch (err: any) {
      onNotify(`Failed to update availability: ${err.message}`)
    }
  }

  async function handleCreateSolver(e: React.FormEvent) {
    e.preventDefault()
    if (!newSolver.name || !newSolver.email_id) {
      onNotify('Name and email required')
      return
    }
    try {
      await createDeveloperUser(newSolver)
      onNotify(`Problem solver ${newSolver.name} registered`)
      setIsAddOpen(false)
      loadSolvers()
    } catch (err: any) {
      onNotify(`Failed to add problem solver: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Problem Solver Workforce & Capacity Management</h2>
            <div className={styles.cardSubtitle}>
              Monitor real-time task allocations, shift availability, and resolution ratings
            </div>
          </div>
          <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => setIsAddOpen(true)}>
            + Enroll Solver
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {loading ? (
            <div style={{ color: 'var(--color-text-muted)', padding: '24px 0' }}>Loading solvers roster...</div>
          ) : (
            solvers.map((s) => {
              const isAvail = s.availability === 'available'
              const isBusy = s.availability === 'busy'
              return (
                <div
                  key={s.email_id}
                  className={styles.card}
                  style={{
                    border: '1px solid var(--color-border)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px' }}>{s.name}</h3>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{s.email_id}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '2px', fontWeight: 600 }}>
                        {s.dept || s.designation || 'Staff'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: isAvail ? 'rgba(16, 185, 129, 0.15)' : isBusy ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-surface-muted)',
                        color: isAvail ? '#10B981' : isBusy ? '#F59E0B' : 'var(--color-text-muted)',
                      }}
                    >
                      {s.availability.toUpperCase()}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '16px 0', background: 'var(--color-surface-muted)', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>WORKLOAD</div>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{s.assigned_count || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>COMPLETED</div>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px', color: '#10B981' }}>{s.completed_count || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>RATING</div>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px', color: '#F59E0B' }}>{s.rating || 5} ★</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <select
                      className={styles.input}
                      style={{ maxWidth: '130px', padding: '4px 8px', fontSize: '11px' }}
                      value={s.availability}
                      onChange={(e) => handleAvailabilityChange(s.email_id, e.target.value as any)}
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy / On-Field</option>
                      <option value="offline">Offline / Shift End</option>
                    </select>

                    <button
                      className={styles.actionBtn}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => onNavigateTab('complaints')}
                    >
                      View Assigned
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Enroll Solver Modal */}
      {isAddOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Enroll Campus Problem Solver</h3>
              <button
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                onClick={() => setIsAddOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSolver}>
              <div className={styles.formGrid}>
                <div>
                  <label className={styles.label}>Solver Full Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    value={newSolver.name}
                    onChange={(e) => setNewSolver((v) => ({ ...v, name: e.target.value }))}
                    placeholder="e.g. Suresh Maintenance"
                  />
                </div>
                <div>
                  <label className={styles.label}>Institutional Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    required
                    value={newSolver.email_id}
                    onChange={(e) => setNewSolver((v) => ({ ...v, email_id: e.target.value }))}
                    placeholder="suresh@team13.com"
                  />
                </div>
                <div>
                  <label className={styles.label}>Department / Specialization</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={newSolver.dept}
                    onChange={(e) => setNewSolver((v) => ({ ...v, dept: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={styles.label}>Role Designation</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={newSolver.designation}
                    onChange={(e) => setNewSolver((v) => ({ ...v, designation: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    className={styles.input}
                    value={newSolver.phone_number}
                    onChange={(e) => setNewSolver((v) => ({ ...v, phone_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={styles.label}>Login OTP</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={newSolver.otp}
                    onChange={(e) => setNewSolver((v) => ({ ...v, otp: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
                  Enroll Problem Solver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
