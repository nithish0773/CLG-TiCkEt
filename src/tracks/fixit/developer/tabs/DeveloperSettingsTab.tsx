import { useState, useEffect, useRef } from 'react'
import {
  updateDeveloperUser,
  getDeveloperUsers,
  getDeveloperConfig,
  updateDeveloperConfig,
  AVATAR_PRESETS,
  compressImageFile,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface DeveloperSettingsTabProps {
  onNotify: (msg: string) => void
}

export function DeveloperSettingsTab({ onNotify }: DeveloperSettingsTabProps) {
  const [profile, setProfile] = useState({
    name: 'Team 13 Lead Developer',
    email_id: 'admin@team13.com',
    phone_number: '9000000013',
    otp: '595436',
    avatar_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [simulationEnabled, setSimulationEnabled] = useState(true)
  const [togglingSim, setTogglingSim] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const devFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    getDeveloperConfig().then((cfg) => {
      if (active) setSimulationEnabled(cfg.role_simulation_enabled !== false)
    }).catch(() => {})

    getDeveloperUsers().then((res) => {
      if (!active) return
      const dev = (res.items || []).find((u) => u.email_id.toLowerCase() === 'admin@team13.com')
      if (dev) {
        setProfile((prev) => ({
          ...prev,
          name: dev.name || prev.name,
          phone_number: dev.phone_number || prev.phone_number,
          otp: dev.otp || prev.otp,
          avatar_url: dev.avatar_url || '',
        }))
      }
    }).catch(() => {})

    return () => { active = false }
  }, [])

  async function handleToggleSimulation() {
    try {
      setTogglingSim(true)
      const nextState = !simulationEnabled
      await updateDeveloperConfig({ role_simulation_enabled: nextState })
      setSimulationEnabled(nextState)
      onNotify(`Role Simulation Feature ${nextState ? 'ENABLED' : 'DISABLED'} successfully.`)
    } catch (err: any) {
      onNotify(`Failed to update simulation policy: ${err.message}`)
    } finally {
      setTogglingSim(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressImageFile(file, 256)
      setProfile((prev) => ({ ...prev, avatar_url: dataUrl }))
      onNotify('Developer profile picture loaded. Click Save to persist.')
    } catch (err: any) {
      onNotify(`Upload error: ${err.message}`)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      await updateDeveloperUser('admin@team13.com', {
        name: profile.name,
        phone_number: profile.phone_number,
        otp: profile.otp,
        avatar_url: profile.avatar_url,
      })
      onNotify('Developer profile & access credentials saved successfully.')
    } catch (err: any) {
      onNotify(`Update failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.glowBadge}>ROLE: DEVELOPER SUPER ADMIN</span>
            </div>
            <h2 className={styles.cardTitle} style={{ marginTop: '4px' }}>
              Developer Identity, Environment & Gateway Configuration
            </h2>
            <div className={styles.cardSubtitle}>
              Manage primary administrator credentials, cryptographic OTP token, and runtime API specifications
            </div>
          </div>
        </div>

        {/* Profile & Credentials Form */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          {/* Avatar Option */}
          <div>
            <label className={styles.label}>Developer Profile Picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-primary)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Developer Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 22, fontWeight: 'bold', color: 'var(--color-primary)' }}>DEV</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  ref={devFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => devFileRef.current?.click()}
                >
                  📷 Upload Picture
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setShowPresets(!showPresets)}
                >
                  🎨 {showPresets ? 'Close Presets' : 'Choose Preset'}
                </button>
                {profile.avatar_url && (
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    onClick={() => setProfile((prev) => ({ ...prev, avatar_url: '' }))}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>

            {showPresets && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px', marginTop: '12px', padding: '12px', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setProfile((prev) => ({ ...prev, avatar_url: preset.dataUrl }))
                      setShowPresets(false)
                    }}
                    style={{
                      border: profile.avatar_url === preset.dataUrl ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      borderRadius: '4px',
                      background: 'var(--color-surface)',
                      padding: '8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <img src={preset.dataUrl} alt={preset.name} style={{ width: 36, height: 36, borderRadius: '50%', margin: '0 auto' }} />
                    <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px' }}>{preset.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={styles.label}>Developer Full Name</label>
            <input
              type="text"
              className={styles.input}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          <div>
            <label className={styles.label}>Super Admin Email (Immutable Root Identity)</label>
            <input type="email" className={styles.input} disabled value={profile.email_id} />
          </div>

          <div>
            <label className={styles.label}>Emergency Phone Contact</label>
            <input
              type="tel"
              className={styles.input}
              value={profile.phone_number}
              onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
            />
          </div>

          <div>
            <label className={styles.label}>Master Login OTP / Passcode</label>
            <input
              type="text"
              className={styles.input}
              value={profile.otp}
              onChange={(e) => setProfile({ ...profile, otp: e.target.value })}
            />
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Used to authenticate directly via /login or /auth/admin/login endpoints.
            </div>
          </div>

          <button
            type="submit"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            style={{ alignSelf: 'flex-start', marginTop: '8px' }}
            disabled={saving}
          >
            {saving ? 'Updating Credentials...' : 'Save Developer Profile'}
          </button>
        </form>

        {/* Evaluation & Expo Role Simulation Security Policy */}
        <div style={{ marginTop: '32px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                Role Simulation & Expo Evaluation Mode Gate
              </h3>
              <div className={styles.cardSubtitle} style={{ marginTop: '4px' }}>
                Enforce production security rules. When disabled, server-side simulation tokens are blocked and cannot be issued.
              </div>
            </div>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleToggleSimulation}
              disabled={togglingSim}
              style={{
                background: simulationEnabled ? '#DC2626' : '#16A34A',
                color: '#FFFFFF',
                fontWeight: 600,
                border: 'none',
              }}
            >
              {simulationEnabled ? 'Disable Role Simulation (Enforce Production)' : 'Enable Role Simulation (Expo Mode)'}
            </button>
          </div>
          <div style={{ marginTop: '12px', padding: '12px', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
            <strong>Current Policy Status:</strong>{' '}
            <span style={{ color: simulationEnabled ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
              {simulationEnabled ? 'ENABLED (Developer Evaluation Allowed)' : 'DISABLED (Production Hardened — Simulation Blocked)'}
            </span>
          </div>
        </div>

        {/* Environment & API Gateway Specs */}
        <div style={{ marginTop: '32px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '12px' }}>
            Environment Runtime Information (Non-Sensitive)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>FRONTEND ENGINE</div>
              <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>React 19 + Vite 8.3 (TypeScript)</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>BACKEND RUNTIME</div>
              <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>Node.js HTTP REST Gateway (:8000)</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>ACTIVE TEAM WORKSPACE</div>
              <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>Team 13 (Fixit Track Platform)</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>CORS & SECURITY POLICY</div>
              <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>Strict Bearer Token Auth + OPTIONS Preflight</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

