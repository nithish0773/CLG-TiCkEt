/**
 * Utilities for formatting UTC timestamps into India Standard Time (IST)
 * IST is UTC +05:30
 */

export function formatIST(utcIsoString?: string | null, includeTime = true): string {
  if (!utcIsoString) return '—'
  try {
    const date = new Date(utcIsoString)
    if (isNaN(date.getTime())) return utcIsoString

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }
        : {}),
    }

    return new Intl.DateTimeFormat('en-IN', options).format(date)
  } catch {
    return utcIsoString
  }
}

export function formatDateIST(dateString?: string | null): string {
  return formatIST(dateString, false)
}

export function formatRelativeIST(utcIsoString?: string | null): string {
  if (!utcIsoString) return '—'
  try {
    const date = new Date(utcIsoString)
    if (isNaN(date.getTime())) return utcIsoString

    const now = Date.now()
    const diffMs = now - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHrs = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHrs / 24)

    if (diffSec < 60) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHrs < 24) return `${diffHrs}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`

    return formatDateIST(utcIsoString)
  } catch {
    return utcIsoString
  }
}

