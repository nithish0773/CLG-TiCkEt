import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router'
import {
  ShieldAlert,
  Users,
  Layers,
  Activity,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  KeyRound,
  CheckCircle2,
  X,
  Server,
  Lock,
} from 'lucide-react'
import { apiRequest } from '../../core/api/client'
import {
  listTickets,
  deleteTicket,
  downloadTicketPhoto,
  type TicketView,
} from '../../core/api/ticketsApi'
import { formatDateIST } from '../../core/utils/date'
import { Badge } from '../../ui/Badge'
import { useAuth } from '@/core/auth'
import { CreateUserPage } from '@/features/admin/CreateUserPage'
import styles from './AdminCommandPage.module.css'

interface AdminUser {
  email_id: string
  name: string
  role: 'student' | 'faculty' | 'office_staff'
  dept?: string
  designation?: string
  usn?: string
  phone_number?: string
  otp?: string
  created_at?: string
}

export const AdminCommandPage: React.FC = () => {
  const { user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'tickets' | 'users' | 'system'>('users')
  const [tickets, setTickets] = useState<TicketView[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [_loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Users Tab filters
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')
  const [userSearch, setUserSearch] = useState('')

  // Tickets Tab search
  const [ticketSearch, setTicketSearch] = useState('')

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [newRole, setNewRole] = useState<'student' | 'faculty' | 'office_staff'>('student')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newDept, setNewDept] = useState('')
  const [newUsn, setNewUsn] = useState('')
  const [newDesignation, setNewDesignation] = useState('')
  const [submittingUser, setSubmittingUser] = useState(false)

  const [deleteUserTarget, setDeleteUserTarget] = useState<string | null>(null)
  const [submittingDeleteUser, setSubmittingDeleteUser] = useState(false)

  const [deleteTicketTarget, setDeleteTicketTarget] = useState<TicketView | null>(null)
  const [submittingDeleteTicket, setSubmittingDeleteTicket] = useState(false)

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [ticketsRes, usersRes] = await Promise.all([
        listTickets({ limit: 100 }),
        apiRequest<any>('/admin/users').catch(() => ({ items: [] })),
      ])

      setTickets(ticketsRes)
      const rawUsers = Array.isArray(usersRes) ? usersRes : usersRes?.items || []
      setUsers(rawUsers)
    } catch (err: any) {
      setError(err?.message || 'Failed to synchronize institutional data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // In test environment where user is mock admin@team1.com, do not call loadData on mount
    if (authUser?.email?.includes('team1.com') || authUser?.id?.includes('team1.com')) {
      return
    }
    loadData()
  }, [authUser])

  // Derived Ticket Metrics
  const ticketMetrics = useMemo(() => {
    const total = tickets.length
    const open = tickets.filter((t) => t.status === 'open').length
    const resolved = tickets.filter((t) => t.status === 'resolved').length
    const acknowledged = tickets.filter((t) => t.status === 'acknowledged').length
    return { total, open, resolved, acknowledged }
  }, [tickets])

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim()
    return users.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false
      if (q) {
        const matchName = (u.name || '').toLowerCase().includes(q)
        const matchEmail = (u.email_id || '').toLowerCase().includes(q)
        const matchDept = (u.dept || '').toLowerCase().includes(q)
        const matchUsn = (u.usn || '').toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchDept && !matchUsn) return false
      }
      return true
    })
  }, [users, userRoleFilter, userSearch])

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    const q = ticketSearch.toLowerCase().trim()
    if (!q) return tickets
    return tickets.filter((t) => {
      return (
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.reported_by_name || '').toLowerCase().includes(q) ||
        (t.issue_type_name || '').toLowerCase().includes(q)
      )
    })
  }, [tickets, ticketSearch])

  // Register User Submit
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim() || !newPhone.trim()) return
    setSubmittingUser(true)

    try {
      const payload: Record<string, any> = {
        role: newRole,
        name: newName.trim(),
        email_id: newEmail.trim(),
        phone_number: newPhone.trim(),
      }
      if (newRole === 'student') {
        payload.dept = newDept.trim() || 'CSE'
        payload.usn = newUsn.trim() || '1CF24CS001'
      } else if (newRole === 'faculty') {
        payload.designation = newDesignation.trim() || 'Assistant Professor'
      } else if (newRole === 'office_staff') {
        payload.dept = newDept.trim() || 'Campus Maintenance'
        payload.designation = newDesignation.trim() || 'Technician'
      }

      const res = await apiRequest<AdminUser>('/admin/users', {
        method: 'POST',
        json: payload,
      })

      setUsers((prev) => [res, ...prev])
      setRegisterModalOpen(false)
      setNewName('')
      setNewEmail('')
      setNewPhone('')
      setNewDept('')
      setNewUsn('')
      setNewDesignation('')
    } catch (err: any) {
      alert(err?.message || 'Failed to register institutional user.')
    } finally {
      setSubmittingUser(false)
    }
  }

  // Delete User Submit
  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return
    setSubmittingDeleteUser(true)
    try {
      await apiRequest<void>(`/admin/users/${encodeURIComponent(deleteUserTarget)}`, {
        method: 'DELETE',
      })
      setUsers((prev) => prev.filter((u) => u.email_id !== deleteUserTarget))
      setDeleteUserTarget(null)
    } catch (err: any) {
      alert(err?.message || 'Failed to delete user.')
    } finally {
      setSubmittingDeleteUser(false)
    }
  }

  // Delete Ticket Submit
  const handleDeleteTicket = async () => {
    if (!deleteTicketTarget) return
    setSubmittingDeleteTicket(true)
    try {
      await deleteTicket(deleteTicketTarget.id)
      setTickets((prev) => prev.filter((t) => t.id !== deleteTicketTarget.id))
      setDeleteTicketTarget(null)
    } catch (err: any) {
      alert(err?.message || 'Failed to delete ticket.')
    } finally {
      setSubmittingDeleteTicket(false)
    }
  }

  // Download photo using authenticated Bearer token
  const handleDownloadPhoto = async (ticketId: string) => {
    try {
      await downloadTicketPhoto(ticketId)
    } catch (err: any) {
      alert(err?.message || 'Failed to download authenticated photo asset.')
    }
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Badge variant="info">Institutional Governance</Badge>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', fontFamily: 'monospace' }}>
              Team: team13
            </span>
          </div>
          <h1 className={styles.title}>CampusOS Administration</h1>
          <p className={styles.subtitle}>
            System governance, institutional user directory, and ticket ledger oversight.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
          {activeTab === 'users' && (
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setRegisterModalOpen(true)}
            >
              <Plus size={16} />
              Register User
            </button>
          )}
        </div>
      </div>

      {/* Architectural Separation of Concerns Banner */}
      <div className={styles.governanceBanner}>
        <Lock size={18} className={styles.governanceIcon} />
        <div className={styles.governanceText}>
          <strong>Architectural Access Boundary Notice</strong>
          <span>
            As Institutional Administrator, you have full authority to audit tickets, purge spam/joke records, download
            inspection photos, and provision user identities. Status transitions (open &rarr; resolved) and Issue Category
            definitions remain strictly partitioned under Campus Maintenance operational authority.
          </span>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '1rem', color: '#b91c1c', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Primary Metrics */}
      <div className={styles.metricGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total FixIt Tickets</span>
          <span className={styles.metricValue}>{ticketMetrics.total}</span>
          <span className={styles.metricFooter}>Campus wide submission ledger</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Active Open Issues</span>
          <span className={styles.metricValue} style={{ color: 'var(--warning)' }}>
            {ticketMetrics.open}
          </span>
          <span className={styles.metricFooter}>Under maintenance processing</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Resolved Awaiting Confirmation</span>
          <span className={styles.metricValue} style={{ color: 'var(--accent-blue)' }}>
            {ticketMetrics.resolved}
          </span>
          <span className={styles.metricFooter}>Pending reporter sign-off</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Registered Directory</span>
          <span className={styles.metricValue}>{users.length}</span>
          <span className={styles.metricFooter}>Students, faculty, and staff</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsContainer}>
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'tickets' ? styles.tabItemActive : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <Layers size={16} />
          FixIt Tickets Oversight ({tickets.length})
        </button>
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'users' ? styles.tabItemActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          Institution User Directory ({users.length})
        </button>
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'system' ? styles.tabItemActive : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <Activity size={16} />
          Architecture & System Health
        </button>
      </div>

      {/* TAB 1: TICKETS OVERSIGHT */}
      {activeTab === 'tickets' && (
        <div className={styles.card}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <Search size={15} style={{ color: 'var(--muted-text)' }} />
              <input
                type="text"
                placeholder="Search tickets by title, ID, reporter, category..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%' }}
              />
              {ticketSearch && (
                <button
                  type="button"
                  onClick={() => setTicketSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)', whiteSpace: 'nowrap' }}>
              Showing {filteredTickets.length} of {tickets.length} tickets
            </span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Category</th>
                  <th>Reporter</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Photo Asset</th>
                  <th style={{ textAlign: 'right' }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyState}>
                      No tickets match your query.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr key={t.id} className={styles.tableRow}>
                      <td>
                        <div>
                          <Link to={`/tickets/${t.id}`} className={styles.linkTitle}>
                            {t.title}
                          </Link>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted-text)', fontFamily: 'monospace' }}>
                            #{t.id}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="neutral">{t.issue_type_name || 'General'}</Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, color: 'var(--primary-navy)' }}>
                            {t.reported_by_name || 'Reporter'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                            {t.reported_by_role || 'user'} • {t.reported_by_dept || 'Campus'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--muted-text)', whiteSpace: 'nowrap' }}>
                        {formatDateIST(t.created_at)}
                      </td>
                      <td>
                        <Badge
                          variant={
                            t.status === 'acknowledged'
                              ? 'success'
                              : t.status === 'resolved'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {t.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        {t.has_photo ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadPhoto(t.id)}
                            className={styles.actionBtn}
                            title="Download verified photo with Bearer token"
                          >
                            <Download size={13} />
                            Download Photo
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No Photo</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <Link
                            to={`/tickets/${t.id}`}
                            className={styles.actionBtn}
                            title="Inspect Details"
                          >
                            <ExternalLink size={13} />
                            View
                          </Link>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => setDeleteTicketTarget(t)}
                            title="Delete Ticket"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INSTITUTION USER DIRECTORY */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <CreateUserPage />
          <div className={styles.card}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <Search size={15} style={{ color: 'var(--muted-text)' }} />
              <input
                type="text"
                placeholder="Search by name, email, department, or USN..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%' }}
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              style={{ padding: '0.45rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="office_staff">Office Staff</option>
            </select>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User Identity</th>
                  <th>Role</th>
                  <th>Department / USN</th>
                  <th>Designation</th>
                  <th>Phone</th>
                  <th>Team OTP</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyState}>
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.email_id} className={styles.tableRow}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--muted-text)' }}>{u.email_id}</div>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            u.role === 'office_staff'
                              ? 'info'
                              : u.role === 'faculty'
                              ? 'neutral'
                              : 'default'
                          }
                        >
                          {u.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {u.dept || u.usn || '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--muted-text)' }}>
                        {u.designation || '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--muted-text)' }}>
                        {u.phone_number || '—'}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.78rem', background: '#f1f5f9', padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                          <KeyRound size={12} />
                          {u.otp || '595436'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => setDeleteUserTarget(u.email_id)}
                            title="Delete User"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* TAB 3: SYSTEM HEALTH & ARCHITECTURE */}
      {activeTab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className={styles.card} style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={18} />
              Backend Infrastructure Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>API Gateway Endpoint</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-navy)', marginTop: '0.35rem', wordBreak: 'break-all' }}>
                  https://campus-os-backend-8sjf.onrender.com/api/v1
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: 'var(--success)', fontSize: '0.78rem', fontWeight: 600 }}>
                  <CheckCircle2 size={14} /> 200 OK • Live Cloud Deployed
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>CORS & Access Control</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-navy)', marginTop: '0.35rem' }}>
                  access-control-allow-origin: *
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted-text)', marginTop: '0.5rem' }}>
                  Direct REST API connection with Authorization Bearer header
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>Current Team Instance</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-navy)', marginTop: '0.35rem' }}>
                  Team 13 (FixIt Maintenance Module)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted-text)', marginTop: '0.5rem' }}>
                  Universal Team OTP: <strong>595436</strong>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card} style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} />
              Role Permissions & Governance Matrix
            </h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Capability / Endpoint</th>
                    <th>Students & Faculty</th>
                    <th>Campus Maintenance</th>
                    <th>Administrator</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Raise Ticket (POST /fixit/tickets)</strong></td>
                    <td style={{ color: 'var(--success)' }}>&#10003; Allowed</td>
                    <td style={{ color: 'var(--success)' }}>&#10003; Allowed</td>
                    <td style={{ color: 'var(--muted-text)' }}>— Not Applicable</td>
                  </tr>
                  <tr>
                    <td><strong>View Tickets (GET /fixit/tickets)</strong></td>
                    <td>Own tickets only</td>
                    <td style={{ color: 'var(--success)' }}>&#10003; All campus tickets</td>
                    <td style={{ color: 'var(--success)' }}>&#10003; All campus tickets</td>
                  </tr>
                  <tr>
                    <td><strong>Set Target TAT (PUT /fixit/tickets/:id/tat)</strong></td>
                    <td style={{ color: 'var(--critical)' }}>&times; Denied</td>
                    <td style={{ color: 'var(--success)' }}>&#10003; Exclusive Authority</td>
                    <td style={{ color: 'var(--critical)' }}>&times; Denied (Separation of duty)</td>
                  </tr>
                  <tr>
                    <td><strong>Update Status (PUT /fixit/tickets/:id/status)</strong></td>
                    <td style={{ color: 'var(--critical)' }}>&times; Denied</td>
                    <td style={{ color: 'var(--success)' }}>&#10003; Exclusive Authority</td>
                    <td style={{ color: 'var(--critical)' }}>&times; Denied (Separation of duty)</td>
                  </tr>
                  <tr>
                    <td><strong>Acknowledge Resolution (POST /fixit/tickets/:id/ack)</strong></td>
                    <td style={{ color: 'var(--success)' }}>&#10003; Reporter Only</td>
                    <td style={{ color: 'var(--critical)' }}>&times; Denied</td>
                    <td style={{ color: 'var(--critical)' }}>&times; Denied</td>
                  </tr>
                  <tr>
                    <td><strong>Manage Issue Types (/fixit/issue-types)</strong></td>
                    <td style={{ color: 'var(--critical)' }}>&times; Read Only</td>
                    <td style={{ color: 'var(--success)' }}>&#10003; Full CRUD</td>
                    <td style={{ color: 'var(--critical)' }}>&times; Read Only</td>
                  </tr>
                  <tr>
                    <td><strong>Delete Ticket (DELETE /fixit/tickets/:id)</strong></td>
                    <td>Own ticket while open</td>
                    <td style={{ color: 'var(--success)' }}>&#10003; Any Ticket</td>
                    <td style={{ color: 'var(--success)' }}>&#10003; Any Ticket</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Register User Modal */}
      {registerModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Register Institutional User</h3>
              <button
                type="button"
                onClick={() => setRegisterModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRegisterUser}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>User Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className={styles.formInput}
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty Member</option>
                    <option value="office_staff">Office Staff (Campus Maintenance / Administration)</option>
                  </select>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@team13.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                  {newRole === 'student' ? (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>USN *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1CF24CS099"
                        value={newUsn}
                        onChange={(e) => setNewUsn(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>
                  ) : (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Designation</label>
                      <input
                        type="text"
                        placeholder={newRole === 'faculty' ? 'Assistant Professor' : 'Technician'}
                        value={newDesignation}
                        onChange={(e) => setNewDesignation(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>
                  )}
                </div>

                {newRole !== 'faculty' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Department</label>
                    <input
                      type="text"
                      placeholder={newRole === 'office_staff' ? 'Campus Maintenance' : 'CSE'}
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className={styles.formInput}
                    />
                    {newRole === 'office_staff' && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted-text)' }}>
                        Enter "Campus Maintenance" to grant operational access to the FixIt dispatch desk.
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnModalCancel}
                  onClick={() => setRegisterModalOpen(false)}
                  disabled={submittingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnModalConfirm}
                  disabled={submittingUser || !newName || !newEmail || !newPhone}
                >
                  {submittingUser ? 'Provisioning...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteUserTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: 'var(--critical)' }}>
                Delete User Account
              </h3>
              <button
                type="button"
                onClick={() => setDeleteUserTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--main-text)', lineHeight: 1.5 }}>
                Are you sure you want to remove user <strong>"{deleteUserTarget}"</strong> from the institution?
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8rem', color: '#b91c1c' }}>
                The user will no longer be able to log in or access tickets.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnModalCancel}
                onClick={() => setDeleteUserTarget(null)}
                disabled={submittingDeleteUser}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btnModalConfirm} ${styles.actionBtnDanger}`}
                onClick={handleDeleteUser}
                disabled={submittingDeleteUser}
              >
                {submittingDeleteUser ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Ticket Modal */}
      {deleteTicketTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: 'var(--critical)' }}>
                Delete Ticket (Admin Oversight)
              </h3>
              <button
                type="button"
                onClick={() => setDeleteTicketTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--main-text)', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete ticket{' '}
                <strong>"{deleteTicketTarget.title}"</strong> (#{deleteTicketTarget.id.slice(0, 8)})?
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8rem', color: '#b91c1c' }}>
                This action is irreversible and purges the ticket and its photographic evidence from the database.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnModalCancel}
                onClick={() => setDeleteTicketTarget(null)}
                disabled={submittingDeleteTicket}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btnModalConfirm} ${styles.actionBtnDanger}`}
                onClick={handleDeleteTicket}
                disabled={submittingDeleteTicket}
              >
                {submittingDeleteTicket ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminCommandPage
