import { type Message } from 'api/sessions'
import React, { useEffect, useMemo, useRef } from 'react'

interface Props {
  messages: Message[]
  loading?: boolean
  error?: string | null
  canSend: boolean
  sending: boolean
  onSend: (text: string) => Promise<void>
}

const ConversationPane: React.FC<Props> = ({
  messages,
  loading = false,
  error = null,
  canSend,
  sending,
  onSend
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length])

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem(
      'message'
    ) as HTMLTextAreaElement | null
    const value = input?.value?.trim() ?? ''
    if (!value) return
    await onSend(value)
    if (input) input.value = ''
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const renderedMessages = useMemo(() => messages, [messages])

  return (
    <div className="grow">
      <div
        ref={scrollRef}
        className="h-[60vh] overflow-y-auto rounded border p-4"
      >
        {loading && <p className="text-sm text-gray-600">Loading messages…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {renderedMessages.map((m) => {
          const isAgent = m.senderType === 'agent'
          const meta = m.metadata
          const costLabel = (() => {
            if (!meta || typeof meta.cost !== 'number') return null
            try {
              return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 6,
                minimumFractionDigits: 6
              }).format(meta.cost)
            } catch {
              return `$${meta.cost.toFixed(6)}`
            }
          })()
          return (
            <div
              key={m._id}
              className={`mb-3 flex ${
                isAgent ? 'justify-start' : 'justify-end'
              }`}
            >
              <div className="max-w-[75%]">
                <div
                  className={`mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 ${
                    isAgent
                      ? 'justify-start text-left'
                      : 'justify-end text-right'
                  }`}
                >
                  <span>
                    {isAgent ? 'Agent' : 'You'} •{' '}
                    {new Date(m.createdAt ?? Date.now()).toLocaleTimeString()}
                  </span>
                  {isAgent && meta && (
                    <>
                      {typeof meta.totalTokens === 'number' && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                          Tokens: {meta.totalTokens}
                        </span>
                      )}
                      {costLabel && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                          Cost: {costLabel}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div
                  className={`whitespace-pre-wrap rounded border px-3 py-2 text-sm ${
                    isAgent
                      ? 'border-gray-200 bg-gray-100 text-gray-900'
                      : 'border-blue-600 bg-blue-600 text-white'
                  }`}
                >
                  {m.isGenerating ? (
                    <span className="animate-pulse text-gray-500">
                      Generating…
                    </span>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div className="h-2.5" />
      </div>
      <form onSubmit={onSubmit} className="mt-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          name="message"
          rows={1}
          className="max-h-48 min-h-10 w-full resize-none overflow-auto rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder={
            canSend ? 'Type a message…' : 'Create or select a session first'
          }
          disabled={!canSend || sending}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              const target = e.currentTarget
              const value = target.value.trim()
              if (!value) return
              await onSend(value)
              target.value = ''
              // reset height
              target.style.height = 'auto'
            }
          }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
          }}
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={!canSend || sending}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ConversationPane
