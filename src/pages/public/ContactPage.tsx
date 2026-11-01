import { useState, type FormEvent } from 'react'
import { Mail, Phone, Building, Send, CheckCircle2 } from 'lucide-react'
import styles from './ContactPage.module.css'

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) return
    setSubmitted(true)
  }

  return (
    <div className={styles.page}>
      <section className={styles.headerSection}>
        <div className={styles.container}>
          <span className={styles.kicker}>INSTITUTIONAL DIRECTORY</span>
          <h1 className={styles.title}>Campus Maintenance Inquiries</h1>
          <p className={styles.subtitle}>
            Connect with institutional facilities leadership, technical operations dispatch, or institutional administrators.
          </p>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            {/* Contact Details */}
            <div className={styles.infoCol}>
              <h2 className={styles.colTitle}>Operational Channels</h2>
              <p className={styles.colDesc}>
                For urgent physical safety hazards, electrical surges, or critical flooding, contact the emergency facilities dispatch directly.
              </p>

              <div className={styles.channelList}>
                <div className={styles.channelItem}>
                  <div className={styles.channelIcon}>
                    <Building size={20} />
                  </div>
                  <div>
                    <strong>Campus Maintenance Department</strong>
                    <p>Central Facilities Office, Level 1</p>
                    <span className={styles.channelMeta}>maintenance@team13.com</span>
                  </div>
                </div>

                <div className={styles.channelItem}>
                  <div className={styles.channelIcon}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <strong>Campus Administration</strong>
                    <p>Institutional Oversight & Governance</p>
                    <span className={styles.channelMeta}>admin@team13.com</span>
                  </div>
                </div>

                <div className={styles.channelItem}>
                  <div className={styles.channelIcon}>
                    <Phone size={20} />
                  </div>
                  <div>
                    <strong>Emergency Facility Hotline</strong>
                    <p>24/7 Electrical & Hydraulic Emergency Service</p>
                    <span className={styles.channelMeta}>Intercom: Ext 4004</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inquiry Form */}
            <div className={styles.formCol}>
              <div className={styles.formCard}>
                <h3 className={styles.formTitle}>Submit an Inquiry</h3>
                <p className={styles.formSub}>Send a message to campus facilities coordination.</p>

                {submitted ? (
                  <div className={styles.successBox}>
                    <CheckCircle2 size={32} className={styles.successIcon} />
                    <h4>Message Received</h4>
                    <p>Your inquiry has been logged with the campus facility coordination desk.</p>
                    <button type="button" onClick={() => setSubmitted(false)} className={styles.resetBtn}>
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="name">Your Name</label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dr. Meera Rao"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="email">Institution Email</label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. user@team13.com"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="subject">Subject</label>
                      <input
                        id="subject"
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. HVAC scheduled maintenance question"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="message">Message</label>
                      <textarea
                        id="message"
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describe your inquiry..."
                      />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                      <span>Send Inquiry</span>
                      <Send size={15} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

