'use client'

import { useEffect, useState, useCallback } from 'react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  owner:    { bg: 'var(--active-bg)',   color: 'var(--active-text)' },
  manager:  { bg: 'var(--due-bg)',      color: 'var(--due-text)' },
  employee: { bg: 'var(--inactive-bg)', color: 'var(--inactive-text)' },
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [removeLoading, setRemoveLoading] = useState<string | null>(null)

  const fetchTeam = useCallback(async () => {
    const res = await fetch('/api/store-users')
    if (res.ok) {
      const data: TeamMember[] = await res.json()
      setTeam(data)
      // Detect if current user is owner by checking auth context
      const meRes = await fetch('/api/auth/me')
      if (meRes.ok) {
        const me = await meRes.json()
        setIsOwner(me.role === 'owner')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)
    try {
      const res = await fetch('/api/store-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error ?? 'Failed'); return }
      setShowAdd(false)
      setForm({ name: '', email: '', password: '', role: 'employee' })
      fetchTeam()
    } catch {
      setAddError('Could not connect.')
    } finally {
      setAddLoading(false)
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remove this team member?')) return
    setRemoveLoading(memberId)
    await fetch('/api/store-users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: memberId }),
    })
    setRemoveLoading(null)
    fetchTeam()
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Team</h1>
        {isOwner && (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Add Member
          </button>
        )}
      </div>

      {team.map(member => {
        const badge = ROLE_COLORS[member.role] ?? ROLE_COLORS.employee
        return (
          <div key={member.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{member.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{member.email}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '3px 8px', borderRadius: 4, ...badge,
              }}>
                {member.role}
              </span>
              {isOwner && member.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(member.id)}
                  disabled={removeLoading === member.id}
                  style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                    padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--locked-text)',
                    opacity: removeLoading === member.id ? 0.5 : 1,
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )
      })}

      {showAdd && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => setShowAdd(false)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 360 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Add Team Member</h2>
            <form onSubmit={handleAdd}>
              {[
                { key: 'name',     label: 'Full Name', type: 'text' },
                { key: 'email',    label: 'Email',     type: 'email' },
                { key: 'password', label: 'Password',  type: 'password' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required
                    placeholder={f.key === 'password' ? 'Min 8 characters' : undefined}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{ ...inputStyle, background: '#fff' }}
                >
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              {addError && <p style={{ color: 'var(--locked-text)', marginBottom: 12, fontSize: 13 }}>{addError}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={addLoading} style={{ flex: 2, padding: 12, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: addLoading ? 'not-allowed' : 'pointer', opacity: addLoading ? 0.7 : 1 }}>
                  {addLoading ? 'Adding…' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
