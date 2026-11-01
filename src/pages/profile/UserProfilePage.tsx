import React from 'react'
import { Link, useNavigate } from 'react-router'
import {
  LogOut,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../core/auth'
import {
  isCampusMaintenanceStaff,
  isAdminUser,
  getRoleLandingPath,
} from '../../core/auth/session'
import { Badge } from '../../ui/Badge'
import styles from './UserProfilePage.module.css'

export const UserProfilePage: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  const isMaint = isCampusMaintenanceStaff(user)
  const isAdmin = isAdminUser(user)
  const landingPath = getRoleLandingPath(user)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const roleLabel = isAdmin
    ? 'Institutional Administrator'
    : isMaint
    ? 'Campus Maintenance Specialist'
    : user.role === 'faculty'
    ? 'Faculty Member'
    : user.role === 'office_staff'
    ? 'Office Staff Member'
    : 'Student Reporter'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>User Identity & Security</h1>
          <p className={styles.subtitle}>
            Verified credentials, operational authorization scope, and current session telemetry.
          </p>
        </div>
      </div>

      <div className={styles.card}>
        {/* Identity Header */}
        <div className={styles.identityBanner}>
          <div className={styles.avatarBox}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className={styles.identityDetails}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 className={styles.userName}>{user.name || 'Campus Member'}</h2>
              <Badge variant={isAdmin ? 'critical' : isMaint ? 'info' : 'success'}>
                {roleLabel}
              </Badge>
            </div>
            <div className={styles.userEmail}>{user.email || (user as any).email_id}</div>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Department</span>
            <span className={styles.infoValue}>{user.dept || 'Engineering'}</span>
          </div>

          {user.designation && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Designation</span>
              <span className={styles.infoValue}>{user.designation}</span>
            </div>
          )}

          {user.usn && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>USN</span>
              <span className={styles.infoValue}>{user.usn}</span>
            </div>
          )}

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Contact Number</span>
            <span className={styles.infoValue}>{user.phone_number || '+91 9000000000'}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Institution Team ID</span>
            <span className={styles.infoValue}>{(user as any).team_id || user.institution_name || 'Team 13'}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Session Status</span>
            <span className={styles.infoValue} style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={15} /> Active (Bearer Token)
            </span>
          </div>
        </div>

        {/* Scope and Permissions description */}
        <div className={styles.scopeBox}>
          <div className={styles.scopeTitle}>Institutional Authorization Scope</div>
          <div className={styles.scopeDesc}>
            {isAdmin ? (
              <>
                You hold <strong>Institutional Governance</strong> authority. You can purge tickets, download photographic
                evidence with Bearer authorization, manage user identity provisioning, and monitor live system telemetry.
              </>
            ) : isMaint ? (
              <>
                You hold <strong>Campus Maintenance Operational</strong> authority. You can inspect all campus work orders,
                dispatch technicians, set turnaround commitments (TAT), post progress logs, mark issues resolved, and manage
                the master issue taxonomy.
              </>
            ) : (
              <>
                You hold <strong>Campus Issue Reporter</strong> authority. You can submit maintenance issues with photo evidence,
                monitor repair progress in real time, edit open submissions, and provide sign-off confirmation once repairs are completed.
              </>
            )}
          </div>
        </div>

        {/* Action Row */}
        <div className={styles.actionRow}>
          <button type="button" className={styles.btnLogout} onClick={handleLogout}>
            <LogOut size={15} />
            Sign Out
          </button>

          <Link to={landingPath} className={styles.btnDashboard}>
            Open Work Dashboard <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  )
}
export default UserProfilePage
