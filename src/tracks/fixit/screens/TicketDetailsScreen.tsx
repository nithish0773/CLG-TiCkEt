import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  getTicket,
  updateTicketStatus,
  acknowledgeTicket,
  updateTicketTat,
  getTicketPhotoUrl,
  downloadTicketPhoto,
  type Ticket,
  useAuth,
} from '@/core'
import { Button, Badge, Modal, Spinner } from '@/ui'
import { isFixitManager } from '../utils/roles'
import styles from './TicketDetailsScreen.module.css'

export function TicketDetailsScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Status update modal (Manager resolving issue)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolveSubmitting, setResolveSubmitting] = useState(false)

  // Acknowledge modal (Reporter signoff)
  const [ackModalOpen, setAckModalOpen] = useState(false)
  const [ackFeedback, setAckFeedback] = useState('')
  const [ackSubmitting, setAckSubmitting] = useState(false)

  // TAT update state
  const [tatDate, setTatDate] = useState('')
  const [tatSubmitting, setTatSubmitting] = useState(false)

  // Manager notes state
  const [managerNotes, setManagerNotes] = useState('')
  const [notesSubmitting, setNotesSubmitting] = useState(false)

  // Photo modal state
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [downloadingPhoto, setDownloadingPhoto] = useState(false)

  useEffect(() => {
    if (id) {
      loadTicket(id)
    }
  }, [id])

  async function loadTicket(ticketId: string) {
    setLoading(true)
    setError(null)
    try {
      const data = await getTicket(ticketId)
      setTicket(data)
      setTatDate(data.expected_completion_date || '')
      setManagerNotes(data.manager_notes || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ticket ${ticketId}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle Download Photo
  async function handleDownloadPhoto() {
    if (!ticket) return
    setDownloadingPhoto(true)
    try {
      await downloadTicketPhoto(ticket.id, `${ticket.id}-evidence.svg`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download photo.')
    } finally {
      setDownloadingPhoto(false)
    }
  }

  // Manager Marks as Resolved
  async function handleConfirmResolve(e: FormEvent) {
    e.preventDefault()
    if (!ticket) return
    setResolveSubmitting(true)
    try {
      const updated = await updateTicketStatus(ticket.id, 'resolved', resolveNotes.trim())
      setTicket(updated)
      setResolveModalOpen(false)
      setResolveNotes('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update ticket status.')
    } finally {
      setResolveSubmitting(false)
    }
  }

  // Reporter Acknowledges Resolution
  async function handleConfirmAcknowledge(e: FormEvent) {
    e.preventDefault()
    if (!ticket) return
    setAckSubmitting(true)
    try {
      const updated = await acknowledgeTicket(ticket.id, ackFeedback.trim())
      setTicket(updated)
      setAckModalOpen(false)
      setAckFeedback('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to acknowledge ticket.')
    } finally {
      setAckSubmitting(false)
    }
  }

  // Save TAT
  async function handleSaveTat() {
    if (!ticket || !tatDate) return
    setTatSubmitting(true)
    try {
      const updated = await updateTicketTat(ticket.id, tatDate)
      setTicket(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update expected completion date.')
    } finally {
      setTatSubmitting(false)
    }
  }

  // Save Manager Notes
  async function handleSaveNotes() {
    if (!ticket) return
    setNotesSubmitting(true)
    try {
      const updated = await updateTicketStatus(ticket.id, ticket.status, managerNotes)
      setTicket(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save manager notes.')
    } finally {
      setNotesSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
        <Spinner label="Loading ticket details..." />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className={styles.container}>
        <div style={{ padding: 'var(--space-6)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-danger)', margin: '0 0 8px' }}>Ticket Not Found</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>{error || 'Unable to locate ticket record.'}</p>
          <Button variant="primary" onClick={() => navigate('/tracks/fixit/tickets')}>
            ← Back to All Tickets
          </Button>
        </div>
      </div>
    )
  }

  const isManager = isFixitManager(user)
  const isReporter = user?.email?.toLowerCase() === ticket.reporter?.email?.toLowerCase() || isManager

  const photoUrl = getTicketPhotoUrl(ticket.id)

  const createdStr = new Date(ticket.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const updatedStr = new Date(ticket.updated_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className={styles.container}>
      {/* Top navigation */}
      <div className={styles.topNav}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={() => loadTicket(ticket.id)}>
            🔄 Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/tracks/fixit/tickets')}>
            📋 All Tickets
          </Button>
        </div>
      </div>

      {/* Ticket Header Card */}
      <div className={styles.ticketHeaderCard}>
        <div className={styles.headerLeft}>
          <div className={styles.idRow}>
            <span className={styles.ticketId}>{ticket.id}</span>
            <Badge
              size="md"
              tone={
                ticket.status === 'resolved'
                  ? 'success'
                  : ticket.status === 'acknowledged'
                  ? 'primary'
                  : 'warning'
              }
            >
              {ticket.status.toUpperCase()}
            </Badge>

            {ticket.is_overdue && (
              <Badge size="md" tone="danger">
                ⚠️ OVERDUE
              </Badge>
            )}
          </div>

          <h1 className={styles.ticketTitle}>{ticket.title}</h1>

          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Created {createdStr} • Last updated {updatedStr}
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Status Workflow Primary Action */}
          {ticket.status === 'open' && isManager && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setResolveModalOpen(true)}
            >
              ✅ Mark as Resolved
            </Button>
          )}

          {ticket.status === 'resolved' && isReporter && (
            <Button
              variant="primary"
              size="sm"
              style={{ background: 'var(--color-success)' }}
              onClick={() => setAckModalOpen(true)}
            >
              🎉 Acknowledge Resolution
            </Button>
          )}

          {ticket.status === 'acknowledged' && (
            <Badge tone="success" size="md">
              ✓ Formally Closed &amp; Verified
            </Badge>
          )}
        </div>
      </div>

      {/* Main Grid: Left Details + Right Workflow Panels */}
      <div className={styles.detailsGrid}>
        {/* Left Column */}
        <div>
          {/* Issue Overview Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span>📄</span> Incident Information
            </h2>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Facility / Building</span>
                <span className={styles.infoValue}>{ticket.building}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Location / Room</span>
                <span className={styles.infoValue}>{ticket.location || 'General facility'}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Issue Category</span>
                <span className={styles.infoValue}>{ticket.issue_type}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Committed Target TAT</span>
                <span className={styles.infoValue} style={{ color: ticket.is_overdue ? 'var(--color-danger)' : 'inherit' }}>
                  {ticket.expected_completion_date
                    ? new Date(ticket.expected_completion_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
                    : 'Awaiting scheduling'}
                </span>
              </div>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Incident Description</span>
              <div className={styles.descriptionBox}>{ticket.description}</div>
            </div>
          </div>

          {/* Photographic Evidence Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span>📸</span> Photographic Site Evidence
            </h2>

            <div className={styles.photoWrapper}>
              <img
                src={photoUrl}
                alt={`Evidence photo for ticket ${ticket.id}`}
                className={styles.photoImg}
                onClick={() => setPhotoModalOpen(true)}
                style={{ cursor: 'pointer' }}
              />

              <div className={styles.photoBar}>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Visual Diagnostic Archive ({ticket.id})
                </span>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPhotoModalOpen(true)}
                  >
                    🔍 Enlarge
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    loading={downloadingPhoto}
                    onClick={handleDownloadPhoto}
                  >
                    ⬇️ Download Photo
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Status History & Timeline Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span>⏱️</span> Workflow History &amp; Audit Trail
            </h2>

            <div className={styles.timeline}>
              {(ticket.status_history || []).map((ev, idx) => (
                <div key={idx} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineHeader}>
                    <span className={styles.timelineAuthor}>{ev.changed_by}</span>
                    <Badge size="sm" tone={ev.status === 'resolved' ? 'success' : ev.status === 'acknowledged' ? 'primary' : 'warning'}>
                      {ev.status.toUpperCase()}
                    </Badge>
                    <span className={styles.timelineTime}>
                      {new Date(ev.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  {ev.comment && <div className={styles.timelineComment}>{ev.comment}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Reporter Information Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span>👤</span> Reporter Profile
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {ticket.reporter?.name ? ticket.reporter.name[0].toUpperCase() : 'R'}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 14 }}>
                  {ticket.reporter?.name || 'Anonymous Member'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {ticket.reporter?.email}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <Badge tone="neutral" size="sm">
                Role: {ticket.reporter?.role ? ticket.reporter.role.toUpperCase() : 'STUDENT'}
              </Badge>
            </div>
          </div>

          {/* Workflow Action Notice */}
          <div className={styles.workflowCard}>
            <span className={styles.workflowTitle}>Status Workflow</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 'bold' }}>
              <span style={{ color: ticket.status === 'open' ? 'var(--amber-500)' : 'var(--color-text-muted)' }}>1. OPEN</span>
              <span>→</span>
              <span style={{ color: ticket.status === 'resolved' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>2. RESOLVED</span>
              <span>→</span>
              <span style={{ color: ticket.status === 'acknowledged' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>3. ACKNOWLEDGED</span>
            </div>

            <div className={styles.workflowDesc}>
              {ticket.status === 'open' && (
                <span>Issue is currently dispatched. Campus Manager can mark work as resolved when maintenance operations complete.</span>
              )}
              {ticket.status === 'resolved' && (
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                  Work is marked resolved! The reporter must now inspect the repair and formally acknowledge completion.
                </span>
              )}
              {ticket.status === 'acknowledged' && (
                <span style={{ color: 'var(--color-primary)' }}>
                  Incident lifecycle is complete. Reporter has verified and signed off on the resolution.
                </span>
              )}
            </div>

            {ticket.status === 'resolved' && isReporter && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAckModalOpen(true)}
                style={{ background: 'var(--color-success)', marginTop: 4 }}
              >
                🎉 Acknowledge Resolution Now
              </Button>
            )}

            {ticket.status === 'open' && isManager && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setResolveModalOpen(true)}
                style={{ marginTop: 4 }}
              >
                Mark as Resolved
              </Button>
            )}
          </div>

          {/* Expected Completion Date (TAT) Management */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span>📅</span> Target TAT Management
            </h2>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Expected Completion Date
              </label>
              <input
                type="date"
                value={tatDate}
                onChange={(e) => setTatDate(e.target.value)}
                disabled={!isManager || tatSubmitting}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            {isManager && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveTat}
                loading={tatSubmitting}
                disabled={!tatDate}
              >
                Update Committed TAT
              </Button>
            )}
          </div>

          {/* Manager Operational Notes */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span>📝</span> Manager Operations Notes
            </h2>

            <textarea
              style={{ width: '100%', minHeight: 90, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
              placeholder={isManager ? 'Add operational diagnostic notes, vendor order IDs, technician notes...' : 'No notes added by manager.'}
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              disabled={!isManager || notesSubmitting}
            />

            {isManager && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveNotes}
                loading={notesSubmitting}
              >
                Save Notes
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* RESOLVE ISSUE MODAL */}
      <Modal
        open={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Mark Maintenance Ticket as Resolved"
        description="Verify technician completion and transition ticket to RESOLVED status pending reporter sign-off."
      >
        <form onSubmit={handleConfirmResolve}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Resolution Summary &amp; Notes
              </label>
              <textarea
                style={{ width: '100%', minHeight: 90, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                placeholder="Explain the repair performed, parts replaced, and verification testing..."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setResolveModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={resolveSubmitting}>
                Confirm Resolution
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ACKNOWLEDGE ISSUE MODAL */}
      <Modal
        open={ackModalOpen}
        onClose={() => setAckModalOpen(false)}
        title="Formally Acknowledge Resolution"
        description="Confirm that the maintenance issue has been inspected and resolved satisfactorily."
      >
        <form onSubmit={handleConfirmAcknowledge}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)' }}>
              By acknowledging this ticket, you verify that the reported fault at{' '}
              <strong>{ticket.building}</strong> has been inspected and confirmed operational.
            </p>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Reporter Feedback / Comments (Optional)
              </label>
              <textarea
                style={{ width: '100%', minHeight: 70, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                placeholder="e.g. Inspected and tested lighting. Everything is working perfectly."
                value={ackFeedback}
                onChange={(e) => setAckFeedback(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setAckModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" style={{ background: 'var(--color-success)' }} loading={ackSubmitting}>
                Confirm &amp; Acknowledge
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* FULL PHOTO PREVIEW MODAL */}
      <Modal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        title={`Inspection Evidence: ${ticket.id}`}
        maxWidth={840}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <img
            src={photoUrl}
            alt="Full size evidence"
            style={{ width: '100%', maxHeight: '65vh', objectFit: 'contain', background: 'var(--navy-900)', borderRadius: 4 }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => setPhotoModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" loading={downloadingPhoto} onClick={handleDownloadPhoto}>
              ⬇️ Download Photo File
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

