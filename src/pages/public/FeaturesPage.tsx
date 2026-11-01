import { Link } from 'react-router'
import {
  Camera,
  Activity,
  Clock,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Shield,
  ArrowRight,
  Database,
  Search,
} from 'lucide-react'
import { useAuth, getRoleLandingPath } from '@/core/auth'
import styles from './FeaturesPage.module.css'

export function FeaturesPage() {
  const { user } = useAuth()
  const ctaDest = user ? getRoleLandingPath(user) : '/login'
  const ctaText = user ? 'Enter Workspace' : 'Sign In to FixIt'
  const coreFeatures = [
    {
      icon: <Camera size={22} />,
      title: 'Photo-based Incident Reporting',
      desc: 'Attach JPEG/PNG evidence up to 5 MB per ticket. Drag-and-drop or mobile photo capture with preview, swap, and deletion before submission.',
    },
    {
      icon: <Layers size={22} />,
      title: 'Dynamic Issue Categories',
      desc: 'Issue categories are loaded dynamically from the backend (Electrical, Plumbing, HVAC, Smart Class, Structural, Network). Campus Maintenance has full CRUD control.',
    },
    {
      icon: <Clock size={22} />,
      title: 'Turnaround Time (TAT) Commitments',
      desc: 'Facility supervisors set explicit resolution deadlines on open tickets. All timestamps and deadlines are rendered in India Standard Time (IST).',
    },
    {
      icon: <AlertTriangle size={22} />,
      title: 'Automated Overdue Detection',
      desc: 'When committed turnaround dates elapse without resolution, the backend flags the ticket as overdue. Real-time visual alerts prompt immediate intervention.',
    },
    {
      icon: <Activity size={22} />,
      title: 'Mandatory Progress Updates',
      desc: 'Every dispatch requires a structured note (1–280 chars) from the technician, ensuring students and faculty are continually informed.',
    },
    {
      icon: <CheckCircle2 size={22} />,
      title: 'Reporter Acknowledgment Loop',
      desc: 'Tickets are only finalized when the reporting user acknowledges that the problem has actually been fixed on the physical campus.',
    },
    {
      icon: <Search size={22} />,
      title: 'Multi-criteria Ticket Filtering',
      desc: 'Filter work orders by status (open, resolved, acknowledged), issue category, overdue status, or personal reporting scope.',
    },
    {
      icon: <Shield size={22} />,
      title: 'Role-Enforced Governance',
      desc: 'Strict authorization matrix: students and faculty control their own tickets, Campus Maintenance manages work orders, and Admin oversees the entire campus ledger.',
    },
    {
      icon: <Database size={22} />,
      title: 'Authenticated Media Vault',
      desc: 'Temporary signed URLs for rapid image previewing, coupled with authenticated download endpoints passing Bearer tokens for secure retrieval.',
    },
  ]

  return (
    <div className={styles.page}>
      <section className={styles.headerSection}>
        <div className={styles.container}>
          <span className={styles.kicker}>COMPREHENSIVE CAPABILITIES</span>
          <h1 className={styles.title}>Engineered for Campus Precision</h1>
          <p className={styles.subtitle}>
            Explore the complete suite of architectural maintenance features powering CampusOS FixIt across academic,
            residential, laboratory, and administrative facilities.
          </p>
        </div>
      </section>

      <section className={styles.gridSection}>
        <div className={styles.container}>
          <div className={styles.featureGrid}>
            {coreFeatures.map((f, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.iconBox}>{f.icon}</div>
                <h3 className={styles.cardTitle}>{f.title}</h3>
                <p className={styles.cardDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className={styles.workflowSection}>
        <div className={styles.container}>
          <div className={styles.workflowCard}>
            <div className={styles.workflowText}>
              <span className={styles.workflowKicker}>INTEGRATED ARCHITECTURE</span>
              <h2>Ready to streamline facility operations?</h2>
              <p>
                Join institutional administrators and maintenance engineers running CampusOS FixIt to eliminate maintenance backlogs and establish complete accountability.
              </p>
              <Link to={ctaDest} className={styles.workflowBtn}>
                <span>{ctaText}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
