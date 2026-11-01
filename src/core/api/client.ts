import { loadSession, saveSession } from '@/core/auth/session'
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config'
import { ApiError } from './errors'
import { sanitizeErrorMessage } from '@/core/utils/security'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** JSON body */
  json?: unknown
  /** Raw body (e.g. FormData for multipart ticket creation) */
  body?: BodyInit
}

/**
 * Calls `${API_BASE_URL}/api/v1${path}` with the session's bearer token and turns the backend's
 * error envelope into an ApiError. Every API call in the app goes through here.
 */
export async function apiRequest<T>(path: string, { method = 'GET', json, body }: RequestOptions = {}): Promise<T> {
  // Validate path to prevent directory traversal or malformed endpoints
  if (!path.startsWith('/') || path.includes('..')) {
    throw new ApiError(400, 'INVALID_PATH', 'Invalid API endpoint path request.')
  }

  const headers = new Headers({ Accept: 'application/json' })
  const token = loadSession()?.accessToken
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let requestBody: BodyInit | undefined = body
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(json)
  }

  let res: Response
  const url = `${API_BASE_URL}/api/v1${path}`
  try {
    res = await fetch(url, {
      method,
      headers,
      body: requestBody,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError(0, 'TIMEOUT', 'The server took too long to respond. The Render backend may be waking up from idle. Please try again.')
    }
    // Failover to local Vite dev proxy / same-origin API if external port is unreachable
    if (typeof window !== 'undefined' && API_BASE_URL && !url.startsWith(window.location.origin)) {
      try {
        res = await fetch(`/api/v1${path}`, {
          method,
          headers,
          body: requestBody,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
      } catch {
        throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.')
      }
    } else {
      throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.')
    }
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    const e = data?.error
    const rawMsg = e?.message || data?.detail || (typeof data === 'string' ? data : null) || 'Something went wrong. Try again.'
    const message = sanitizeErrorMessage(rawMsg, 'An error occurred during this request.')
    // Expired or revoked token on a protected route: drop the session and start over at the login page.
    if (res.status === 401 && !path.startsWith('/auth/') && !path.includes('/auth/')) {
      saveSession(null)
      window.location.assign('/login')
    }
    throw new ApiError(res.status, e?.code ?? 'UNKNOWN', message, e?.details)
  }
  return data as T
}
