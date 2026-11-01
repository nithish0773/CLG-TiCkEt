import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Wrench, Shield, Users, ArrowLeft } from 'lucide-react'
import { useAuth, type LoginCategory } from '@/core/auth'
import { Alert, Button, TextField } from '@/ui'
import { safeNext } from './safeNext'
import { validateLogin, hasErrors, type FieldErrors, type LoginValues } from './validation'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const paramCategory = params.get('category') as LoginCategory | null

  const initialCategory: LoginCategory =
    paramCategory === 'maintenance' || paramCategory === 'admin' || paramCategory === 'student_faculty'
      ? paramCategory
      : 'student_faculty'

  const [category, setCategory] = useState<LoginCategory>(initialCategory)
  const [categorySelected, setCategorySelected] = useState(Boolean(paramCategory))
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [errors, setErrors] = useState<FieldErrors<LoginValues>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Redirect authenticated user away from /login
  if (user && !submitting) {
    return <Navigate to={next} replace />
  }

  const handleQuickFill = (testEmail: string, testOtp: string, cat: LoginCategory) => {
    setEmail(testEmail)
    setOtp(testOtp)
    setCategory(cat)
    setCategorySelected(true)
    setErrors({})
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validateLogin({ email, otp })
    setErrors(found)
    setFormError(null)
    if (hasErrors(found)) return

    setSubmitting(true)
    try {
      await signIn(email.trim().toLowerCase(), otp.trim(), categorySelected ? category : undefined)
      navigate(next, { replace: true })
    } catch (err: any) {
      const message =
        err?.message ||
        err?.response?.data?.error?.message ||
        'Authentication failed. Please verify your credentials and try again.'
      setFormError(message)
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.splitPage}>
      {/* Left Column: Architectural Branding & Aesthetics */}
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <Link to="/" className={styles.brandHeader}>
            <div className={styles.logoMark}>
              <Wrench size={20} />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>CampusOS</span>
              <span className={styles.brandModule}>FIXIT</span>
            </div>
          </Link>

          <div className={styles.graphicBox}>
            <div className={styles.archGridVisual}>
              <div className={styles.gridLineH} />
              <div className={styles.gridLineH} />
              <div className={styles.gridLineH} />
              <div className={styles.gridLineV} />
              <div className={styles.gridLineV} />
              <div className={styles.gridLineV} />

              <div className={styles.archMarkerA}>
                <span className={styles.markerBadge}>BLOCK-A / ROOF</span>
                <span className={styles.markerDot} />
              </div>

              <div className={styles.archMarkerB}>
                <span className={styles.markerBadge}>SCI-TOWER / LAB-4</span>
                <span className={styles.markerDot} />
              </div>

              <div className={styles.archStatusPill}>
                <span className={styles.livePulse} />
                <span>OPERATIONAL INTELLIGENCE ACTIVE</span>
              </div>
            </div>
          </div>

          <div className={styles.heroText}>
            <h2 className={styles.heroHeadline}>A smarter way to care for your campus.</h2>
            <p className={styles.heroSub}>
              Coordinating institutional facilities from initial problem identification to final verified resolution.
            </p>
          </div>

          <div className={styles.brandFooter}>
            <span>Team 13 Institution Workspace</span>
            <span>Render Cloud API v1 Verified</span>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className={styles.authPanel}>
        <div className={styles.authContainer}>
          <div className={styles.topNavRow}>
            <Link to="/" className={styles.backLink}>
              <ArrowLeft size={16} />
              <span>Return to website</span>
            </Link>
          </div>

          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>Welcome to CampusOS</h1>
            <p className={styles.authSubtitle}>Select your account category to access your verified portal.</p>
          </div>

          {/* Account Category Selector Tabs */}
          <div className={styles.categorySelector} role="tablist" aria-label="Account Category">
            <button
              type="button"
              role="tab"
              aria-selected={category === 'student_faculty'}
              className={`${styles.categoryTab} ${category === 'student_faculty' ? styles.activeTab : ''}`}
              onClick={() => {
                setCategory('student_faculty')
                setCategorySelected(true)
                setFormError(null)
              }}
            >
              <Users size={16} />
              <span>Student / Faculty</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={category === 'maintenance'}
              className={`${styles.categoryTab} ${category === 'maintenance' ? styles.activeTab : ''}`}
              onClick={() => {
                setCategory('maintenance')
                setCategorySelected(true)
                setFormError(null)
              }}
            >
              <Wrench size={16} />
              <span>Campus Maintenance</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={category === 'admin'}
              className={`${styles.categoryTab} ${category === 'admin' ? styles.activeTab : ''}`}
              onClick={() => {
                setCategory('admin')
                setCategorySelected(true)
                setFormError(null)
              }}
            >
              <Shield size={16} />
              <span>Administrator</span>
            </button>
          </div>

          {/* Form container */}
          <form onSubmit={handleSubmit} className={styles.loginForm} noValidate aria-label="Sign in">
            {formError && (
              <Alert tone="danger" role="alert" data-testid="login-error">
                {formError}
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder={
                category === 'admin'
                  ? 'admin@team13.com'
                  : category === 'maintenance'
                  ? 'maintenance@team13.com'
                  : 'student@team13.com'
              }
            />

            <div style={{ position: 'relative' }}>
              <TextField
                label="OTP"
                type={showOtp ? 'text' : 'password'}
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                error={errors.otp}
                placeholder="Enter team OTP (e.g. 595436)"
                hint="Use your team OTP shared by the institution administrator."
              />
              <button
                type="button"
                onClick={() => setShowOtp(!showOtp)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '34px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--muted-text)',
                  padding: '2px 4px',
                }}
                tabIndex={-1}
              >
                {showOtp ? 'Hide' : 'Show'}
              </button>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: '0.5rem' }}
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Evaluator Quick 1-Click Verification Pills */}
          <div className={styles.evaluatorSection}>
            <div className={styles.evaluatorHeader}>
              <span className={styles.evaluatorTag}>EVALUATOR TEST PROFILES</span>
              <span className={styles.teamBadge}>Team 13 Verified</span>
            </div>
            <p className={styles.evaluatorDesc}>Click any role below to pre-populate verified live credentials:</p>
            <div className={styles.pillGrid}>
              <button
                type="button"
                className={styles.pillBtn}
                onClick={() => handleQuickFill('student@team13.com', '595436', 'student_faculty')}
              >
                <strong>Student</strong>
                <small>student@team13.com</small>
              </button>

              <button
                type="button"
                className={styles.pillBtn}
                onClick={() => handleQuickFill('faculty@team13.com', '595436', 'student_faculty')}
              >
                <strong>Faculty</strong>
                <small>faculty@team13.com</small>
              </button>

              <button
                type="button"
                className={styles.pillBtn}
                onClick={() => handleQuickFill('maintenance@team13.com', '595436', 'maintenance')}
              >
                <strong>Campus Maintenance</strong>
                <small>maintenance@team13.com</small>
              </button>

              <button
                type="button"
                className={styles.pillBtn}
                onClick={() => handleQuickFill('admin@team13.com', '595436', 'admin')}
              >
                <strong>Administrator</strong>
                <small>admin@team13.com</small>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default LoginPage
