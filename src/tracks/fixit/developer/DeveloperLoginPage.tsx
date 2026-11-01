import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import {
  useAuth,
  sendDeveloperOtp,
  getConfiguredDeveloperGmail,
} from '@/core/auth'
import { Alert, Button, Stack, Text, TextField } from '@/ui'
import styles from './DeveloperLoginPage.module.css'

export function DeveloperLoginPage() {
  const { user, signInDeveloper } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/tracks/fixit/developer'

  const [email, setEmail] = useState(() => getConfiguredDeveloperGmail())
  const [otp, setOtp] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Auto redirect if already authenticated as developer super admin
  useEffect(() => {
    if (user && ((user as any).is_super_admin || user.role === 'developer' || user.email.toLowerCase() === getConfiguredDeveloperGmail())) {
      navigate(next, { replace: true })
    }
  }, [user, navigate, next])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleSendOtp() {
    if (!email.trim()) {
      setError('Please enter your Developer Gmail address.')
      return
    }

    setSendingOtp(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await sendDeveloperOtp(email.trim().toLowerCase())
      setOtpSent(true)
      setCooldown(res.cooldown_seconds || 60)
      setSuccess(res.message || 'Verification code sent to your registered Gmail address.')
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification code.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.')
      return
    }

    setVerifying(true)
    setError(null)

    try {
      if (signInDeveloper) {
        await signInDeveloper(email.trim().toLowerCase(), otp.trim())
      }
      navigate(next, { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code and try again.')
      setVerifying(false)
    }
  }

  return (
    <Stack gap={5}>
      <div className={styles.badge}>
        <span>🛡️</span>
        <span>Restricted Developer Access • Level 4</span>
      </div>

      <Stack gap={1} className={styles.title}>
        <Text as="h1" size="xl" weight="bold">Developer Super Admin</Text>
        <p className={styles.subtitle}>
          Direct infrastructure control and live site management. Authenticate with your authorized developer Gmail.
        </p>
      </Stack>

      {error && (
        <Alert tone="danger" data-testid="dev-auth-error">
          {error}
        </Alert>
      )}

      {success && (
        <Alert tone="success" data-testid="dev-auth-success">
          {success}
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate aria-label="Developer Super Admin Sign in">
        <Stack gap={4}>
          <div className={styles.emailRow}>
            <div className={styles.emailInputWrap}>
              <TextField
                label="Developer Gmail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError(null)
                }}
                disabled={sendingOtp || verifying}
                data-testid="dev-email-input"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              className={styles.sendBtn}
              onClick={handleSendOtp}
              disabled={sendingOtp || cooldown > 0 || verifying}
              loading={sendingOtp}
              data-testid="dev-send-otp-btn"
            >
              {cooldown > 0 ? `Resend (${cooldown}s)` : otpSent ? 'Resend Code' : 'Send Code'}
            </Button>
          </div>

          <TextField
            label="6-Digit Verification Code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6)
              setOtp(val)
              if (error) setError(null)
            }}
            disabled={verifying}
            className={styles.otpInput}
            data-testid="dev-otp-input"
          />

          <Button
            type="submit"
            fullWidth
            loading={verifying}
            disabled={otp.length !== 6 || verifying}
            data-testid="dev-verify-submit-btn"
          >
            Verify &amp; Access Dashboard
          </Button>

          <div className={styles.securityNote}>
            <strong>🔒 Security Protocol:</strong> One-time verification codes expire in 5 minutes. Accounts are locked for 10 minutes after 5 incorrect attempts. All authentication actions are permanently audited.
          </div>

          <div className={styles.backLink}>
            <Link to="/login" data-testid="dev-back-to-login">
              ← Return to Campus OS Standard Login
            </Link>
          </div>
        </Stack>
      </form>
    </Stack>
  )
}

