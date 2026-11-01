import { useState, useEffect, type MouseEvent } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  Layers,
  Wrench,
  Shield,
  FileCheck,
  Building,
  Activity,
  Users,
  Compass,
  Check,
  ExternalLink,
  MessageSquare,
} from 'lucide-react'
import { useAuth, getRoleLandingPath } from '@/core/auth'
import styles from './LandingPage.module.css'

interface PreviewTicket {
  id: string
  title: string
  location: string
  category: string
  status: 'OPEN' | 'IN PROGRESS' | 'RESOLVED' | 'OVERDUE'
  tat: string
  isOverdue?: boolean
  description: string
  reporter: string
  reporterRole: string
  reportDate: string
  timeline: Array<{
    dotType: 'success' | 'active' | 'pending'
    title: string
    sub: string
  }>
}

const INITIAL_PREVIEW_TICKETS: PreviewTicket[] = [
  {
    id: 'TKT-1006',
    title: 'Solar Water Heater Heat-Exchanger Valve Burst',
    location: 'Hostel Complex Block A • Rooftop Array',
    category: 'Plumbing',
    status: 'OPEN',
    tat: '02 Nov 2026',
    description:
      'Severe hydraulic valve gasket rupture spraying scalding water across the solar array platform. Urgent isolation and valve replacement required.',
    reporter: 'Rahul Verma',
    reporterRole: 'Student (Hostel Block A)',
    reportDate: '30 Oct 2026, 09:14 AM IST',
    timeline: [
      {
        dotType: 'success',
        title: 'Reported by Rahul Verma (Student)',
        sub: '30 Oct 2026, 09:14 AM IST • Photo verified',
      },
      {
        dotType: 'active',
        title: 'Maintenance Queue: Assigned to Plumbing Team',
        sub: 'Replacement 2-inch ball valve requisitioned',
      },
      {
        dotType: 'pending',
        title: 'Target Resolution: 02 Nov 2026',
        sub: 'Committed turnaround time',
      },
    ],
  },
  {
    id: 'TKT-1001',
    title: 'Server Room 302 Chiller Auxiliary Compressor Trip',
    location: 'Aryabhata Block • Floor 3 Server Enclosure',
    category: 'HVAC',
    status: 'OVERDUE',
    tat: '29 Oct 2026',
    isOverdue: true,
    description:
      'Auxiliary cooling loop tripped on high head pressure. Main rack temperatures elevated to 27°C. Critical airflow risk for high-performance compute clusters.',
    reporter: 'Anand Kulkarni',
    reporterRole: 'System Admin (Staff)',
    reportDate: '27 Oct 2026, 02:45 PM IST',
    timeline: [
      {
        dotType: 'success',
        title: 'Reported by Anand Kulkarni (IT Staff)',
        sub: '27 Oct 2026, 02:45 PM IST',
      },
      {
        dotType: 'active',
        title: 'Technician Update: Refrigerant leak isolated',
        sub: 'Evacuation pump running; waiting for R410A gas canister',
      },
      {
        dotType: 'pending',
        title: 'Committed TAT: 29 Oct 2026 (Overdue)',
        sub: 'Escalated to Chief Maintenance Engineer',
      },
    ],
  },
  {
    id: 'TKT-1003',
    title: 'Phase 3 Harmonic Surge on Laser Spectroscopy Sub-panel',
    location: 'Ramanujan Science Tower • Lab 404',
    category: 'Electrical',
    status: 'IN PROGRESS',
    tat: '31 Oct 2026',
    description:
      'Voltage fluctuations triggering laser protective trip circuits. Sensitive optics lab operations suspended until load balancing completed.',
    reporter: 'Dr. Vikram Sen',
    reporterRole: 'Faculty (Physics Dept)',
    reportDate: '28 Oct 2026, 07:22 PM IST',
    timeline: [
      {
        dotType: 'success',
        title: 'Reported by Dr. Vikram Sen (Faculty)',
        sub: '28 Oct 2026, 07:22 PM IST',
      },
      {
        dotType: 'active',
        title: 'Maintenance Progress: Electrician assigned',
        sub: 'Industrial capacitor replacement in progress',
      },
      {
        dotType: 'pending',
        title: 'Target Resolution: 31 Oct 2026',
        sub: 'Committed turnaround time',
      },
    ],
  },
  {
    id: 'TKT-1004',
    title: 'Passenger Lift L-02 Micro-Switch Interlock Seizure',
    location: 'Kalam Innovation Hub • North Shaft Bank B',
    category: 'Elevators',
    status: 'RESOLVED',
    tat: '29 Oct 2026',
    description:
      'Door safety interlock switch failed to contact on Ground Floor landing, preventing elevator cabin carriage movement.',
    reporter: 'Meena Swaminathan',
    reporterRole: 'Facility Coordinator (Staff)',
    reportDate: '26 Oct 2026, 11:05 AM IST',
    timeline: [
      {
        dotType: 'success',
        title: 'Reported by Meena Swaminathan (Staff)',
        sub: '26 Oct 2026, 11:05 AM IST',
      },
      {
        dotType: 'success',
        title: 'Maintenance Resolution: Interlock replaced & tested',
        sub: 'Otis contractor replaced micro-switch assembly',
      },
      {
        dotType: 'active',
        title: 'Pending Reporter Acknowledgment',
        sub: 'Awaiting reporter inspection to finalize closure',
      },
    ],
  },
]

export function LandingPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'reporter' | 'maintenance' | 'admin'>('maintenance')

  // Interactive Live Dashboard Preview State
  const [previewTickets, setPreviewTickets] = useState<PreviewTicket[]>(INITIAL_PREVIEW_TICKETS)
  const [selectedTicketId, setSelectedTicketId] = useState<string>('TKT-1003')
  const [isComposingNote, setIsComposingNote] = useState(false)
  const [customNote, setCustomNote] = useState('')
  const [previewFeedback, setPreviewFeedback] = useState<string | null>(null)

  const activeTicket =
    previewTickets.find((t) => t.id === selectedTicketId) || previewTickets[0]

  // Smooth scroll handler for anchor links
  const scrollToFeatures = (e?: MouseEvent) => {
    e?.preventDefault()
    const el = document.getElementById('features')
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 75
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  // Handle URL hash on initial load
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => {
          const top = el.getBoundingClientRect().top + window.scrollY - 75
          window.scrollTo({ top, behavior: 'smooth' })
        }, 100)
      }
    }
  }, [])

  // Auto-clear preview feedback
  useEffect(() => {
    if (!previewFeedback) return
    const timer = setTimeout(() => setPreviewFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [previewFeedback])

  // Handle posting a progress update in interactive preview
  const handlePostUpdate = (noteText: string) => {
    if (!noteText.trim()) return

    setPreviewTickets((prev) =>
      prev.map((t) => {
        if (t.id !== selectedTicketId) return t
        return {
          ...t,
          status: t.status === 'OPEN' || t.status === 'OVERDUE' ? 'IN PROGRESS' : t.status,
          timeline: [
            ...t.timeline.slice(0, 2),
            {
              dotType: 'active',
              title: `Maintenance Update: ${noteText.trim()}`,
              sub: 'Just now • Logged by Facility Operations',
            },
            ...t.timeline.slice(2),
          ],
        }
      }),
    )

    setCustomNote('')
    setIsComposingNote(false)
    setPreviewFeedback(`Progress note logged for ${selectedTicketId}!`)
  }

  // Handle resolving work order in interactive preview
  const handleResolveWorkOrder = () => {
    setPreviewTickets((prev) =>
      prev.map((t) => {
        if (t.id !== selectedTicketId) return t
        return {
          ...t,
          status: 'RESOLVED',
          isOverdue: false,
          timeline: [
            ...t.timeline,
            {
              dotType: 'success',
              title: 'Work Order Resolved by Campus Maintenance',
              sub: 'Repair completed • Awaiting reporter confirmation',
            },
          ],
        }
      }),
    )
    setPreviewFeedback(`${selectedTicketId} marked as RESOLVED!`)
  }

  const primaryDest = user ? getRoleLandingPath(user) : '/login'
  const primaryText = user ? 'Enter Workspace' : 'Get Started'

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.container}>
          <div className={styles.heroHeader}>
            <div className={styles.kickerBadge}>
              <span className={styles.kickerDot} />
              <span>Campus Facilities Infrastructure System</span>
            </div>
            <h1 className={styles.heroHeadline}>
              Your Campus.<br />Better Maintained.
            </h1>
            <p className={styles.heroDescription}>
              Report campus issues, coordinate maintenance and follow every repair from the first report
              to final resolution — all in one connected platform.
            </p>
            <div className={styles.heroCtaGroup}>
              <Link to={primaryDest} className={styles.primaryCta}>
                <span>{primaryText}</span>
                <ArrowRight size={16} />
              </Link>
              <button type="button" onClick={scrollToFeatures} className={styles.secondaryCta}>
                <span>Explore Platform</span>
              </button>
            </div>
          </div>

          {/* Original Product Preview Dashboard Composition */}
          <div className={styles.previewContainer}>
            <div className={styles.previewWindow}>
              {/* Window Header */}
              <div className={styles.windowHeader}>
                <div className={styles.windowControls}>
                  <span className={styles.controlDot} />
                  <span className={styles.controlDot} />
                  <span className={styles.controlDot} />
                </div>
                <Link
                  to={user ? '/operations' : '/login?category=maintenance'}
                  className={styles.windowAddressLink}
                  title="Click to open Operations Board"
                >
                  <span>campusos.internal / fixit / operations-board</span>
                  <ExternalLink size={11} />
                </Link>
                <div className={styles.windowStatus}>
                  <span className={styles.livePulse} />
                  <span>LIVE FACILITY DISPATCH</span>
                </div>
              </div>

              {/* Dashboard Layout Composition */}
              <div className={styles.dashboardCanvas}>
                {/* Metric Summary Ribbon with direct links */}
                <div className={styles.metricRibbon}>
                  <Link
                    to={user ? '/operations/tickets' : '/login?category=maintenance'}
                    className={`${styles.metricCard} ${styles.metricCardLink}`}
                    title="View active maintenance tickets"
                  >
                    <span className={styles.metricLabel}>ACTIVE COMPLAINTS</span>
                    <span className={styles.metricValue}>14</span>
                    <span className={styles.metricSub}>9 on schedule</span>
                  </Link>

                  <Link
                    to={user ? '/operations' : '/login?category=maintenance'}
                    className={`${styles.metricCard} ${styles.metricCardLink}`}
                    title="View turnaround metrics"
                  >
                    <span className={styles.metricLabel}>AVG TURNAROUND</span>
                    <span className={styles.metricValue}>1.8<small>d</small></span>
                    <span className={styles.metricSub}>-4h vs last term</span>
                  </Link>

                  <Link
                    to={user ? '/operations/tickets' : '/login?category=maintenance'}
                    className={`${styles.metricCard} ${styles.metricCardLink}`}
                    title="View overdue attention queue"
                  >
                    <span className={styles.metricLabel}>OVERDUE TICKETS</span>
                    <span className={`${styles.metricValue} ${styles.valCritical}`}>1</span>
                    <span className={styles.metricSub}>Action required</span>
                  </Link>

                  <Link
                    to={user ? '/operations' : '/login?category=maintenance'}
                    className={`${styles.metricCard} ${styles.metricCardLink}`}
                    title="View resolution closure metrics"
                  >
                    <span className={styles.metricLabel}>CONFIRMATION RATE</span>
                    <span className={`${styles.metricValue} ${styles.valSuccess}`}>98.4%</span>
                    <span className={styles.metricSub}>Reporter acknowledged</span>
                  </Link>
                </div>

                {/* Operations Grid Composition */}
                <div className={styles.opsGrid}>
                  {/* Left: Interactive Work Order Table */}
                  <div className={styles.tablePanel}>
                    <div className={styles.panelHeader}>
                      <div>
                        <h4 className={styles.panelTitle}>Campus Maintenance Work Order Dispatch</h4>
                        <p className={styles.panelSubtitle}>
                          Select any row below to inspect and manage in live preview
                        </p>
                      </div>
                      <Link
                        to="/about"
                        className={styles.panelBadge}
                        title="About CampusOS FixIt"
                      >
                        Team 13 Institution
                      </Link>
                    </div>

                    <div className={styles.workOrderTable}>
                      <div className={styles.tableHead}>
                        <span>TICKET ID</span>
                        <span>FACILITY ISSUE</span>
                        <span>CATEGORY</span>
                        <span>STATUS</span>
                        <span>TAT</span>
                      </div>

                      {previewTickets.map((t) => (
                        <div
                          key={t.id}
                          className={`${styles.tableRow} ${
                            t.id === selectedTicketId ? styles.tableRowActive : ''
                          } ${t.isOverdue && t.status !== 'RESOLVED' ? styles.rowOverdue : ''}`}
                          onClick={() => setSelectedTicketId(t.id)}
                          role="button"
                          tabIndex={0}
                          title={`Click to inspect ${t.id}`}
                        >
                          <span className={styles.monoId}>{t.id}</span>
                          <div className={styles.issueCell}>
                            <strong>{t.title}</strong>
                            <small>{t.location}</small>
                          </div>
                          <span className={styles.catBadge}>{t.category}</span>
                          <span
                            className={`${styles.statusBadge} ${
                              t.status === 'RESOLVED'
                                ? styles.statusSuccess
                                : t.status === 'OVERDUE'
                                ? styles.statusCritical
                                : styles.statusOpen
                            }`}
                          >
                            {t.status}
                          </span>
                          <span
                            className={`${styles.tatCell} ${
                              t.isOverdue && t.status !== 'RESOLVED' ? styles.tatOverdue : ''
                            }`}
                          >
                            {t.tat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Operational Work Order Inspector */}
                  <div className={styles.detailPanel}>
                    <div className={styles.detailHeader}>
                      <span className={styles.detailTag}>WORK ORDER INSPECTOR</span>
                      <span className={styles.detailId}>{activeTicket.id}</span>
                    </div>

                    <div className={styles.detailBody}>
                      <h5 className={styles.detailTitle}>{activeTicket.title}</h5>
                      <p className={styles.detailDesc}>{activeTicket.description}</p>

                      <div className={styles.timelineBox}>
                        {activeTicket.timeline.map((item, idx) => (
                          <div key={idx} className={styles.timelineItem}>
                            <span
                              className={`${styles.timelineDot} ${
                                item.dotType === 'success'
                                  ? styles.dotSuccess
                                  : item.dotType === 'active'
                                  ? styles.dotActive
                                  : ''
                              }`}
                            />
                            <div className={styles.timelineContent}>
                              <strong>{item.title}</strong>
                              <small>{item.sub}</small>
                            </div>
                          </div>
                        ))}
                      </div>

                      {previewFeedback && (
                        <div className={styles.previewFeedback}>
                          <span>✓ {previewFeedback}</span>
                          <Check size={14} />
                        </div>
                      )}

                      {/* Interactive Dispatch Action Area */}
                      <div className={styles.detailActionCard}>
                        <span className={styles.actionPrompt}>OPERATIONAL DISPATCH CONTROLS</span>
                        <div className={styles.actionBtnGroup}>
                          <button
                            type="button"
                            className={styles.actionBtnPrimary}
                            onClick={() => setIsComposingNote(!isComposingNote)}
                          >
                            <MessageSquare size={13} />
                            <span>Post Progress Update</span>
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtnSuccess}
                            onClick={handleResolveWorkOrder}
                            disabled={activeTicket.status === 'RESOLVED'}
                          >
                            <CheckCircle2 size={13} />
                            <span>
                              {activeTicket.status === 'RESOLVED' ? 'Resolved' : 'Resolve Work Order'}
                            </span>
                          </button>

                          <Link
                            to={user ? '/operations/tickets' : '/login?category=maintenance'}
                            className={styles.actionBtnSecondary}
                            title="Open full work order management"
                          >
                            <span>Open Board</span>
                            <ArrowRight size={11} />
                          </Link>
                        </div>

                        {/* Interactive Note Composer */}
                        {isComposingNote && (
                          <div className={styles.inlineNoteComposer}>
                            <div className={styles.quickNotesGroup}>
                              <button
                                type="button"
                                className={styles.quickNotePill}
                                onClick={() => handlePostUpdate('Technician dispatched on site with tools')}
                              >
                                + Dispatched
                              </button>
                              <button
                                type="button"
                                className={styles.quickNotePill}
                                onClick={() => handlePostUpdate('Replacement hardware requisitioned')}
                              >
                                + Parts Requisitioned
                              </button>
                              <button
                                type="button"
                                className={styles.quickNotePill}
                                onClick={() => handlePostUpdate('Load test completed; waiting for cooldown')}
                              >
                                + Testing
                              </button>
                            </div>

                            <form
                              onSubmit={(e) => {
                                e.preventDefault()
                                handlePostUpdate(customNote)
                              }}
                            >
                              <input
                                type="text"
                                className={styles.inlineNoteInput}
                                placeholder="Type a maintenance technician note..."
                                value={customNote}
                                onChange={(e) => setCustomNote(e.target.value)}
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  className={styles.actionBtnSecondary}
                                  onClick={() => setIsComposingNote(false)}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className={styles.actionBtnPrimary}
                                  disabled={!customNote.trim()}
                                >
                                  Submit Note
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={styles.howItWorksSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionKicker}>VERIFIED RESOLUTION CYCLE</span>
            <h2 className={styles.sectionTitle}>How CampusOS FixIt Works</h2>
            <p className={styles.sectionDescription}>
              A transparent, closed-loop workflow connecting every student, faculty member, facility technician,
              and administrative leader across the institution.
            </p>
          </div>

          <div className={styles.stepGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumberBadge}>01</div>
              <div className={styles.stepIconWrap}>
                <Camera size={24} className={styles.stepIcon} />
              </div>
              <h3 className={styles.stepTitle}>REPORT</h3>
              <p className={styles.stepText}>
                Students, faculty and staff submit tickets in seconds with issue classification, location specifics,
                and optional photographic evidence directly from their devices.
              </p>
              <div className={styles.stepMeta}>
                <span>• Issue Category Validation</span>
                <span>• 5MB Image Upload</span>
                <span>• Instant Tracking ID</span>
              </div>
              <Link to={user ? '/raise-ticket' : '/login?category=student_faculty'} className={styles.stepCtaLink}>
                <span>Raise a Complaint</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumberBadge}>02</div>
              <div className={styles.stepIconWrap}>
                <Wrench size={24} className={styles.stepIcon} />
              </div>
              <h3 className={styles.stepTitle}>RESOLVE</h3>
              <p className={styles.stepText}>
                Campus Maintenance receives the ticket on the operational dispatch board, commits to an expected
                turnaround date, posts progress notes, and resolves the issue.
              </p>
              <div className={styles.stepMeta}>
                <span>• Mandatory Progress Notes</span>
                <span>• Turnaround (TAT) Commitments</span>
                <span>• Overdue Identification</span>
              </div>
              <Link to={user ? '/operations' : '/login?category=maintenance'} className={styles.stepCtaLink}>
                <span>Operations Dispatch</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumberBadge}>03</div>
              <div className={styles.stepIconWrap}>
                <FileCheck size={24} className={styles.stepIcon} />
              </div>
              <h3 className={styles.stepTitle}>CONFIRM</h3>
              <p className={styles.stepText}>
                The loop is closed only when the original reporter inspects the resolved work and acknowledges
                satisfactory completion, ensuring total facility transparency.
              </p>
              <div className={styles.stepMeta}>
                <span>• Reporter Acknowledgment</span>
                <span>• Reopen Authority if Unfixed</span>
                <span>• Complete Audit Trail</span>
              </div>
              <Link to={user ? '/my-tickets' : '/login?category=student_faculty'} className={styles.stepCtaLink}>
                <span>Verify Repairs</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionKicker}>ENGINEERED FOR SCALE</span>
            <h2 className={styles.sectionTitle}>Architectural Maintenance Capabilities</h2>
            <p className={styles.sectionDescription}>
              Enterprise-grade tools built specifically for campus maintenance logistics, avoiding generic
              ticket clutter with precise operational intelligence.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureItem}>
              <div className={styles.featureIconBox}>
                <Compass size={20} />
              </div>
              <h4>Simple Complaint Reporting</h4>
              <p>Intuitive interface for reporting electrical, plumbing, HVAC, furniture, and network issues without complex bureaucratic overhead.</p>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIconBox}>
                <Camera size={20} />
              </div>
              <h4>Photo-based Reporting</h4>
              <p>Drag-and-drop or mobile photo uploads with automatic size verification, instant previews, and replacement before assignment.</p>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIconBox}>
                <Activity size={20} />
              </div>
              <h4>Ticket Tracking</h4>
              <p>Real-time lifecycle tracking with live status feeds, maintenance notes, and timeline logs rendered in India Standard Time.</p>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIconBox}>
                <Building size={20} />
              </div>
              <h4>Maintenance Operations</h4>
              <p>Command centre with status filtering, categorical sorting, reporter contact details, and rapid work order inspection.</p>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIconBox}>
                <Clock size={20} />
              </div>
              <h4>Progress Updates</h4>
              <p>Campus Maintenance technicians post mandatory status notes for every dispatch, ensuring reporters are never left guessing.</p>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIconBox}>
                <Layers size={20} />
              </div>
              <h4>Turnaround Management</h4>
              <p>Define expected completion dates (TAT) on active work orders with notes, creating accountability across facility contractors.</p>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIconBox}>
                <AlertTriangle size={20} />
              </div>
              <h4>Overdue Identification</h4>
              <p>Automatic detection when committed turnaround dates elapse, highlighting delayed jobs on the dispatch board for immediate remediation.</p>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIconBox}>
                <Wrench size={20} />
              </div>
              <h4>Issue Category Management</h4>
              <p>Campus Maintenance teams dynamically create, edit, and organize issue categories without hardcoding, reflecting campus needs instantly.</p>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIconBox}>
                <CheckCircle2 size={20} />
              </div>
              <h4>Resolution Confirmation</h4>
              <p>Guaranteed accountability: tickets can only be finalized when the reporting student or faculty member confirms the repair.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiated User Experiences */}
      <section className={styles.portalsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionKicker}>TAILORED EXPERIENCES</span>
            <h2 className={styles.sectionTitle}>Three Portals. One Connected Campus.</h2>
            <p className={styles.sectionDescription}>
              Every role receives a dedicated, permission-verified workspace aligned with their operational duties.
            </p>
          </div>

          <div className={styles.portalTabs}>
            <button
              type="button"
              className={`${styles.portalTabBtn} ${activeTab === 'reporter' ? styles.activeTabBtn : ''}`}
              onClick={() => setActiveTab('reporter')}
            >
              <Users size={16} />
              <span>Reporter Portal</span>
            </button>
            <button
              type="button"
              className={`${styles.portalTabBtn} ${activeTab === 'maintenance' ? styles.activeTabBtn : ''}`}
              onClick={() => setActiveTab('maintenance')}
            >
              <Wrench size={16} />
              <span>Maintenance Operations</span>
            </button>
            <button
              type="button"
              className={`${styles.portalTabBtn} ${activeTab === 'admin' ? styles.activeTabBtn : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Shield size={16} />
              <span>Admin Command Centre</span>
            </button>
          </div>

          <div className={styles.portalCard}>
            {activeTab === 'reporter' && (
              <div className={styles.portalContent}>
                <div className={styles.portalText}>
                  <span className={styles.portalRoleBadge}>STUDENTS • FACULTY • GENERAL STAFF</span>
                  <h3>Fast, Transparent Problem Reporting</h3>
                  <p>
                    Log in with institution email and one-time password to raise maintenance requests in under 60 seconds.
                    Upload photos of broken equipment, monitor progress updates directly from the facility team, and confirm
                    closure once the repair is completed.
                  </p>
                  <ul className={styles.portalList}>
                    <li>Quick complaint submission with photo attachment</li>
                    <li>Personal ticket history and status filters</li>
                    <li>Ability to withdraw or edit active open tickets</li>
                    <li>Resolution acknowledgment to officially close tickets</li>
                  </ul>
                  <Link
                    to={user ? '/dashboard' : '/login?category=student_faculty'}
                    className={styles.portalCta}
                  >
                    <span>{user ? 'Open Reporter Dashboard' : 'Access Reporter Portal'}</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
                <div className={styles.portalGraphic}>
                  <div className={styles.graphicCard}>
                    <div className={styles.graphicHeader}>
                      <span className={styles.graphicTitle}>My Maintenance Tickets</span>
                      <span className={styles.graphicCount}>4 active</span>
                    </div>
                    <Link
                      to={user ? '/my-tickets' : '/login?category=student_faculty'}
                      className={styles.interactiveItemLink}
                    >
                      <div className={styles.graphicItem}>
                        <div className={styles.graphicItemTop}>
                          <strong>Classroom 402 AC Cooling Failure</strong>
                          <span className={`${styles.statusBadge} ${styles.statusOpen}`}>OPEN</span>
                        </div>
                        <small>Reported today • Update: Technician dispatched</small>
                      </div>
                    </Link>
                    <Link
                      to={user ? '/my-tickets' : '/login?category=student_faculty'}
                      className={styles.interactiveItemLink}
                    >
                      <div className={styles.graphicItem}>
                        <div className={styles.graphicItemTop}>
                          <strong>Chemistry Lab Fume Hood Blower</strong>
                          <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>RESOLVED</span>
                        </div>
                        <small>Action required: Click to confirm fix</small>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className={styles.portalContent}>
                <div className={styles.portalText}>
                  <span className={styles.portalRoleBadge}>OFFICE STAFF (CAMPUS MAINTENANCE)</span>
                  <h3>Operations Dispatch Command Centre</h3>
                  <p>
                    The flagship facility operations board. View all institutional tickets across campus blocks, prioritize
                    repairs, set target completion dates (TAT), post mandatory status notes, manage dynamic issue types,
                    and resolve work orders.
                  </p>
                  <ul className={styles.portalList}>
                    <li>Global ticket queue with category, status and overdue filters</li>
                    <li>Status updates with technician notes and work logging</li>
                    <li>Target turnaround time (TAT) scheduling and deadline monitoring</li>
                    <li>Full CRUD authority over campus issue categories</li>
                  </ul>
                  <Link
                    to={user ? '/operations' : '/login?category=maintenance'}
                    className={styles.portalCta}
                  >
                    <span>{user ? 'Open Operations Command' : 'Access Maintenance Command'}</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
                <div className={styles.portalGraphic}>
                  <div className={styles.graphicCard}>
                    <div className={styles.graphicHeader}>
                      <span className={styles.graphicTitle}>Dispatch Operations</span>
                      <span className={styles.graphicCount}>14 Total</span>
                    </div>
                    <Link
                      to={user ? '/operations/tickets' : '/login?category=maintenance'}
                      className={styles.interactiveItemLink}
                    >
                      <div className={styles.graphicItem}>
                        <div className={styles.graphicItemTop}>
                          <strong>Library Linear LED Array</strong>
                          <span className={`${styles.statusBadge} ${styles.statusOpen}`}>OPEN</span>
                        </div>
                        <small>TAT: 02 Nov 2026 • Assigned: Electrician 2</small>
                      </div>
                    </Link>
                    <Link
                      to={user ? '/operations/tickets' : '/login?category=maintenance'}
                      className={styles.interactiveItemLink}
                    >
                      <div className={styles.graphicItem}>
                        <div className={styles.graphicItemTop}>
                          <strong>Plumbing Main Riser Leak</strong>
                          <span className={`${styles.statusBadge} ${styles.statusCritical}`}>OVERDUE</span>
                        </div>
                        <small>Overdue by 2 days • Critical priority</small>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <div className={styles.portalContent}>
                <div className={styles.portalText}>
                  <span className={styles.portalRoleBadge}>INSTITUTION ADMINISTRATOR</span>
                  <h3>Institutional Governance & Oversight</h3>
                  <p>
                    Full visibility into campus-wide tickets, user management, and institutional maintenance trends.
                    Inspect ticket details, download evidence photos, remove obsolete or spam entries, and provision
                    campus staff and students.
                  </p>
                  <ul className={styles.portalList}>
                    <li>Institution-wide ticket ledger and evidence photo downloads</li>
                    <li>Authority to delete obsolete, accidental, or spam tickets</li>
                    <li>User provisioning for students, faculty, and maintenance staff</li>
                    <li>System audit logs and compliance oversight</li>
                  </ul>
                  <Link
                    to={user ? '/admin' : '/login?category=admin'}
                    className={styles.portalCta}
                  >
                    <span>{user ? 'Open Admin Command' : 'Access Admin Command'}</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
                <div className={styles.portalGraphic}>
                  <div className={styles.graphicCard}>
                    <div className={styles.graphicHeader}>
                      <span className={styles.graphicTitle}>Institution Overview</span>
                      <span className={styles.graphicCount}>Team 13</span>
                    </div>
                    <Link
                      to={user ? '/admin' : '/login?category=admin'}
                      className={styles.interactiveItemLink}
                    >
                      <div className={styles.graphicItem}>
                        <div className={styles.graphicItemTop}>
                          <strong>Total Registered Accounts</strong>
                          <span className={styles.monoId}>4 users</span>
                        </div>
                        <small>Student • Faculty • Maintenance • Admin</small>
                      </div>
                    </Link>
                    <Link
                      to={user ? '/admin' : '/login?category=admin'}
                      className={styles.interactiveItemLink}
                    >
                      <div className={styles.graphicItem}>
                        <div className={styles.graphicItemTop}>
                          <strong>System Health</strong>
                          <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>100% OPERATIONAL</span>
                        </div>
                        <small>Backend connected: Render Cloud API v1</small>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <span className={styles.ctaKicker}>SEAMLESS CAMPUS COLLABORATION</span>
            <h2 className={styles.ctaHeadline}>Every campus issue deserves a solution.</h2>
            <p className={styles.ctaDescription}>
              Join your campus community on CampusOS FixIt. Experience transparent reporting, faster maintenance
              turnaround, and verified repairs.
            </p>
            <Link to={primaryDest} className={styles.ctaButton}>
              <span>{primaryText}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
