import { describe, it, expect } from 'vitest'
import {
  validateImageFile,
  sanitizeTextInput,
  isSafeUrl,
  sanitizeErrorMessage,
} from '../security'

describe('Core Security Hardening Tests', () => {
  describe('File Upload Security: validateImageFile', () => {
    it('accepts genuine JPEG files with valid magic bytes (FF D8 FF)', async () => {
      // JPEG magic bytes: 0xFF, 0xD8, 0xFF, 0xE0, ...
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])
      const file = new File([jpegBytes], 'evidence.jpg', { type: 'image/jpeg' })

      const result = await validateImageFile(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts genuine PNG files with valid magic bytes (89 50 4E 47 0D 0A 1A 0A)', async () => {
      // PNG magic bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const file = new File([pngBytes], 'broken-tap.png', { type: 'image/png' })

      const result = await validateImageFile(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('rejects disguised SVG or HTML files masquerading as .png', async () => {
      // HTML/SVG content disguised with image/png MIME and extension
      const fakeSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>'
      const file = new File([fakeSvg], 'exploit.png', { type: 'image/png' })

      const result = await validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File signature mismatch')
    })

    it('rejects disguised executable files masquerading as .jpg', async () => {
      // MZ header for Windows executables: 0x4D, 0x5A
      const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00])
      const file = new File([exeBytes], 'malware.jpg', { type: 'image/jpeg' })

      const result = await validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File signature mismatch')
    })

    it('rejects empty (0 byte) files', async () => {
      const emptyFile = new File([], 'empty.png', { type: 'image/png' })
      const result = await validateImageFile(emptyFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('0 bytes')
    })

    it('rejects files exceeding the strict 5 MB limit', async () => {
      // 5.1 MB buffer
      const largeBuffer = new Uint8Array(5.1 * 1024 * 1024)
      largeBuffer[0] = 0xff
      largeBuffer[1] = 0xd8
      largeBuffer[2] = 0xff
      const file = new File([largeBuffer], 'giant.jpg', { type: 'image/jpeg' })

      const result = await validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds the strict 5 MB limit')
    })

    it('rejects disallowed file extensions like .svg, .exe, .sh', async () => {
      const file = new File([new Uint8Array([1, 2, 3])], 'vector.svg', { type: 'image/svg+xml' })
      const result = await validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unsupported file format')
    })
  })

  describe('Input Sanitization & Injection Protection: sanitizeTextInput', () => {
    it('strips null bytes and malicious control characters from text', () => {
      const maliciousInput = 'TKT-1001\x00SELECT * FROM users\x07\x1F'
      const sanitized = sanitizeTextInput(maliciousInput)
      expect(sanitized).toBe('TKT-1001SELECT * FROM users')
      expect(sanitized).not.toContain('\x00')
      expect(sanitized).not.toContain('\x07')
    })

    it('enforces maximum character lengths to prevent buffer overflow attacks', () => {
      const longInput = 'A'.repeat(500)
      const sanitized = sanitizeTextInput(longInput, 120)
      expect(sanitized.length).toBe(120)
    })

    it('preserves clean multiline complaint text with legitimate newlines', () => {
      const normalInput = 'Broken ceiling fan in Room 302.\nSparks when turned on.'
      const sanitized = sanitizeTextInput(normalInput)
      expect(sanitized).toBe(normalInput)
    })
  })

  describe('URL Safety & Protocol Validation: isSafeUrl', () => {
    it('rejects javascript: protocol payloads', () => {
      expect(isSafeUrl('javascript:alert(document.cookie)')).toBe(false)
      expect(isSafeUrl('JAVASCRIPT:alert(1)')).toBe(false)
    })

    it('rejects data:text/html and vbscript: payloads', () => {
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false)
    })

    it('allows safe relative paths, blob URLs, and https URLs', () => {
      expect(isSafeUrl('/api/v1/tickets/TKT-1001/photo')).toBe(true)
      expect(isSafeUrl('https://campus-os.internal/photos/evidence.jpg')).toBe(true)
      expect(isSafeUrl('blob:http://localhost:5173/uuid-1234')).toBe(true)
    })
  })

  describe('Information Leak Prevention: sanitizeErrorMessage', () => {
    it('masks internal SQL syntax and database schema details', () => {
      const sqlLeak = 'syntax error at or near "SELECT" in relation "campus_tickets" on line 42'
      const masked = sanitizeErrorMessage(sqlLeak)
      expect(masked).not.toContain('syntax error at or near')
      expect(masked).not.toContain('campus_tickets')
      expect(masked).toBe('An internal processing error occurred. The technical details have been logged securely.')
    })

    it('masks internal server file paths', () => {
      const pathLeak = 'ENOENT: no such file or directory, open "C:\\Users\\Administrator\\campus-os\\secrets\\key.pem"'
      const masked = sanitizeErrorMessage(pathLeak)
      expect(masked).not.toContain('C:\\Users\\Administrator')
      expect(masked).toBe('An internal processing error occurred. The technical details have been logged securely.')
    })

    it('preserves safe user-facing validation error messages', () => {
      const userMessage = 'Complaint title must be between 3 and 120 characters.'
      const masked = sanitizeErrorMessage(userMessage)
      expect(masked).toBe(userMessage)
    })
  })
})
