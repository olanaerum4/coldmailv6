'use client'
import { useState } from 'react'

interface Snapshot {
  recorded_at: string
  mrr: number
  customers: number
}

interface Props {
  snapshots: Snapshot[]
  projectName: string
  color: string
}

export default function MRRGraph({ snapshots, projectName, color }: Props) {
  const [hover, setHover] = useState<Snapshot | null>(null)

  if (snapshots.length < 2) {
    return (
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8' }}>
          Trenger minst 2 datapunkter for graf
        </p>
      </div>
    )
  }

  const W = 280, H = 80, PAD = 8
  const maxMRR = Math.max(...snapshots.map(s => s.mrr), 1)
  const minMRR = Math.min(...snapshots.map(s => s.mrr))

  const points = snapshots.map((s, i) => {
    const x = PAD + (i / (snapshots.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((s.mrr - minMRR) / (maxMRR - minMRR || 1)) * (H - PAD * 2)
    return { x, y, data: s }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length-1].x} ${H} L ${points[0].x} ${H} Z`

  return (
    <div style={{ position: 'relative' }}>
      {hover && (
        <div style={{
          position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff', borderRadius: 6, padding: '3px 8px',
          fontFamily: 'var(--font-mono)', fontSize: 11, whiteSpace: 'nowrap', zIndex: 10,
        }}>
          {new Date(hover.recorded_at).toLocaleDateString('nb-NO')} · {hover.mrr.toLocaleString('nb-NO')} kr
        </div>
      )}
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${projectName}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${projectName})`} />
        <path d={pathD} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={hover === p.data ? 4 : 2.5}
            fill={color} stroke="#fff" strokeWidth="1.5"
            style={{ cursor: 'pointer', transition: 'r 0.1s' }}
            onMouseEnter={() => setHover(p.data)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
    </div>
  )
}
