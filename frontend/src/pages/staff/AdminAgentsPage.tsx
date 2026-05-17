import { useEffect, useMemo, useState } from 'react'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson, StaffApiError } from '../../services/staffApi'
import type { AgentPermission } from '../../types/staff'

const PERM_OPTIONS: { id: AgentPermission; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'clients', label: 'Clients' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'support', label: 'Support' },
]

type AgentRow = {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  permissions: AgentPermission[]
  createdAt: string
}

function defaultPermissions(): AgentPermission[] {
  return ['chat', 'clients', 'support', 'referrals']
}

export function AdminAgentsPage() {
  const token = useStaffAuthStore((s) => s.admin?.token ?? null)
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [createPerms, setCreatePerms] = useState<Set<AgentPermission>>(
    () => new Set(defaultPermissions()),
  )
  const [rowDraft, setRowDraft] = useState<
    Record<string, { permissions: AgentPermission[]; isActive: boolean }>
  >({})
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function load() {
    if (!token) return
    try {
      const res = await staffJson<{ agents: AgentRow[] }>('/admin/agents', token)
      setAgents(res.agents)
      const draft: Record<
        string,
        { permissions: AgentPermission[]; isActive: boolean }
      > = {}
      for (const a of res.agents) {
        draft[a.id] = {
          permissions:
            a.permissions?.length ? [...a.permissions] : defaultPermissions(),
          isActive: a.isActive,
        }
      }
      setRowDraft(draft)
      setError(null)
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Failed to load')
    }
  }

  useEffect(() => {
    load()
  }, [token])

  const createPermList = useMemo(() => {
    return PERM_OPTIONS.filter((p) => createPerms.has(p.id)).map((p) => p.id)
  }, [createPerms])

  function toggleCreatePerm(id: AgentPermission) {
    setCreatePerms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (createPermList.length === 0) {
      setMessage('Select at least one permission.')
      return
    }
    setMessage(null)
    setLoading(true)
    try {
      await staffJson('/admin/agents', token, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          permissions: createPermList,
        }),
      })
      setMessage('Agent created.')
      setEmail('')
      setPassword('')
      setFirstName('')
      setLastName('')
      setCreatePerms(new Set(defaultPermissions()))
      await load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  function setRowPerm(agentId: string, perm: AgentPermission, checked: boolean) {
    setRowDraft((d) => {
      const cur = d[agentId]
      if (!cur) return d
      const set = new Set(cur.permissions)
      if (checked) set.add(perm)
      else set.delete(perm)
      return {
        ...d,
        [agentId]: { ...cur, permissions: [...set] },
      }
    })
  }

  async function saveRow(agentId: string) {
    if (!token) return
    const draft = rowDraft[agentId]
    if (!draft || draft.permissions.length === 0) {
      setMessage('Each agent needs at least one permission.')
      return
    }
    setSavingId(agentId)
    setMessage(null)
    try {
      await staffJson(`/admin/agents/${agentId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          permissions: draft.permissions,
          isActive: draft.isActive,
        }),
      })
      setMessage('Agent updated.')
      await load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSavingId(null)
    }
  }

  function rowDirty(a: AgentRow): boolean {
    const d = rowDraft[a.id]
    if (!d) return false
    const permEq =
      d.permissions.length === a.permissions.length &&
      d.permissions.every((p) => a.permissions.includes(p))
    return !permEq || d.isActive !== a.isActive
  }

  return (
    <div>
      {/*
      <p className="text-sm text-slate-600">
        … sign in at /agent/login …
      </p>
      */}
      <p className="text-sm text-slate-600">
        Create agent accounts and choose which areas they can open: Chat,
        Clients, Referrals, and Support.
      </p>

      <form
        onSubmit={onCreate}
        className="mt-8 max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-900">New agent</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
            required
          />
          <input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
            required
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
          required
        />
        <input
          type="password"
          placeholder="Password (min 8)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
          required
          minLength={8}
        />
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-slate-500">
            Tab access
          </legend>
          <div className="flex flex-wrap gap-4">
            {PERM_OPTIONS.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={createPerms.has(p.id)}
                  onChange={() => toggleCreatePerm(p.id)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>
        {message ? (
          <p className="text-sm text-slate-600">{message}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          Create agent
        </button>
      </form>

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

      <div className="mt-10 overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200 bg-white shadow-sm [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Permissions</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {agents.map((a) => {
              const draft = rowDraft[a.id]
              return (
                <tr key={a.id}>
                  <td className="px-4 py-3 text-slate-900">
                    {a.firstName} {a.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.email}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft?.isActive ?? a.isActive}
                        onChange={(e) =>
                          setRowDraft((d) => ({
                            ...d,
                            [a.id]: {
                              permissions:
                                d[a.id]?.permissions ??
                                (a.permissions?.length
                                  ? [...a.permissions]
                                  : defaultPermissions()),
                              isActive: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      Active
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      {PERM_OPTIONS.map((p) => (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600"
                        >
                          <input
                            type="checkbox"
                            checked={
                              draft?.permissions.includes(p.id) ?? false
                            }
                            onChange={(e) =>
                              setRowPerm(a.id, p.id, e.target.checked)
                            }
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={!rowDirty(a) || savingId === a.id}
                      onClick={() => saveRow(a.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-40"
                    >
                      {savingId === a.id ? 'Saving…' : 'Save'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
