import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Wrench,
  Camera,
  User,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { useAuth, isCampusMaintenanceStaff, isAdminUser } from '@/core/auth'
import {
  getTicket,
  updateTicket,
  deleteTicket,
  acknowledgeTicket,
  updateTicketStatus,
  updateTicketTat,
  downloadTicketPhoto,
  type Ticket,
} from '@/core/api/ticketsApi'
import { listIssueTypes, type IssueType } from '@/core/api/issueTypesApi'
import { formatIST, formatDateIST } from '@/core/utils/date'
import { validateImageFile, sanitizeTextInput, isSafeUrl, sanitizeErrorMessage } from '@/core/utils'
import styles from './TicketDetailsPage.module.css'

export function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Edit Ticket Modal State (Reporter & Maintenance)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIssueTypeId, setEditIssueTypeId] = useState('')
  const [editManualCategory, setEditManualCategory] = useState('')
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null)
  const [editRemovePhoto, setEditRemovePhoto] = useState(false)
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([])

  // Maintenance Actions State
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [progressNote, setProgressNote] = useState('')
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolveNote, setResolveNote] = useState('')
  const [reopenModalOpen, setReopenModalOpen] = useState(false)
  const [reopenNote, setReopenNote] = useState('')
  const [tatModalOpen, setTatModalOpen] = useState(false)
  const [tatDate, setTatDate] = useState('')
  const [tatNote, setTatNote] = useState('')

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const isCM = isCampusMaintenanceStaff(user)
  const isAdmin = isAdminUser(user)
  const isOwner = user && ticket && ((user.email || '').toLowerCase() === (ticket.reported_by || '').toLowerCase() || user.id === ticket.reported_by)

  const loadTicketDetails = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getTicket(id)
      setTicket(data)
    } catch (err: unknown) {
      setError(sanitizeErrorMessage(err, 'Failed to retrieve ticket details from campus server.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTicketDetails()
  }, [id])

  // Pre-load issue types for edit modal
  useEffect(() => {
    listIssueTypes().then(setIssueTypes).catch(() => {})
  }, [])

  // Handle Photo Download with token
  const handlePhotoDownload = async () => {
    if (!ticket) return
    try {
      await downloadTicketPhoto(ticket.id, `${ticket.id}-evidence.jpg`)
    } catch (err: unknown) {
      setError(sanitizeErrorMessage(err, 'Could not download photo.'))
    }
  }

  // Reporter Acknowledge Action
  const handleAcknowledge = async () => {
    if (!ticket) return
    setActionLoading(true)
    setError(null)
    try {
      const updated = await acknowledgeTicket(ticket.id)
      setTicket(updated)
      setActionSuccess('Resolution acknowledged! Ticket is now officially verified and closed.')
    } catch (err: unknown) {
      setError(sanitizeErrorMessage(err, 'Failed to acknowledge ticket.'))
    } finally {
      setActionLoading(false)
    }
  }

  // Open Edit Ticket Modal
  const openEditModal = () => {
    if (!ticket) return
    setEditTitle(ticket.title)
    const match = ticket.description.match(/^\[Manual (?:Issue|Category|Issue Category):\s*([^\]]+)\]\s*\n\n?([\s\S]*)$/i)
    if (match) {
      setEditManualCategory(match[1])
      setEditDescription(match[2])
    } else {
      setEditManualCategory('')
      setEditDescription(ticket.description)
    }
    setEditIssueTypeId(ticket.issue_type_id)
    setEditPhotoFile(null)
    setEditRemovePhoto(false)
    setEditModalOpen(true)
  }

  // Edit Submit (Reporter or Maintenance)
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!ticket) return
    setActionLoading(true)
    setError(null)

    const cleanTitle = sanitizeTextInput(editTitle, 120)
    const cleanDesc = sanitizeTextInput(editDescription, 2000)
    const cleanManual = sanitizeTextInput(editManualCategory, 100)

    if (cleanTitle.length < 3 || cleanTitle.length > 120) {
      setError('Title must be between 3 and 120 characters.')
      setActionLoading(false)
      return
    }

    if (cleanDesc.length < 5 || cleanDesc.length > 2000) {
      setError('Description must be between 5 and 2000 characters.')
      setActionLoading(false)
      return
    }

    const isOther =
      editIssueTypeId === 'it-8' ||
      editIssueTypeId === 'other' ||
      editIssueTypeId === '__manual_other__' ||
      issueTypes.find((t) => t.id === editIssueTypeId)?.name.toLowerCase().includes('other')

    let finalDesc = cleanDesc
    if (isOther && cleanManual) {
      finalDesc = `[Manual Issue: ${cleanManual}]\n\n${finalDesc}`
    }

    let finalTypeId = editIssueTypeId
    if (finalTypeId === '__manual_other__') {
      const otherType = issueTypes.find((t) => t.id === 'it-8' || t.name.toLowerCase().includes('other'))
      finalTypeId = otherType?.id || issueTypes[0]?.id || ''
    }

    try {
      const updated = await updateTicket(ticket.id, {
        title: cleanTitle,
        description: finalDesc,
        issue_type_id: finalTypeId || undefined,
        photo: editPhotoFile,
        remove_photo: editRemovePhoto,
      })
      setTicket(updated)
      setEditModalOpen(false)
      setActionSuccess('Work order modified successfully.')
    } catch (err: unknown) {
      setError(sanitizeErrorMessage(err, 'Failed to update ticket.'))
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Ticket
  const handleDeleteTicket = async () => {
    if (!ticket) return
    setActionLoading(true)
    setError(null)
    try {
      await deleteTicket(ticket.id)
      if (isCM) {
        navigate('/operations/tickets', { replace: true })
      } else if (isAdmin) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/my-tickets', { replace: true })
      }
    } catch (err: unknown) {
      setError(sanitizeErrorMessage(err, 'Failed to delete ticket.'))
      setActionLoading(false)
      setDeleteConfirmOpen(false)
    }
  }

  // Maintenance: Post Progress
  const handlePostProgress = async (e: FormEvent) => {
    e.preventDefault()
    const cleanNote = sanitizeTextInput(progressNote, 1000)
    if (!ticket || !cleanNote) return
    setActionLoading(true)
    try {
      const updated = await updateTicketStatus(ticket.id, 'open', cleanNote)
      setTicket(updated)
      setProgressModalOpen(false)
      setProgressNote('')
      setActionSuccess('Progress update dispatched to reporter.')
    } catch (err: unknown) {
      setError(sanitizeErrorMessage(err, 'Failed to post progress.'))
    } finally {
      setActionLoading(false)
    }
  }

  // Maintenance: Mark Resolved
  const handleResolveTicket = async (e: FormEvent) => {
    e.preventDefault()
    const cleanNote = sanitizeTextInput(resolveNote, 1000)
    if (!ticket || !cleanNote) return
    setActionLoading(true)
    try {
      const updated = await updateTicketStatus(ticket.id, 'resolved', cleanNote)
      setTicket(updated)
      setResolveModalOpen(false)
      setResolveNote('')
      setActionSuccess('Work order marked as resolved. Waiting for reporter confirmation.')
    } catch (err: unknown) {
      setError(sanitizeErrorMessage(err, 'Failed to resolve ticket.'))
    } finally {
      setActionLoading(false)
    }
  }

  // Maintenance: Reopen Resolved
  const handleReopenTicket = async (e: FormEvent) => {
    e.preventDefault()
    const cleanNote = sanitizeTextInput(reopenNote, 1000)
    if (!ticket || !cleanNote) return
    setActionLoading(true)
    try {
      const updated = await updateTicketStatus(ticket.id, 'open', cleanNote)
      setTicket(updated)
      setReopenModalOpen(false)
      setReopenNote('')
      setActionSuccess('Ticket reopened for further inspection.')
    } catch (err: unknown) {
      setError(sanitizeErrorMessage(err, 'Failed to reopen ticket.'))
    } finally {
      setActionLoading(false)
    }
  }

  // Maintenance: Set TAT
  const handleSetTat = async (e: FormEvent) => {
    e.preventDefault()
    if (!ticket || !tatDate) return
    setActionLoading(true)
    const cleanNote = sanitizeTextInput(tatNote, 500)
    try {
      const updated = await updateTicketTat(ticket.id, tatDate, cleanNote)
      setTicket(updated)
      setTatModalOpen(false)
      setActionSuccess('Target turnaround date committed successfully.')
    } catch (err: unknown) {
      setError(sanitizeErrorMessage(err, 'Failed to set turnaround date.'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <RefreshCw size={24} className={styles.spinning} />
        <span>Loading ticket specifications...</span>
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className={styles.errorCard}>
        <AlertCircle size={32} className={styles.errorIcon} />
        <h2>Ticket Unavailable</h2>
        <p>{error}</p>
        <Link to="/my-tickets" className={styles.returnBtn}>
          Return to Tickets
        </Link>
      </div>
    )
  }

  if (!ticket) return null

  // Role & Permission Protection:
  // Prevent unauthorized users from accessing another user's ticket by manipulating the URL/ID
  if (!isCM && !isAdmin && !isOwner) {
    return (
      <div className={styles.errorCard}>
        <ShieldAlert size={36} className={styles.errorIcon} />
        <h2>403 - Restricted Work Order Access</h2>
        <p>
          You do not have permission to view ticket <strong>{ticket.id}</strong>. Only the original reporter,
          authorized Campus Maintenance personnel, or system administrators can view this ticket.
        </p>
        <Link to="/my-tickets" className={styles.returnBtn}>
          Return to My Tickets
        </Link>
      </div>
    )
  }

  // Determine Timeline Step States
  // Timeline: REPORTED → MAINTENANCE IN PROGRESS → RESOLVED → CONFIRMED
  // "Maintenance in progress" is an open ticket with progress update
  const hasProgress = Boolean(ticket.update && ticket.update.note)
  const isResolved = ticket.status === 'resolved'
  const isAcknowledged = ticket.status === 'acknowledged'

  return (
    <div className={styles.container}>
      {/* Top Bar Navigation */}
      <div className={styles.topBar}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className={styles.topBarRight}>
          <button
            type="button"
            className={styles.refreshIconBtn}
            onClick={loadTicketDetails}
            title="Refresh ticket"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className={styles.successBanner} role="status">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
          <button type="button" onClick={() => setActionSuccess(null)} className={styles.closeAlertBtn}>
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className={styles.closeAlertBtn}>
            Dismiss
          </button>
        </div>
      )}

      {/* Ticket Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.headerMetaRow}>
            <span className={styles.ticketIdBadge}>{ticket.id}</span>
            <span className={styles.categoryPill}>{ticket.issue_type_name}</span>
            {ticket.overdue && ticket.status === 'open' && (
              <span className={styles.overdueBadge}>OVERDUE</span>
            )}
          </div>

          <span
            className={`${styles.statusBadge} ${
              ticket.status === 'open'
                ? styles.statusOpen
                : ticket.status === 'resolved'
                ? styles.statusResolved
                : styles.statusAck
            }`}
          >
            {ticket.status.toUpperCase()}
          </span>
        </div>

        <h1 className={styles.ticketTitle}>{ticket.title}</h1>

        <div className={styles.headerDetailsGrid}>
          <div className={styles.headerDetailItem}>
            <Calendar size={15} />
            <span>Reported: {formatIST(ticket.created_at)}</span>
          </div>

          <div className={styles.headerDetailItem}>
            <Clock size={15} />
            <span>
              Expected TAT:{' '}
              {ticket.tat?.expected_by ? (
                <strong className={ticket.overdue ? styles.tatOverdue : styles.tatNormal}>
                  {ticket.tat.expected_by}
                </strong>
              ) : (
                <em className={styles.tatNone}>Uncommitted</em>
              )}
            </span>
          </div>

          <div className={styles.headerDetailItem}>
            <User size={15} />
            <span>
              Reporter: {ticket.reported_by_name} ({ticket.reported_by_role})
            </span>
          </div>
        </div>
      </div>

      {/* Maintenance Progress Timeline */}
      <div className={styles.timelineCard}>
        <h3 className={styles.sectionHeading}>Maintenance Resolution Cycle</h3>
        <p className={styles.sectionSub}>Closed-loop lifecycle tracking from physical report to final sign-off</p>

        <div className={styles.timelineTrack}>
          {/* Step 1: Reported */}
          <div className={`${styles.timelineStep} ${styles.stepCompleted}`}>
            <div className={styles.stepIndicator}>
              <Check size={14} />
            </div>
            <div className={styles.stepInfo}>
              <strong>01 REPORTED</strong>
              <small>{formatDateIST(ticket.created_at)}</small>
            </div>
          </div>

          <div className={`${styles.stepConnector} ${hasProgress || isResolved || isAcknowledged ? styles.connectorActive : ''}`} />

          {/* Step 2: Maintenance In Progress */}
          <div
            className={`${styles.timelineStep} ${
              hasProgress || isResolved || isAcknowledged
                ? styles.stepCompleted
                : ticket.status === 'open'
                ? styles.stepCurrent
                : ''
            }`}
          >
            <div className={styles.stepIndicator}>
              {hasProgress || isResolved || isAcknowledged ? (
                <Check size={14} />
              ) : (
                <Clock size={14} />
              )}
            </div>
            <div className={styles.stepInfo}>
              <strong>02 IN PROGRESS</strong>
              <small>{hasProgress ? 'Technician assigned' : 'Queue dispatch'}</small>
            </div>
          </div>

          <div className={`${styles.stepConnector} ${isResolved || isAcknowledged ? styles.connectorActive : ''}`} />

          {/* Step 3: Resolved */}
          <div
            className={`${styles.timelineStep} ${
              isAcknowledged ? styles.stepCompleted : isResolved ? styles.stepCurrent : ''
            }`}
          >
            <div className={styles.stepIndicator}>
              {isAcknowledged ? <Check size={14} /> : <Wrench size={14} />}
            </div>
            <div className={styles.stepInfo}>
              <strong>03 RESOLVED</strong>
              <small>{isResolved ? 'Awaiting confirmation' : isAcknowledged ? 'Completed' : 'Pending service'}</small>
            </div>
          </div>

          <div className={`${styles.stepConnector} ${isAcknowledged ? styles.connectorActive : ''}`} />

          {/* Step 4: Confirmed (Acknowledged) */}
          <div className={`${styles.timelineStep} ${isAcknowledged ? styles.stepCompleted : ''}`}>
            <div className={styles.stepIndicator}>
              <CheckCircle2 size={14} />
            </div>
            <div className={styles.stepInfo}>
              <strong>04 CONFIRMED</strong>
              <small>{isAcknowledged ? 'Reporter signed off' : 'Final step'}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Description & Evidence vs Actions & Reporter Details */}
      <div className={styles.bodyGrid}>
        {/* Left Column: Description & Photo Evidence */}
        <div className={styles.leftCol}>
          {/* Description Card */}
          <div className={styles.contentCard}>
            <h3 className={styles.cardHeader}>Problem Description</h3>
            <p className={styles.descText}>{ticket.description}</p>
          </div>

          {/* Photographic Evidence Card */}
          <div className={styles.contentCard}>
            <div className={styles.evidenceHeader}>
              <h3 className={styles.cardHeader}>Photographic Evidence</h3>
              {ticket.photo && (
                <button
                  type="button"
                  onClick={handlePhotoDownload}
                  className={styles.downloadPhotoBtn}
                >
                  <Download size={14} />
                  <span>Download Image</span>
                </button>
              )}
            </div>

            {ticket.photo ? (
              <div className={styles.photoContainer}>
                {isSafeUrl(ticket.photo.url) ? (
                  <img
                    src={ticket.photo.url}
                    alt={ticket.photo.filename || 'Ticket evidence'}
                    className={styles.evidenceImage}
                  />
                ) : (
                  <div style={{ padding: '1rem', color: '#D95757', fontSize: '0.88rem' }}>
                    Unsafe image URL protocol blocked by security policy.
                  </div>
                )}
                <div className={styles.photoMeta}>
                  <span>{ticket.photo.filename}</span>
                  <span>{(ticket.photo.size_bytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            ) : (
              <div className={styles.noPhotoBox}>
                <Camera size={24} className={styles.noPhotoIcon} />
                <p>No photograph was attached with this report.</p>
              </div>
            )}
          </div>

          {/* Maintenance Update Notes */}
          {ticket.update && (
            <div className={styles.updateCard}>
              <span className={styles.updateCardKicker}>LATEST TECHNICIAN LOG</span>
              <p className={styles.updateCardText}>"{ticket.update.note}"</p>
              <div className={styles.updateCardFooter}>
                <span>Dispatched by {ticket.update.updated_by_name}</span>
                <span>{formatIST(ticket.update.updated_at)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Context & Actions */}
        <div className={styles.rightCol}>
          {/* Action Box based on Role & Status */}
          <div className={styles.actionsCard}>
            <h3 className={styles.cardHeader}>Operational Actions</h3>

            {/* Reporter Acknowledge Action (if resolved) */}
            {isOwner && ticket.status === 'resolved' && (
              <div className={styles.acknowledgePrompt}>
                <CheckCircle2 size={24} className={styles.ackIcon} />
                <div>
                  <strong>Work Marked Resolved</strong>
                  <p>Campus Maintenance has addressed this issue. Confirm if the fault is resolved on site.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  disabled={actionLoading}
                  className={styles.acknowledgeBtn}
                >
                  <Check size={16} />
                  <span>Confirm Fix & Close Ticket</span>
                </button>
              </div>
            )}

            {/* Reporter Open Actions (Edit / Delete) */}
            {isOwner && ticket.status === 'open' && (
              <div className={styles.reporterActions}>
                <button
                  type="button"
                  onClick={openEditModal}
                  className={styles.editBtn}
                >
                  <Edit3 size={15} />
                  <span>Edit Ticket & Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className={styles.deleteBtn}
                >
                  <Trash2 size={15} />
                  <span>Withdraw / Delete Ticket</span>
                </button>
              </div>
            )}

            {/* Campus Maintenance Actions */}
            {isCM && (
              <div className={styles.cmActionStack}>
                <span className={styles.actionStackHeading}>FACILITY CONTROLS</span>

                <button
                  type="button"
                  onClick={openEditModal}
                  className={styles.cmModifyBtn}
                >
                  <Edit3 size={15} />
                  <span>Modify Ticket Details & Category</span>
                </button>

                {ticket.status === 'open' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setProgressModalOpen(true)}
                      className={styles.cmProgressBtn}
                    >
                      <Clock size={15} />
                      <span>Post Progress Note</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTatModalOpen(true)}
                      className={styles.cmTatBtn}
                    >
                      <Calendar size={15} />
                      <span>Set Turnaround Time (TAT)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolveModalOpen(true)}
                      className={styles.cmResolveBtn}
                    >
                      <CheckCircle2 size={15} />
                      <span>Mark as Resolved</span>
                    </button>
                  </>
                )}

                {ticket.status === 'resolved' && (
                  <button
                    type="button"
                    onClick={() => setReopenModalOpen(true)}
                    className={styles.cmReopenBtn}
                  >
                    <RotateCcw size={15} />
                    <span>Reopen Work Order</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className={styles.cmDeleteBtn}
                >
                  <Trash2 size={15} />
                  <span>Delete Work Order</span>
                </button>
              </div>
            )}

            {/* Admin Delete Action */}
            {isAdmin && !isCM && (
              <div className={styles.adminActionBox}>
                <button
                  type="button"
                  onClick={openEditModal}
                  className={styles.editBtn}
                  style={{ marginBottom: '8px' }}
                >
                  <Edit3 size={15} />
                  <span>Modify Ticket (Admin Authority)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className={styles.deleteBtn}
                >
                  <Trash2 size={15} />
                  <span>Delete Ticket (Admin Authority)</span>
                </button>
              </div>
            )}

            {/* Closed Ticket Notice */}
            {ticket.status === 'acknowledged' && (
              <div className={styles.closedNotice}>
                <CheckCircle2 size={18} className={styles.closedIcon} />
                <div>
                  <strong>Ticket Closed</strong>
                  <p>Confirmed and archived on {formatIST(ticket.acknowledged_at || ticket.updated_at)}.</p>
                </div>
              </div>
            )}
          </div>

          {/* Reporter Information Card */}
          <div className={styles.infoCard}>
            <h3 className={styles.cardHeader}>Reporter Details</h3>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Name:</span>
              <strong className={styles.infoVal}>{ticket.reported_by_name}</strong>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Role:</span>
              <span className={styles.roleTag}>{ticket.reported_by_role}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email ID:</span>
              <span className={styles.infoValMono}>{ticket.reported_by}</span>
            </div>
            {ticket.reported_by_dept && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Department:</span>
                <span className={styles.infoVal}>{ticket.reported_by_dept}</span>
              </div>
            )}
            {ticket.reported_by_phone_number && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Phone:</span>
                <span className={styles.infoVal}>{ticket.reported_by_phone_number}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Edit Ticket Modal (Reporter & Maintenance) */}
      {editModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Modify Ticket Details & Evidence</h3>
            <p className={styles.modalSub}>Update operational category classification, defect notes, or photographic evidence.</p>

            <form onSubmit={handleEditSubmit} className={styles.modalForm}>
              <div className={styles.modalGroup}>
                <label>Issue Category</label>
                <select
                  value={editIssueTypeId}
                  onChange={(e) => setEditIssueTypeId(e.target.value)}
                  className={styles.modalSelect}
                >
                  {issueTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  {!issueTypes.some((t) => t.id === 'it-8' || t.name.toLowerCase().includes('other')) && (
                    <option value="__manual_other__">
                      Other / Miscellaneous — Manual Custom Category
                    </option>
                  )}
                </select>
              </div>

              {(editIssueTypeId === 'it-8' ||
                editIssueTypeId === 'other' ||
                editIssueTypeId === '__manual_other__' ||
                issueTypes.find((t) => t.id === editIssueTypeId)?.name.toLowerCase().includes('other')) && (
                <div className={styles.modalGroup}>
                  <label>Manual Issue Category Specification (Custom Defect Name)</label>
                  <input
                    type="text"
                    value={editManualCategory}
                    onChange={(e) => setEditManualCategory(e.target.value)}
                    placeholder="e.g. Broken water cooler sensor, Laboratory centrifuge vibration..."
                    className={styles.modalInput}
                  />
                  <span className={styles.charCountHint}>
                    Specify manual classification for non-standard campus defect
                  </span>
                </div>
              )}

              <div className={styles.modalGroup}>
                <label>Title (3 to 120 chars)</label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalGroup}>
                <label>Description (5 to 2000 chars)</label>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className={styles.modalTextarea}
                />
              </div>

              <div className={styles.modalGroup}>
                <label>Replace Evidence Photo (optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0]
                      const validation = await validateImageFile(file)
                      if (!validation.valid) {
                        setError(validation.error || 'Invalid photo format. Only JPEG or PNG up to 5 MB permitted.')
                        if (fileInputRef.current) fileInputRef.current.value = ''
                        return
                      }
                      setEditPhotoFile(file)
                      setEditRemovePhoto(false)
                    }
                  }}
                  className={styles.modalFileInput}
                />
                {ticket.photo && !editPhotoFile && (
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editRemovePhoto}
                      onChange={(e) => setEditRemovePhoto(e.target.checked)}
                    />
                    <span>Remove current photo completely</span>
                  </label>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={styles.confirmBtn}
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Progress Modal (Campus Maintenance) */}
      {progressModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Post Maintenance Progress Note</h3>
            <p className={styles.modalSub}>
              Enter a mandatory progress update for the reporter (1–280 chars).
            </p>

            <form onSubmit={handlePostProgress} className={styles.modalForm}>
              <div className={styles.modalGroup}>
                <label>Technician Progress Note</label>
                <textarea
                  required
                  rows={3}
                  maxLength={280}
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="e.g. Electrician assigned. Sourcing replacement capacitor from central stock..."
                  className={styles.modalTextarea}
                />
                <span className={styles.charCountHint}>{progressNote.length}/280 chars</span>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setProgressModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !progressNote.trim()}
                  className={styles.confirmBtn}
                >
                  {actionLoading ? 'Posting...' : 'Dispatch Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Resolved Modal (Campus Maintenance) */}
      {resolveModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Mark Work Order as Resolved</h3>
            <p className={styles.modalSub}>
              Describe the physical repair completed. The ticket will await reporter confirmation.
            </p>

            <form onSubmit={handleResolveTicket} className={styles.modalForm}>
              <div className={styles.modalGroup}>
                <label>Resolution Note (Mandatory 1-280 chars)</label>
                <textarea
                  required
                  rows={3}
                  maxLength={280}
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="e.g. Capacitor replaced and motor re-wound. Fan tested in high speed mode."
                  className={styles.modalTextarea}
                />
                <span className={styles.charCountHint}>{resolveNote.length}/280 chars</span>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !resolveNote.trim()}
                  className={styles.confirmSuccessBtn}
                >
                  {actionLoading ? 'Submitting...' : 'Mark Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Modal (Campus Maintenance) */}
      {reopenModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Reopen Resolved Work Order</h3>
            <p className={styles.modalSub}>
              Explain why this ticket is being reopened for ongoing maintenance.
            </p>

            <form onSubmit={handleReopenTicket} className={styles.modalForm}>
              <div className={styles.modalGroup}>
                <label>Reopen Reason (Mandatory 1-280 chars)</label>
                <textarea
                  required
                  rows={3}
                  maxLength={280}
                  value={reopenNote}
                  onChange={(e) => setReopenNote(e.target.value)}
                  placeholder="e.g. Issue persists on further inspection; replacement armature ordered..."
                  className={styles.modalTextarea}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !reopenNote.trim()}
                  className={styles.confirmBtn}
                >
                  {actionLoading ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Turnaround Time (TAT) Modal */}
      {tatModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Set Turnaround Time Commitment</h3>
            <p className={styles.modalSub}>
              Set the expected resolution date for this work order (YYYY-MM-DD).
            </p>

            <form onSubmit={handleSetTat} className={styles.modalForm}>
              <div className={styles.modalGroup}>
                <label>Expected Completion Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={tatDate}
                  onChange={(e) => setTatDate(e.target.value)}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalGroup}>
                <label>Note / Reason (optional)</label>
                <input
                  type="text"
                  maxLength={280}
                  value={tatNote}
                  onChange={(e) => setTatNote(e.target.value)}
                  placeholder="e.g. Waiting for vendor spare parts delivery"
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setTatModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !tatDate}
                  className={styles.confirmBtn}
                >
                  {actionLoading ? 'Saving...' : 'Set Turnaround Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitleCritical}>Confirm Ticket Deletion</h3>
            <p className={styles.modalSub}>
              Are you sure you want to delete ticket <strong>{ticket.id}</strong>? This action will permanently
              remove this work order and its attached evidence photo from the campus database.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTicket}
                disabled={actionLoading}
                className={styles.confirmCriticalBtn}
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
