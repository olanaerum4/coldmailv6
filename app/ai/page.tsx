import AIAssistant from '@/components/AIAssistant'

export default function AIPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>🤖 AI-assistent</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
          Still spørsmål om dataen din, få business-innsikt og idéer
        </p>
      </div>
      <AIAssistant />
    </div>
  )
}
