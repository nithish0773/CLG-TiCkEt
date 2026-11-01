import { apiRequest } from './client'
import { API_BASE_URL } from './config'
import { loadSession } from '@/core/auth/session'

export type TicketStatus = 'open' | 'resolved' | 'acknowledged'

export interface FileView {
  file_id: string
  filename: string
  content_type: string
  size_bytes: number
  url: string
}

export interface TatView {
  expected_by: string
  estimated_completion_at?: string
  note?: string | null
  updated_by: string
  updated_by_name?: string
  updated_at: string
}

export interface UpdateView {
  note: string
  updated_by: string
  updated_by_name: string
  updated_at: string
}

export interface TicketReporter {
  name: string
  email: string
  role: string
  dept?: string | null
  phone_number?: string
}

export interface Ticket {
  id: string
  ticket_id?: string
  issue_type_id: string
  issue_type_name?: string
  title: string
  description: string
  status: TicketStatus
  photo?: FileView | null
  tat?: TatView | null
  overdue?: boolean
  update?: UpdateView | null
  acknowledged_at?: string | null
  reported_by?: string
  reported_by_name?: string
  reported_by_role?: string
  reported_by_dept?: string | null
  reported_by_phone_number?: string
  created_at: string
  updated_at: string

  // Legacy/UI aliases for UI backward compatibility
  reporter: TicketReporter
  issue_type: string
  expected_completion_date: string | null
  is_overdue: boolean
  has_photo: boolean
  manager_notes?: string
  building?: string
  location?: string
  status_history?: any[]
}

export type TicketView = Ticket

export interface TicketListResponse {
  items: Ticket[]
  count: number
  next_cursor: string | null
}

export interface TicketFilterParams {
  status?: TicketStatus | 'all'
  issue_type_id?: string
  category?: string
  mine?: boolean
  search?: string
  limit?: number
  cursor?: string | null
}

export interface CreateTicketInput {
  issue_type_id: string
  issue_type?: string
  title: string
  description: string
  building?: string
  location?: string
  photo?: File | Blob | string | null
}

export interface UpdateTicketInput {
  issue_type_id?: string
  issue_type?: string
  title?: string
  description?: string
  building?: string
  location?: string
  photo?: File | Blob | null
  remove_photo?: boolean
}

export function normalizeTicket(raw: any): Ticket {
  const id = raw.ticket_id || raw.id || ''
  const issueTypeId = raw.issue_type_id || ''
  const issueTypeName = raw.issue_type_name || raw.issue_type || 'General Maintenance'
  const tatExpected = raw.tat?.expected_by || raw.expected_completion_date || null
  const overdue = Boolean(raw.overdue ?? raw.is_overdue)

  const reporter: TicketReporter = {
    name: raw.reported_by_name || raw.reporter?.name || 'Campus Member',
    email: raw.reported_by || raw.reporter?.email || '',
    role: raw.reported_by_role || raw.reporter?.role || 'student',
    dept: raw.reported_by_dept || raw.reporter?.dept || null,
    phone_number: raw.reported_by_phone_number || raw.reporter?.phone_number || '',
  }

  const managerNotes = raw.update?.note || raw.manager_notes || raw.tat?.note || ''

  return {
    id,
    ticket_id: id,
    issue_type_id: issueTypeId,
    issue_type_name: issueTypeName,
    title: raw.title || '',
    description: raw.description || '',
    status: (raw.status || 'open') as TicketStatus,
    photo: raw.photo || null,
    tat: raw.tat
      ? {
          ...raw.tat,
          expected_by: raw.tat.expected_by || raw.tat.estimated_completion_at || '',
          estimated_completion_at: raw.tat.expected_by || raw.tat.estimated_completion_at || '',
          updated_by_name: raw.tat.updated_by_name || raw.tat.updated_by || 'Operations',
        }
      : null,
    overdue,
    update: raw.update || null,
    acknowledged_at: raw.acknowledged_at || null,
    reported_by: reporter.email,
    reported_by_name: reporter.name,
    reported_by_role: reporter.role,
    reported_by_dept: reporter.dept,
    reported_by_phone_number: reporter.phone_number || '',
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),

    // UI helpers
    reporter,
    issue_type: issueTypeName,
    expected_completion_date: tatExpected,
    is_overdue: overdue,
    has_photo: Boolean(raw.photo || raw.has_photo),
    manager_notes: managerNotes,
    building: raw.building || '',
    location: raw.location || '',
    status_history: raw.status_history || [],
  }
}

export function getTicketPhotoUrl(ticketId: string): string {
  return `${API_BASE_URL}/api/v1/fixit/tickets/${encodeURIComponent(ticketId)}/photo`
}

/**
 * GET /api/v1/fixit/tickets
 * Query: status, issue_type_id, mine, limit, cursor
 */
export async function fetchTicketsPage(params: TicketFilterParams = {}): Promise<TicketListResponse> {
  const query = new URLSearchParams()
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.issue_type_id && params.issue_type_id !== 'all') query.set('issue_type_id', params.issue_type_id)
  else if (params.category && params.category !== 'all') query.set('issue_type_id', params.category)
  if (params.mine !== undefined) query.set('mine', String(params.mine))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.cursor) query.set('cursor', params.cursor)

  const queryString = query.toString()
  const path = `/fixit/tickets${queryString ? `?${queryString}` : ''}`

  const res = await apiRequest<any>(path)
  const rawItems = Array.isArray(res) ? res : res?.items || []
  const items = rawItems.map(normalizeTicket)

  return {
    items,
    count: res?.count ?? items.length,
    next_cursor: res?.next_cursor ?? null,
  }
}

/**
 * Backward compatible wrapper that returns Ticket[]
 */
export async function listTickets(params: TicketFilterParams = {}): Promise<Ticket[]> {
  const result = await fetchTicketsPage(params)
  let items = result.items

  // Client-side search filtering if provided
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase()
    items = items.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.issue_type_name || '').toLowerCase().includes(q) ||
        (t.reported_by_name || '').toLowerCase().includes(q),
    )
  }

  return items
}

/**
 * GET /api/v1/fixit/tickets/{ticket_id}
 */
export async function getTicket(id: string): Promise<Ticket> {
  const res = await apiRequest<any>(`/fixit/tickets/${encodeURIComponent(id)}`)
  return normalizeTicket(res)
}

/**
 * POST /api/v1/fixit/tickets
 * Uses multipart/form-data.
 */
export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const formData = new FormData()
  formData.append('issue_type_id', input.issue_type_id)
  formData.append('title', input.title.trim())
  formData.append('description', input.description.trim())

  if (input.photo) {
    if (typeof input.photo === 'string') {
      try {
        const fetchRes = await fetch(input.photo)
        const blob = await fetchRes.blob()
        formData.append('photo', blob, 'evidence.jpg')
      } catch {
        // omit if string is not valid blob url
      }
    } else {
      formData.append('photo', input.photo)
    }
  }

  const res = await apiRequest<any>('/fixit/tickets', {
    method: 'POST',
    body: formData,
  })
  return normalizeTicket(res)
}

/**
 * PATCH /api/v1/fixit/tickets/{ticket_id}
 * Uses multipart/form-data. Allowed while open for reporter.
 */
export async function updateTicket(id: string, input: UpdateTicketInput): Promise<Ticket> {
  const formData = new FormData()
  if (input.title !== undefined) formData.append('title', input.title.trim())
  if (input.description !== undefined) formData.append('description', input.description.trim())
  if (input.issue_type_id !== undefined) formData.append('issue_type_id', input.issue_type_id)
  if (input.photo) formData.append('photo', input.photo)
  if (input.remove_photo) formData.append('remove_photo', 'true')

  const res = await apiRequest<any>(`/fixit/tickets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: formData,
  })
  return normalizeTicket(res)
}

/**
 * DELETE /api/v1/fixit/tickets/{ticket_id}
 */
export async function deleteTicket(id: string): Promise<void> {
  await apiRequest<void>(`/fixit/tickets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

/**
 * PUT /api/v1/fixit/tickets/{ticket_id}/status
 * Campus Maintenance only. Note is mandatory (1-280 chars).
 */
export async function updateTicketStatus(
  id: string,
  statusOrPayload: 'open' | 'resolved' | string | { status: 'open' | 'resolved' | string; note: string },
  maybeNote?: string,
): Promise<Ticket> {
  const status = typeof statusOrPayload === 'string' ? statusOrPayload : statusOrPayload.status
  const note = typeof statusOrPayload === 'string' ? maybeNote || '' : statusOrPayload.note
  const res = await apiRequest<any>(`/fixit/tickets/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    json: {
      status,
      note: note.trim(),
    },
  })
  return normalizeTicket(res)
}

/**
 * PUT /api/v1/fixit/tickets/{ticket_id}/tat
 * Campus Maintenance only, while ticket is open.
 */
export async function updateTicketTat(
  id: string,
  expectedByOrPayload: string | { expected_by?: string; estimated_completion_at?: string; note?: string },
  maybeNote?: string,
): Promise<Ticket> {
  let expected_by = ''
  let note = maybeNote

  if (typeof expectedByOrPayload === 'string') {
    expected_by = expectedByOrPayload
  } else {
    expected_by = expectedByOrPayload.expected_by || expectedByOrPayload.estimated_completion_at || ''
    note = expectedByOrPayload.note || maybeNote
  }

  const payload: { expected_by: string; note?: string } = {
    expected_by: expected_by.trim(),
  }
  if (note && note.trim()) {
    payload.note = note.trim()
  }

  const res = await apiRequest<any>(`/fixit/tickets/${encodeURIComponent(id)}/tat`, {
    method: 'PUT',
    json: payload,
  })
  return normalizeTicket(res)
}

/**
 * POST /api/v1/fixit/tickets/{ticket_id}/acknowledge
 * Reporter confirms resolved ticket is fixed (closes ticket).
 */
export async function acknowledgeTicket(id: string, _feedback?: string): Promise<Ticket> {
  const res = await apiRequest<any>(`/fixit/tickets/${encodeURIComponent(id)}/acknowledge`, {
    method: 'POST',
  })
  return normalizeTicket(res)
}

/**
 * Authenticated download of ticket photo using Authorization: Bearer <token>.
 */
export async function downloadTicketPhoto(id: string, customFilename?: string): Promise<void> {
  const token = loadSession()?.accessToken
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE_URL}/api/v1/fixit/tickets/${encodeURIComponent(id)}/photo`, {
    headers,
  })

  if (!res.ok) {
    throw new Error('Failed to download photo. The image may have expired or is unavailable.')
  }

  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = customFilename || `ticket-${id}-photo.jpg`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}
