import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  Search,
  PlusCircle,
  RefreshCw,
  LayoutGrid,
  List,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Ticket as TicketIcon,
} from 'lucide-react'
import { fetchTicketsPage, type Ticket, type TicketStatus } from '@/core/api/ticketsApi'
import { listIssueTypes, type IssueType } from '@/core/api/issueTypesApi'
import { formatIST, formatRelativeIST } from '@/core/utils/date'
import styles from './MyTicketsPage.module.css'

export function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Categories list for filter dropdown
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([])

  const loadCategories = async () => {
    try {
      const types = await listIssueTypes()
      setIssueTypes(types)
    } catch {
      // non-blocking
    }
  }

  const loadTickets = async (cursor?: string | null) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchTicketsPage({
        status: statusFilter,
        issue_type_id: categoryFilter !== 'all' ? categoryFilter : undefined,
        cursor: cursor || undefined,
        limit: 20,
      })
      setTickets(res.items)
      setTotalCount(res.count)
      setNextCursor(res.next_cursor)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch tickets from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    setCursorHistory([])
    loadTickets(null)
  }, [statusFilter, categoryFilter])

  const handleNextPage = () => {
    if (nextCursor) {
      setCursorHistory((prev) => [...prev, nextCursor])
      loadTickets(nextCursor)
    }
  }

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory]
      newHistory.pop() // remove current
      const prevCursor = newHistory[newHistory.length - 1] || null
      setCursorHistory(newHistory)
      loadTickets(prevCursor)
    }
  }

  // Client-side filtering for Search and Sorting
  const filteredTickets = tickets
    .filter((t) => {
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return (
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.issue_type_name || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      return a.title.localeCompare(b.title)
    })

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.kicker}>PERSONAL MAINTENANCE REPOSITORY</span>
          <h1 className={styles.title}>My Maintenance Tickets</h1>
          <p className={styles.subtitle}>
            Track the status of your reported campus infrastructure problems and review technician updates.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => loadTickets(null)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? styles.spinning : ''} />
            <span>Refresh</span>
          </button>

          <Link to="/raise-ticket" className={styles.raiseBtn}>
            <PlusCircle size={15} />
            <span>Raise Complaint</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className={styles.errorAlert} role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => loadTickets(null)} className={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {/* Control Bar: Search, Filters, View Modes */}
      <div className={styles.controlBar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by ID, title, or keywords..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={styles.selectFilter}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open Only</option>
            <option value="resolved">Resolved (Needs Confirmation)</option>
            <option value="acknowledged">Acknowledged (Closed)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.selectFilter}
          >
            <option value="all">All Categories</option>
            {issueTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.selectFilter}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>

          {/* View Mode Toggle */}
          <div className={styles.viewToggleGroup}>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.activeView : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === 'cards' ? styles.activeView : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className={styles.loadingBox}>
          <RefreshCw size={24} className={styles.spinning} />
          <span>Retrieving maintenance records from server...</span>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className={styles.emptyCard}>
          <TicketIcon size={36} className={styles.emptyIcon} />
          <h3>No tickets match your criteria</h3>
          <p>
            {search || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your filters or search keywords.'
              : 'You have not submitted any campus maintenance complaints yet.'}
          </p>
          <div className={styles.emptyActions}>
            {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setCategoryFilter('all')
                }}
                className={styles.clearBtn}
              >
                Clear Filters
              </button>
            )}
            <Link to="/raise-ticket" className={styles.raiseComplaintBtn}>
              Raise a Complaint
            </Link>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>TICKET ID</th>
                  <th>TITLE & SUMMARY</th>
                  <th>CATEGORY</th>
                  <th>REPORTED</th>
                  <th>EXPECTED TAT</th>
                  <th>LATEST UPDATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id} className={t.overdue && t.status === 'open' ? styles.rowOverdue : ''}>
                    <td className={styles.monoId}>{t.id}</td>
                    <td>
                      <div className={styles.titleCell}>
                        <Link to={`/tickets/${t.id}`} className={styles.ticketLink}>
                          {t.title}
                        </Link>
                        <span className={styles.descSnippet}>{t.description.slice(0, 75)}...</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.catBadge}>{t.issue_type_name}</span>
                    </td>
                    <td className={styles.dateCell}>{formatIST(t.created_at)}</td>
                    <td className={styles.tatCell}>
                      {t.tat?.expected_by ? (
                        <span className={t.overdue ? styles.tatOverdue : styles.tatNormal}>
                          {t.tat.expected_by}
                        </span>
                      ) : (
                        <span className={styles.tatNone}>Pending TAT</span>
                      )}
                    </td>
                    <td>
                      {t.update?.note ? (
                        <span className={styles.updateSnippet} title={t.update.note}>
                          "{t.update.note.slice(0, 40)}..."
                        </span>
                      ) : (
                        <span className={styles.noUpdate}>Queued</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.statusCell}>
                        {t.overdue && t.status === 'open' && (
                          <span className={styles.badgeOverdue}>OVERDUE</span>
                        )}
                        <span
                          className={`${styles.statusPill} ${
                            t.status === 'open'
                              ? styles.pillOpen
                              : t.status === 'resolved'
                              ? styles.pillResolved
                              : styles.pillAck
                          }`}
                        >
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/tickets/${t.id}`} className={styles.viewBtn}>
                        <span>Inspect</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className={styles.cardsGrid}>
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              className={`${styles.ticketCard} ${t.overdue && t.status === 'open' ? styles.cardOverdue : ''}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.monoId}>{t.id}</span>
                <div className={styles.cardBadges}>
                  {t.overdue && t.status === 'open' && (
                    <span className={styles.badgeOverdue}>OVERDUE</span>
                  )}
                  <span
                    className={`${styles.statusPill} ${
                      t.status === 'open'
                        ? styles.pillOpen
                        : t.status === 'resolved'
                        ? styles.pillResolved
                        : styles.pillAck
                    }`}
                  >
                    {t.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <h4 className={styles.cardTitle}>
                <Link to={`/tickets/${t.id}`}>{t.title}</Link>
              </h4>
              <p className={styles.cardDesc}>{t.description.slice(0, 110)}...</p>

              <div className={styles.cardMeta}>
                <span className={styles.catBadge}>{t.issue_type_name}</span>
                <span className={styles.dateCell}>{formatRelativeIST(t.created_at)}</span>
              </div>

              {t.update?.note && (
                <div className={styles.cardUpdate}>
                  <strong>Technician Note:</strong>
                  <p>"{t.update.note}"</p>
                </div>
              )}

              <div className={styles.cardFooter}>
                <span className={styles.tatFooter}>
                  TAT: {t.tat?.expected_by || 'Unscheduled'}
                </span>
                <Link to={`/tickets/${t.id}`} className={styles.cardActionLink}>
                  <span>Details</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <div className={styles.paginationBar}>
        <span className={styles.pageInfo}>
          Showing <strong>{filteredTickets.length}</strong> of <strong>{totalCount}</strong> records
        </span>

        <div className={styles.paginationControls}>
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={cursorHistory.length === 0 || loading}
            className={styles.pageBtn}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={!nextCursor || loading}
            className={styles.pageBtn}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
