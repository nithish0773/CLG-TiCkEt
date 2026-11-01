import { useState, useEffect, useRef, type ChangeEvent, type FormEvent, type DragEvent } from 'react'
import { useNavigate } from 'react-router'
import { createTicket, listIssueTypes, type IssueType, type Ticket } from '@/core'
import { Button, Alert, Badge } from '@/ui'
import styles from './RaiseTicketScreen.module.css'

const CAMPUS_BUILDINGS = [
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

interface FormValues {
  categoryId: string
  building: string
  location: string
  title: string
  description: string
}

interface FormErrors {
  categoryId?: string
  building?: string
  location?: string
  title?: string
  description?: string
  photo?: string
}

export function RaiseTicketScreen() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<IssueType[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const [values, setValues] = useState<FormValues>({
    categoryId: '',
    building: CAMPUS_BUILDINGS[0],
    location: '',
    title: '',
    description: '',
  })

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [photoFileName, setPhotoFileName] = useState<string | null>(null)
  const [photoFileSize, setPhotoFileSize] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    listIssueTypes()
      .then((cats) => {
        setCategories(cats)
        if (cats.length > 0) {
          setValues((v) => ({ ...v, categoryId: cats[0].id }))
        }
      })
      .catch((e) => {
        setFormError(e instanceof Error ? e.message : 'Failed to load issue categories.')
      })
      .finally(() => setCategoriesLoading(false))
  }, [])

  function handleInputChange(field: keyof FormValues) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }
  }

  function validateFile(file: File): string | null {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      return 'File must be an image (JPEG, PNG, WebP, or SVG).'
    }
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return 'Image file size must be less than 5MB.'
    }
    return null
  }

  function processFile(file: File) {
    const fileErr = validateFile(file)
    if (fileErr) {
      setErrors((prev) => ({ ...prev, photo: fileErr }))
      return
    }

    setErrors((prev) => ({ ...prev, photo: undefined }))
    setPhotoFileName(file.name)
    setPhotoFileSize((file.size / 1024).toFixed(1) + ' KB')

    const reader = new FileReader()
    reader.onload = (event) => {
      setPhotoDataUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  function removePhoto() {
    setPhotoDataUrl(null)
    setPhotoFileName(null)
    setPhotoFileSize(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!values.categoryId) {
      newErrors.categoryId = 'Please select an issue category.'
    }
    if (!values.title.trim()) {
      newErrors.title = 'Ticket title is required.'
    } else if (values.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters.'
    }
    if (!values.description.trim()) {
      newErrors.description = 'Detailed description is required.'
    } else if (values.description.trim().length < 15) {
      newErrors.description = 'Description must be at least 15 characters to provide sufficient detail.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!validate()) return

    setSubmitting(true)

    try {
      const selectedCat = categories.find((c) => c.id === values.categoryId)
      const ticket = await createTicket({
        title: values.title.trim(),
        description: values.description.trim(),
        issue_type: selectedCat?.name || 'General Infrastructure',
        issue_type_id: values.categoryId,
        building: values.building,
        location: values.location.trim() || 'General Location',
        photo: photoDataUrl || undefined,
      })

      setCreatedTicket(ticket)
      // Reset form
      setValues({
        categoryId: categories[0]?.id || '',
        building: CAMPUS_BUILDINGS[0],
        location: '',
        title: '',
        description: '',
      })
      removePhoto()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit maintenance request. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Raise a Maintenance Issue</h1>
        <p className={styles.subtitle}>
          Report campus facility faults, system failures, or maintenance requirements directly to the Operations Command Center.
        </p>
      </div>

      {createdTicket && (
        <div className={styles.successBox} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <strong style={{ color: 'var(--color-success)', fontSize: 14 }}>
                  Incident Report Successfully Logged
                </strong>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Assigned Ticket Reference:{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--color-text)' }}>
                    {createdTicket.id}
                  </span>
                </div>
              </div>
            </div>
            <Badge tone="success" size="sm">OPEN</Badge>
          </div>

          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)' }}>
            Your request &ldquo;{createdTicket.title}&rdquo; has been routed to the maintenance dispatch pool.
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate(`/tracks/fixit/tickets/${createdTicket.id}`)}
            >
              View Ticket Details →
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCreatedTicket(null)}
            >
              Submit Another Report
            </Button>
          </div>
        </div>
      )}

      {formError && (
        <Alert tone="danger" style={{ marginBottom: 'var(--space-5)' }}>
          {formError}
        </Alert>
      )}

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formGrid}>
            {/* Category & Building */}
            <div className={styles.rowTwo}>
              <div className={styles.fieldGroup}>
                <label htmlFor="issue-category" className={styles.label}>
                  Issue Category <span className={styles.required}>*</span>
                </label>
                <select
                  id="issue-category"
                  className={[styles.select, errors.categoryId && styles.inputError].filter(Boolean).join(' ')}
                  value={values.categoryId}
                  onChange={handleInputChange('categoryId')}
                  disabled={categoriesLoading || submitting}
                >
                  {categoriesLoading ? (
                    <option>Loading categories...</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.categoryId && <span className={styles.errorText}>{errors.categoryId}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="campus-building" className={styles.label}>
                  Campus Facility / Building <span className={styles.required}>*</span>
                </label>
                <select
                  id="campus-building"
                  className={styles.select}
                  value={values.building}
                  onChange={handleInputChange('building')}
                  disabled={submitting}
                >
                  {CAMPUS_BUILDINGS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title & Location details */}
            <div className={styles.fieldGroup}>
              <label htmlFor="ticket-title" className={styles.label}>
                Issue Title <span className={styles.required}>*</span>
              </label>
              <input
                id="ticket-title"
                type="text"
                className={[styles.input, errors.title && styles.inputError].filter(Boolean).join(' ')}
                placeholder="e.g. 3rd Floor Chiller Auxiliary Compressor Overload"
                value={values.title}
                onChange={handleInputChange('title')}
                disabled={submitting}
              />
              {errors.title && <span className={styles.errorText}>{errors.title}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="specific-location" className={styles.label}>
                Exact Room / Specific Floor Location
              </label>
              <input
                id="specific-location"
                type="text"
                className={styles.input}
                placeholder="e.g. Room 302B, Server Corridor, West Wing"
                value={values.location}
                onChange={handleInputChange('location')}
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className={styles.fieldGroup}>
              <label htmlFor="issue-description" className={styles.label}>
                Detailed Description &amp; Fault Symptoms <span className={styles.required}>*</span>
              </label>
              <textarea
                id="issue-description"
                className={[styles.textarea, errors.description && styles.inputError].filter(Boolean).join(' ')}
                placeholder="Describe the problem, when it started, any visible error codes, hazard conditions, or operational impact..."
                value={values.description}
                onChange={handleInputChange('description')}
                disabled={submitting}
              />
              {errors.description && <span className={styles.errorText}>{errors.description}</span>}
            </div>

            {/* Photo Upload: Drag & Drop + Preview */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Photographic Evidence / Site Inspection Image
              </label>

              {!photoDataUrl ? (
                <div
                  className={[styles.dropzone, isDragging && styles.dropzoneActive].filter(Boolean).join(' ')}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className={styles.dropzoneIcon} aria-hidden="true">📸</span>
                  <div className={styles.dropzoneTitle}>
                    Drag and drop an image here, or browse files
                  </div>
                  <div className={styles.dropzoneHint}>
                    Supports JPG, PNG, WebP or SVG up to 5MB
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className={styles.hiddenFileInput}
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={onFileChange}
                    disabled={submitting}
                  />
                </div>
              ) : (
                <div className={styles.previewContainer}>
                  <img
                    src={photoDataUrl}
                    alt="Inspection preview"
                    className={styles.previewImage}
                  />
                  <div className={styles.previewMeta}>
                    <span>{photoFileName} ({photoFileSize})</span>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={removePhoto}
                      disabled={submitting}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              {errors.photo && <span className={styles.errorText}>{errors.photo}</span>}
            </div>

            {/* Form actions */}
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/tracks/fixit/tickets')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? 'Submitting to Dispatch...' : 'Submit Maintenance Ticket'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

