import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth, saveSession, getPublicCustomization, simulateRole, exitSimulation, type Role, type WebsiteCustomization } from '@/core'
import { Badge, ThemeToggle } from '@/ui'
import { isFixitManager, getRoleDisplayLabel } from '../utils/roles'
import { GlobalSearchModal } from './GlobalSearchModal'
import styles from './FixitLayout.module.css'

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  link?: string
  tone?: 'primary' | 'warning' | 'success' | 'danger'
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'High Priority Overdue Alert',
    message: 'TICK-1001: Server Room 302 Chiller Compressor has exceeded committed TAT.',
    time: '12m ago',
    read: false,
    link: '/tracks/fixit/tickets/TICK-1001',
    tone: 'danger',
  },
  {
    id: 'n-2',
    title: 'Resolution Acknowledged',
    message: 'TICK-1005: Library Reading Hall Lighting acknowledged by student reporter.',
    time: '45m ago',
    read: false,
    link: '/tracks/fixit/tickets/TICK-1005',
    tone: 'success',
  },
  {
    id: 'n-3',
    title: 'New Maintenance Dispatch',
    message: 'TICK-1003 assigned to Electrical Operations team.',
    time: '2h ago',
    read: true,
    link: '/tracks/fixit/tickets/TICK-1003',
    tone: 'primary',
  },
]

const DEMO_ACCOUNTS: Array<{ role: Role; name: string; email: string; label: string; department?: string }> = [
  { role: 'student', name: 'Asha Kumar', email: 'asha@team1.com', label: 'Student (Asha)' },
  { role: 'office_staff', name: 'Kumar Gowda', email: 'kumar@team1.com', label: 'Campus Maintenance (Kumar)', department: 'Campus Maintenance' },
  { role: 'faculty', name: 'Dr. Meera Rao', email: 'meera@team1.com', label: 'Faculty (Dr. Meera)' },
  { role: 'office_staff', name: 'Ravi Shetty', email: 'ravi@team1.com', label: 'Office Staff (Ravi)', department: 'Student Affairs' },
  { role: 'campus_manager', name: 'Kavita Sharma', email: 'manager@team1.com', label: 'Campus Manager' },
  { role: 'admin', name: 'Team 13 Admin', email: 'admin@team13.com', label: 'Admin (Team 13)' },
]

function computeExpiresAt(expiresInSeconds: number) {
  return Date.now() + expiresInSeconds * 1000
}

export function FixitLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [customization, setCustomization] = useState<WebsiteCustomization | null>(null)

  useEffect(() => {
    let mounted = true
    getPublicCustomization().then((data) => {
      if (mounted) {
        setCustomization(data)
        if (data.primary_color) {
          document.documentElement.style.setProperty('--color-primary', data.primary_color)
        }
      }
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function handleSwitchRole(account: { role: Role; name: string; email: string; department?: string }) {
    try {
      if (account.email === 'admin@team13.com' && user?.is_simulation) {
        const res = await exitSimulation()
        saveSession({
          accessToken: res.access_token,
          expiresAt: computeExpiresAt(res.expires_in),
          user: {
            id: res.profile.email_id,
            name: res.profile.name,
            email: res.profile.email_id,
            role: res.profile.role,
            is_simulation: false,
          },
        })
      } else {
        const res = await simulateRole(account.email)
        saveSession({
          accessToken: res.access_token,
          expiresAt: computeExpiresAt(res.expires_in),
          user: {
            id: res.profile.email_id,
            name: res.profile.name,
            email: res.profile.email_id,
            role: res.profile.role,
            department: account.department || res.profile.dept,
            is_simulation: account.email !== 'admin@team13.com',
            simulated_by: res.simulated_by || user?.email || 'admin@team13.com',
          },
        })
      }
      setProfileOpen(false)
      window.location.reload()
    } catch (err: any) {
      alert(`Role switch failed: ${err.message || 'Unauthorized'}`)
    }
  }

  async function handleExitSimulation() {
    try {
      const res = await exitSimulation()
      saveSession({
        accessToken: res.access_token,
        expiresAt: Date.now() + res.expires_in * 1000,
        user: {
          id: res.profile.email_id,
          name: res.profile.name,
          email: res.profile.email_id,
          role: res.profile.role,
          is_simulation: false,
        },
      })
      window.location.assign('/tracks/fixit/developer')
    } catch (err: any) {
      console.error('Failed to exit simulation:', err)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  // Derive dynamic breadcrumbs
  const path = location.pathname
  const breadcrumbSegments: Array<{ label: string; path?: string }> = [{ label: 'FIXIT', path: '/tracks/fixit' }]

  if (path.includes('/my-tickets')) breadcrumbSegments.push({ label: 'My Tickets' })
  else if (path.includes('/raise')) breadcrumbSegments.push({ label: 'Raise an Issue' })
  else if (path.includes('/tickets/')) {
    const id = path.split('/tickets/')[1]
    breadcrumbSegments.push({ label: 'All Tickets', path: '/tracks/fixit/tickets' })
    breadcrumbSegments.push({ label: id || 'Details' })
  } else if (path.includes('/tickets')) breadcrumbSegments.push({ label: 'All Tickets' })
  else if (path.includes('/map')) breadcrumbSegments.push({ label: 'Campus Map' })
  else if (path.includes('/analytics')) breadcrumbSegments.push({ label: 'Issue Analytics' })
  else if (path.includes('/categories')) breadcrumbSegments.push({ label: 'Issue Categories' })
  else if (path.includes('/notifications')) breadcrumbSegments.push({ label: 'Notifications' })
  else if (path.includes('/settings')) breadcrumbSegments.push({ label: 'Settings' })
  else breadcrumbSegments.push({ label: 'Overview' })

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [styles.navItem, isActive && styles.navItemActive].filter(Boolean).join(' ')

  const roleLabel = getRoleDisplayLabel(user)

  return (
    <div className={styles.shell}>
      {/* SIDEBAR */}
      <aside
        className={[
          styles.sidebar,
          collapsed && styles.sidebarCollapsed,
          mobileOpen && styles.sidebarMobileOpen,
        ].filter(Boolean).join(' ')}
      >
        <div className={styles.sidebarHeader}>
          <Link to="/tracks/fixit" className={styles.brandLink}>
            <div className={styles.brandLogo}>{customization?.logo_url || 'FX'}</div>
            {!collapsed && (
              <div className={styles.brandMeta}>
                <span className={styles.brandName}>{customization?.brand_name || 'FIXIT'}</span>
                <span className={styles.brandTagline}>{customization?.tagline || 'Infrastructure OS'}</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            className={styles.collapseToggle}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className={styles.sidebarNav} aria-label="Main Navigation" onClick={() => setMobileOpen(false)}>
          {!collapsed && <div className={styles.navSectionLabel}>Operations</div>}

          <NavLink to="/tracks/fixit" end className={navClass} title="Overview">
            <span className={styles.navIcon}>⚡</span>
            {!collapsed && <span className={styles.navLabel}>Overview</span>}
          </NavLink>

          <NavLink to="/tracks/fixit/my-tickets" className={navClass} title="My Tickets">
            <span className={styles.navIcon}>👤</span>
            {!collapsed && <span className={styles.navLabel}>My Tickets</span>}
          </NavLink>

          <NavLink to="/tracks/fixit/raise" className={navClass} title="Raise an Issue">
            <span className={styles.navIcon}>➕</span>
            {!collapsed && <span className={styles.navLabel}>Raise an Issue</span>}
          </NavLink>

          <NavLink to="/tracks/fixit/tickets" className={navClass} title="All Tickets">
            <span className={styles.navIcon}>📋</span>
            {!collapsed && <span className={styles.navLabel}>All Tickets</span>}
          </NavLink>

          {!collapsed && <div className={styles.navSectionLabel}>Campus Intelligence</div>}

          <NavLink to="/tracks/fixit/map" className={navClass} title="Campus Map">
            <span className={styles.navIcon}>🗺️</span>
            {!collapsed && <span className={styles.navLabel}>Campus Map</span>}
          </NavLink>

          <NavLink to="/tracks/fixit/analytics" className={navClass} title="Issue Analytics">
            <span className={styles.navIcon}>📊</span>
            {!collapsed && <span className={styles.navLabel}>Issue Analytics</span>}
          </NavLink>

          <NavLink to="/tracks/fixit/categories" className={navClass} title="Issue Categories">
            <span className={styles.navIcon}>🏷️</span>
            {!collapsed && <span className={styles.navLabel}>Issue Categories</span>}
          </NavLink>

          {!collapsed && <div className={styles.navSectionLabel}>Preferences</div>}

          <NavLink to="/tracks/fixit/notifications" className={navClass} title="Notifications">
            <span className={styles.navIcon}>🔔</span>
            {!collapsed && <span className={styles.navLabel}>Notifications</span>}
            {!collapsed && unreadCount > 0 && (
              <span className={styles.navBadge}>{unreadCount}</span>
            )}
          </NavLink>

          <NavLink to="/tracks/fixit/settings" className={navClass} title="Settings">
            <span className={styles.navIcon}>⚙️</span>
            {!collapsed && <span className={styles.navLabel}>Settings</span>}
          </NavLink>

          {user?.role === 'admin' && (
            <>
              {!collapsed && <div className={styles.navSectionLabel}>Developer Control</div>}
              <NavLink to="/tracks/fixit/developer" className={navClass} title="Super Admin Dashboard">
                <span className={styles.navIcon}>⚡</span>
                {!collapsed && <span className={styles.navLabel}>Developer Super Admin</span>}
              </NavLink>
              <NavLink to="/admin" className={navClass} title="Admin Center">
                <span className={styles.navIcon}>🛡️</span>
                {!collapsed && <span className={styles.navLabel}>Admin Center</span>}
              </NavLink>
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.systemStatus}>
            <span className={styles.liveIndicator} />
            {!collapsed && <span>Campus Systems Operational</span>}
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className={styles.mainContainer}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile navigation menu"
            >
              ☰
            </button>

            {/* Breadcrumb Navigation */}
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              {breadcrumbSegments.map((segment, idx) => {
                const isLast = idx === breadcrumbSegments.length - 1
                return (
                  <span key={segment.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {idx > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                    {isLast || !segment.path ? (
                      <span className={styles.breadcrumbCurrent}>{segment.label}</span>
                    ) : (
                      <Link to={segment.path} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {segment.label}
                      </Link>
                    )}
                  </span>
                )
              })}
            </nav>
          </div>

          <div className={styles.topbarRight}>
            {/* Global Search Trigger */}
            <button
              type="button"
              className={styles.searchTrigger}
              onClick={() => setSearchOpen(true)}
              aria-label="Search campus infrastructure"
            >
              <span aria-hidden="true">🔍</span>
              <span>Search tickets, facilities...</span>
              <span className={styles.searchShortcut}>Ctrl K</span>
            </button>

            {/* Notification Icon */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label={`View notifications (${unreadCount} unread)`}
              >
                🔔
                {unreadCount > 0 && <span className={styles.iconBadge}>{unreadCount}</span>}
              </button>

              {notificationsOpen && (
                <div className={styles.notificationPopover} role="menu">
                  <div className={styles.notificationHeader}>
                    <span className={styles.notificationTitle}>Campus Notifications</span>
                    {unreadCount > 0 && (
                      <button type="button" className={styles.clearBtn} onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className={styles.notificationList}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={[
                          styles.notificationItem,
                          !n.read && styles.notificationItemUnread,
                        ].filter(Boolean).join(' ')}
                        onClick={() => {
                          if (n.link) {
                            setNotificationsOpen(false)
                            navigate(n.link)
                          }
                        }}
                      >
                        <span className={styles.notificationIcon}>
                          {n.tone === 'danger' ? '🔴' : n.tone === 'success' ? '🟢' : '🔵'}
                        </span>
                        <div className={styles.notificationContent}>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{n.title}</div>
                          <div className={styles.notificationText}>{n.message}</div>
                          <div className={styles.notificationTime}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Switcher */}
            <ThemeToggle />

            {/* Role Indicator Badge */}
            <Badge
              size="sm"
              tone={
                isFixitManager(user)
                  ? 'primary'
                  : user?.role === 'admin'
                  ? 'danger'
                  : user?.role === 'faculty'
                  ? 'warning'
                  : user?.role === 'office_staff'
                  ? 'neutral'
                  : 'success'
              }
            >
              {roleLabel}
            </Badge>

            {/* User Profile & Demo Switcher */}
            <div ref={profileRef} className={styles.userProfileWrapper}>
              <button
                type="button"
                className={styles.userProfileBtn}
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="User profile and role menu"
              >
                <div className={styles.userAvatar}>
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className={styles.avatarImg} />
                  ) : (
                    user?.name ? user.name[0].toUpperCase() : 'U'
                  )}
                </div>
                <span className={styles.userName}>{user?.name || 'User'}</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>▼</span>
              </button>

              {profileOpen && (
                <div className={styles.profileMenu} role="menu">
                  <div className={styles.menuHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={styles.menuAvatarLarge}>
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className={styles.avatarImg} />
                        ) : (
                          user?.name ? user.name[0].toUpperCase() : 'U'
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={styles.menuName}>{user?.name}</div>
                        <div className={styles.menuEmail}>{user?.email}</div>
                      </div>
                    </div>
                  </div>

                  {Boolean(user) && (
                    <>
                      <div className={styles.menuSectionTitle}>⚡ Switch Role (Expo Demo)</div>
                      <div className={styles.roleSwitcherGrid}>
                        {DEMO_ACCOUNTS.map((acc) => {
                          const isCurrentActive =
                            user?.email?.toLowerCase() === acc.email.toLowerCase() ||
                            (user?.role === acc.role && (!acc.department || user?.department === acc.department || (user as any)?.dept === acc.department))
                          return (
                            <button
                              key={acc.email}
                              type="button"
                              className={[
                                styles.roleSwitchBtn,
                                isCurrentActive && styles.roleSwitchBtnActive,
                              ].filter(Boolean).join(' ')}
                              onClick={() => handleSwitchRole(acc)}
                            >
                              {acc.label}
                            </button>
                          )
                        })}
                      </div>
                      <div className={styles.menuDivider} />
                    </>
                  )}

                  <button
                    type="button"
                    className={styles.menuItemBtn}
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/tracks/fixit/settings')
                    }}
                  >
                    ⚙️ Account Settings
                  </button>

                  <button
                    type="button"
                    className={[styles.menuItemBtn, styles.menuItemDanger].join(' ')}
                    onClick={handleSignOut}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DEMO / EVALUATION SIMULATION BANNER */}
        {user?.is_simulation && (
          <div
            data-testid="simulation-banner"
            style={{
              background: 'linear-gradient(90deg, #4338CA 0%, #6366F1 50%, #7C3AED 100%)',
              color: '#FFFFFF',
              padding: '9px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 2px 10px rgba(67, 56, 202, 0.35)',
              zIndex: 100,
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px' }}>⚡</span>
              <span>
                <strong>DEMO / EVALUATION MODE ACTIVE:</strong> Simulating <u>{user.name}</u> ({user.role?.toUpperCase()}) — {user.email} (Authorized by Developer {user.simulated_by || 'admin@team13.com'})
              </span>
            </div>
            <button
              type="button"
              data-testid="return-to-developer-btn"
              onClick={handleExitSimulation}
              style={{
                background: '#FFFFFF',
                color: '#4338CA',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 14px',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            >
              <span>↩</span>
              <span>Return to Developer Dashboard</span>
            </button>
          </div>
        )}

        {/* GLOBAL BROADCAST BANNER */}
        {customization?.banner_alert_active && customization?.banner_alert_text && (
          <div style={{ background: '#FEF3C7', color: '#92400E', padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>📢</span>
            <span>{customization.banner_alert_text}</span>
          </div>
        )}

        {/* MAINTENANCE MODE NOTICE */}
        {customization?.maintenance_mode?.enabled && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 16px', fontSize: '12px', fontWeight: 700, borderBottom: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>🚧</span>
            <span>
              MAINTENANCE ACTIVE: {customization.maintenance_mode.message} (Expected: {customization.maintenance_mode.estimated_completion || 'Soon'})
            </span>
            {user?.role === 'admin' && <span style={{ background: '#DC2626', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>ADMIN BYPASS</span>}
          </div>
        )}

        {/* CONTENT AREA */}
        <main className={styles.contentArea}>
          <Outlet />
        </main>
      </div>

      {/* GLOBAL SEARCH MODAL */}
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

