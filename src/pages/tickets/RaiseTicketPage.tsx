import { useState, useEffect, useRef, type ChangeEvent, type FormEvent, type DragEvent } from 'react'
import { useNavigate, Link } from 'react-router'
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'
import { listIssueTypes, type IssueType } from '@/core/api/issueTypesApi'
import { createTicket, type Ticket } from '@/core/api/ticketsApi'
import { validateImageFile, sanitizeTextInput, sanitizeErrorMessage } from '@/core/utils'
import styles from './RaiseTicketPage.module.css'

export function RaiseTicketPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [issueTypes, setIssueTypes] = useState<IssueType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [_typesError, setTypesError] = useState<string | null>(null)

  // Form State
  const [issueTypeId, setIssueTypeId] = useState('')
  const [manualCategory, setManualCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Submission State
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    async function loadTypes() {
      setLoadingTypes(true)
      try {
        const types = await listIssueTypes()
        setIssueTypes(types)
        if (types.length > 0) {
          setIssueTypeId(types[0].id)
        }
      } catch {
        setTypesError('Failed to load issue categories from server.')
      } finally {
        setLoadingTypes(false)
      }
    }
    loadTypes()
  }, [])

  // Handle Photo selection with deep magic byte security verification
  const handlePhotoSelect = async (file: File) => {
    setFormError(null)

    // Deep binary security inspection: file size, extension, MIME, and magic bytes (JPEG/PNG)
    const validation = await validateImageFile(file)
    if (!validation.valid) {
      setFormError(validation.error || 'Invalid photo format. Only genuine JPEG or PNG files up to 5 MB are permitted.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void handlePhotoSelect(e.target.files[0])
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handlePhotoSelect(e.dataTransfer.files[0])
    }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const cleanTitle = sanitizeTextInput(title, 120)
    const cleanDesc = sanitizeTextInput(description, 2000)
    const cleanManual = sanitizeTextInput(manualCategory, 100)

    // Title validation (3-120 chars)
    if (cleanTitle.length < 3 || cleanTitle.length > 120) {
      setFormError('Complaint title must be between 3 and 120 characters.')
      return
    }

    // Description validation (5-2000 chars)
    if (cleanDesc.length < 5 || cleanDesc.length > 2000) {
      setFormError('Description must be between 5 and 2000 characters.')
      return
    }

    if (!issueTypeId) {
      setFormError('Please select a valid issue type category.')
      return
    }

    const isOther =
      issueTypeId === 'it-8' ||
      issueTypeId === 'other' ||
      issueTypeId === '__manual_other__' ||
      issueTypes.find((t) => t.id === issueTypeId)?.name.toLowerCase().includes('other')

    let finalDesc = cleanDesc
    if (isOther && cleanManual) {
      finalDesc = `[Manual Issue: ${cleanManual}]\n\n${cleanDesc}`
    }

    let finalTypeId = issueTypeId
    if (finalTypeId === '__manual_other__') {
      const otherType = issueTypes.find((t) => t.id === 'it-8' || t.name.toLowerCase().includes('other'))
      finalTypeId = otherType?.id || issueTypes[0]?.id || ''
    }

    setSubmitting(true)
    try {
      const newTicket = await createTicket({
        issue_type_id: finalTypeId,
        title: cleanTitle,
        description: finalDesc,
        photo: photoFile,
      })
      setCreatedTicket(newTicket)
    } catch (err: unknown) {
      setFormError(sanitizeErrorMessage(err, 'Failed to submit ticket. Check details and try again.'))
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Top Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link to="/my-tickets" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to My Tickets</span>
        </Link>
      </div>

      <div className={styles.header}>
        <span className={styles.kicker}>INCIDENT DISPATCH INGESTION</span>
        <h1 className={styles.title}>Raise Maintenance Complaint</h1>
        <p className={styles.subtitle}>
          Report equipment failures, physical infrastructure defects, or utility interruptions to Campus Maintenance.
        </p>
      </div>

      {/* Success Modal / Banner */}
      {createdTicket ? (
        <div className={styles.successCard}>
          <div className={styles.successIconBox}>
            <CheckCircle2 size={40} className={styles.successCheck} />
          </div>
          <h2 className={styles.successTitle}>Complaint Registered Successfully</h2>
          <p className={styles.successDesc}>
            Your maintenance ticket has been ingested into the facility work order queue.
          </p>
          <div className={styles.ticketIdBox}>
            <span className={styles.idLabel}>ASSIGNED TICKET ID:</span>
            <strong className={styles.idValue}>{createdTicket.id}</strong>
          </div>
          <div className={styles.successActions}>
            <button
              type="button"
              onClick={() => navigate(`/tickets/${createdTicket.id}`)}
              className={styles.viewTicketBtn}
            >
              <span>View Ticket Details</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatedTicket(null)
                setTitle('')
                setDescription('')
                handleRemovePhoto()
              }}
              className={styles.raiseAnotherBtn}
            >
              Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.formCard}>
          {formError && (
            <div className={styles.errorAlert} role="alert">
              <AlertCircle size={18} className={styles.errorIcon} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Issue Category Dropdown */}
            <div className={styles.formGroup}>
              <label htmlFor="issue-category" className={styles.label}>
                Issue Category <span className={styles.requiredMark}>*</span>
              </label>
              {loadingTypes ? (
                <div className={styles.typesLoading}>
                  <RefreshCw size={14} className={styles.spinning} />
                  <span>Loading categories from backend...</span>
                </div>
              ) : (
                <select
                  id="issue-category"
                  value={issueTypeId}
                  onChange={(e) => setIssueTypeId(e.target.value)}
                  className={styles.selectInput}
                  required
                >
                  {issueTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.description ? `— ${t.description}` : ''}
                    </option>
                  ))}
                  {!issueTypes.some((t) => t.id === 'it-8' || t.name.toLowerCase().includes('other')) && (
                    <option value="__manual_other__">
                      Other / Miscellaneous — Unlisted manual facility issue
                    </option>
                  )}
                </select>
              )}
              <span className={styles.inputHint}>
                Categories are loaded directly from the campus server database.
              </span>
            </div>

            {/* Manual Other Issue Specification */}
            {(issueTypeId === 'it-8' ||
              issueTypeId === 'other' ||
              issueTypeId === '__manual_other__' ||
              issueTypes.find((t) => t.id === issueTypeId)?.name.toLowerCase().includes('other')) && (
              <div className={styles.formGroup}>
                <label htmlFor="manual-category" className={styles.label}>
                  Manual Issue Category Specification <span className={styles.requiredMark}>*</span>
                </label>
                <input
                  id="manual-category"
                  type="text"
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  placeholder="e.g. Broken water cooler sensor, Laboratory centrifuge vibration..."
                  className={styles.textInput}
                  required
                />
                <span className={styles.inputHint}>
                  Specify the custom operational category or defect details for Maintenance dispatch.
                </span>
              </div>
            )}

            {/* Complaint Title */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="ticket-title" className={styles.label}>
                  Complaint Title <span className={styles.requiredMark}>*</span>
                </label>
                <span className={styles.charCount}>{title.length}/120</span>
              </div>
              <input
                id="ticket-title"
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Block Room 402 - Ceiling Fan Not Spinning"
                className={styles.textInput}
              />
              <span className={styles.inputHint}>
                Concise summary of the problem (3 to 120 characters).
              </span>
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="ticket-desc" className={styles.label}>
                  Detailed Description <span className={styles.requiredMark}>*</span>
                </label>
                <span className={styles.charCount}>{description.length}/2000</span>
              </div>
              <textarea
                id="ticket-desc"
                required
                rows={5}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide exact location details (Block, Floor, Room number) and symptom specifics..."
                className={styles.textareaInput}
              />
              <span className={styles.inputHint}>
                State where the problem is located and describe what is failing (5 to 2000 characters).
              </span>
            </div>

            {/* Photo Attachment (Drag & Drop / Preview / Remove / Replace) */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Photographic Evidence <span className={styles.optionalMark}>(Optional)</span>
              </label>

              {photoPreview ? (
                <div className={styles.previewBox}>
                  <img src={photoPreview} alt="Evidence preview" className={styles.previewImg} />
                  <div className={styles.previewOverlay}>
                    <div className={styles.previewInfo}>
                      <span className={styles.fileName}>{photoFile?.name}</span>
                      <span className={styles.fileSize}>
                        {photoFile ? `${(photoFile.size / 1024).toFixed(1)} KB` : ''}
                      </span>
                    </div>
                    <div className={styles.previewControls}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.replaceBtn}
                      >
                        Replace Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className={styles.removeBtn}
                        aria-label="Remove photo"
                      >
                        <X size={16} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} className={styles.uploadIcon} />
                  <strong>Click to upload or drag and drop photo</strong>
                  <p>Supports JPEG and PNG formats up to 5 MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Submit Action Button */}
            <div className={styles.submitRow}>
              <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
              >
                {submitting ? (
                  <>
                    <span className={styles.spinner} />
                    <span>Submitting to Campus Operations...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Maintenance Ticket</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
