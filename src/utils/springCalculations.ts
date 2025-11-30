import type { SpringParameters, MaterialProperties, MachineConfig } from '../types'

export interface SpringCalculatedProperties {
  /** 刚度 k，单位 N/mm */
  stiffnessNPerMm: number
  /** 展开长度，单位 mm */
  wireLengthMm: number
  /** 重量，单位 g */
  massGrams: number
  /** 最大剪切应力，单位 MPa */
  maxShearStressMpa: number
  /** 建议安全系数 */
  recommendedSafetyFactor: number
}

/**
 * 计算弹簧基本性能参数。
 *
 * 参考经典压缩弹簧刚度公式：
 *   k = (G d^4) / (8 D^3 n)
 * 其中：
 *   k: 刚度 (N/mm)
 *   G: 剪切模量 (MPa)
 *   d: 线径 (mm)
 *   D: 中径 (mm)
 *   n: 有效圈数
 */
export function calculateSpringProperties(
  params: SpringParameters,
  material: MaterialProperties
): SpringCalculatedProperties {
  const { wireDiameter: d, meanDiameter: D, activeCoils: n, totalCoils } = params
  const { shearModulus: G, density, allowableShearStress, springbackFactor } = material

  const stiffnessNPerMm = (G * d ** 4) / (8 * D ** 3 * n)

  const meanCircumference = Math.PI * D
  const wireLengthMm = meanCircumference * totalCoils

  const radiusMm = d / 2
  const wireCrossSectionAreaMm2 = Math.PI * radiusMm ** 2
  const wireVolumeMm3 = wireCrossSectionAreaMm2 * wireLengthMm
  const wireVolumeM3 = wireVolumeMm3 * 1e-9
  const massKg = wireVolumeM3 * density
  const massGrams = massKg * 1000

  const WahlK = 1 + 0.5 * (d / D)
  const maxShearStressMpa = (8 * allowableShearStress * D * WahlK) / (Math.PI * d ** 3)

  const recommendedSafetyFactor = 1.0 + springbackFactor * 2.0

  return {
    stiffnessNPerMm,
    wireLengthMm,
    massGrams,
    maxShearStressMpa,
    recommendedSafetyFactor
  }
}

export interface SpringPathPoint {
  x: number
  y: number
  z: number
  /** 极角，单位弧度 */
  angle: number
}

/**
 * 生成 3D 路径点，用于绘制弹簧几何。
 * progress 取值 0~1，用于渐进生成路径。
 */
export function generateSpringPath(
  params: SpringParameters,
  progress: number
): SpringPathPoint[] {
  const clamped = Math.min(Math.max(progress, 0), 1)
  const turns = params.totalCoils * clamped
  const stepsPerTurn = 32
  const totalSteps = Math.max(4, Math.round(turns * stepsPerTurn))

  const points: SpringPathPoint[] = []

  for (let i = 0; i <= totalSteps; i += 1) {
    const t = totalSteps === 0 ? 0 : i / totalSteps
    const currentTurn = turns * t

    let pitchMm = params.pitch
    if (params.variablePitch && params.variablePitch.length > 0) {
      const seg = params.variablePitch.find(
        (s) => currentTurn >= s.startTurn && currentTurn <= s.endTurn
      )
      if (seg) pitchMm = seg.pitch
    }

    let radiusMm = params.meanDiameter / 2
    if (params.conicalGeometry) {
      const { smallOuterDiameter, largeOuterDiameter, fromSmallToLarge } =
        params.conicalGeometry
      const startR = (fromSmallToLarge ? smallOuterDiameter : largeOuterDiameter) / 2
      const endR = (fromSmallToLarge ? largeOuterDiameter : smallOuterDiameter) / 2
      radiusMm = startR + (endR - startR) * (currentTurn / Math.max(turns, 1))
    }

    const angle = currentTurn * 2 * Math.PI
    const x = radiusMm * Math.cos(angle)
    const z = radiusMm * Math.sin(angle)
    const y = currentTurn * pitchMm

    points.push({ x, y, z, angle })
  }

  return points
}

export interface MachineCalculatedParameters {
  feedSpeedMmPerSec: number
  coilingRpm: number
  pitchStrokeMm: number
  bendAngleDeg: number
}

/**
 * 基于弹簧参数与机床配置，估算送线速度、卷绕转速等。
 */
export function calculateMachineParameters(
  params: SpringParameters,
  machine: MachineConfig
): MachineCalculatedParameters {
  const { pitch, totalCoils } = params
  const { maxFeedSpeed, maxCoilingRpm, maxPitchStroke, maxBendAngle } = machine

  const targetCycleSec = 3
  const totalAxialTravelMm = pitch * totalCoils
  const feedSpeedMmPerSec = Math.min(maxFeedSpeed, totalAxialTravelMm / targetCycleSec)

  const coilingRpm = Math.min(maxCoilingRpm, (totalCoils / targetCycleSec) * 60)

  const pitchStrokeMm = Math.min(maxPitchStroke, pitch)

  const bendAngleDeg = Math.min(maxBendAngle, 90)

  return {
    feedSpeedMmPerSec,
    coilingRpm,
    pitchStrokeMm,
    bendAngleDeg
  }
}

/**
 * 根据材料回弹系数，对外径和节距进行几何补偿。
 */
export function applySpringbackCompensation(
  params: SpringParameters,
  material: MaterialProperties
): SpringParameters {
  const k = material.springbackFactor
  const factor = 1 + k

  return {
    ...params,
    meanDiameter: params.meanDiameter / factor,
    outerDiameter: params.outerDiameter / factor,
    innerDiameter: params.innerDiameter / factor,
    pitch: params.pitch / factor
  }
}
