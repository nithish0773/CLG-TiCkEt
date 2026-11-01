import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/core/auth'
import { tracks } from '@/core/tracks/registry'
import { Button, Text, ThemeToggle } from '@/ui'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function onSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  // FIXIT has its own enterprise shell with custom sidebar & topbar
  if (location.pathname.startsWith('/tracks/fixit')) {
    return <Outlet />
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [styles.navLink, isActive && styles.active].filter(Boolean).join(' ')

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>Campus OS</Link>
        <nav aria-label="Tracks" className={styles.nav}>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navClass} data-testid="nav-admin">Admin</NavLink>
          )}
          {tracks.map((track) => (
            <NavLink key={track.id} to={`/tracks/${track.id}`} className={navClass}>
              {track.navLabel ?? track.title}
            </NavLink>
          ))}
        </nav>
        <div className={styles.actions}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                />
              ) : (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              )}
              <Text as="span" size="sm" tone="textMuted" className={styles.user}>{user.name}</Text>
            </div>
          )}
          <ThemeToggle />
          <Button variant="secondary" size="sm" onClick={onSignOut} data-testid="sign-out">
            Sign out
          </Button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
