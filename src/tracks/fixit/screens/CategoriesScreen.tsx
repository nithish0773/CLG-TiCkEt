import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  listIssueTypes,
  createIssueType,
  updateIssueType,
  deleteIssueType,
  listTickets,
  type IssueType,
  type Ticket,
  useAuth,
} from '@/core'
import { Button, Badge, Modal, EmptyState, Spinner } from '@/ui'
import { isFixitManager } from '../utils/roles'
import styles from './CategoriesScreen.module.css'

export function CategoriesScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [categories, setCategories] = useState<IssueType[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSubmitting, setCreateSubmitting] = useState(false)

  // Edit Modal
  const [editingCategory, setEditingCategory] = useState<IssueType | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Delete Modal
  const [deletingCategory, setDeletingCategory] = useState<IssueType | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    setError(null)
    try {
      const [cList, tList] = await Promise.all([listIssueTypes(), listTickets()])
      setCategories(cList)
      setTickets(tList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issue categories.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Create
  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)

    if (!createName.trim()) {
      setCreateError('Category name is required.')
      return
    }
    if (createName.trim().length < 3) {
      setCreateError('Category name must be at least 3 characters.')
      return
    }
    if (!createDesc.trim()) {
      setCreateError('Description is required.')
      return
    }
    if (createDesc.trim().length < 10) {
      setCreateError('Description must be at least 10 characters.')
      return
    }

    setCreateSubmitting(true)
    try {
      const created = await createIssueType({
        name: createName.trim(),
        description: createDesc.trim(),
      })
      setCategories((prev) => [...prev, created])
      setCreateOpen(false)
      setCreateName('')
      setCreateDesc('')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create category.')
    } finally {
      setCreateSubmitting(false)
    }
  }

  // Handle Open Edit
  function handleOpenEdit(cat: IssueType) {
    setEditingCategory(cat)
    setEditName(cat.name)
    setEditDesc(cat.description)
    setEditError(null)
  }

  // Handle Edit Submit
  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editingCategory) return
    setEditError(null)

    if (!editName.trim()) {
      setEditError('Category name is required.')
      return
    }
    if (!editDesc.trim()) {
      setEditError('Description is required.')
      return
    }

    setEditSubmitting(true)
    try {
      const updated = await updateIssueType(editingCategory.id, {
        name: editName.trim(),
        description: editDesc.trim(),
      })
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setEditingCategory(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update category.')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Handle Confirm Delete
  async function handleConfirmDelete() {
    if (!deletingCategory) return
    setDeleteSubmitting(true)
    try {
      await deleteIssueType(deletingCategory.id)
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id))
      setDeletingCategory(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category.')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const isManagerOrAdmin = isFixitManager(user)

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Issue Category Management</h1>
          <p className={styles.subheading}>
            Manage classifications for campus maintenance routing, technician dispatch, and SLA commitments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={loadCategories}>
            🔄 Refresh
          </Button>

          {isManagerOrAdmin && (
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              ➕ Create Category
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--red-100)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
          <Spinner label="Loading categories..." />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="No Issue Categories Registered"
          description="Create your first infrastructure issue classification to enable ticket reporting."
          action={
            isManagerOrAdmin ? (
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                Create Category
              </Button>
            ) : null
          }
        />
      ) : (
        <div className={styles.grid}>
          {categories.map((c) => {
            const ticketCount = tickets.filter(
              (t) => t.issue_type === c.name || t.issue_type_id === c.id,
            ).length

            return (
              <div key={c.id} className={styles.categoryCard}>
                <div className={styles.cardTop}>
                  <div className={styles.catIcon}>
                    {c.name.includes('Electrical')
                      ? '⚡'
                      : c.name.includes('HVAC')
                      ? '❄️'
                      : c.name.includes('Plumbing')
                      ? '💧'
                      : c.name.includes('Elevator')
                      ? '🛗'
                      : c.name.includes('Network')
                      ? '🌐'
                      : c.name.includes('Fire')
                      ? '🧯'
                      : '🏷️'}
                  </div>

                  <Badge tone="neutral" size="sm">
                    {ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}
                  </Badge>
                </div>

                <div>
                  <h2 className={styles.catName}>{c.name}</h2>
                  <p className={styles.catDesc}>{c.description}</p>
                </div>

                <div className={styles.cardFooter}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => navigate(`/tracks/fixit/tickets?category=${encodeURIComponent(c.name)}`)}
                  >
                    View Tickets →
                  </button>

                  {isManagerOrAdmin && (
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleOpenEdit(c)}
                        title="Edit category"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className={[styles.actionBtn, styles.actionBtnDanger].join(' ')}
                        onClick={() => setDeletingCategory(c)}
                        title="Delete category"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Issue Category"
        description="Add a new classification for campus infrastructure failure reporting."
      >
        <form onSubmit={handleCreateSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {createError && (
              <div style={{ padding: '6px 10px', background: 'var(--red-100)', color: 'var(--color-danger)', borderRadius: 4, fontSize: 12 }}>
                {createError}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Category Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chemical Storage Ventilation"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Description &amp; Scope <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                placeholder="Describe which equipment, rooms, and failure symptoms belong to this category..."
                style={{ width: '100%', minHeight: 90, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={createSubmitting}>
                Create Category
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* EDIT CATEGORY MODAL */}
      <Modal
        open={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        title={`Edit Category: ${editingCategory?.name}`}
        description="Update category name and classification scope."
      >
        <form onSubmit={handleEditSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {editError && (
              <div style={{ padding: '6px 10px', background: 'var(--red-100)', color: 'var(--color-danger)', borderRadius: 4, fontSize: 12 }}>
                {editError}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Category Name
              </label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Description
              </label>
              <textarea
                style={{ width: '100%', minHeight: 90, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={editSubmitting}>
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        open={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        title="Confirm Category Deletion"
        description="Permanent removal of category from campus maintenance registry."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            Are you sure you want to delete category <strong>{deletingCategory?.name}</strong>?
          </p>

          {tickets.some((t) => t.issue_type === deletingCategory?.name) && (
            <div style={{ padding: '8px 12px', background: 'var(--amber-100)', color: 'var(--amber-600)', borderRadius: 4, fontSize: 12 }}>
              ⚠️ Caution: Existing maintenance tickets currently reference this category.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDeletingCategory(null)}
              disabled={deleteSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              style={{ background: 'var(--color-danger)' }}
              onClick={handleConfirmDelete}
              loading={deleteSubmitting}
            >
              Delete Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

