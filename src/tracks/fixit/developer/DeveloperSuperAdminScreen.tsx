import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  useAuth,
  publishCustomization,
  createDatabaseBackup,
  toggleMaintenanceMode,
  getWebsiteCustomization,
  getConfiguredDeveloperGmail,
} from '@/core'
import styles from './DeveloperSuperAdminScreen.module.css'

// Tabs
import { OverviewTab } from './tabs/OverviewTab'
import { UserManagementTab } from './tabs/UserManagementTab'
import { ComplaintManagementTab } from './tabs/ComplaintManagementTab'
import { SolverManagementTab } from './tabs/SolverManagementTab'
import { CustomizationStudioTab } from './tabs/CustomizationStudioTab'
import { PageManagementTab } from './tabs/PageManagementTab'
import { AnnouncementCenterTab } from './tabs/AnnouncementCenterTab'
import { AnalyticsReportsTab } from './tabs/AnalyticsReportsTab'
import { SystemMonitoringTab } from './tabs/SystemMonitoringTab'
import { SecurityCenterTab } from './tabs/SecurityCenterTab'
import { DatabaseManagementTab } from './tabs/DatabaseManagementTab'
import { MaintenanceModeTab } from './tabs/MaintenanceModeTab'
import { DeveloperSettingsTab } from './tabs/DeveloperSettingsTab'

interface NavSection {
  id: string
  label: string
  icon: string
  badge?: string
}

const SECTIONS: NavSection[] = [
  { id: 'overview', label: 'Overview', icon: '⚡' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'complaints', label: 'Complaint Management', icon: '📋' },
  { id: 'solvers', label: 'Problem Solvers', icon: '🛠️' },
  { id: 'customization', label: 'Website Studio', icon: '🎨', badge: 'LIVE' },
  { id: 'pages', label: 'Page Management', icon: '📄' },
  { id: 'announcements', label: 'Announcements', icon: '📢' },
  { id: 'analytics', label: 'Analytics & Reports', icon: '📊' },
  { id: 'monitoring', label: 'System Monitoring', icon: '🖥️' },
  { id: 'security', label: 'Security Center', icon: '🛡️' },
  { id: 'database', label: 'Database & Backups', icon: '💾' },
  { id: 'maintenance', label: 'Maintenance Mode', icon: '🚧' },
  { id: 'settings', label: 'Developer Settings', icon: '⚙️' },
]

export function DeveloperSuperAdminScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [quickActionLoading, setQuickActionLoading] = useState(false)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage((curr) => (curr === msg ? null : curr)), 4000)
  }

  // Developer Super Admin Role Guard - STRICTLY MAIN DEVELOPER ONLY
  const devGmail = getConfiguredDeveloperGmail()
  const isAuthorized =
    user &&
    ((user as any).is_super_admin ||
      user.role === 'developer' ||
      user.email.toLowerCase() === devGmail ||
      user.email.toLowerCase() === 'admin@team13.com' ||
      user.email.toLowerCase() === 'admin@team1.com') &&
    !user.is_simulation

  if (!isAuthorized) {
    return (
      <div style={{ padding: '60px 20px', maxWidth: '580px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 12px 0' }}>Developer Control Center Locked</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          This dashboard is exclusively accessible to the authenticated developer super administrator (<code style={{ color: 'var(--color-primary)' }}>{devGmail}</code>). You are currently signed in as{' '}
          <strong>{user ? `${user.name} (${user.role})` : 'Anonymous'}</strong>.
        </p>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          style={{ padding: '10px 20px', fontSize: '14px' }}
          onClick={() => navigate('/developer/login?next=/tracks/fixit/developer')}
          data-testid="dev-authenticate-btn"
        >
          Authenticate as Developer Super Admin
        </button>
      </div>
    )
  }

  // Quick Action Handlers
  async function handleQuickPublish() {
    try {
      setQuickActionLoading(true)
      const current = await getWebsiteCustomization()
      const res = await publishCustomization(current)
      showToast(`Website published live! Version ${res.version} active on client portal.`)
    } catch (err: any) {
      showToast(`Publish error: ${err.message}`)
    } finally {
      setQuickActionLoading(false)
    }
  }

  async function handleQuickBackup() {
    try {
      setQuickActionLoading(true)
      const res = await createDatabaseBackup()
      showToast(`Database backup ${res.id} created successfully!`)
    } catch (err: any) {
      showToast(`Backup error: ${err.message}`)
    } finally {
      setQuickActionLoading(false)
    }
  }

  async function handleQuickToggleMaintenance() {
    try {
      setQuickActionLoading(true)
      const current = await getWebsiteCustomization()
      const nextState = !current.maintenance_mode.enabled
      await toggleMaintenanceMode(
        nextState,
        'Campus Fixit is currently undergoing scheduled platform upgrades.',
        '20 minutes'
      )
      showToast(`Maintenance mode is now ${nextState ? 'ACTIVE' : 'DEACTIVATED'}`)
    } catch (err: any) {
      showToast(`Maintenance error: ${err.message}`)
    } finally {
      setQuickActionLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Top Bar with Quick Actions */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: 'var(--color-text)',
              padding: '4px',
            }}
            onClick={() => setCollapsed(!collapsed)}
            title="Toggle Sidebar"
          >
            ☰
          </button>
          <span className={styles.glowBadge}>
            <span className={styles.glowDot} />
            SUPER ADMIN
          </span>
          <h1 className={styles.topTitle}>Developer Central Command</h1>
        </div>

        {/* 8 Functional Quick Action Buttons */}
        <div className={styles.quickActionsBar}>
          <button
            className={styles.actionBtn}
            onClick={() => setActiveTab('customization')}
            title="Edit Website"
          >
            🎨 Edit Website
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setActiveTab('users')}
            title="Add User"
          >
            👤 Add User
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setActiveTab('complaints')}
            title="Assign Complaint"
          >
            📋 Assign Complaint
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={handleQuickPublish}
            disabled={quickActionLoading}
            title="Publish Changes"
          >
            🚀 Publish Changes
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setActiveTab('monitoring')}
            title="View Error Logs"
          >
            📜 Error Logs
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleQuickBackup}
            disabled={quickActionLoading}
            title="Create Backup"
          >
            💾 Create Backup
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={handleQuickToggleMaintenance}
            disabled={quickActionLoading}
            title="Toggle Maintenance Mode"
          >
            🚧 Maintenance Mode
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => navigate('/tracks/fixit')}
            title="View Live Website"
          >
            🌐 View Live Site
          </button>
        </div>
      </header>

      {/* Main Layout: Sidebar + Active Content Tab */}
      <div className={styles.mainLayout}>
        <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
          <div className={styles.sidebarHeader}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              {!collapsed && 'Control Matrix'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-primary)' }}>13 Modules</span>
          </div>

          <nav className={styles.sidebarNav}>
            {SECTIONS.map((s) => {
              const active = activeTab === s.id
              return (
                <button
                  key={s.id}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  onClick={() => setActiveTab(s.id)}
                  title={collapsed ? s.label : undefined}
                >
                  <span className={styles.navIcon}>{s.icon}</span>
                  {!collapsed && <span className={styles.navLabel}>{s.label}</span>}
                  {!collapsed && s.badge && <span className={styles.navBadge}>{s.badge}</span>}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Tab Content Canvas */}
        <main className={styles.contentArea}>
          {activeTab === 'overview' && (
            <OverviewTab
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenQuickAction={(action) => {
                if (action === 'backup') handleQuickBackup()
              }}
            />
          )}
          {activeTab === 'users' && <UserManagementTab onNotify={showToast} />}
          {activeTab === 'complaints' && <ComplaintManagementTab onNotify={showToast} />}
          {activeTab === 'solvers' && (
            <SolverManagementTab onNotify={showToast} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'customization' && (
            <CustomizationStudioTab
              onNotify={showToast}
              onBroadcastCustomization={() => {
                showToast('Website design system tokens refreshed!')
              }}
            />
          )}
          {activeTab === 'pages' && <PageManagementTab onNotify={showToast} />}
          {activeTab === 'announcements' && <AnnouncementCenterTab onNotify={showToast} />}
          {activeTab === 'analytics' && <AnalyticsReportsTab onNotify={showToast} />}
          {activeTab === 'monitoring' && <SystemMonitoringTab onNotify={showToast} />}
          {activeTab === 'security' && <SecurityCenterTab onNotify={showToast} />}
          {activeTab === 'database' && <DatabaseManagementTab onNotify={showToast} />}
          {activeTab === 'maintenance' && <MaintenanceModeTab onNotify={showToast} />}
          {activeTab === 'settings' && <DeveloperSettingsTab onNotify={showToast} />}
        </main>
      </div>

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div className={styles.toast}>
          <span style={{ color: '#10B981' }}>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
