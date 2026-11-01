import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Menu, X, ArrowRight, Wrench } from 'lucide-react'
import { useAuth, getRoleLandingPath } from '@/core/auth'
import styles from './PublicNavbar.module.css'

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/features' },
    { label: 'How It Works', path: '/#how-it-works' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ]

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return false
    return location.pathname === path
  }

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    if (path === '/#how-it-works') {
      if (location.pathname === '/') {
        e.preventDefault()
        const el = document.getElementById('how-it-works')
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 70
          window.scrollTo({ top, behavior: 'smooth' })
          window.history.pushState(null, '', '/#how-it-works')
        }
      }
    } else if (path === '/' && location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand} onClick={(e) => handleNavClick('/', e)}>
          <div className={styles.logoMark}>
            <Wrench className={styles.logoIcon} size={18} />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>CampusOS</span>
            <span className={styles.brandBadge}>FixIt</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.navLinks} aria-label="Main Navigation">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              onClick={(e) => handleNavClick(item.path, e)}
              className={`${styles.navLink} ${isActive(item.path) ? styles.active : ''}`}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin" className={styles.navLink} data-testid="nav-admin">
              Admin
            </Link>
          )}
        </nav>

        {/* Action Buttons */}
        <div className={styles.actions}>
          {user ? (
            <Link to={getRoleLandingPath(user)} className={styles.primaryBtn}>
              <span>Enter Workspace</span>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/login" className={styles.secondaryBtn}>
                Sign In
              </Link>
              <Link to="/login" className={styles.primaryBtn}>
                <span>Get Started</span>
                <ArrowRight size={15} />
              </Link>
            </>
          )}

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileNavLinks}>
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`${styles.mobileNavLink} ${isActive(item.path) ? styles.activeMobile : ''}`}
                onClick={(e) => {
                  handleNavClick(item.path, e)
                  setMobileMenuOpen(false)
                }}
              >
                {item.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={styles.mobileNavLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Command
              </Link>
            )}
            {user ? (
              <Link
                to={getRoleLandingPath(user)}
                className={styles.mobilePrimaryBtn}
                onClick={() => setMobileMenuOpen(false)}
              >
                Enter Workspace
              </Link>
            ) : (
              <Link
                to="/login"
                className={styles.mobilePrimaryBtn}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
