/**
 * 压簧生产工艺生成器
 * 
 * 根据弹簧参数生成完整的生产过程（各轴关键帧）
 */

import type {
  ProcessInputParams,
  CompressionSpringProcess,
  ProcessPhaseData,
  AxisProfile,
  Keyframe,
  AxisPositions,
  ProcessPhase
} from '../types/process'

/**
 * 生成压簧的完整生产过程
 */
export function generateCompressionSpringProcess(
  params: ProcessInputParams
): CompressionSpringProcess {
  const {
    wireDiameter,
    meanDiameter,
    activeCoils,
    totalCoils,
    pitch,
    endType,
    feedSpeed
  } = params

  // 基础几何计算
  const wirePerCoil = Math.PI * meanDiameter  // 每圈线材长度
  const closedCoils = (totalCoils - activeCoils) / 2  // 两端各多少紧密圈
  const firstClosedCoils = Math.ceil(closedCoils)  // 首端紧密圈数
  const endClosedCoils = Math.floor(closedCoils)   // 末端紧密圈数

  // 各阶段的线材长度
  const firstClosedLength = wirePerCoil * firstClosedCoils
  const bodyLength = wirePerCoil * activeCoils
  const endClosedLength = wirePerCoil * endClosedCoils
  const totalWireLength = firstClosedLength + bodyLength + endClosedLength

  // 各阶段时间计算（基于送料速度）
  const timeFirstClosed = firstClosedLength / feedSpeed
  const timeBody = bodyLength / feedSpeed
  const timeEndClosed = endClosedLength / feedSpeed
  const timeCut = 0.3  // 切断时间（固定）
  const timeReset = 0.2  // 回位时间（固定）

  // 累计时间点
  let t = 0
  const phases: ProcessPhaseData[] = []
  
  // 阶段 0: 待机 (短暂)
  phases.push({
    name: 'idle',
    displayName: '待机',
    startTime: t,
    endTime: t + 0.1,
    description: '所有轴回到安全位置'
  })
  t += 0.1

  // 阶段 1: 首圈紧密圈
  phases.push({
    name: 'first_closed_coil',
    displayName: '首端紧密圈',
    startTime: t,
    endTime: t + timeFirstClosed,
    description: `形成 ${firstClosedCoils.toFixed(1)} 圈紧密圈，螺距接近0`
  })
  const t1End = t + timeFirstClosed
  t = t1End

  // 阶段 2: 主体工作圈
  phases.push({
    name: 'body_coils',
    displayName: '主体工作圈',
    startTime: t,
    endTime: t + timeBody,
    description: `卷制 ${activeCoils} 圈有效圈，螺距 ${pitch}mm`
  })
  const t2End = t + timeBody
  t = t2End

  // 阶段 3: 末端紧密圈
  if (endClosedCoils > 0) {
    phases.push({
      name: 'end_closed_coil',
      displayName: '末端紧密圈',
      startTime: t,
      endTime: t + timeEndClosed,
      description: `形成 ${endClosedCoils.toFixed(1)} 圈末端紧密圈`
    })
    t += timeEndClosed
  }

  // 阶段 4: 切断准备
  phases.push({
    name: 'pre_cut',
    displayName: '切断准备',
    startTime: t,
    endTime: t + 0.1,
    description: '送料停止，切刀接近'
  })
  t += 0.1

  // 阶段 5: 切断
  phases.push({
    name: 'cutting',
    displayName: '切断',
    startTime: t,
    endTime: t + timeCut,
    description: '切刀快速推进剪断线材'
  })
  const tCutEnd = t + timeCut
  t = tCutEnd

  // 阶段 6: 回位
  phases.push({
    name: 'reset',
    displayName: '回位',
    startTime: t,
    endTime: t + timeReset,
    description: '各轴回到初始位置'
  })
  t += timeReset

  const totalCycleTime = t

  // 生成各轴关键帧
  const axes: AxisProfile[] = []

  // ===== F轴 (送料) =====
  const feedKeyframes: Keyframe[] = [
    { time: 0, position: 0 },
    { time: 0.1, position: 0 },  // 待机结束
    { time: t1End, position: firstClosedLength },  // 首圈结束
    { time: t2End, position: firstClosedLength + bodyLength },  // 主体结束
  ]
  if (endClosedCoils > 0) {
    feedKeyframes.push({
      time: t2End + timeEndClosed,
      position: totalWireLength
    })
  }
  // 切断和回位期间保持不动
  feedKeyframes.push({ time: tCutEnd, position: totalWireLength })
  feedKeyframes.push({ time: totalCycleTime, position: totalWireLength })

  axes.push({
    axisId: 'feed',
    name: 'F轴 送料',
    unit: 'mm',
    keyframes: feedKeyframes
  })

  // ===== C轴 (成形/直径控制) =====
  // 成形刀基本保持在固定位置，只在开始时靠近
  const coilingTarget = meanDiameter / 2  // 目标位置约为半径
  const coilingKeyframes: Keyframe[] = [
    { time: 0, position: coilingTarget + 10 },  // 退回位置
    { time: 0.1, position: coilingTarget },     // 待机结束，到位
    { time: tCutEnd, position: coilingTarget }, // 保持
    { time: totalCycleTime, position: coilingTarget + 10 }  // 回位
  ]
  axes.push({
    axisId: 'coiling',
    name: 'C轴 成形刀',
    unit: 'mm',
    keyframes: coilingKeyframes
  })

  // ===== P轴 (螺距控制) =====
  const pitchKeyframes: Keyframe[] = [
    { time: 0, position: 0 },
    { time: 0.1, position: 0 },  // 待机，保持0
    { time: t1End, position: wireDiameter * firstClosedCoils },  // 首圈：极小螺距
  ]
  // 主体圈：每圈推进 pitch
  const bodyPitchStart = wireDiameter * firstClosedCoils
  const bodyPitchEnd = bodyPitchStart + pitch * activeCoils
  pitchKeyframes.push({ time: t2End, position: bodyPitchEnd })
  
  // 末端圈：螺距逐渐减小
  if (endClosedCoils > 0) {
    pitchKeyframes.push({
      time: t2End + timeEndClosed,
      position: bodyPitchEnd + wireDiameter * endClosedCoils
    })
  }
  // 切断和回位
  pitchKeyframes.push({ time: tCutEnd, position: pitchKeyframes[pitchKeyframes.length - 1].position })
  pitchKeyframes.push({ time: totalCycleTime, position: 0 })  // 回零

  axes.push({
    axisId: 'pitch',
    name: 'P轴 节距刀',
    unit: 'mm',
    keyframes: pitchKeyframes
  })

  // ===== K轴 (切刀) =====
  const cutSafePos = 30  // 安全位置
  const cutActivePos = 0  // 切断位置
  const cutApproachTime = phases.find(p => p.name === 'pre_cut')?.startTime ?? tCutEnd - 0.4
  const cutKeyframes: Keyframe[] = [
    { time: 0, position: cutSafePos },
    { time: cutApproachTime, position: cutSafePos },  // 一直在安全位置
    { time: cutApproachTime + 0.1, position: cutSafePos * 0.5 },  // 接近
    { time: tCutEnd - 0.1, position: cutActivePos },  // 切断
    { time: tCutEnd, position: cutActivePos },
    { time: totalCycleTime, position: cutSafePos }  // 回位
  ]
  axes.push({
    axisId: 'cut',
    name: 'K轴 切刀',
    unit: 'mm',
    keyframes: cutKeyframes
  })

  // ===== A轴 (辅助整形) =====
  const addSafePos = 20
  const addActivePos = 5
  const addKeyframes: Keyframe[] = [
    { time: 0, position: addSafePos },
    { time: 0.1, position: addActivePos },  // 开始时接近
    { time: t1End, position: addActivePos },  // 首圈期间保持
    { time: t1End + 0.1, position: addSafePos },  // 首圈后退回
    // 末端圈时再次接近
    { time: t2End - 0.1, position: addSafePos },
    { time: t2End, position: endClosedCoils > 0 ? addActivePos : addSafePos },
    { time: tCutEnd, position: addSafePos },
    { time: totalCycleTime, position: addSafePos }
  ]
  axes.push({
    axisId: 'additional',
    name: 'A轴 辅助臂',
    unit: 'mm',
    keyframes: addKeyframes
  })

  return {
    totalCycleTime,
    phases,
    axes,
    springGeometry: {
      wireDiameter,
      meanDiameter,
      pitch,
      totalCoils,
      activeCoils,
      wirePerCoil,
      totalWireLength
    }
  }
}

/**
 * 根据时间插值获取各轴当前位置
 */
export function interpolateAxisPositions(
  process: CompressionSpringProcess,
  time: number
): AxisPositions {
  const { axes, phases, springGeometry } = process

  // 限制时间范围
  const t = Math.max(0, Math.min(time, process.totalCycleTime))

  // 查找当前阶段
  let currentPhase: ProcessPhase = 'idle'
  for (const phase of phases) {
    if (t >= phase.startTime && t < phase.endTime) {
      currentPhase = phase.name
      break
    }
  }
  if (t >= phases[phases.length - 1].endTime) {
    currentPhase = 'reset'
  }

  // 插值函数
  const interpolate = (keyframes: Keyframe[]): number => {
    if (keyframes.length === 0) return 0
    if (t <= keyframes[0].time) return keyframes[0].position
    if (t >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].position
    }

    // 找到当前时间所在的区间
    for (let i = 0; i < keyframes.length - 1; i++) {
      const k0 = keyframes[i]
      const k1 = keyframes[i + 1]
      if (t >= k0.time && t < k1.time) {
        const ratio = (t - k0.time) / (k1.time - k0.time)
        return k0.position + ratio * (k1.position - k0.position)
      }
    }
    return keyframes[keyframes.length - 1].position
  }

  // 获取各轴位置
  const getAxisPos = (id: string): number => {
    const axis = axes.find(a => a.axisId === id)
    return axis ? interpolate(axis.keyframes) : 0
  }

  const feedPos = getAxisPos('feed')

  // 计算当前圈数（基于送料位置）
  const currentCoils = feedPos / springGeometry.wirePerCoil

  return {
    feed: feedPos,
    coiling: getAxisPos('coiling'),
    pitch: getAxisPos('pitch'),
    cut: getAxisPos('cut'),
    additional: getAxisPos('additional'),
    currentPhase,
    currentCoils
  }
}

/**
 * 将工艺过程导出为时间轴表格（用于调试/显示）
 */
export function processToTimelineTable(
  process: CompressionSpringProcess,
  stepCount: number = 20
): Array<{
  time: number
  phase: string
  feed: number
  pitch: number
  cut: number
  coils: number
}> {
  const table = []
  const dt = process.totalCycleTime / stepCount

  for (let i = 0; i <= stepCount; i++) {
    const t = i * dt
    const pos = interpolateAxisPositions(process, t)
    table.push({
      time: Number(t.toFixed(2)),
      phase: pos.currentPhase,
      feed: Number(pos.feed.toFixed(1)),
      pitch: Number(pos.pitch.toFixed(1)),
      cut: Number(pos.cut.toFixed(1)),
      coils: Number(pos.currentCoils.toFixed(2))
    })
  }

  return table
}
