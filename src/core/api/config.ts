/** Base URL of campus-os-backend, from VITE_API_BASE_URL in .env. */
export const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL ?? 'https://campus-os-backend-8sjf.onrender.com',
).replace(/\/+$/, '')

/** Requests that take longer than this are aborted and reported as a timeout. Set to 60s for Render cold-starts. */
export const REQUEST_TIMEOUT_MS = 60_000
