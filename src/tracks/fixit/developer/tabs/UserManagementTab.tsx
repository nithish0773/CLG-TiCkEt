import { useEffect, useState, useMemo } from 'react'
import {
  getDeveloperUsers,
  updateDeveloperUser,
  deleteDeveloperUser,
  createDeveloperUser,
  type DeveloperUser,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface UserManagementTabProps {
  onNotify: (msg: string) => void
}

export function UserManagementTab({ onNotify }: UserManagementTabProps) {
  const [users, setUsers] = useState<DeveloperUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals
  const [editingUser, setEditingUser] = useState<DeveloperUser | null>(null)
  const [viewingUser, setViewingUser] = useState<DeveloperUser | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<DeveloperUser | null>(null)

  // New user form state
  const [newUser, setNewUser] = useState<Partial<DeveloperUser>>({
    name: '',
    email_id: '',
    role: 'student',
    dept: 'Computer Science',
    phone_number: '9876543210',
    otp: '123456',
    status: 'active',
  })

  async function loadUsers() {
    try {
      setLoading(true)
      const res = await getDeveloperUsers()
      setUsers(res.items || [])
    } catch (err: any) {
      onNotify(`Error loading users: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    getDeveloperUsers()
      .then((res) => {
        if (mounted) {
          setUsers(res.items || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoading(false)
          onNotify(`Error loading users: ${err.message}`)
        }
      })
    return () => {
      mounted = false
    }
  }, [onNotify])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email_id.toLowerCase().includes(search.toLowerCase()) ||
        (u.dept && u.dept.toLowerCase().includes(search.toLowerCase()))
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  async function handleToggleStatus(user: DeveloperUser) {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended'
    try {
      await updateDeveloperUser(user.email_id, { status: nextStatus })
      onNotify(`User ${user.name} marked as ${nextStatus}`)
      loadUsers()
    } catch (err: any) {
      onNotify(`Failed to update user status: ${err.message}`)
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    try {
      await updateDeveloperUser(editingUser.email_id, {
        name: editingUser.name,
        role: editingUser.role,
        dept: editingUser.dept,
        phone_number: editingUser.phone_number,
        status: editingUser.status,
      })
      onNotify(`User ${editingUser.name} updated successfully`)
      setEditingUser(null)
      loadUsers()
    } catch (err: any) {
      onNotify(`Failed to save user: ${err.message}`)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newUser.name || !newUser.email_id) {
      onNotify('Name and Email are required')
      return
    }
    try {
      await createDeveloperUser(newUser)
      onNotify(`User ${newUser.name} created with OTP ${newUser.otp}`)
      setIsAddOpen(false)
      setNewUser({
        name: '',
        email_id: '',
        role: 'student',
        dept: 'Computer Science',
        phone_number: '9876543210',
        otp: '123456',
        status: 'active',
      })
      loadUsers()
    } catch (err: any) {
      onNotify(`Failed to create user: ${err.message}`)
    }
  }

  async function handleDeleteUser() {
    if (!deleteConfirm) return
    try {
      await deleteDeveloperUser(deleteConfirm.email_id)
      onNotify(`User ${deleteConfirm.name} removed`)
      setDeleteConfirm(null)
      loadUsers()
    } catch (err: any) {
      onNotify(`Failed to remove user: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Identity & Access Control (User Directory)</h2>
            <div className={styles.cardSubtitle}>
              Strict role-based authorization, account provisioning, and credential governance
            </div>
          </div>
          <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => setIsAddOpen(true)}>
            + Provision User
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '320px' }}
          />

          <select
            className={styles.input}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ maxWidth: '160px' }}
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="office_staff">Problem Solver (Staff)</option>
            <option value="campus_manager">Campus Manager</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Developer / Admin</option>
          </select>

          <select
            className={styles.input}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ maxWidth: '160px' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>

          <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Showing <strong>{filteredUsers.length}</strong> of {users.length} accounts
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Account Details</th>
              <th>System Role</th>
              <th>Department / Group</th>
              <th>Status</th>
              <th>Security OTP</th>
              <th>Performance / Activity</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                  Loading secure user directory...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                  No accounts matching search criteria found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isActive = (u.status || 'active') === 'active'
                const isSuspended = u.status === 'suspended'
                return (
                  <tr key={u.email_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'var(--color-primary-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                              {u.name ? u.name[0].toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{u.email_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background:
                            u.role === 'admin'
                              ? 'rgba(139, 92, 246, 0.15)'
                              : u.role === 'office_staff' || u.role === 'campus_manager'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(37, 99, 235, 0.12)',
                          color:
                            u.role === 'admin'
                              ? '#8B5CF6'
                              : u.role === 'office_staff' || u.role === 'campus_manager'
                              ? '#10B981'
                              : 'var(--color-primary)',
                        }}
                      >
                        {u.role === 'office_staff' ? 'Problem Solver' : u.role}
                      </span>
                    </td>
                    <td>{u.dept || u.designation || 'General'}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: isActive ? '#10B981' : isSuspended ? '#EF4444' : 'var(--color-text-muted)',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isActive ? '#10B981' : isSuspended ? '#EF4444' : 'var(--color-text-muted)',
                          }}
                        />
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--color-surface-muted)', borderRadius: '4px' }}>
                        {u.otp || '123456'}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {u.role === 'office_staff' ? (
                          <span>
                            {u.completed_count || 0} Solved · {u.rating || 5}★
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never logged in'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className={styles.actionBtn}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => setViewingUser(u)}
                        >
                          View
                        </button>
                        <button
                          className={styles.actionBtn}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => setEditingUser({ ...u })}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.actionBtn}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            color: isSuspended ? '#10B981' : '#EF4444',
                          }}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {isSuspended ? 'Restore' : 'Suspend'}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => setDeleteConfirm(u)}
                          >
                            Del
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Provision New System Account</h3>
              <button
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                onClick={() => setIsAddOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className={styles.formGrid}>
                <div>
                  <label className={styles.label}>Full Legal / Institutional Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser((v) => ({ ...v, name: e.target.value }))}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div>
                  <label className={styles.label}>Institutional Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    required
                    value={newUser.email_id}
                    onChange={(e) => setNewUser((v) => ({ ...v, email_id: e.target.value }))}
                    placeholder="e.g. ramesh@team13.com"
                  />
                </div>
                <div>
                  <label className={styles.label}>System Access Role</label>
                  <select
                    className={styles.input}
                    value={newUser.role}
                    onChange={(e) => setNewUser((v) => ({ ...v, role: e.target.value as any }))}
                  >
                    <option value="student">Student</option>
                    <option value="office_staff">Problem Solver (Staff)</option>
                    <option value="campus_manager">Campus Manager</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Developer / Admin</option>
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Department</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={newUser.dept}
                    onChange={(e) => setNewUser((v) => ({ ...v, dept: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    className={styles.input}
                    value={newUser.phone_number}
                    onChange={(e) => setNewUser((v) => ({ ...v, phone_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={styles.label}>Secure Login OTP</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={newUser.otp}
                    onChange={(e) => setNewUser((v) => ({ ...v, otp: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
                  Save & Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Edit Profile & Privileges: {editingUser.name}</h3>
              <button
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                onClick={() => setEditingUser(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className={styles.formGrid}>
                <div>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editingUser.name}
                    onChange={(e) => setEditingUser((u) => u && { ...u, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.label}>Email (Locked ID)</label>
                  <input type="text" className={styles.input} disabled value={editingUser.email_id} />
                </div>
                <div>
                  <label className={styles.label}>Assigned Role</label>
                  <select
                    className={styles.input}
                    value={editingUser.role}
                    onChange={(e) => setEditingUser((u) => u && { ...u, role: e.target.value as any })}
                  >
                    <option value="student">Student</option>
                    <option value="office_staff">Problem Solver</option>
                    <option value="campus_manager">Campus Manager</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Developer / Admin</option>
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Department</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editingUser.dept || ''}
                    onChange={(e) => setEditingUser((u) => u && { ...u, dept: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.label}>Account State</label>
                  <select
                    className={styles.input}
                    value={editingUser.status || 'active'}
                    onChange={(e) => setEditingUser((u) => u && { ...u, status: e.target.value as any })}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editingUser.phone_number || ''}
                    onChange={(e) => setEditingUser((u) => u && { ...u, phone_number: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>User Dossier & Audit</h3>
              <button
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                onClick={() => setViewingUser(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                  }}
                >
                  {viewingUser.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{viewingUser.name}</h3>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{viewingUser.email_id}</div>
                  <div style={{ marginTop: '4px' }}>
                    <span className={styles.glowBadge}>{viewingUser.role.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--color-surface-muted)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Department</div>
                  <div style={{ fontWeight: 600 }}>{viewingUser.dept || 'None'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Contact Phone</div>
                  <div style={{ fontWeight: 600 }}>{viewingUser.phone_number || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Account Status</div>
                  <div style={{ fontWeight: 600, color: viewingUser.status === 'suspended' ? '#EF4444' : '#10B981' }}>
                    {viewingUser.status || 'active'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>OTP Code</div>
                  <div style={{ fontWeight: 600 }}>{viewingUser.otp || '123456'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button className={styles.actionBtn} onClick={() => setViewingUser(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '440px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#EF4444' }}>Revoke Account Permanently?</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 20px 0' }}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email_id})? This action will revoke their session tokens and historical logs immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className={styles.actionBtn} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={handleDeleteUser}>
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
