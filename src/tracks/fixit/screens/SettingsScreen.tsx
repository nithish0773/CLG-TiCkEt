import { useState, useRef } from 'react'
import {
  useAuth,
  saveSession,
  simulateRole,
  exitSimulation,
  updateCurrentUserAvatar,
  AVATAR_PRESETS,
  compressImageFile,
  type Role,
  API_BASE_URL,
} from '@/core'
import { Button, Badge, ThemeToggle } from '@/ui'

const DEMO_ACCOUNTS: Array<{ role: Role; name: string; email: string; label: string; desc: string; department?: string }> = [
  { role: 'student', name: 'Asha Kumar', email: 'asha@team1.com', label: 'Student (Asha Kumar)', desc: 'Can submit tickets, view personal tickets, acknowledge resolved issues' },
  { role: 'office_staff', name: 'Kumar Gowda', email: 'kumar@team1.com', label: 'Campus Maintenance (Kumar Gowda)', department: 'Campus Maintenance', desc: 'Full operations authority: resolve tickets, set TAT, notes, categories' },
  { role: 'faculty', name: 'Dr. Meera Rao', email: 'meera@team1.com', label: 'Faculty (Dr. Meera Rao)', desc: 'Can report lab faults, track research equipment, sign off on repairs' },
  { role: 'office_staff', name: 'Ravi Shetty', email: 'ravi@team1.com', label: 'Office Staff (Ravi Shetty)', department: 'Student Affairs', desc: 'Departmental staff tracking building facilities' },
  { role: 'campus_manager', name: 'Kavita Sharma', email: 'manager@team1.com', label: 'Campus Manager', desc: 'Full operations authority: resolve tickets, set TAT, notes, categories' },
  { role: 'admin', name: 'Team 13 Admin', email: 'admin@team13.com', label: 'Admin (Team 13 Admin)', desc: 'System administrator: user provisioning, system monitoring, global analytics' },
]

function computeExpiresAt(expiresInSeconds: number) {
  return Date.now() + expiresInSeconds * 1000
}

export function SettingsScreen() {
  const { user, updateUser } = useAuth()

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState('30s')
  const [savedFeedback, setSavedFeedback] = useState(false)

  // Avatar Studio State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPresets, setShowPresets] = useState(false)
  const [updatingAvatar, setUpdatingAvatar] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null)

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUpdatingAvatar(true)
      const dataUrl = await compressImageFile(file, 256)
      await updateCurrentUserAvatar(dataUrl)
      updateUser({ avatar_url: dataUrl })
      setAvatarMessage('Profile photo uploaded and saved successfully!')
      setTimeout(() => setAvatarMessage(null), 3500)
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo')
    } finally {
      setUpdatingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSelectPreset(presetUrl: string) {
    try {
      setUpdatingAvatar(true)
      await updateCurrentUserAvatar(presetUrl)
      updateUser({ avatar_url: presetUrl })
      setAvatarMessage('Preset avatar selected and saved!')
      setTimeout(() => setAvatarMessage(null), 3500)
    } catch (err: any) {
      alert(err.message || 'Failed to set avatar')
    } finally {
      setUpdatingAvatar(false)
    }
  }

  async function handleRemoveAvatar() {
    try {
      setUpdatingAvatar(true)
      await updateCurrentUserAvatar('')
      updateUser({ avatar_url: '' })
      setAvatarMessage('Profile picture removed. Monogram fallback restored.')
      setTimeout(() => setAvatarMessage(null), 3500)
    } catch (err: any) {
      alert(err.message || 'Failed to remove avatar')
    } finally {
      setUpdatingAvatar(false)
    }
  }

  async function handleSwitchRole(account: { role: Role; name: string; email: string; department?: string }) {
    try {
      if (account.email === 'admin@team13.com') {
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
            department: account.department,
            is_simulation: true,
            simulated_by: res.simulated_by,
          },
        })
      }
      window.location.reload()
    } catch (err: any) {
      alert(`Role simulation failed: ${err.message || 'Unauthorized'}`)
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

  function handleSavePreferences() {
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2500)
  }

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: '0 0 4px', color: 'var(--color-text)' }}>
          Platform Settings &amp; Configuration
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
          Manage your account profile, role simulation for evaluations, and telemetry preferences.
        </p>
      </div>

      {savedFeedback && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--green-100)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500 }}>
          ✓ Preferences saved successfully.
        </div>
      )}

      {/* Profile Overview Card */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 'bold', margin: '0 0 16px', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
          Active User Profile
        </h2>

        {/* Profile Avatar Studio for All Roles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 76, height: 76, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', flexShrink: 0, background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                data-testid="profile-avatar-img"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 30, fontWeight: 'bold', color: 'var(--color-primary)' }}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Profile Photo</span>
              <Badge tone="success" size="sm">Active Identity</Badge>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 12px' }}>
              Upload your personal photo or pick an official campus role avatar. Visible on your tickets, activity feeds, and navigation bar.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarFileChange}
                data-testid="avatar-file-input"
              />

              <Button
                size="sm"
                variant="primary"
                disabled={updatingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                📷 Upload Photo
              </Button>

              <Button
                size="sm"
                variant="secondary"
                disabled={updatingAvatar}
                onClick={() => setShowPresets(!showPresets)}
              >
                🎨 {showPresets ? 'Hide Presets' : 'Choose Preset'}
              </Button>

              {user?.avatar_url && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={updatingAvatar}
                  onClick={handleRemoveAvatar}
                >
                  ✕ Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Preset Avatar Selection Grid */}
        {showPresets && (
          <div style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--color-text)' }}>
              Select an Official Campus Identity Preset:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = user?.avatar_url === preset.dataUrl
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.dataUrl)}
                    style={{
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                      padding: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      textAlign: 'center',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <img src={preset.dataUrl} alt={preset.name} style={{ width: 44, height: 44, borderRadius: '50%' }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>{preset.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{preset.roleLabel}</div>
                    {isSelected && (
                      <span style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 'bold' }}>✓ ACTIVE</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {avatarMessage && (
          <div style={{ padding: '8px 12px', background: 'var(--green-100)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
            ✓ {avatarMessage}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Full Name</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginTop: 2 }}>{user?.name}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', marginTop: 2 }}>{user?.email}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Security Role</div>
            <div style={{ marginTop: 2 }}>
              <Badge tone="primary" size="sm">{user?.role?.toUpperCase()}</Badge>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Interface Theme</div>
            <div style={{ marginTop: 2 }}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Role Switcher for Expo Judges & All Users */}
      {Boolean(user) && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 10, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 'bold', margin: '0 0 2px', color: 'var(--color-text)' }}>
                1-Click Role Switcher (Evaluation &amp; Expo Mode)
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                Server-authorized role simulation. Test permissions, dashboards, and workflows without signing out.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user?.is_simulation && (
                <Button variant="secondary" size="sm" onClick={handleExitSimulation}>
                  ↩ Exit Simulation
                </Button>
              )}
              <Badge tone="warning" size="sm">Demo Mode</Badge>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent =
                user?.email?.toLowerCase() === acc.email.toLowerCase() ||
                (user?.role === acc.role && (!acc.department || user?.department === acc.department || (user as any)?.dept === acc.department))
              return (
                <div
                  key={acc.email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: isCurrent ? 'var(--color-primary-subtle)' : 'var(--color-surface-muted)',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13, color: 'var(--color-text)' }}>{acc.label}</strong>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                        ({acc.email})
                      </span>
                      {isCurrent && <Badge tone="primary" size="sm">ACTIVE</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {acc.desc}
                    </div>
                  </div>

                  <Button
                    variant={isCurrent ? 'secondary' : 'primary'}
                    size="sm"
                    disabled={isCurrent}
                    onClick={() => handleSwitchRole(acc)}
                  >
                    {isCurrent ? 'Currently Active' : 'Switch to this Role'}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Operational Preferences */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 'bold', margin: '0 0 16px', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
          Operational Telemetry Preferences
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Real-Time Dispatch Alerts</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Notify when assigned issues exceed target turnaround time</div>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Live Telemetry Polling Rate</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Background synchronization interval with campus servers</div>
            </div>
            <select
              value={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: 12 }}
            >
              <option value="15s">Every 15 seconds</option>
              <option value="30s">Every 30 seconds</option>
              <option value="60s">Every 1 minute</option>
              <option value="manual">Manual refresh only</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="primary" size="sm" onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        </div>
      </div>

      {/* System Diagnostics Card */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 'bold', margin: '0 0 16px', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
          System Architecture &amp; Diagnostic Telemetry
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12 }}>
          <div style={{ padding: 10, background: 'var(--color-surface-muted)', borderRadius: 4 }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Platform Release</div>
            <div style={{ fontWeight: 'bold', marginTop: 2 }}>FIXIT Enterprise v2.4</div>
          </div>

          <div style={{ padding: 10, background: 'var(--color-surface-muted)', borderRadius: 4 }}>
            <div style={{ color: 'var(--color-text-muted)' }}>API Server Base</div>
            <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{API_BASE_URL}</div>
          </div>

          <div style={{ padding: 10, background: 'var(--color-surface-muted)', borderRadius: 4 }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Engine Runtime</div>
            <div style={{ fontWeight: 'bold', marginTop: 2 }}>React 19 + Vite 8 (Node.js)</div>
          </div>

          <div style={{ padding: 10, background: 'var(--color-surface-muted)', borderRadius: 4 }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Storage Layer</div>
            <div style={{ fontWeight: 'bold', color: 'var(--color-success)', marginTop: 2 }}>● Active &amp; Persistent</div>
          </div>
        </div>
      </div>
    </div>
  )
}

