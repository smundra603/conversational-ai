// agents hook handles types
import { getProviders, registerAgent, type ProviderId } from 'api/agents'
import {
  converse,
  createSession,
  getMessage,
  getTranscript,
  type Message
} from 'api/sessions'
import AddAgentModal from 'components/Agent/AddAgentModal'
import { useAgents } from 'hooks/useAgents'
import { useSessions } from 'hooks/useSessions'
import { useEffect, useMemo, useRef, useState } from 'react'
import ConversationPane from './ConversationPane'
import NewSessionModal from './NewSessionModal'
import SessionList from './SessionList'

// Agents are loaded via useAgents hook

type SessionMessages = Record<string, Message[]>

const Chat = () => {
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    refresh: refreshSessions
  } = useSessions()
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const [messagesBySession, setMessagesBySession] = useState<SessionMessages>(
    {}
  )
  const [sending, setSending] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)

  // New session modal
  const [addOpen, setAddOpen] = useState(false)
  const { agents, loading: agentsLoading, refresh: refreshAgents } = useAgents()
  const [providers, setProviders] = useState<ProviderId[]>([])
  const [addingAgent, setAddingAgent] = useState(false)
  const [addAgentError, setAddAgentError] = useState<string | null>(null)
  const [addAgentOpen, setAddAgentOpen] = useState(false)
  // Modal internal state is handled by NewSessionModal

  // sessions are loaded via useSessions
  const sessionsSortedDesc = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
  }, [sessions])

  useEffect(() => {
    if (!currentSessionId && sessionsSortedDesc.length > 0) {
      setCurrentSessionId(sessionsSortedDesc[0]._id)
    }
  }, [sessionsSortedDesc, currentSessionId])

  // Load transcript when a session becomes active
  const loadedTranscripts = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!currentSessionId) return
    if (loadedTranscripts.current.has(currentSessionId)) return
    setMessagesLoading(true)
    setMessagesError(null)
    getTranscript(currentSessionId)
      .then((msgs: Message[]) => {
        setMessagesBySession((prev) => ({ ...prev, [currentSessionId]: msgs }))
        loadedTranscripts.current.add(currentSessionId)
      })
      .catch((err: Error) => setMessagesError(err.message))
      .finally(() => setMessagesLoading(false))
  }, [currentSessionId])

  // agents are loaded via useAgents

  // Agents are refreshed from within the modal with a once-per-open guard

  // Load providers when Add Agent modal opens (once per app lifetime unless cleared)
  useEffect(() => {
    let cancelled = false
    if (!addAgentOpen) return
    if (providers.length > 0) return
    getProviders()
      .then((p) => {
        if (!cancelled) setProviders(p)
      })
      .catch(() => void 0)
    return () => {
      cancelled = true
    }
  }, [addAgentOpen, providers.length])

  const currentMessages: Message[] = useMemo(() => {
    if (!currentSessionId) return []
    return messagesBySession[currentSessionId] ?? []
  }, [messagesBySession, currentSessionId])

  const onSend = async (text: string) => {
    if (!currentSessionId || !text.trim()) return
    setSending(true)
    try {
      const { agentResponse, userMessage } = await converse(
        currentSessionId,
        text.trim()
      )
      setMessagesBySession((prev) => {
        const existing = prev[currentSessionId] ?? []
        const existingIds = new Set(existing.map((m) => m._id))
        const toAppend = [userMessage, agentResponse].filter(
          (m) => !existingIds.has(m._id)
        )
        return {
          ...prev,
          [currentSessionId]: [...existing, ...toAppend]
        }
      })
      // Poll for up to 30 seconds for agent message update
      const start = Date.now()
      const poll = async () => {
        try {
          const msg = await getMessage(currentSessionId, agentResponse._id)
          if (!msg.isGenerating) {
            setMessagesBySession((prev) => ({
              ...prev,
              [currentSessionId]: (prev[currentSessionId] ?? []).map((m) =>
                m._id === msg._id ? msg : m
              )
            }))
            return
          }
        } catch {
          // ignore transient errors
        }
        if (Date.now() - start < 30000) {
          setTimeout(poll, 1500)
        } else {
          // Mark message as needing retry
          setMessagesBySession((prev) => ({
            ...prev,
            [currentSessionId]: (prev[currentSessionId] ?? []).map((m) =>
              m._id === agentResponse._id
                ? {
                    ...m,
                    content: 'Response timed out. Please retry.',
                    isGenerating: false
                  }
                : m
            )
          }))
        }
      }
      poll()
    } catch (err) {
      // Surface error near input
      setMessagesBySession((prev) => ({
        ...prev,
        [currentSessionId]: [
          ...(prev[currentSessionId] ?? []),
          {
            _id: `error-${Date.now()}`,
            content: (err as Error).message,
            senderId: 'system',
            senderType: 'agent',
            sessionId: currentSessionId,
            isGenerating: false
          }
        ]
      }))
    } finally {
      setSending(false)
    }
  }

  const onCreateSession = async (agentId: string) => {
    const created = await createSession(agentId)
    await refreshSessions()
    setCurrentSessionId(created._id)
    setAddOpen(false)
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {sessionsLoading ? (
          <p className="text-sm text-gray-600">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded border p-6 text-center">
              <h2 className="mb-2 text-lg font-semibold">No sessions yet</h2>
              {sessionsError && (
                <p className="mb-2 text-xs text-red-600">{sessionsError}</p>
              )}
              <p className="mb-4 text-sm text-gray-600">
                Create your first session to start chatting with an agent.
              </p>
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => setAddOpen(true)}
              >
                Create First Session
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <SessionList
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSelect={setCurrentSessionId}
              loading={sessionsLoading}
              error={sessionsError}
              onNewSession={() => setAddOpen(true)}
            />

            <ConversationPane
              messages={currentMessages}
              loading={messagesLoading}
              error={messagesError}
              canSend={!!currentSessionId}
              sending={sending}
              onSend={onSend}
            />
          </div>
        )}
      </div>
      <NewSessionModal
        isOpen={addOpen}
        agents={agents}
        agentsLoading={agentsLoading}
        onRefreshAgents={refreshAgents}
        onCreateSession={onCreateSession}
        onClose={() => setAddOpen(false)}
        onAddAgentClick={() => setAddAgentOpen(true)}
      />
      <AddAgentModal
        isOpen={addAgentOpen}
        providers={providers}
        adding={addingAgent}
        addError={addAgentError}
        onAdd={async (payload) => {
          setAddAgentError(null)
          setAddingAgent(true)
          try {
            await registerAgent({
              name: payload.name,
              primaryProvider: payload.primaryProvider,
              fallbackProvider: payload.fallbackProvider || undefined,
              prompt: payload.prompt
            })
            await refreshAgents().catch(() => void 0)
            setAddAgentOpen(false)
          } catch (err) {
            setAddAgentError((err as Error).message)
          } finally {
            setAddingAgent(false)
          }
        }}
        onClose={() => setAddAgentOpen(false)}
      />
    </div>
  )
}

export default Chat
