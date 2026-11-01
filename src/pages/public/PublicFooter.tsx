import { Link } from 'react-router'
import { Wrench } from 'lucide-react'
import styles from './PublicFooter.module.css'

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topGrid}>
          {/* Brand & Mission */}
          <div className={styles.brandCol}>
            <div className={styles.brand}>
              <div className={styles.logoMark}>
                <Wrench size={16} />
              </div>
              <span className={styles.brandTitle}>CampusOS FixIt</span>
            </div>
            <p className={styles.brandDesc}>
              Architectural operations intelligence for higher education. Streamlining campus infrastructure
              reporting, maintenance response workflows, and resolution verification across institutional facilities.
            </p>
          </div>

          {/* Navigation */}
          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>Navigation</h4>
            <ul className={styles.linkList}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/features">Product Features</Link></li>
              <li><Link to="/#how-it-works">How It Works</Link></li>
              <li><Link to="/about">About Platform</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Capabilities */}
          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>Operational Modules</h4>
            <ul className={styles.linkList}>
              <li><Link to="/raise-ticket">Complaint Reporting</Link></li>
              <li><Link to="/my-tickets">Ticket Tracking</Link></li>
              <li><Link to="/operations">Maintenance Work Orders</Link></li>
              <li><Link to="/operations/issue-types">Issue Category Management</Link></li>
              <li><Link to="/admin">Admin Command Centre</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>Access Portals</h4>
            <ul className={styles.linkList}>
              <li><Link to="/login?category=student_faculty">Student & Faculty Sign In</Link></li>
              <li><Link to="/login?category=maintenance">Campus Maintenance Login</Link></li>
              <li><Link to="/login?category=admin">Administrator Login</Link></li>
              <li><Link to="/dashboard">Operational Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} CampusOS Infrastructure & Operations. All rights reserved.
          </p>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>Backend Systems Connected</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

