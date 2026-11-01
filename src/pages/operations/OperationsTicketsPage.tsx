import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router'
import {
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Trash2,
  X,
  LayoutGrid,
  Table as TableIcon,
  MessageSquare,
  RotateCcw,
  Download,
  Edit3,
  Eye,
  Plus,
  Layers,
} from 'lucide-react'
import {
  listTickets,
  updateTicketTat,
  updateTicketStatus,
  updateTicket,
  deleteTicket,
  downloadTicketPhoto,
  getTicketPhotoUrl,
  type TicketView,
} from '../../core/api/ticketsApi'
import {
  listIssueTypes,
  createIssueType,
  updateIssueType,
  deleteIssueType,
  type IssueType,
} from '../../core/api/issueTypesApi'
import { formatRelativeIST, formatDateIST } from '../../core/utils/date'
import { validateImageFile, sanitizeTextInput, isSafeUrl, sanitizeErrorMessage } from '../../core/utils'
import { Badge } from '../../ui/Badge'
import styles from './OperationsTicketsPage.module.css'

type TabKey = 'all' | 'open' | 'needs_tat' | 'in_progress' | 'resolved' | 'acknowledged' | 'overdue' | 'categories'

export const OperationsTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<TicketView[]>([])
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([])
  const [_loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  // Filters & display
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'tat'>('newest')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Category Manager within Maintenance Panel
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [editCategoryTarget, setEditCategoryTarget] = useState<IssueType | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryDesc, setEditCategoryDesc] = useState('')
  const [submittingEditCategory, setSubmittingEditCategory] = useState(false)

  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<IssueType | null>(null)
  const [submittingDeleteCategory, setSubmittingDeleteCategory] = useState(false)

  // Set TAT modal
  const [tatModalTicket, setTatModalTicket] = useState<TicketView | null>(null)
  const [tatDate, setTatDate] = useState('')
  const [tatNote, setTatNote] = useState('')
  const [submittingTat, setSubmittingTat] = useState(false)

  // Status / Progress modal
  const [statusModalTicket, setStatusModalTicket] = useState<{
    ticket: TicketView
    targetStatus: 'open' | 'resolved'
    isProgressUpdate?: boolean
  } | null>(null)
  const [statusNote, setStatusNote] = useState('')
  const [submittingStatus, setSubmittingStatus] = useState(false)

  // Delete modal
  const [deleteModalTicket, setDeleteModalTicket] = useState<TicketView | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  // High-Resolution Photo Viewer Modal
  const [viewingPhotoTicket, setViewingPhotoTicket] = useState<TicketView | null>(null)

  // Modify Ticket Modal
  const [modifyModalTicket, setModifyModalTicket] = useState<TicketView | null>(null)
  const [modifyTitle, setModifyTitle] = useState('')
  const [modifyCategoryId, setModifyCategoryId] = useState('')
  const [modifyIsOther, setModifyIsOther] = useState(false)
  const [modifyManualCategory, setModifyManualCategory] = useState('')
  const [modifyDescription, setModifyDescription] = useState('')
  const [modifyPhotoFile, setModifyPhotoFile] = useState<File | null>(null)
  const [modifyRemovePhoto, setModifyRemovePhoto] = useState(false)
  const [submittingModify, setSubmittingModify] = useState(false)
  const [modifyError, setModifyError] = useState<string | null>(null)

  // Quick-Add Manual Category Modal
  const [manualCategoryModalOpen, setManualCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [submittingCategory, setSubmittingCategory] = useState(false)

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [ticketsRes, typesRes] = await Promise.all([
        listTickets({ limit: 100 }),
        listIssueTypes(),
      ])
      setTickets(ticketsRes)
      setIssueTypes(typesRes)
    } catch (err: any) {
      setError(err?.message || 'Failed to load tickets ledger.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-clear success banner after 4 seconds
  useEffect(() => {
    if (!successBanner) return
    const timer = setTimeout(() => setSuccessBanner(null), 4000)
    return () => clearTimeout(timer)
  }, [successBanner])

  // Tab counts
  const tabCounts = useMemo(() => {
    const now = Date.now()
    const counts = {
      all: tickets.length,
      open: 0,
      needs_tat: 0,
      in_progress: 0,
      resolved: 0,
      acknowledged: 0,
      overdue: 0,
      categories: issueTypes.length,
    }

    tickets.forEach((t) => {
      if (t.status === 'open') {
        counts.open++
        if (!t.tat?.estimated_completion_at) counts.needs_tat++
        if (t.update?.note) counts.in_progress++
        if (t.tat?.estimated_completion_at && new Date(t.tat.estimated_completion_at).getTime() < now) {
          counts.overdue++
        }
      } else if (t.status === 'resolved') {
        counts.resolved++
      } else if (t.status === 'acknowledged') {
        counts.acknowledged++
      }
    })

    return counts
  }, [tickets, issueTypes])

  // Category ticket statistics for Maintenance Panel
  const categoryTicketStats = useMemo(() => {
    const stats: Record<string, { total: number; open: number }> = {}
    tickets.forEach((t) => {
      const typeId = t.issue_type_id || t.issue_type_name || 'unknown'
      if (!stats[typeId]) stats[typeId] = { total: 0, open: 0 }
      stats[typeId].total++
      if (t.status === 'open') stats[typeId].open++

      if (t.issue_type_name) {
        if (!stats[t.issue_type_name]) stats[t.issue_type_name] = { total: 0, open: 0 }
        stats[t.issue_type_name].total++
        if (t.status === 'open') stats[t.issue_type_name].open++
      }
    })
    return stats
  }, [tickets])

  // Filtered categories for search
  const filteredCategories = useMemo(() => {
    const q = categorySearchQuery.toLowerCase().trim()
    if (!q) return issueTypes
    return issueTypes.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        (it.description || '').toLowerCase().includes(q) ||
        (it.id || '').toLowerCase().includes(q),
    )
  }, [issueTypes, categorySearchQuery])

  // Filtered and sorted tickets
  const filteredTickets = useMemo(() => {
    const now = Date.now()
    const q = searchQuery.toLowerCase().trim()

    return tickets
      .filter((t) => {
        // Tab filter
        if (activeTab === 'open' && t.status !== 'open') return false
        if (activeTab === 'resolved' && t.status !== 'resolved') return false
        if (activeTab === 'acknowledged' && t.status !== 'acknowledged') return false
        if (activeTab === 'needs_tat' && (t.status !== 'open' || t.tat?.estimated_completion_at)) return false
        if (activeTab === 'in_progress' && (t.status !== 'open' || !t.update?.note)) return false
        if (activeTab === 'overdue') {
          if (t.status !== 'open') return false
          if (!t.tat?.estimated_completion_at) return false
          if (new Date(t.tat.estimated_completion_at).getTime() >= now) return false
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (t.issue_type_id !== selectedCategory && t.issue_type_name !== selectedCategory) {
            return false
          }
        }

        // Search query
        if (q) {
          const matchTitle = t.title.toLowerCase().includes(q)
          const matchId = t.id.toLowerCase().includes(q)
          const matchReporter =
            (t.reported_by_name || '').toLowerCase().includes(q) ||
            (t.reported_by || '').toLowerCase().includes(q)
          const matchDesc = t.description.toLowerCase().includes(q)
          if (!matchTitle && !matchId && !matchReporter && !matchDesc) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        if (sortBy === 'tat') {
          const aTat = a.tat?.estimated_completion_at
            ? new Date(a.tat.estimated_completion_at).getTime()
            : Infinity
          const bTat = b.tat?.estimated_completion_at
            ? new Date(b.tat.estimated_completion_at).getTime()
            : Infinity
          return aTat - bTat
        }
        return 0
      })
  }, [tickets, activeTab, selectedCategory, searchQuery, sortBy])

  // Handle Photo Download directly
  const handleDownloadPhoto = async (t: TicketView) => {
    try {
      await downloadTicketPhoto(t.id, `${t.id}-evidence.jpg`)
    } catch (err: any) {
      alert(err?.message || 'Failed to download evidence image.')
    }
  }

  // Open Modify Modal
  const openModifyModal = (t: TicketView) => {
    setModifyModalTicket(t)
    setModifyTitle(t.title)
    setModifyCategoryId(t.issue_type_id || '')
    const isOther =
      (t.issue_type_name || '').toLowerCase().includes('other') ||
      t.issue_type_id === 'it-8' ||
      t.issue_type_id === 'other'
    setModifyIsOther(isOther)
    setModifyManualCategory('')
    setModifyDescription(t.description)
    setModifyPhotoFile(null)
    setModifyRemovePhoto(false)
    setModifyError(null)
  }

  // Handle Modify Submit
  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modifyModalTicket) return
    const cleanTitle = sanitizeTextInput(modifyTitle, 120)
    let cleanDesc = sanitizeTextInput(modifyDescription, 2000)
    const cleanManual = sanitizeTextInput(modifyManualCategory, 100)

    if (cleanTitle.length < 3 || cleanTitle.length > 120) {
      setModifyError('Title must be between 3 and 120 characters.')
      return
    }
    if (cleanDesc.length < 5 || cleanDesc.length > 2000) {
      setModifyError('Description must be between 5 and 2000 characters.')
      return
    }

    if (modifyIsOther && cleanManual) {
      cleanDesc = `[Manual Category: ${cleanManual}]\n\n${cleanDesc}`
    }

    setSubmittingModify(true)
    setModifyError(null)

    try {
      const resolvedIssueTypeId =
        modifyCategoryId === 'other'
          ? issueTypes.find((it) => it.name.toLowerCase().includes('other'))?.id || 'it-8'
          : modifyCategoryId

      const updated = await updateTicket(modifyModalTicket.id, {
        title: cleanTitle,
        description: cleanDesc,
        issue_type_id: resolvedIssueTypeId || undefined,
        photo: modifyPhotoFile || undefined,
        remove_photo: modifyRemovePhoto,
      })

      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setModifyModalTicket(null)
      setSuccessBanner(`Work order #${updated.id} specifications modified successfully!`)
    } catch (err: unknown) {
      setModifyError(sanitizeErrorMessage(err, 'Failed to modify ticket specifications.'))
    } finally {
      setSubmittingModify(false)
    }
  }

  // Handle Create Quick Manual Category
  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = sanitizeTextInput(newCategoryName, 100)
    const cleanDesc = sanitizeTextInput(newCategoryDesc, 500)
    if (!cleanName) return
    setSubmittingCategory(true)
    try {
      const created = await createIssueType({
        name: cleanName,
        description: cleanDesc || 'Manual custom facilities issue category',
      })
      setIssueTypes((prev) => [...prev, created])
      setManualCategoryModalOpen(false)
      setNewCategoryName('')
      setNewCategoryDesc('')
      setSuccessBanner(`Issue Category '${created.name}' created and added to master list!`)
    } catch (err: unknown) {
      alert(sanitizeErrorMessage(err, 'Failed to create manual category.'))
    } finally {
      setSubmittingCategory(false)
    }
  }

  // Open Edit Category Modal
  const openEditCategory = (it: IssueType) => {
    setEditCategoryTarget(it)
    setEditCategoryName(it.name)
    setEditCategoryDesc(it.description || '')
  }

  // Handle Edit Category Submit
  const handleEditCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCategoryTarget) return
    const cleanName = sanitizeTextInput(editCategoryName, 100)
    const cleanDesc = sanitizeTextInput(editCategoryDesc, 500)
    if (!cleanName) return
    setSubmittingEditCategory(true)
    try {
      const updated = await updateIssueType(editCategoryTarget.id, {
        name: cleanName,
        description: cleanDesc || undefined,
      })
      setIssueTypes((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
      setEditCategoryTarget(null)
      setSuccessBanner(`Category '${updated.name}' updated successfully!`)
    } catch (err: unknown) {
      alert(sanitizeErrorMessage(err, 'Failed to update category.'))
    } finally {
      setSubmittingEditCategory(false)
    }
  }

  // Handle Delete Category Submit
  const handleDeleteCategorySubmit = async () => {
    if (!deleteCategoryTarget) return
    setSubmittingDeleteCategory(true)
    try {
      await deleteIssueType(deleteCategoryTarget.id)
      setIssueTypes((prev) => prev.filter((it) => it.id !== deleteCategoryTarget.id))
      setDeleteCategoryTarget(null)
      setSuccessBanner(`Category '${deleteCategoryTarget.name}' deleted successfully!`)
    } catch (err: unknown) {
      alert(sanitizeErrorMessage(err, 'Failed to delete category.'))
    } finally {
      setSubmittingDeleteCategory(false)
    }
  }

  // Handle TAT Submit
  const handleTatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tatModalTicket || !tatDate) return
    setSubmittingTat(true)
    try {
      const isoDate = new Date(tatDate).toISOString()
      const updated = await updateTicketTat(tatModalTicket.id, {
        estimated_completion_at: isoDate,
        note: tatNote.trim() ? tatNote.trim() : undefined,
      })
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setTatModalTicket(null)
      setTatDate('')
      setTatNote('')
      setSuccessBanner(`Turnaround target committed for #${updated.id}!`)
    } catch (err: any) {
      alert(err?.message || 'Failed to update TAT commitment.')
    } finally {
      setSubmittingTat(false)
    }
  }

  // Handle Status / Progress Note Submit
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statusModalTicket || !statusNote.trim()) return
    setSubmittingStatus(true)
    try {
      const updated = await updateTicketStatus(statusModalTicket.ticket.id, {
        status: statusModalTicket.targetStatus,
        note: statusNote.trim(),
      })
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setStatusModalTicket(null)
      setStatusNote('')
      setSuccessBanner(
        statusModalTicket.targetStatus === 'resolved'
          ? `Work order #${updated.id} marked as RESOLVED!`
          : `Field progress log updated on #${updated.id}!`,
      )
    } catch (err: any) {
      alert(err?.message || 'Failed to update ticket status.')
    } finally {
      setSubmittingStatus(false)
    }
  }

  // Handle Delete Ticket Submit
  const handleDeleteSubmit = async () => {
    if (!deleteModalTicket) return
    setSubmittingDelete(true)
    try {
      await deleteTicket(deleteModalTicket.id)
      setTickets((prev) => prev.filter((t) => t.id !== deleteModalTicket.id))
      setDeleteModalTicket(null)
      setSuccessBanner(`Ticket #${deleteModalTicket.id} withdrawn successfully.`)
    } catch (err: any) {
      alert(err?.message || 'Failed to delete ticket.')
    } finally {
      setSubmittingDelete(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Maintenance Operations Ledger</h1>
          <p className={styles.subtitle}>
            Direct facilities work-order queue. Inspect evidence photos, modify tickets, commit TAT SLAs, and dispatch technicians.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.btnSecondary} ${activeTab === 'categories' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(activeTab === 'categories' ? 'all' : 'categories')}
            title="Inspect and configure all campus issue categories"
          >
            <Layers size={15} />
            <span>Issue Categories ({issueTypes.length})</span>
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => setManualCategoryModalOpen(true)}
            title="Create a new manual / other issue category"
          >
            <Plus size={15} />
            <span>+ Add Category</span>
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {successBanner && (
        <div className={styles.successBanner} role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '1rem', color: '#b91c1c', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Filter and Search Controls Bar */}
      <div className={styles.controlsBar}>
        {/* Filter Tabs */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Work Orders <span className={styles.tabCount}>{tabCounts.all}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'open' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('open')}
          >
            Active Open <span className={styles.tabCount}>{tabCounts.open}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'needs_tat' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('needs_tat')}
          >
            Needs TAT <span className={styles.tabCount}>{tabCounts.needs_tat}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'overdue' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            Overdue SLA <span className={styles.tabCount} style={{ color: tabCounts.overdue > 0 ? 'var(--critical)' : 'inherit' }}>{tabCounts.overdue}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'in_progress' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('in_progress')}
          >
            In Progress <span className={styles.tabCount}>{tabCounts.in_progress}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'resolved' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('resolved')}
          >
            Resolved <span className={styles.tabCount}>{tabCounts.resolved}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'acknowledged' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('acknowledged')}
          >
            Acknowledged <span className={styles.tabCount}>{tabCounts.acknowledged}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('categories')}
            style={{
              marginLeft: 'auto',
              borderLeft: '1px solid var(--border)',
              background: activeTab === 'categories' ? '#E7F7FA' : 'inherit',
              fontWeight: 600,
            }}
          >
            <Layers size={14} style={{ marginRight: '5px' }} />
            Issue Categories <span className={styles.tabCount}>{tabCounts.categories}</span>
          </button>
        </div>

        {/* Search, Category, Sorting and View mode (shown when not on categories tab) */}
        {activeTab !== 'categories' && (
          <div className={styles.filtersRow}>
            <div className={styles.searchBox}>
              <Search size={16} style={{ color: 'var(--muted-text)' }} />
              <input
                type="text"
                placeholder="Search title, ticket ID, reporter name, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => {
                if (e.target.value === '__manage_categories__') {
                  setActiveTab('categories')
                  return
                }
                setSelectedCategory(e.target.value)
              }}
              className={styles.selectInput}
            >
              <option value="all">All Categories ({issueTypes.length})</option>
              {issueTypes.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
              <option value="__manage_categories__">⚙️ Manage Issue Categories...</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={styles.selectInput}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="tat">Sort: Urgent Target TAT</option>
            </select>

            <div className={styles.viewToggle}>
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <TableIcon size={16} />
              </button>
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${viewMode === 'cards' ? styles.viewToggleBtnActive : ''}`}
                onClick={() => setViewMode('cards')}
                title="Card Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Categories Management View OR Tickets Table / Cards */}
      {activeTab === 'categories' ? (
        <div className={styles.categoriesViewContainer}>
          <div className={styles.categoriesHeaderBar}>
            <div>
              <h2 className={styles.categoriesTitle}>Campus Issue Categories Master Taxonomy</h2>
              <p className={styles.categoriesSubtitle}>
                Operational classifications for incident dispatch, skill routing, and SLA tracking across campus facilities.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className={styles.searchBox} style={{ width: '280px' }}>
                <Search size={15} style={{ color: 'var(--muted-text)' }} />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => setManualCategoryModalOpen(true)}
              >
                <Plus size={15} />
                <span>+ Add Category</span>
              </button>
            </div>
          </div>

          <div className={styles.categoriesGrid}>
            {filteredCategories.map((cat) => {
              const stats = categoryTicketStats[cat.id] || categoryTicketStats[cat.name] || { total: 0, open: 0 }
              return (
                <div key={cat.id} className={styles.categoryCard}>
                  <div className={styles.categoryCardTop}>
                    <div className={styles.categoryCardHeader}>
                      <h3 className={styles.categoryCardName}>{cat.name}</h3>
                      <span className={styles.categoryCardId}>{cat.id}</span>
                    </div>
                    <p className={styles.categoryCardDesc}>
                      {cat.description || 'General maintenance and physical facilities operational classification.'}
                    </p>
                  </div>

                  <div className={styles.categoryCardFooter}>
                    <span className={styles.categoryStatPill}>
                      {stats.total} {stats.total === 1 ? 'Work Order' : 'Work Orders'} ({stats.open} Active)
                    </span>
                    <div className={styles.categoryActionGroup}>
                      <button
                        type="button"
                        className={`${styles.miniBtn} ${styles.miniBtnPrimary}`}
                        onClick={() => {
                          setSelectedCategory(cat.name)
                          setActiveTab('all')
                        }}
                        title="View all work orders in this category"
                      >
                        View Tickets
                      </button>
                      <button
                        type="button"
                        className={styles.miniBtn}
                        onClick={() => openEditCategory(cat)}
                        title="Edit category name and description"
                      >
                        <Edit3 size={13} style={{ marginRight: '3px' }} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
                        onClick={() => setDeleteCategoryTarget(cat)}
                        title="Delete category"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className={`${styles.card} ${styles.emptyState}`}>
              <AlertTriangle size={36} style={{ color: 'var(--muted-text)', marginBottom: '0.75rem', opacity: 0.6 }} />
              <div style={{ fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
                No categories match "{categorySearchQuery}".
              </div>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setCategorySearchQuery('')}
                style={{ marginTop: '0.75rem' }}
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className={`${styles.card} ${styles.emptyState}`}>
          <AlertTriangle size={36} style={{ color: 'var(--muted-text)', marginBottom: '0.75rem', opacity: 0.6 }} />
          <div style={{ fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
            No work orders match the selected criteria.
          </div>
          <div>Try adjusting your search terms, category selection, or status filters.</div>
        </div>
      ) : viewMode === 'table' ? (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Work Order</th>
                  <th>Photo Evidence</th>
                  <th>Category</th>
                  <th>Reporter</th>
                  <th>Submitted</th>
                  <th>TAT Status</th>
                  <th>Latest Field Update</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Work Order Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => {
                  const isOverdue =
                    t.status === 'open' &&
                    t.tat?.estimated_completion_at &&
                    new Date(t.tat.estimated_completion_at).getTime() < Date.now()

                  const hasPhoto = Boolean(t.has_photo || t.photo)

                  return (
                    <tr key={t.id} className={styles.tableRow}>
                      <td>
                        <div>
                          <Link to={`/tickets/${t.id}`} className={styles.ticketTitle}>
                            {t.title}
                          </Link>
                          <div className={styles.ticketId}>#{t.id}</div>
                        </div>
                      </td>

                      {/* Photo Evidence Column with Thumbnail and Download Option */}
                      <td>
                        {hasPhoto ? (
                          <div className={styles.photoCell}>
                            <button
                              type="button"
                              className={styles.photoThumbnailBtn}
                              onClick={() => setViewingPhotoTicket(t)}
                              title="Click to inspect uploaded photo"
                            >
                              <img
                                src={t.photo?.url || getTicketPhotoUrl(t.id)}
                                alt="Evidence"
                                className={styles.photoThumbnailImg}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                              <Eye
                                size={12}
                                style={{
                                  position: 'absolute',
                                  bottom: 2,
                                  right: 2,
                                  color: '#FFFFFF',
                                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                                }}
                              />
                            </button>
                            <button
                              type="button"
                              className={styles.photoDownloadBtn}
                              onClick={() => handleDownloadPhoto(t)}
                              title="Download uploaded photo"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      <td>
                        <Badge variant="neutral">{t.issue_type_name || 'General'}</Badge>
                      </td>
                      <td>
                        <div className={styles.reporterCell}>
                          <span className={styles.reporterName}>{t.reported_by_name || 'Reporter'}</span>
                          <span className={styles.reporterMeta}>
                            {t.reported_by_role || 'user'} • {t.reported_by_dept || 'Campus'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--muted-text)', whiteSpace: 'nowrap' }}>
                        {formatDateIST(t.created_at)}
                      </td>
                      <td>
                        {isOverdue ? (
                          <span className={styles.tatBadgeOverdue}>
                            <AlertOctagon size={12} /> Overdue ({formatRelativeIST(t.tat!.estimated_completion_at)})
                          </span>
                        ) : t.tat?.estimated_completion_at ? (
                          <span className={styles.tatBadgeNormal}>
                            <Clock size={12} /> Due {formatDateIST(t.tat.estimated_completion_at)}
                          </span>
                        ) : (
                          <span className={styles.tatBadgeNone}>No TAT</span>
                        )}
                      </td>
                      <td>
                        {t.update?.note ? (
                          <div className={styles.updateSnippet} title={t.update.note}>
                            <div>{t.update.note}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                              {formatRelativeIST(t.update.updated_at)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>—</span>
                        )}
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
                        <div className={styles.actionButtonGroup}>
                          {/* Modify Ticket Button */}
                          <button
                            type="button"
                            className={styles.miniBtn}
                            onClick={() => openModifyModal(t)}
                            title="Modify / Edit work order details"
                          >
                            <Edit3 size={13} style={{ marginRight: '0.2rem' }} />
                            Modify
                          </button>

                          {t.status === 'open' && (
                            <>
                              <button
                                type="button"
                                className={`${styles.miniBtn} ${styles.miniBtnPrimary}`}
                                onClick={() => {
                                  setTatModalTicket(t)
                                  setTatDate(
                                    t.tat?.estimated_completion_at
                                      ? new Date(t.tat.estimated_completion_at).toISOString().slice(0, 16)
                                      : '',
                                  )
                                  setTatNote('')
                                }}
                                title="Set / Update Turnaround Target"
                              >
                                <Calendar size={13} style={{ marginRight: '0.2rem' }} />
                                TAT
                              </button>

                              <button
                                type="button"
                                className={styles.miniBtn}
                                onClick={() => {
                                  setStatusModalTicket({ ticket: t, targetStatus: 'open', isProgressUpdate: true })
                                  setStatusNote('')
                                }}
                                title="Post Field Progress Log"
                              >
                                <MessageSquare size={13} style={{ marginRight: '0.2rem' }} />
                                Update
                              </button>

                              <button
                                type="button"
                                className={`${styles.miniBtn} ${styles.miniBtnSuccess}`}
                                onClick={() => {
                                  setStatusModalTicket({ ticket: t, targetStatus: 'resolved' })
                                  setStatusNote('')
                                }}
                                title="Mark as Resolved"
                              >
                                <CheckCircle2 size={13} style={{ marginRight: '0.2rem' }} />
                                Resolve
                              </button>
                            </>
                          )}

                          {t.status === 'resolved' && (
                            <button
                              type="button"
                              className={styles.miniBtn}
                              onClick={() => {
                                setStatusModalTicket({ ticket: t, targetStatus: 'open' })
                                setStatusNote('')
                              }}
                              title="Reopen Work Order"
                            >
                              <RotateCcw size={13} style={{ marginRight: '0.2rem' }} />
                              Reopen
                            </button>
                          )}

                          <Link
                            to={`/tickets/${t.id}`}
                            className={styles.miniBtn}
                            title="Inspect Details"
                          >
                            <ExternalLink size={13} />
                          </Link>

                          <button
                            type="button"
                            className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
                            onClick={() => setDeleteModalTicket(t)}
                            title="Delete Ticket"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards Grid View */
        <div className={styles.cardsGrid}>
          {filteredTickets.map((t) => {
            const isOverdue =
              t.status === 'open' &&
              t.tat?.estimated_completion_at &&
              new Date(t.tat.estimated_completion_at).getTime() < Date.now()

            const hasPhoto = Boolean(t.has_photo || t.photo)

            return (
              <div key={t.id} className={styles.ticketCard}>
                {/* Photo Banner on Card View */}
                {hasPhoto && (
                  <div className={styles.cardPhotoBanner}>
                    <img
                      src={t.photo?.url || getTicketPhotoUrl(t.id)}
                      alt="Evidence"
                      className={styles.cardPhotoImg}
                      onClick={() => setViewingPhotoTicket(t)}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className={styles.cardPhotoOverlay}>
                      <button
                        type="button"
                        className={styles.cardPhotoActionBtn}
                        onClick={() => setViewingPhotoTicket(t)}
                      >
                        <Eye size={11} /> View Photo
                      </button>
                      <button
                        type="button"
                        className={styles.cardPhotoActionBtn}
                        onClick={() => handleDownloadPhoto(t)}
                        title="Download photo"
                      >
                        <Download size={11} /> Download
                      </button>
                    </div>
                  </div>
                )}

                <div className={styles.cardHeaderRow}>
                  <div>
                    <span className={styles.ticketId}>#{t.id.slice(0, 8)}</span>
                    <h3 style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 700 }}>
                      <Link to={`/tickets/${t.id}`} className={styles.ticketTitle}>
                        {t.title}
                      </Link>
                    </h3>
                  </div>
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
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--muted-text)', lineHeight: 1.4 }}>
                  {t.description.length > 120 ? `${t.description.slice(0, 120)}...` : t.description}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <Badge variant="neutral">{t.issue_type_name || 'General'}</Badge>
                  <span style={{ color: 'var(--muted-text)' }}>{formatDateIST(t.created_at)}</span>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--muted-text)' }}>Reporter:</span>
                    <span style={{ fontWeight: 600 }}>{t.reported_by_name || 'Reporter'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--muted-text)' }}>TAT SLA:</span>
                    {isOverdue ? (
                      <span className={styles.tatBadgeOverdue}>Overdue</span>
                    ) : t.tat?.estimated_completion_at ? (
                      <span className={styles.tatBadgeNormal}>Due {formatDateIST(t.tat.estimated_completion_at)}</span>
                    ) : (
                      <span className={styles.tatBadgeNone}>No TAT</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className={styles.miniBtn}
                      onClick={() => openModifyModal(t)}
                      title="Modify Work Order"
                    >
                      <Edit3 size={12} style={{ marginRight: '0.2rem' }} />
                      Modify
                    </button>
                    <Link to={`/tickets/${t.id}`} className={styles.miniBtn}>
                      Details <ExternalLink size={11} style={{ marginLeft: '0.2rem' }} />
                    </Link>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {t.status === 'open' && (
                      <button
                        type="button"
                        className={`${styles.miniBtn} ${styles.miniBtnPrimary}`}
                        onClick={() => {
                          setTatModalTicket(t)
                          setTatDate(
                            t.tat?.estimated_completion_at
                              ? new Date(t.tat.estimated_completion_at).toISOString().slice(0, 16)
                              : '',
                          )
                          setTatNote('')
                        }}
                      >
                        Set TAT
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
                      onClick={() => setDeleteModalTicket(t)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* High-Resolution Photo Viewer & Download Modal */}
      {viewingPhotoTicket && (
        <div className={styles.modalOverlay} onClick={() => setViewingPhotoTicket(null)}>
          <div className={styles.photoModalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  Evidence Photograph — #{viewingPhotoTicket.id}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)' }}>
                  {viewingPhotoTicket.title} • {viewingPhotoTicket.reported_by_name} ({viewingPhotoTicket.reported_by_role})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhotoTicket(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.photoModalImgContainer}>
              {isSafeUrl(viewingPhotoTicket.photo?.url || getTicketPhotoUrl(viewingPhotoTicket.id)) ? (
                <img
                  src={viewingPhotoTicket.photo?.url || getTicketPhotoUrl(viewingPhotoTicket.id)}
                  alt="Ticket Evidence High Resolution"
                  className={styles.photoModalImg}
                />
              ) : (
                <div style={{ padding: '2rem', color: '#FFFFFF', textAlign: 'center', fontSize: '0.9rem' }}>
                  Security Policy: External image URL failed protocol safety checks.
                </div>
              )}
            </div>

            <div className={styles.modalFooter} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)' }}>
                {viewingPhotoTicket.photo?.filename || `${viewingPhotoTicket.id}-photo.jpg`}
              </span>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  className={styles.btnModalCancel}
                  onClick={() => setViewingPhotoTicket(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={styles.btnModalConfirm}
                  onClick={() => handleDownloadPhoto(viewingPhotoTicket)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={14} />
                  <span>Download Original Image</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Ticket Modal for Maintenance */}
      {modifyModalTicket && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '620px' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Modify Work Order #{modifyModalTicket.id}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                  Update classification, description, or evidence photo for maintenance execution
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModifyModalTicket(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleModifySubmit}>
              <div className={styles.modalBody}>
                {modifyError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.6rem 0.8rem', borderRadius: '6px', color: '#b91c1c', fontSize: '0.8rem' }}>
                    {modifyError}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Complaint Title *</label>
                  <input
                    type="text"
                    value={modifyTitle}
                    onChange={(e) => setModifyTitle(e.target.value)}
                    required
                    maxLength={120}
                    className={styles.formInput}
                    placeholder="Short description of the fault"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Issue Category / Classification *</label>
                  <select
                    value={modifyCategoryId}
                    onChange={(e) => {
                      setModifyCategoryId(e.target.value)
                      const isOther =
                        e.target.value === 'it-8' ||
                        e.target.value === 'other' ||
                        Boolean(issueTypes.find((it) => it.id === e.target.value)?.name.toLowerCase().includes('other'))
                      setModifyIsOther(isOther)
                    }}
                    className={styles.formInput}
                  >
                    {issueTypes.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                    <option value="other">Other / Manual Custom Issue Type</option>
                  </select>
                </div>

                {modifyIsOther && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Manual Issue Specification (Custom Category)
                    </label>
                    <input
                      type="text"
                      value={modifyManualCategory}
                      onChange={(e) => setModifyManualCategory(e.target.value)}
                      placeholder="e.g. Ultrasonic cleaning bath defect, Rooftop solar conduit repair..."
                      className={styles.formInput}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted-text)' }}>
                      Specify the custom or non-standard maintenance issue detail.
                    </span>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description *</label>
                  <textarea
                    value={modifyDescription}
                    onChange={(e) => setModifyDescription(e.target.value)}
                    required
                    maxLength={2000}
                    rows={4}
                    className={styles.formTextarea}
                    placeholder="Provide full description of the defect and location specifics"
                  />
                </div>

                {/* Photo modification */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Photographic Evidence</label>
                  {modifyModalTicket.has_photo && !modifyRemovePhoto && !modifyPhotoFile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                      <img
                        src={getTicketPhotoUrl(modifyModalTicket.id)}
                        alt="Current"
                        style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div style={{ flex: 1, fontSize: '0.8rem' }}>
                        <span>Current photo attached</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModifyRemovePhoto(true)}
                        style={{ background: 'none', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}

                  {modifyRemovePhoto && (
                    <div style={{ fontSize: '0.78rem', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: '#fff1f2', borderRadius: '4px' }}>
                      <span>Photo will be detached upon saving.</span>
                      <button type="button" onClick={() => setModifyRemovePhoto(false)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.75rem' }}>Undo</button>
                    </div>
                  )}

                  <div style={{ marginTop: '0.4rem' }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0]
                          const validation = await validateImageFile(file)
                          if (!validation.valid) {
                            setModifyError(validation.error || 'Invalid photo format. Only JPEG or PNG up to 5 MB permitted.')
                            e.target.value = ''
                            return
                          }
                          setModifyPhotoFile(file)
                          setModifyRemovePhoto(false)
                        }
                      }}
                      style={{ fontSize: '0.8rem' }}
                    />
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted-text)', marginTop: '2px' }}>
                      Upload replacement or new JPEG/PNG image (max 5 MB).
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnModalCancel}
                  onClick={() => setModifyModalTicket(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModify}
                  className={styles.btnModalConfirm}
                >
                  {submittingModify ? 'Saving Changes...' : 'Save Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Manual Category Modal */}
      {manualCategoryModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Custom / Manual Issue Category</h3>
              <button
                type="button"
                onClick={() => setManualCategoryModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCategorySubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category Name *</label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Smart Projectors & Displays"
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Scope and description of equipment / facilities covered"
                    className={styles.formTextarea}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnModalCancel}
                  onClick={() => setManualCategoryModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className={styles.btnModalConfirm}
                >
                  {submittingCategory ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Issue Category Modal */}
      {editCategoryTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Modify Issue Category</h3>
              <button
                type="button"
                onClick={() => setEditCategoryTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditCategorySubmit}>
              <div className={styles.modalBody}>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', marginBottom: '0.75rem' }}>
                  Category ID: <code>{editCategoryTarget.id}</code>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category Name *</label>
                  <input
                    type="text"
                    required
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Operational Scope & Description</label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={editCategoryDesc}
                    onChange={(e) => setEditCategoryDesc(e.target.value)}
                    className={styles.formTextarea}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnModalCancel}
                  onClick={() => setEditCategoryTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditCategory || !editCategoryName.trim()}
                  className={styles.btnModalConfirm}
                >
                  {submittingEditCategory ? 'Saving Changes...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteCategoryTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: 'var(--critical)' }}>
                Delete Issue Category
              </h3>
              <button
                type="button"
                onClick={() => setDeleteCategoryTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--main-text)' }}>
                Are you sure you want to permanently delete category <strong>"{deleteCategoryTarget.name}"</strong> (
                <em>{deleteCategoryTarget.id}</em>)?
              </p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: 'var(--muted-text)' }}>
                This category will no longer be available when tickets are raised or modified.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnModalCancel}
                onClick={() => setDeleteCategoryTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDeleteCategory}
                className={`${styles.btnModalConfirm} ${styles.btnModalDanger}`}
                onClick={handleDeleteCategorySubmit}
              >
                {submittingDeleteCategory ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set TAT Modal */}
      {tatModalTicket && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Set Turnaround Target (TAT)</h3>
              <button
                type="button"
                onClick={() => setTatModalTicket(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTatSubmit}>
              <div className={styles.modalBody}>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted-text)' }}>
                  Work Order: <strong>{tatModalTicket.title}</strong> (#{tatModalTicket.id.slice(0, 8)})
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Estimated Completion Timestamp (Local IST) *</label>
                  <input
                    type="datetime-local"
                    value={tatDate}
                    onChange={(e) => setTatDate(e.target.value)}
                    required
                    className={styles.formInput}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted-text)' }}>
                    Will be stored as UTC and presented to the reporter in Indian Standard Time (IST).
                  </span>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Operational Note (Optional, 1–280 chars)</label>
                  <textarea
                    value={tatNote}
                    onChange={(e) => setTatNote(e.target.value)}
                    maxLength={280}
                    placeholder="e.g. Electrical replacement components dispatched from central warehouse."
                    className={styles.formTextarea}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnModalCancel}
                  onClick={() => setTatModalTicket(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTat}
                  className={styles.btnModalConfirm}
                >
                  {submittingTat ? 'Committing...' : 'Commit TAT SLA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status / Progress Note Modal */}
      {statusModalTicket && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {statusModalTicket.isProgressUpdate
                  ? 'Post Field Progress Note'
                  : statusModalTicket.targetStatus === 'resolved'
                  ? 'Confirm Work Order Resolution'
                  : 'Reopen Work Order'}
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalTicket(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleStatusSubmit}>
              <div className={styles.modalBody}>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted-text)' }}>
                  Work Order: <strong>{statusModalTicket.ticket.title}</strong> (#{statusModalTicket.ticket.id.slice(0, 8)})
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {statusModalTicket.isProgressUpdate
                      ? 'Technician Progress Note (Mandatory, 1–280 chars) *'
                      : statusModalTicket.targetStatus === 'resolved'
                      ? 'Resolution Field Summary (Mandatory, 1–280 chars) *'
                      : 'Reopening Reason / Diagnostics Note *'}
                  </label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    required
                    maxLength={280}
                    rows={4}
                    placeholder={
                      statusModalTicket.isProgressUpdate
                        ? 'e.g. Electrician arrived on site. High-voltage capacitor bank replaced. Load testing in progress.'
                        : statusModalTicket.targetStatus === 'resolved'
                        ? 'e.g. Ball-valve replaced, water pressure normalized. System sanitized and verified leak-free.'
                        : 'e.g. Reporter noted residual dripping after main valve was opened. Dispatched for inspection.'
                    }
                    className={styles.formTextarea}
                  />
                  <div className={styles.charCount}>{statusNote.length}/280</div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnModalCancel}
                  onClick={() => setStatusModalTicket(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus || !statusNote.trim()}
                  className={`${styles.btnModalConfirm} ${
                    statusModalTicket.targetStatus === 'resolved' ? styles.miniBtnSuccess : ''
                  }`}
                >
                  {submittingStatus
                    ? 'Submitting...'
                    : statusModalTicket.isProgressUpdate
                    ? 'Post Progress Note'
                    : statusModalTicket.targetStatus === 'resolved'
                    ? 'Resolve Work Order'
                    : 'Reopen Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Ticket Confirmation Modal */}
      {deleteModalTicket && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: 'var(--critical)' }}>
                Delete Work Order
              </h3>
              <button
                type="button"
                onClick={() => setDeleteModalTicket(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--main-text)' }}>
                Are you sure you want to permanently delete work order <strong>#{deleteModalTicket.id}</strong> (
                <em>{deleteModalTicket.title}</em>)?
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-text)' }}>
                This will remove the ticket from the campus ledger and purge associated telemetry.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnModalCancel}
                onClick={() => setDeleteModalTicket(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDelete}
                className={`${styles.btnModalConfirm} ${styles.btnModalDanger}`}
                onClick={handleDeleteSubmit}
              >
                {submittingDelete ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default OperationsTicketsPage
