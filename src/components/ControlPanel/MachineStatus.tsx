import type { ReactNode } from 'react'
import { useProcessStore } from '../../stores/processStore'

export function MachineStatus(): ReactNode {
  const axisPositions = useProcessStore((s) => s.axisPositions)

  const feed = axisPositions?.feed ?? 0
  const coiling = axisPositions?.coiling ?? 0
  const pitch = axisPositions?.pitch ?? 0
  const cut = axisPositions?.cut ?? 0

  const axisStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0'
  }

  const labelStyle = { color: '#94a3b8' }
  const valueStyle = { color: '#f1f5f9', fontFamily: 'monospace' }

  return (
    <div style={{ fontSize: '11px' }}>
      <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
        轴位置监控 (4+1轴)
      </div>
      <div style={axisStyle}>
        <span style={labelStyle}>F轴 送料</span>
        <span style={valueStyle}>{feed.toFixed(1)} mm</span>
      </div>
      <div style={axisStyle}>
        <span style={labelStyle}>C轴 成形</span>
        <span style={valueStyle}>{coiling.toFixed(1)} mm</span>
      </div>
      <div style={axisStyle}>
        <span style={labelStyle}>P轴 节距</span>
        <span style={valueStyle}>{pitch.toFixed(1)} mm</span>
      </div>
      <div style={axisStyle}>
        <span style={labelStyle}>K轴 切刀</span>
        <span style={{ ...valueStyle, color: cut < 10 ? '#f97316' : '#f1f5f9' }}>
          {cut.toFixed(1)} mm
        </span>
      </div>
    </div>
  )
}
