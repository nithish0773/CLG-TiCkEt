import React, { useEffect, useState, useMemo } from 'react'
import {
  Sliders,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Layers,
  Info,
} from 'lucide-react'
import {
  listIssueTypes,
  createIssueType,
  updateIssueType,
  deleteIssueType,
  type IssueType,
} from '../../core/api/issueTypesApi'
import { listTickets, type TicketView } from '../../core/api/ticketsApi'
import { formatDateIST } from '../../core/utils/date'
import styles from './OperationsIssueTypesPage.module.css'

export const OperationsIssueTypesPage: React.FC = () => {
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([])
  const [tickets, setTickets] = useState<TicketView[]>([])
  const [_loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [submittingCreate, setSubmittingCreate] = useState(false)

  const [editType, setEditType] = useState<IssueType | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  const [deleteType, setDeleteType] = useState<IssueType | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [typesRes, ticketsRes] = await Promise.all([
        listIssueTypes(),
        listTickets({ limit: 100 }),
      ])
      setIssueTypes(typesRes)
      setTickets(ticketsRes)
    } catch (err: any) {
      setError(err?.message || 'Failed to load issue categories.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Map category ID/Name to ticket count
  const ticketCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    tickets.forEach((t) => {
      const idKey = t.issue_type_id || ''
      const nameKey = t.issue_type_name || ''
      if (idKey) counts[idKey] = (counts[idKey] || 0) + 1
      if (nameKey) counts[nameKey] = (counts[nameKey] || 0) + 1
    })
    return counts
  }, [tickets])

  // Handle Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newDescription.trim()) return
    setSubmittingCreate(true)
    try {
      const created = await createIssueType({
        name: newName.trim(),
        description: newDescription.trim(),
      })
      setIssueTypes((prev) => [...prev, created])
      setCreateModalOpen(false)
      setNewName('')
      setNewDescription('')
    } catch (err: any) {
      alert(err?.message || 'Failed to create issue category.')
    } finally {
      setSubmittingCreate(false)
    }
  }

  // Handle Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editType || !editName.trim() || !editDescription.trim()) return
    setSubmittingEdit(true)
    try {
      const updated = await updateIssueType(editType.id, {
        name: editName.trim(),
        description: editDescription.trim(),
      })
      setIssueTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setEditType(null)
      setEditName('')
      setEditDescription('')
    } catch (err: any) {
      alert(err?.message || 'Failed to update issue category.')
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Handle Delete
  const handleDeleteSubmit = async () => {
    if (!deleteType) return
    setSubmittingDelete(true)
    try {
      await deleteIssueType(deleteType.id)
      setIssueTypes((prev) => prev.filter((t) => t.id !== deleteType.id))
      setDeleteType(null)
    } catch (err: any) {
      alert(err?.message || 'Failed to delete issue category.')
    } finally {
      setSubmittingDelete(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Issue Category Master</h1>
          <p className={styles.subtitle}>
            Configure incident classifications used across the institution for routing and reporting.
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
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              setNewName('')
              setNewDescription('')
              setCreateModalOpen(true)
            }}
          >
            <Plus size={16} />
            Create Category
          </button>
        </div>
      </div>

      {/* Role permission info banner */}
      <div className={styles.calloutCard}>
        <Info size={18} className={styles.calloutIcon} />
        <div className={styles.calloutContent}>
          <strong>Campus Maintenance Operational Authority</strong>
          <span>
            Only verified Campus Maintenance staff hold authorization to add, modify, or deprecate issue categories.
            Reporters select from these categories when raising maintenance tickets to ensure proper triage.
          </span>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '1rem', color: '#b91c1c', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Categories Table */}
      <div className={styles.card}>
        {issueTypes.length === 0 ? (
          <div className={styles.emptyState}>
            <Sliders size={36} style={{ color: 'var(--muted-text)', marginBottom: '0.5rem', opacity: 0.6 }} />
            <div>No issue categories defined. Click "Create Category" above to initialize your taxonomy.</div>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Classification & Triage Scope</th>
                  <th>Active Linked Tickets</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issueTypes.map((type) => {
                  const linkedCount = ticketCounts[type.id] || ticketCounts[type.name] || 0

                  return (
                    <tr key={type.id} className={styles.tableRow}>
                      <td>
                        <span className={styles.categoryName}>{type.name}</span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted-text)', fontFamily: 'monospace' }}>
                          ID: {type.id.slice(0, 8)}
                        </div>
                      </td>
                      <td>
                        <div className={styles.categoryDesc}>{type.description}</div>
                      </td>
                      <td>
                        <span className={styles.ticketCountBadge}>
                          <Layers size={12} />
                          {linkedCount} ticket{linkedCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--muted-text)', whiteSpace: 'nowrap' }}>
                        {type.created_at ? formatDateIST(type.created_at) : 'Institutional Standard'}
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            className={styles.btnAction}
                            onClick={() => {
                              setEditType(type)
                              setEditName(type.name)
                              setEditDescription(type.description)
                            }}
                            title="Edit Category"
                          >
                            <Edit2 size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`${styles.btnAction} ${styles.btnActionDanger}`}
                            onClick={() => setDeleteType(type)}
                            title="Delete Category"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      {createModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New Issue Category</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electrical Failures"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description & Scope *</label>
                  <textarea
                    required
                    placeholder="e.g. Broken light fixtures, power outlets, circuit breaker trips, and switchboard faults."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className={styles.formTextarea}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnModalCancel}
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submittingCreate}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnModalConfirm}
                  disabled={submittingCreate || !newName.trim() || !newDescription.trim()}
                >
                  {submittingCreate ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editType && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Issue Category</h3>
              <button
                type="button"
                onClick={() => setEditType(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description & Scope *</label>
                  <textarea
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={styles.formTextarea}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnModalCancel}
                  onClick={() => setEditType(null)}
                  disabled={submittingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnModalConfirm}
                  disabled={submittingEdit || !editName.trim() || !editDescription.trim()}
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {deleteType && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: 'var(--critical)' }}>
                Delete Issue Category
              </h3>
              <button
                type="button"
                onClick={() => setDeleteType(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--main-text)', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete the category <strong>"{deleteType.name}"</strong>?
              </p>
              {(ticketCounts[deleteType.id] || ticketCounts[deleteType.name] || 0) > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8rem', color: '#b91c1c' }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: '-2px' }} />
                  Warning: There are {ticketCounts[deleteType.id] || ticketCounts[deleteType.name]} tickets currently linked to this category.
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnModalCancel}
                onClick={() => setDeleteType(null)}
                disabled={submittingDelete}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${styles.btnModalConfirm} ${styles.btnModalDanger}`}
                onClick={handleDeleteSubmit}
                disabled={submittingDelete}
              >
                {submittingDelete ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default OperationsIssueTypesPage
