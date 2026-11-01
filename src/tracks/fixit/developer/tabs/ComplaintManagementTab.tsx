import { useEffect, useState, useMemo } from 'react'
import {
  getDeveloperComplaints,
  updateDeveloperComplaint,
  deleteDeveloperComplaint,
  getDeveloperSolvers,
  type DeveloperComplaint,
  type DeveloperSolver,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface ComplaintManagementTabProps {
  onNotify: (msg: string) => void
}

export function ComplaintManagementTab({ onNotify }: ComplaintManagementTabProps) {
  const [complaints, setComplaints] = useState<DeveloperComplaint[]>([])
  const [solvers, setSolvers] = useState<DeveloperSolver[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Modals
  const [selectedTicket, setSelectedTicket] = useState<DeveloperComplaint | null>(null)
  const [assigningTicket, setAssigningTicket] = useState<DeveloperComplaint | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeveloperComplaint | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      const [compRes, solvRes] = await Promise.all([
        getDeveloperComplaints(),
        getDeveloperSolvers(),
      ])
      setComplaints(compRes.items || [])
      setSolvers(solvRes.items || [])
    } catch (err: any) {
      onNotify(`Error loading complaints: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    Promise.all([getDeveloperComplaints(), getDeveloperSolvers()])
      .then(([compRes, solvRes]) => {
        if (mounted) {
          setComplaints(compRes.items || [])
          setSolvers(solvRes.items || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoading(false)
          onNotify(`Error loading complaints: ${err.message}`)
        }
      })
    return () => {
      mounted = false
    }
  }, [onNotify])

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const q = search.toLowerCase()
      const matchesSearch =
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.building && c.building.toLowerCase().includes(q)) ||
        (c.issue_type && c.issue_type.toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || (c.priority || 'medium') === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [complaints, search, statusFilter, priorityFilter])

  async function handleQuickStatusChange(id: string, nextStatus: 'open' | 'acknowledged' | 'resolved') {
    try {
      await updateDeveloperComplaint(id, { status: nextStatus })
      onNotify(`Complaint marked as ${nextStatus}`)
      loadData()
    } catch (err: any) {
      onNotify(`Failed to change status: ${err.message}`)
    }
  }

  async function handleQuickPriorityChange(id: string, nextPriority: 'critical' | 'high' | 'medium' | 'low') {
    try {
      await updateDeveloperComplaint(id, { priority: nextPriority })
      onNotify(`Priority updated to ${nextPriority.toUpperCase()}`)
      loadData()
    } catch (err: any) {
      onNotify(`Failed to change priority: ${err.message}`)
    }
  }

  async function handleAssignSolver(solver: DeveloperSolver) {
    if (!assigningTicket) return
    try {
      await updateDeveloperComplaint(assigningTicket.id, {
        assigned_to: {
          name: solver.name,
          email: solver.email_id,
          phone: solver.phone_number || '',
        },
        status: 'acknowledged',
      })
      onNotify(`Assigned to ${solver.name} (${solver.dept || 'Staff'})`)
      setAssigningTicket(null)
      loadData()
    } catch (err: any) {
      onNotify(`Assignment failed: ${err.message}`)
    }
  }

  async function handleDeleteTicket() {
    if (!deleteConfirm) return
    try {
      await deleteDeveloperComplaint(deleteConfirm.id)
      onNotify(`Complaint ${deleteConfirm.ticket_id || deleteConfirm.id} archived & deleted`)
      setDeleteConfirm(null)
      loadData()
    } catch (err: any) {
      onNotify(`Failed to delete complaint: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Complaint Governance & Incident Dispatch</h2>
            <div className={styles.cardSubtitle}>
              Direct intervention into ticketing queues, emergency routing, SLA re-prioritization
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.actionBtn} onClick={loadData}>
              ↻ Refresh Live Tickets
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Search by title, location, category, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '320px' }}
          />

          <select
            className={styles.input}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ maxWidth: '170px' }}
          >
            <option value="all">All Statuses</option>
            <option value="open">Pending (Open)</option>
            <option value="acknowledged">Processing (Acknowledged)</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            className={styles.input}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ maxWidth: '170px' }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical (P0)</option>
            <option value="high">High (P1)</option>
            <option value="medium">Medium (P2)</option>
            <option value="low">Low (P3)</option>
          </select>

          <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Showing <strong>{filtered.length}</strong> of {complaints.length} tickets
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ticket Info</th>
              <th>Location & Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned Solver</th>
              <th>Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                  Loading campus complaints...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                  No complaints match the current filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const pri = t.priority || 'medium'
                const isResolved = t.status === 'resolved'
                const isAck = t.status === 'acknowledged'
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {t.ticket_id || t.id.slice(0, 8)} · Reported by: {t.reporter?.name || 'Student'}
                      </div>
                    </td>
                    <td>
                      <div>{t.issue_type || 'Maintenance'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {t.building || 'Campus'} {t.location ? `· ${t.location}` : ''}
                      </div>
                    </td>
                    <td>
                      <select
                        className={styles.input}
                        style={{
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '12px',
                          color:
                            pri === 'critical'
                              ? '#DC2626'
                              : pri === 'high'
                              ? '#EA580C'
                              : pri === 'medium'
                              ? 'var(--color-primary)'
                              : 'var(--color-text-muted)',
                          borderColor:
                            pri === 'critical'
                              ? 'rgba(220, 38, 38, 0.4)'
                              : 'var(--color-border)',
                        }}
                        value={pri}
                        onChange={(e) => handleQuickPriorityChange(t.id, e.target.value as any)}
                      >
                        <option value="critical">CRITICAL</option>
                        <option value="high">HIGH</option>
                        <option value="medium">MEDIUM</option>
                        <option value="low">LOW</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className={styles.input}
                        style={{
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '12px',
                          color: isResolved ? '#10B981' : isAck ? '#F59E0B' : '#3B82F6',
                        }}
                        value={t.status}
                        onChange={(e) => handleQuickStatusChange(t.id, e.target.value as any)}
                      >
                        <option value="open">OPEN (PENDING)</option>
                        <option value="acknowledged">PROCESSING</option>
                        <option value="resolved">RESOLVED</option>
                      </select>
                    </td>
                    <td>
                      {t.assigned_to ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '12px' }}>{t.assigned_to.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{t.assigned_to.email}</div>
                        </div>
                      ) : (
                        <button
                          className={styles.actionBtn}
                          style={{ padding: '3px 8px', fontSize: '11px', color: '#EA580C' }}
                          onClick={() => setAssigningTicket(t)}
                        >
                          + Assign Solver
                        </button>
                      )}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className={styles.actionBtn}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => setSelectedTicket(t)}
                        >
                          Inspect
                        </button>
                        <button
                          className={styles.actionBtn}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => setAssigningTicket(t)}
                        >
                          Reassign
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => setDeleteConfirm(t)}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Ticket Modal */}
      {selectedTicket && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.glowBadge}>{selectedTicket.issue_type || 'Incident'}</span>
                <h3 className={styles.cardTitle} style={{ marginTop: '6px' }}>
                  {selectedTicket.title}
                </h3>
              </div>
              <button
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                onClick={() => setSelectedTicket(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className={styles.label}>Complaint Description</label>
                <div style={{ padding: '12px', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)', fontSize: '13px', lineHeight: 1.5 }}>
                  {selectedTicket.description}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Location Details</div>
                  <div style={{ fontWeight: 600 }}>{selectedTicket.building || 'Main Campus'} ({selectedTicket.location || 'General'})</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Reported By</div>
                  <div style={{ fontWeight: 600 }}>{selectedTicket.reporter?.name || 'Asha Kumar'} ({selectedTicket.reporter?.email || 'Student'})</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Assigned Solver</div>
                  <div style={{ fontWeight: 600 }}>{selectedTicket.assigned_to?.name || 'Unassigned'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Current Status</div>
                  <div style={{ fontWeight: 600, textTransform: 'uppercase', color: selectedTicket.status === 'resolved' ? '#10B981' : '#3B82F6' }}>
                    {selectedTicket.status}
                  </div>
                </div>
              </div>

              {selectedTicket.manager_notes && (
                <div>
                  <label className={styles.label}>Developer / Manager Resolution Notes</label>
                  <div style={{ padding: '10px', background: 'rgba(37, 99, 235, 0.08)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                    {selectedTicket.manager_notes}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                  onClick={() => {
                    const next = selectedTicket.status === 'resolved' ? 'open' : 'resolved'
                    handleQuickStatusChange(selectedTicket.id, next)
                    setSelectedTicket(null)
                  }}
                >
                  {selectedTicket.status === 'resolved' ? 'Reopen Ticket' : 'Mark as Resolved ✓'}
                </button>
                <button className={styles.actionBtn} onClick={() => setSelectedTicket(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Solver Modal */}
      {assigningTicket && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Assign Problem Solver</h3>
              <button
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                onClick={() => setAssigningTicket(null)}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
              Assigning complaint: <strong>{assigningTicket.title}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {solvers.map((s) => (
                <div
                  key={s.email_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-muted)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {s.dept || 'Staff'} · {s.availability} · Workload: {s.assigned_count || 0} active
                    </div>
                  </div>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                    onClick={() => handleAssignSolver(s)}
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Archive / Delete Confirm */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '440px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#EF4444' }}>Archive & Purge Complaint?</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 20px 0' }}>
              Are you sure you want to delete complaint <strong>{deleteConfirm.title}</strong>? This removes it from student & solver portals.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className={styles.actionBtn} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={handleDeleteTicket}>
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
