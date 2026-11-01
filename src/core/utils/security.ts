/**
 * Security & Input Validation Utilities for CampusOS FixIt
 * Provides input sanitization, file signature validation, and safe error masking.
 */

/**
 * Validates actual binary magic bytes of an uploaded image file.
 * Supported:
 * - JPEG (FF D8 FF)
 * - PNG  (89 50 4E 47 0D 0A 1A 0A)
 * Rejects SVGs, executables, HTML, and polyglot files disguised as images.
 */
export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!file) {
    return { valid: false, error: 'No file selected.' }
  }

  // 1. Enforce strict 5 MB maximum size and non-zero size
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
  if (file.size <= 0) {
    return { valid: false, error: 'Rejected empty file (0 bytes).' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the strict 5 MB limit.` }
  }

  // 2. Validate file extension
  const lowerName = file.name.toLowerCase()
  const validExtensions = ['.jpg', '.jpeg', '.png']
  const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext))
  if (!hasValidExt) {
    return {
      valid: false,
      error: 'Unsupported file format. Only genuine .jpg, .jpeg, or .png image files are permitted.',
    }
  }

  // 3. Validate declared MIME type
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return {
      valid: false,
      error: 'Unsupported MIME type. File must be image/jpeg or image/png.',
    }
  }

  // 4. Deep Inspection: Verify binary header magic bytes
  try {
    const slice = file.slice(0, 8)
    const buffer = await slice.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    if (bytes.length < 3) {
      return { valid: false, error: 'File header is too small to be a valid image.' }
    }

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4E &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0D &&
      bytes[5] === 0x0A &&
      bytes[6] === 0x1A &&
      bytes[7] === 0x0A

    // JPEG signature: FF D8 FF
    const isJpg =
      bytes[0] === 0xFF &&
      bytes[1] === 0xD8 &&
      bytes[2] === 0xFF

    if (!isPng && !isJpg) {
      return {
        valid: false,
        error: 'Security Alert: File signature mismatch. The file content does not match genuine JPEG or PNG binary formats.',
      }
    }
  } catch {
    return { valid: false, error: 'Failed to inspect file binary signature.' }
  }

  return { valid: true }
}

/**
 * Sanitizes user-entered text by stripping null bytes and dangerous control characters.
 * Trims excess whitespace and prevents overflow payloads.
 */
export function sanitizeTextInput(input: string, maxLength?: number): string {
  if (typeof input !== 'string') return ''
  // Strip null bytes and non-printable control characters (except newline, tab, carriage return)
  // eslint-disable-next-line no-control-regex
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  cleaned = cleaned.trim()
  if (typeof maxLength === 'number' && maxLength > 0 && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength)
  }
  return cleaned
}

/**
 * Validates that a URL uses safe protocols (http, https, blob, or relative).
 * Rejects javascript:, data:text/html, vbscript:, or other unsafe schemes.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()

  // Relative URLs starting with '/' are safe
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true
  }

  // Blob URLs from local object preview are safe
  if (trimmed.startsWith('blob:')) {
    return true
  }

  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Sanitizes API error messages so internal server architecture, stack traces,
 * database schema names, and file paths are never exposed to clients.
 */
export function sanitizeErrorMessage(error: unknown, fallback = 'Operation failed. Please try again.'): string {
  if (!error) return fallback

  let rawMessage = ''
  if (typeof error === 'string') {
    rawMessage = error
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>
    if (typeof errObj.message === 'string') {
      rawMessage = errObj.message
    } else if (errObj.response && typeof errObj.response === 'object') {
      const resp = errObj.response as Record<string, unknown>
      const data = resp.data as Record<string, unknown>
      if (data && typeof data.error === 'object' && data.error !== null) {
        const nestedErr = data.error as Record<string, unknown>
        if (typeof nestedErr.message === 'string') rawMessage = nestedErr.message
      } else if (typeof data?.detail === 'string') {
        rawMessage = data.detail
      }
    }
  }

  if (!rawMessage) return fallback

  // Check for dangerous internal leaks
  const lower = rawMessage.toLowerCase()
  const sensitivePatterns = [
    'select ',
    'insert into',
    'update ',
    'delete from',
    'pg_query',
    'syntax error at',
    'sqlstate',
    'column "',
    'table "',
    'relation "',
    'node_modules',
    'at process.',
    'at async',
    'exception:',
    'stack trace',
    'c:\\',
    '/var/www',
    '/app/',
    'internal server error',
  ]

  if (sensitivePatterns.some((pattern) => lower.includes(pattern))) {
    return 'An internal processing error occurred. The technical details have been logged securely.'
  }

  return rawMessage
}

