import { useState, useEffect, useMemo, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  listTickets,
  listIssueTypes,
  updateTicket,
  deleteTicket,
  type Ticket,
  type IssueType,
  useAuth,
} from '@/core'
import { Button, Badge, Modal, EmptyState, Spinner } from '@/ui'
import { isFixitManager } from '../utils/roles'
import styles from './AllTicketsScreen.module.css'

const CAMPUS_BUILDINGS = [
  'All Buildings',
  'Aryabhata Engineering Block',
  'Visvesvaraya Central Lab',
  'Ramanujan Science Tower',
  'Kalam Innovation Hub',
  'Main Administrative Block',
  'Campus Central Library',
  'Student Activities Center',
  'Campus Hostel Complex - Block A',
  'Campus Hostel Complex - Block B',
  'Sports & Recreation Arena',
]

export function AllTicketsScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [categories, setCategories] = useState<IssueType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all')
  const [buildingFilter, setBuildingFilter] = useState(searchParams.get('building') || 'all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'tat' | 'status'>('newest')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Edit modal state
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editBuilding, setEditBuilding] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Delete modal state
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [tList, cList] = await Promise.all([listTickets(), listIssueTypes()])
      setTickets(tList)
      setCategories(cList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to retrieve maintenance tickets.')
    } finally {
      setLoading(false)
    }
  }

  // Update URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {}
    if (searchQuery) params.search = searchQuery
    if (statusFilter !== 'all') params.status = statusFilter
    if (categoryFilter !== 'all') params.category = categoryFilter
    if (buildingFilter !== 'all') params.building = buildingFilter
    setSearchParams(params, { replace: true })
  }, [searchQuery, statusFilter, categoryFilter, buildingFilter, setSearchParams])

  // Filtered & Sorted Tickets
  const filteredTickets = useMemo(() => {
    let result = [...tickets]

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.building?.toLowerCase().includes(q) ||
          t.reporter?.name?.toLowerCase().includes(q) ||
          t.reporter?.email?.toLowerCase().includes(q),
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.issue_type === categoryFilter || t.issue_type_id === categoryFilter)
    }

    // Building filter
    if (buildingFilter !== 'all' && buildingFilter !== 'All Buildings') {
      result = result.filter((t) => t.building === buildingFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = Date.now()
      if (dateFilter === 'today') {
        const oneDayAgo = now - 24 * 60 * 60 * 1000
        result = result.filter((t) => new Date(t.created_at).getTime() >= oneDayAgo)
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
        result = result.filter((t) => new Date(t.created_at).getTime() >= sevenDaysAgo)
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
        result = result.filter((t) => new Date(t.created_at).getTime() >= thirtyDaysAgo)
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortBy === 'tat') {
        const dateA = a.expected_completion_date ? new Date(a.expected_completion_date).getTime() : Infinity
        const dateB = b.expected_completion_date ? new Date(b.expected_completion_date).getTime() : Infinity
        return dateA - dateB
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status)
      }
      return 0
    })

    return result
  }, [tickets, searchQuery, statusFilter, categoryFilter, buildingFilter, dateFilter, sortBy])

  // Pagination calculation
  const totalItems = filteredTickets.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTickets.slice(start, start + pageSize)
  }, [filteredTickets, currentPage, pageSize])

  // Clear filters
  function clearAllFilters() {
    setSearchQuery('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setBuildingFilter('all')
    setDateFilter('all')
    setSortBy('newest')
    setCurrentPage(1)
  }

  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    (buildingFilter !== 'all' && buildingFilter !== 'All Buildings') ||
    dateFilter !== 'all'

  // Open Edit Modal
  function handleOpenEdit(ticket: Ticket) {
    setEditingTicket(ticket)
    setEditTitle(ticket.title)
    setEditDescription(ticket.description)
    setEditCategory(ticket.issue_type)
    setEditBuilding(ticket.building || '')
    setEditLocation(ticket.location || '')
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingTicket) return
    setEditSubmitting(true)
    try {
      const updated = await updateTicket(editingTicket.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        issue_type: editCategory,
        building: editBuilding,
        location: editLocation.trim(),
      })
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setEditingTicket(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update ticket.')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Open Delete Modal
  function handleOpenDelete(ticket: Ticket) {
    setDeletingTicket(ticket)
  }

  async function handleConfirmDelete() {
    if (!deletingTicket) return
    setDeleteSubmitting(true)
    try {
      await deleteTicket(deletingTicket.id)
      setTickets((prev) => prev.filter((t) => t.id !== deletingTicket.id))
      setDeletingTicket(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete ticket.')
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
          <h1 className={styles.heading}>Infrastructure Tickets Management</h1>
          <p className={styles.subheading}>
            Comprehensive log of all campus maintenance incidents, repair tickets, and completion statuses.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={loadData}>
            🔄 Refresh
          </Button>
          <Button variant="primary" onClick={() => navigate('/tracks/fixit/raise')}>
            ➕ Raise Issue
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--red-100)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          {/* Search Input */}
          <div className={styles.searchInputWrapper}>
            <span className={styles.searchIcon} aria-hidden="true">🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by ID, title, description, reporter, building..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            aria-label="Filter by Status"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="acknowledged">Acknowledged</option>
          </select>

          {/* Category Filter */}
          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            aria-label="Filter by Category"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Building Filter */}
          <select
            className={styles.filterSelect}
            value={buildingFilter}
            onChange={(e) => {
              setBuildingFilter(e.target.value)
              setCurrentPage(1)
            }}
            aria-label="Filter by Facility"
          >
            {CAMPUS_BUILDINGS.map((b) => (
              <option key={b} value={b === 'All Buildings' ? 'all' : b}>
                {b}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            className={styles.filterSelect}
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value)
              setCurrentPage(1)
            }}
            aria-label="Filter by Date Created"
          >
            <option value="all">Any Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>

          {/* Sorting */}
          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort tickets"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="tat">Target TAT Date</option>
            <option value="status">Status</option>
          </select>
        </div>

        {/* Active Filters Summary & Reset */}
        {hasActiveFilters && (
          <div className={styles.activeFiltersRow}>
            <span>Showing {filteredTickets.length} of {tickets.length} tickets</span>
            <span>•</span>
            <button type="button" className={styles.clearFiltersBtn} onClick={clearAllFilters}>
              Reset all filters ✕
            </button>
          </div>
        )}
      </div>

      {/* Ticket Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
            <Spinner label="Loading ticket registry..." />
          </div>
        ) : paginatedTickets.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No tickets match your filters"
            description="Try modifying search keywords, resetting your status/category filter, or create a new issue report."
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => navigate('/tracks/fixit/raise')}>
                  Raise an Issue
                </Button>
              )
            }
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Ticket ID</th>
                  <th className={styles.th}>Title &amp; Facility</th>
                  <th className={styles.th}>Category</th>
                  <th className={styles.th}>Reporter</th>
                  <th className={styles.th}>Created Date</th>
                  <th className={styles.th}>Target TAT</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTickets.map((t) => {
                  const createdStr = new Date(t.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                  const tatStr = t.expected_completion_date
                    ? new Date(t.expected_completion_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not assigned'

                  return (
                    <tr key={t.id} className={styles.tr}>
                      {/* ID */}
                      <td className={styles.td}>
                        <span
                          className={styles.ticketIdCell}
                          onClick={() => navigate(`/tracks/fixit/tickets/${t.id}`)}
                        >
                          {t.id}
                        </span>
                      </td>

                      {/* Title & Facility */}
                      <td className={styles.td} style={{ maxWidth: 260 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {t.building} {t.location ? `• ${t.location}` : ''}
                        </div>
                      </td>

                      {/* Category */}
                      <td className={styles.td}>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{t.issue_type}</span>
                      </td>

                      {/* Reporter */}
                      <td className={styles.td}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{t.reporter?.name || 'Unknown'}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                          {t.reporter?.role ? t.reporter.role.toUpperCase() : ''}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className={styles.td} style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {createdStr}
                      </td>

                      {/* Target TAT */}
                      <td className={styles.td} style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        <span style={{ color: t.is_overdue ? 'var(--color-danger)' : 'var(--color-text)' }}>
                          {tatStr}
                        </span>
                        {t.is_overdue && (
                          <div style={{ fontSize: 10, color: 'var(--color-danger)', fontWeight: 'bold' }}>
                            ⚠️ OVERDUE
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className={styles.td}>
                        <Badge
                          size="sm"
                          tone={
                            t.status === 'resolved'
                              ? 'success'
                              : t.status === 'acknowledged'
                              ? 'primary'
                              : 'warning'
                          }
                        >
                          {t.status.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => navigate(`/tracks/fixit/tickets/${t.id}`)}
                            title="Inspect full ticket details"
                          >
                            View
                          </button>

                          {(isManagerOrAdmin || user?.email === t.reporter?.email) && (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => handleOpenEdit(t)}
                              title="Edit ticket"
                            >
                              Edit
                            </button>
                          )}

                          {isManagerOrAdmin && (
                            <button
                              type="button"
                              className={[styles.actionBtn, styles.actionBtnDanger].join(' ')}
                              onClick={() => handleOpenDelete(t)}
                              title="Delete ticket"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className={styles.paginationBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>
              Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
            </span>
            <select
              style={{ padding: '3px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: 12 }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              aria-label="Rows per page"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>

          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
            >
              ← Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
              if (
                totalPages > 6 &&
                Math.abs(pg - currentPage) > 2 &&
                pg !== 1 &&
                pg !== totalPages
              ) {
                return null
              }
              return (
                <button
                  key={pg}
                  type="button"
                  className={[styles.pageBtn, currentPage === pg && styles.pageBtnActive].filter(Boolean).join(' ')}
                  onClick={() => setCurrentPage(pg)}
                >
                  {pg}
                </button>
              )
            })}

            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* EDIT TICKET MODAL */}
      <Modal
        open={Boolean(editingTicket)}
        onClose={() => setEditingTicket(null)}
        title={`Edit Ticket ${editingTicket?.id}`}
        description="Update maintenance ticket properties and location information."
      >
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Title</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Issue Category</label>
              <select
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)' }}
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Facility / Building</label>
              <select
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)' }}
                value={editBuilding}
                onChange={(e) => setEditBuilding(e.target.value)}
              >
                {CAMPUS_BUILDINGS.filter((b) => b !== 'All Buildings').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Specific Room / Location</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
              <textarea
                style={{ width: '100%', minHeight: 90, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditingTicket(null)}>
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
        open={Boolean(deletingTicket)}
        onClose={() => setDeletingTicket(null)}
        title="Confirm Ticket Deletion"
        description="This action will permanently delete the maintenance ticket and all inspection evidence."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            Are you sure you want to permanently delete ticket{' '}
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{deletingTicket?.id}</strong> (&ldquo;{deletingTicket?.title}&rdquo;)?
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDeletingTicket(null)}
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
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

