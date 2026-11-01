import { apiRequest } from './client'

export interface IssueType {
  id: string
  issue_type_id?: string
  name: string
  description: string
  created_at?: string
  created_by?: string
}

export interface CreateIssueTypeInput {
  name: string
  description: string
}

export interface UpdateIssueTypeInput {
  name?: string
  description?: string
}

function normalizeIssueType(raw: any): IssueType {
  const id = raw.issue_type_id || raw.id || ''
  return {
    id,
    issue_type_id: id,
    name: raw.name || '',
    description: raw.description || '',
    created_at: raw.created_at,
    created_by: raw.created_by,
  }
}

/**
 * GET /api/v1/fixit/issue-types
 * Fallback: GET /api/v1/issue-types
 */
export async function listIssueTypes(): Promise<IssueType[]> {
  try {
    const res = await apiRequest<any>('/fixit/issue-types?limit=100')
    const rawItems = Array.isArray(res) ? res : res?.items || []
    return rawItems.map(normalizeIssueType)
  } catch {
    const res = await apiRequest<any>('/issue-types')
    const rawItems = Array.isArray(res) ? res : res?.items || []
    return rawItems.map(normalizeIssueType)
  }
}

/**
 * POST /api/v1/fixit/issue-types
 */
export async function createIssueType(input: CreateIssueTypeInput): Promise<IssueType> {
  try {
    const res = await apiRequest<any>('/fixit/issue-types', {
      method: 'POST',
      json: input,
    })
    return normalizeIssueType(res)
  } catch {
    const res = await apiRequest<any>('/issue-types', {
      method: 'POST',
      json: input,
    })
    return normalizeIssueType(res)
  }
}

/**
 * PATCH /api/v1/fixit/issue-types/:id
 */
export async function updateIssueType(id: string, updates: UpdateIssueTypeInput): Promise<IssueType> {
  try {
    const res = await apiRequest<any>(`/fixit/issue-types/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      json: updates,
    })
    return normalizeIssueType(res)
  } catch {
    const res = await apiRequest<any>(`/issue-types/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      json: updates,
    })
    return normalizeIssueType(res)
  }
}

/**
 * DELETE /api/v1/fixit/issue-types/:id
 */
export async function deleteIssueType(id: string): Promise<void> {
  try {
    await apiRequest<void>(`/fixit/issue-types/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  } catch {
    await apiRequest<void>(`/issue-types/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }
}
