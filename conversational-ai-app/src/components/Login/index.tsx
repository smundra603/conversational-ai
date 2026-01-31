/* eslint-disable @typescript-eslint/no-explicit-any */
import { createTenant } from 'api/auth'
import { useAuth } from 'auth/AuthProvider'
import Modal from 'components/common/Modal'
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const Login: React.FC = () => {
  const { authorizeSSO, authorized } = useAuth()
  const [domain, setDomain] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [emailId, setEmailId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Create tenant state (modal-driven)
  const [showCreateTenant, setShowCreateTenant] = useState(false)
  const [tenantDomain, setTenantDomain] = useState('')
  const [tenantAdminEmail, setTenantAdminEmail] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantStatus, setTenantStatus] = useState<string | null>(null)
  const [tenantLoading, setTenantLoading] = useState(false)
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
  const [tenantApiKey, setTenantApiKey] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  // If already logged in, redirect inside the app to chat
  React.useEffect(() => {
    if (authorized) {
      navigate('/chat', { replace: true })
    }
  }, [authorized, navigate])

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authorizeSSO({ domain, apiKey, emailId })
      navigate(from, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const onCreateTenant: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setTenantStatus(null)
    setTenantLoading(true)
    try {
      const res = await createTenant({
        adminEmail: tenantAdminEmail,
        domain: tenantDomain,
        name: tenantName
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setTenantStatus(text || `Failed (${res.status})`)
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          apiKey?: string
          tenantId?: string
        }
        setTenantApiKey(data.apiKey ?? 'No API Key returned')
        setTenantId(data.tenantId ?? null)
        setTenantDomain('')
        setTenantAdminEmail('')
        setTenantName('')
        setShowCreateTenant(false)
        setApiKeyModalOpen(true)
      }
    } catch (err) {
      setTenantStatus((err as Error).message)
    } finally {
      setTenantLoading(false)
    }
  }

  return (
    <div className="flex min-h-[50vh] items-start justify-center gap-6 p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Sign in (SSO)</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">Domain</span>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="domainName"
            className="w-full rounded border px-3 py-2"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="apiKey"
            className="w-full rounded border px-3 py-2"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">Email</span>
          <input
            type="email"
            value={emailId}
            onChange={(e) => setEmailId(e.target.value)}
            placeholder="admin@example.com"
            className="w-full rounded border px-3 py-2"
            required
          />
        </label>
        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Continue'}
        </button>
        <div className="mt-4 flex items-center justify-center">
          <span className="mx-2 text-gray-500">or</span>
          <button
            type="button"
            className="rounded border px-3 py-2"
            onClick={() => setShowCreateTenant(true)}
          >
            Create Tenant
          </button>
        </div>
      </form>

      <Modal
        isOpen={showCreateTenant}
        title="Create Tenant"
        onClose={() => setShowCreateTenant(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => setShowCreateTenant(false)}
            >
              Cancel
            </button>
            <button
              form="login-create-tenant-form"
              type="submit"
              className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              disabled={tenantLoading}
            >
              {tenantLoading ? 'Creating…' : 'Create'}
            </button>
          </div>
        }
      >
        <form
          id="login-create-tenant-form"
          onSubmit={onCreateTenant}
          className="space-y-3"
        >
          {tenantStatus && (
            <p className="text-sm text-red-600">{tenantStatus}</p>
          )}
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600">Domain</span>
            <input
              type="text"
              value={tenantDomain}
              onChange={(e) => setTenantDomain(e.target.value)}
              placeholder="domain2"
              className="w-full rounded border px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600">
              Admin Email
            </span>
            <input
              type="email"
              value={tenantAdminEmail}
              onChange={(e) => setTenantAdminEmail(e.target.value)}
              placeholder="adminEmail1@gmail.com"
              className="w-full rounded border px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600">Name</span>
            <input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="testTenant2"
              className="w-full rounded border px-3 py-2"
              required
            />
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={apiKeyModalOpen}
        title="Tenant Created"
        onClose={() => setApiKeyModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
              onClick={() => setApiKeyModalOpen(false)}
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Your tenant has been created. Please keep the API key safe and
            secure. You&apos;ll need it for login purposes.
          </p>
          {tenantId && (
            <div>
              <div className="text-xs text-gray-500">Tenant ID</div>
              <div className="rounded border bg-gray-50 px-3 py-2 font-mono text-sm">
                {tenantId}
              </div>
            </div>
          )}
          {tenantApiKey && (
            <div>
              <div className="text-xs text-gray-500">API Key</div>
              <div className="flex items-center gap-2">
                <div className="grow break-all rounded border bg-gray-50 px-3 py-2 font-mono text-sm">
                  {tenantApiKey}
                </div>
                <button
                  type="button"
                  className="rounded border px-3 py-2"
                  onClick={() => navigator.clipboard.writeText(tenantApiKey)}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Login
