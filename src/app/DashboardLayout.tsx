import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import {
  Wrench,
  LayoutDashboard,
  PlusCircle,
  Ticket as TicketIcon,
  Layers,
  Shield,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Building,
} from 'lucide-react'
import { useAuth, isCampusMaintenanceStaff, isAdminUser } from '@/core/auth'
import styles from './DashboardLayout.module.css'

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const isCM = isCampusMaintenanceStaff(user)
  const isAdmin = isAdminUser(user)

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  // Get user role display label
  const getRoleLabel = () => {
    if (!user) return 'Guest'
    if (isAdmin) return 'Administrator'
    if (isCM) return 'Campus Maintenance'
    if (user.role === 'faculty') return 'Faculty Member'
    if (user.role === 'office_staff') return `Staff (${user.dept || 'Office'})`
    return 'Student Reporter'
  }

  return (
    <div className={styles.appShell}>
      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside className={`${styles.sidebar} ${mobileSidebarOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <Link to="/" className={styles.brandLink}>
            <div className={styles.brandIconBox}>
              <Wrench size={18} />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>CampusOS</span>
              <span className={styles.brandModule}>FIXIT</span>
            </div>
          </Link>
          <button
            type="button"
            className={styles.mobileCloseBtn}
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.instPill}>
          <span className={styles.instDot} />
          <span className={styles.instName}>{user?.institution_name || 'Team 13 Campus'}</span>
        </div>

        {/* Navigation Sections */}
        <nav className={styles.navMenu} aria-label="Application Navigation">
          {/* General Workspace Section */}
          <div className={styles.navGroup}>
            <span className={styles.groupHeading}>REPORTER PORTAL</span>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeItem : ''}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <LayoutDashboard size={17} />
              <span>Overview</span>
            </NavLink>

            <NavLink
              to="/raise-ticket"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeItem : ''}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <PlusCircle size={17} />
              <span>Raise Complaint</span>
            </NavLink>

            <NavLink
              to="/my-tickets"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeItem : ''}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <TicketIcon size={17} />
              <span>My Tickets</span>
            </NavLink>
          </div>

          {/* Maintenance Operations Section (Highlighted for Campus Maintenance & Admin) */}
          {(isCM || isAdmin) && (
            <div className={styles.navGroup}>
              <span className={styles.groupHeading}>FACILITY OPERATIONS</span>
              <NavLink
                to="/operations"
                end
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeItem : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <Building size={17} />
                <span>Operations Overview</span>
              </NavLink>

              <NavLink
                to="/operations/tickets"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeItem : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <TicketIcon size={17} />
                <span>All Tickets Board</span>
              </NavLink>

              <NavLink
                to="/operations/issue-types"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeItem : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <Layers size={17} />
                <span>Issue Categories</span>
              </NavLink>
            </div>
          )}

          {/* Admin Command Centre Section (Only for Admin) */}
          {isAdmin && (
            <div className={styles.navGroup}>
              <span className={styles.groupHeading}>ADMINISTRATION</span>
              <NavLink
                to="/admin"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeItem : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
                data-testid="nav-admin"
              >
                <Shield size={17} />
                <span>Admin Command</span>
              </NavLink>
            </div>
          )}

          {/* Account Section */}
          <div className={styles.navGroup}>
            <span className={styles.groupHeading}>ACCOUNT</span>
            <NavLink
              to="/profile"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeItem : ''}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <UserIcon size={17} />
              <span>My Profile</span>
            </NavLink>
          </div>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'Authorized User'}</span>
              <span className={styles.userRoleBadge}>{getRoleLabel()}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.signOutBtn}
            onClick={handleSignOut}
            title="Sign out of CampusOS"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <div className={styles.canvasArea}>
        {/* Topbar Header */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.mobileMenuToggle}
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className={styles.systemStatusPill}>
              <span className={styles.statusDot} />
              <span className={styles.statusLabel}>Connected to Campus Cloud API</span>
            </div>
          </div>

          <div className={styles.topbarRight}>
            <Link to="/" className={styles.viewSiteLink} target="_blank" rel="noreferrer">
              <span>Public Website</span>
              <ExternalLink size={13} />
            </Link>
            <div className={styles.userPill}>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
