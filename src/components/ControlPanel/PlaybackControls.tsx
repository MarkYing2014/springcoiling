import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useProcessStore } from '../../stores/processStore'
import { useSpringStore } from '../../store/springStore'
import type { ProcessInputParams } from '../../types/process'

export function PlaybackControls(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const isPlaying = useProcessStore((s) => s.isPlaying)
  const currentTime = useProcessStore((s) => s.currentTime)
  const process = useProcessStore((s) => s.process)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  const generateProcess = useProcessStore((s) => s.generateProcess)
  const play = useProcessStore((s) => s.play)
  const pause = useProcessStore((s) => s.pause)
  const reset = useProcessStore((s) => s.reset)

  // 当弹簧参数变化时，重新生成工艺过程
  useEffect(() => {
    const processParams: ProcessInputParams = {
      wireDiameter: params.wireDiameter,
      meanDiameter: params.meanDiameter,
      activeCoils: params.activeCoils,
      totalCoils: params.totalCoils,
      pitch: params.pitch,
      endType: 'closed',
      feedSpeed: 50  // 默认送料速度 50mm/s
    }
    generateProcess(processParams)
  }, [params.wireDiameter, params.meanDiameter, params.activeCoils, params.totalCoils, params.pitch, generateProcess])

  const currentPhase = axisPositions?.currentPhase ?? 'idle'
  const currentCoils = axisPositions?.currentCoils ?? 0
  const totalCycleTime = process?.totalCycleTime ?? 0
  const progress = totalCycleTime > 0 ? (currentTime / totalCycleTime * 100) : 0

  // 阶段名称中文映射
  const phaseNames: Record<string, string> = {
    idle: '待机',
    first_closed_coil: '首端紧密圈',
    body_coils: '主体工作圈',
    end_closed_coil: '末端紧密圈',
    pre_cut: '切断准备',
    cutting: '切断',
    reset: '回位'
  }

  return (
    <div style={{ fontSize: '11px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={() => isPlaying ? pause() : play()}
          style={{
            padding: '4px 12px',
            border: '1px solid #334155',
            borderRadius: '4px',
            background: isPlaying ? '#0d9488' : '#1e293b',
            color: '#f1f5f9',
            cursor: 'pointer'
          }}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '4px 12px',
            border: '1px solid #334155',
            borderRadius: '4px',
            background: '#1e293b',
            color: '#f1f5f9',
            cursor: 'pointer'
          }}
        >
          ⟲ 重置
        </button>
      </div>
      
      {/* 进度条 */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          background: '#334155', 
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${progress}%`, 
            height: '100%', 
            background: '#0ea5e9',
            transition: 'width 0.1s'
          }} />
        </div>
      </div>

      {/* 状态信息 */}
      <div style={{ color: '#94a3b8' }}>
        <span style={{ color: '#22d3ee' }}>{phaseNames[currentPhase] || currentPhase}</span>
        {' | '}
        圈数: {currentCoils.toFixed(1)} / {params.totalCoils}
        {' | '}
        时间: {currentTime.toFixed(1)}s / {totalCycleTime.toFixed(1)}s
      </div>
    </div>
  )
}
