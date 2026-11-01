import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { listTickets, listIssueTypes, type Ticket, type IssueType } from '@/core'
import { Badge } from '@/ui'
import styles from './GlobalSearchModal.module.css'

export interface GlobalSearchModalProps {
  open: boolean
  onClose: () => void
}

const BUILDINGS = [
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

const QUICK_LINKS = [
  { label: 'Raise an Issue', path: '/tracks/fixit/raise', icon: '⚡' },
  { label: 'All Maintenance Tickets', path: '/tracks/fixit/tickets', icon: '📋' },
  { label: 'Campus Intelligence Map', path: '/tracks/fixit/map', icon: '🗺️' },
  { label: 'Infrastructure Analytics', path: '/tracks/fixit/analytics', icon: '📊' },
  { label: 'Issue Categories', path: '/tracks/fixit/categories', icon: '🏷️' },
  { label: 'System Settings', path: '/tracks/fixit/settings', icon: '⚙️' },
]

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [categories, setCategories] = useState<IssueType[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleClose = useCallback(() => {
    setQuery('')
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    listTickets().then(setTickets).catch(() => {})
    listIssueTypes().then(setCategories).catch(() => {})
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, handleClose])

  if (!open) return null

  const q = query.trim().toLowerCase()

  const filteredTickets = q
    ? tickets.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.building?.toLowerCase().includes(q),
      ).slice(0, 5)
    : tickets.slice(0, 3)

  const filteredBuildings = q
    ? BUILDINGS.filter((b) => b.toLowerCase().includes(q)).slice(0, 4)
    : BUILDINGS.slice(0, 3)

  const filteredCategories = q
    ? categories.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)).slice(0, 3)
    : categories.slice(0, 2)

  const filteredLinks = q
    ? QUICK_LINKS.filter((l) => l.label.toLowerCase().includes(q))
    : QUICK_LINKS.slice(0, 4)

  function handleSelect(path: string) {
    handleClose()
    navigate(path)
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.searchBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <span className={styles.searchIcon} aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search tickets, buildings, categories, or actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
            }}
          />
          <span className={styles.escBadge}>ESC</span>
        </div>

        <div className={styles.resultsList}>
          {/* Quick Actions */}
          <div className={styles.sectionHeader}>Quick Actions</div>
          {filteredLinks.map((link) => (
            <div
              key={link.path}
              className={styles.resultItem}
              onClick={() => handleSelect(link.path)}
            >
              <div className={styles.resultLeft}>
                <div className={styles.resultIcon}>{link.icon}</div>
                <div>
                  <div className={styles.resultTitle}>{link.label}</div>
                  <div className={styles.resultSubtitle}>Navigate to section</div>
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Jump ↵</span>
            </div>
          ))}

          {/* Tickets */}
          {filteredTickets.length > 0 && (
            <>
              <div className={styles.sectionHeader}>Maintenance Tickets</div>
              {filteredTickets.map((t) => (
                <div
                  key={t.id}
                  className={styles.resultItem}
                  onClick={() => handleSelect(`/tracks/fixit/tickets/${t.id}`)}
                >
                  <div className={styles.resultLeft}>
                    <div className={styles.resultIcon}>🛠️</div>
                    <div>
                      <div className={styles.resultTitle}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                          {t.id}
                        </span>{' '}
                        — {t.title}
                      </div>
                      <div className={styles.resultSubtitle}>
                        {t.building} • {t.issue_type}
                      </div>
                    </div>
                  </div>
                  <Badge
                    size="sm"
                    tone={
                      t.status === 'resolved'
                        ? 'success'
                        : t.status === 'acknowledged'
                        ? 'primary'
                        : t.is_overdue
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {t.is_overdue ? 'Overdue' : t.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </>
          )}

          {/* Buildings */}
          {filteredBuildings.length > 0 && (
            <>
              <div className={styles.sectionHeader}>Campus Facilities & Buildings</div>
              {filteredBuildings.map((b) => (
                <div
                  key={b}
                  className={styles.resultItem}
                  onClick={() => handleSelect(`/tracks/fixit/map?building=${encodeURIComponent(b)}`)}
                >
                  <div className={styles.resultLeft}>
                    <div className={styles.resultIcon}>🏛️</div>
                    <div>
                      <div className={styles.resultTitle}>{b}</div>
                      <div className={styles.resultSubtitle}>View building status on Campus Map</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>View Map →</span>
                </div>
              ))}
            </>
          )}

          {/* Categories */}
          {filteredCategories.length > 0 && (
            <>
              <div className={styles.sectionHeader}>Issue Categories</div>
              {filteredCategories.map((c) => (
                <div
                  key={c.id}
                  className={styles.resultItem}
                  onClick={() => handleSelect(`/tracks/fixit/tickets?category=${encodeURIComponent(c.name)}`)}
                >
                  <div className={styles.resultLeft}>
                    <div className={styles.resultIcon}>🏷️</div>
                    <div>
                      <div className={styles.resultTitle}>{c.name}</div>
                      <div className={styles.resultSubtitle}>{c.description}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Filter Tickets →</span>
                </div>
              ))}
            </>
          )}

          {q && filteredTickets.length === 0 && filteredBuildings.length === 0 && filteredCategories.length === 0 && filteredLinks.length === 0 && (
            <div className={styles.emptyResults}>
              No infrastructure records found matching &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>

        <div className={styles.searchFooter}>
          <div className={styles.footerHints}>
            <span><strong style={{ color: 'var(--color-text)' }}>↑↓</strong> to navigate</span>
            <span><strong style={{ color: 'var(--color-text)' }}>↵</strong> to select</span>
            <span><strong style={{ color: 'var(--color-text)' }}>ESC</strong> to dismiss</span>
          </div>
          <div>FIXIT Intelligent Index</div>
        </div>
      </div>
    </div>
  )
}
