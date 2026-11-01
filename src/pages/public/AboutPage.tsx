import { Link } from 'react-router'
import { Building2, Users2, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth, getRoleLandingPath } from '@/core/auth'
import styles from './AboutPage.module.css'

export function AboutPage() {
  const { user } = useAuth()
  const ctaDest = user ? getRoleLandingPath(user) : '/login'
  const ctaText = user ? 'Enter Workspace' : 'Get Started with FixIt'
  return (
    <div className={styles.page}>
      <section className={styles.headerSection}>
        <div className={styles.container}>
          <span className={styles.kicker}>THE CAMPUSOS VISION</span>
          <h1 className={styles.title}>Reinventing Campus Facilities</h1>
          <p className={styles.subtitle}>
            Higher education environments function best when infrastructure is transparent, reliable, and proactively
            maintained. CampusOS FixIt transforms institutional maintenance into a seamless collaborative cycle.
          </p>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.manifestoGrid}>
            <div className={styles.manifestoCol}>
              <span className={styles.colKicker}>THE PROBLEM</span>
              <h2>Broken Fans, Silent Frustrations</h2>
              <p>
                In large universities, students and faculty frequently encounter damaged classroom benches, leaking
                laboratory faucets, failing air handlers, and fluctuating power sockets. Traditionally, reporting
                these issues meant submitting paper forms or emailing disconnected administrative desks where tickets
                languished for weeks without status updates.
              </p>
            </div>
            <div className={styles.manifestoCol}>
              <span className={styles.colKicker}>THE FIXIT SOLUTION</span>
              <h2>Accountability Through Transparency</h2>
              <p>
                CampusOS FixIt eliminates communication gaps by connecting students directly with Campus Maintenance
                supervisors. Every dispatch is time-stamped, categorized, given an explicit turnaround date, and
                documented with mandatory technician progress notes. Most crucially, the reporting student confirms
                the fix before the ticket is officially closed.
              </p>
            </div>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <Building2 className={styles.valIcon} size={24} />
              <h4>Architectural Rigor</h4>
              <p>
                Built to match the rigorous operational standards of top engineering, medical, and research universities.
              </p>
            </div>
            <div className={styles.valueCard}>
              <ShieldCheck className={styles.valIcon} size={24} />
              <h4>Verified Closures</h4>
              <p>
                No ticket is quietly marked "resolved" without reporter acknowledgment. Quality is verified at the source.
              </p>
            </div>
            <div className={styles.valueCard}>
              <Users2 className={styles.valIcon} size={24} />
              <h4>Collaborative Ownership</h4>
              <p>
                Students, faculty, facility staff, and administrators share an institution-wide responsibility for campus excellence.
              </p>
            </div>
          </div>
          <div className={styles.ctaBox}>
            <h3>Ready to experience CampusOS FixIt?</h3>
            <p>
              Report campus issues, coordinate maintenance, and ensure every repair is verified.
            </p>
            <Link to={ctaDest} className={styles.ctaBtn}>
              <span>{ctaText}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
