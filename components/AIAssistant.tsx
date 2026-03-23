'use client'
import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Hvilken kampanje har best svarrate?',
  'Finn AI business-muligheter for norske SMB-er i 2025',
  'Hva bør jeg prioritere denne uken basert på pipeline?',
  'Generer 5 cold email-emnelinjer for LokalProfil',
  'Hvilke bransjer bør jeg målrette outreach mot?',
  'Hvordan kan jeg forbedre reply-raten min?',
]

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send(text?: string) {
    const q = text ?? input
    if (!q.trim() || loading) return
    const userMsg: Message = { role: 'user', content: q }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Feil: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Chat history */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, minHeight: 300, maxHeight: 500, overflowY: 'auto', padding: 20, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#64748b', marginBottom: 4 }}>
              Spør meg om outreach-dataen din, pipeline, eller få business-innsikt
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8' }}>
              Jeg har tilgang til kampanje-stats, deals og prosjekter dine
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
                  background: m.role === 'user' ? '#2563eb' : '#f8fafc',
                  color: m.role === 'user' ? '#fff' : '#0f172a',
                  border: m.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                  fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontFamily: 'var(--font-mono)', fontSize: 13, color: '#94a3b8' }}>
                  Tenker...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 99, padding: '6px 12px', cursor: 'pointer', color: '#64748b', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Still et spørsmål..."
          style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 12, outline: 'none', background: '#fff', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, background: input.trim() ? '#2563eb' : '#e2e8f0', color: input.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: input.trim() ? 'pointer' : 'default' }}>
          Send
        </button>
      </div>
    </div>
  )
}
