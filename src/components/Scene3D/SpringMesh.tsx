import { useMemo, useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Vector3, Group } from 'three'
import { useSpringStore } from '../../store/springStore'
import { useProcessStore } from '../../stores/processStore'

import type { SpringParameters, VariablePitchSegment, ConicalGeometry } from '../../types'

/**
 * 根据弹簧类型计算当前圈的螺距
 */
function getPitchAtCoil(
  coilNum: number,
  totalCoils: number,
  basePitch: number,
  wireDiameter: number,
  springType: string,
  variablePitch?: VariablePitchSegment[]
): number {
  // 首圈和末圈紧密
  if (coilNum < 1) {
    return wireDiameter * 1.1
  }
  if (coilNum > totalCoils - 1 && totalCoils > 2) {
    return wireDiameter * 1.1
  }
  
  // 变节距弹簧
  if (springType === 'variablePitch' && variablePitch && variablePitch.length > 0) {
    for (const segment of variablePitch) {
      if (coilNum >= segment.startTurn && coilNum <= segment.endTurn) {
        return segment.pitch
      }
    }
  }
  
  return basePitch
}

/**
 * 根据弹簧类型计算当前圈的半径
 */
function getRadiusAtCoil(
  coilNum: number,
  totalCoils: number,
  baseRadius: number,
  springType: string,
  conicalGeometry?: ConicalGeometry
): number {
  // 锥形弹簧
  if (springType === 'conical' && conicalGeometry) {
    const { smallOuterDiameter, largeOuterDiameter, fromSmallToLarge } = conicalGeometry
    const smallRadius = smallOuterDiameter / 2
    const largeRadius = largeOuterDiameter / 2
    
    const progress = coilNum / Math.max(totalCoils, 1)
    
    if (fromSmallToLarge) {
      return smallRadius + (largeRadius - smallRadius) * progress
    } else {
      return largeRadius - (largeRadius - smallRadius) * progress
    }
  }
  
  return baseRadius
}

/**
 * 生成带平滑过渡的弹簧路径
 * 
 * 三段式路径结构（解决切向不连续问题）：
 * 1. 直线段：从后方(-Z)送料
 * 2. 过渡展开：螺旋式展开，半径从0渐增到R
 * 3. 标准螺旋：在X-Y平面绕圈，沿+Z生长
 * 
 * 几何布局（与机械结构匹配）：
 * - 导线沿-Z方向进入成形点
 * - 成形点在(0, 0, 0)
 * - 螺旋在X-Y平面，沿+Z方向生长
 */
function generateUnifiedWirePath(
  params: SpringParameters,
  currentCoils: number,
  feedLength: number
): Vector3[] {
  const points: Vector3[] = []
  const { meanDiameter, wireDiameter, pitch, totalCoils, type, variablePitch, conicalGeometry } = params
  const R = meanDiameter / 2
  
  // ============================================
  // 段1: 直线送料（从后方-Z进入）
  // ============================================
  const straightSamples = 10
  for (let i = 0; i < straightSamples; i++) {
    const t = i / straightSamples
    const z = -feedLength * (1 - t)  // 从-feedLength到0
    points.push(new Vector3(0, 0, z))
  }
  
  // ============================================
  // 段2: 螺旋式展开过渡（半圈）
  // ============================================
  // 从(0,0,0)开始，半径从0逐渐增加到R
  // 同时角度增加，形成平滑的螺旋展开
  // 这样避免了切向突变
  
  const transitionSamples = 18  // 半圈
  const transitionAngle = Math.PI  // 180度展开
  
  for (let i = 1; i <= transitionSamples; i++) {
    const t = i / transitionSamples  // 0 → 1
    const angle = t * transitionAngle  // 0 → π
    
    // 半径用正弦平滑：从0到R
    const currentR = R * Math.sin(t * Math.PI / 2)
    
    // 位置
    const x = currentR * Math.cos(angle)
    const y = currentR * Math.sin(angle)
    const z = t * pitch * 0.5  // 半圈的螺距
    
    points.push(new Vector3(x, y, z))
  }
  
  // ============================================
  // 段3: 标准螺旋（从展开末端开始）
  // ============================================
  const coilsToRender = Math.min(currentCoils, totalCoils)
  if (coilsToRender > 0.5) {
    const samplesPerCoil = 36
    // 减去过渡占用的0.5圈
    const effectiveCoils = Math.max(0, coilsToRender - 0.5)
    const totalSamples = Math.ceil(effectiveCoils * samplesPerCoil)
    
    // 从展开末端位置继续
    let axialPos = pitch * 0.5
    const startAngle = Math.PI  // 从180度继续
    
    for (let i = 1; i <= totalSamples; i++) {
      const coilNum = i / samplesPerCoil
      const angle = startAngle + coilNum * Math.PI * 2
      
      const currentPitch = getPitchAtCoil(coilNum + 0.5, totalCoils, pitch, wireDiameter, type, variablePitch)
      const currentRadius = getRadiusAtCoil(coilNum + 0.5, totalCoils, R, type, conicalGeometry)
      
      const x = currentRadius * Math.cos(angle)
      const y = currentRadius * Math.sin(angle)
      axialPos += currentPitch / samplesPerCoil
      
      points.push(new Vector3(x, y, axialPos))
    }
  }
  
  return points
}

/**
 * 生成仅螺旋弹簧路径（切断后的独立弹簧）
 * 标准螺旋，中心在原点
 */
function generateSpringOnlyPath(params: SpringParameters): Vector3[] {
  const points: Vector3[] = []
  const { meanDiameter, wireDiameter, pitch, totalCoils, type, variablePitch, conicalGeometry } = params
  const R = meanDiameter / 2
  const samplesPerCoil = 36
  const totalSamples = Math.ceil(totalCoils * samplesPerCoil)
  
  let axialPos = 0
  
  for (let i = 0; i <= totalSamples; i++) {
    const coilNum = i / samplesPerCoil
    const angle = coilNum * Math.PI * 2
    
    const currentPitch = getPitchAtCoil(coilNum, totalCoils, pitch, wireDiameter, type, variablePitch)
    const currentRadius = getRadiusAtCoil(coilNum, totalCoils, R, type, conicalGeometry)
    
    const x = currentRadius * Math.cos(angle)
    const y = currentRadius * Math.sin(angle)
    if (i > 0) {
      axialPos += currentPitch / samplesPerCoil
    }
    
    points.push(new Vector3(x, y, axialPos))
  }
  
  return points
}

/**
 * 下落动画的弹簧组件
 */
function FallingSpring({ 
  curve, 
  wireDiameter 
}: { 
  curve: CatmullRomCurve3
  wireDiameter: number 
}): ReactNode {
  const groupRef = useRef<Group>(null)
  const [, setFallState] = useState({ y: 0, vy: 0, rotation: 0 })

  // 重置下落状态
  useEffect(() => {
    setFallState({ y: 0, vy: 0, rotation: 0 })
  }, [])

  // 下落动画
  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    setFallState(prev => {
      const gravity = 50  // 重力加速度
      const newVy = prev.vy + gravity * delta
      const newY = prev.y - newVy * delta
      const newRotation = prev.rotation + delta * 2  // 旋转
      
      // 更新位置
      groupRef.current!.position.y = newY
      groupRef.current!.rotation.x = Math.PI / 2 + newRotation * 0.1
      groupRef.current!.rotation.z = newRotation * 0.3
      
      return { y: newY, vy: newVy, rotation: newRotation }
    })
  })

  return (
    <group ref={groupRef} position={[0, 0, 25]}>
      <mesh>
        <tubeGeometry
          args={[curve, 256, wireDiameter / 2, 16, false]}
        />
        <meshStandardMaterial
          color="#60a5fa"
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
    </group>
  )
}

export function SpringMesh(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  const tick = useProcessStore((s) => s.tick)

  useFrame((_, delta) => {
    tick(delta)
  })

  const currentCoils = axisPositions?.currentCoils ?? 0
  const currentPhase = axisPositions?.currentPhase ?? 'idle'
  
  // 计算待加工的直线段长度
  const wirePerCoil = Math.PI * params.meanDiameter
  const usedWireLength = currentCoils * wirePerCoil
  const baseFeedLength = 60
  const remainingFeedLength = Math.max(10, baseFeedLength - usedWireLength * 0.3)

  // 统一曲线（直线+过渡+螺旋）- 用于加工过程
  // 支持压缩、变节距、锥形弹簧
  const unifiedCurve = useMemo(() => {
    const path = generateUnifiedWirePath(params, currentCoils, remainingFeedLength)
    return new CatmullRomCurve3(path)
  }, [params, currentCoils, remainingFeedLength])

  // 独立弹簧曲线（仅螺旋）- 用于切断后
  const springOnlyCurve = useMemo(() => {
    const path = generateSpringOnlyPath(params)
    return new CatmullRomCurve3(path)
  }, [params])

  // 空闲状态不显示
  if (currentPhase === 'idle') {
    return null
  }

  // 切断完成后（done状态）：显示独立的弹簧，带下落动画
  if (currentPhase === 'done') {
    return (
      <FallingSpring 
        curve={springOnlyCurve} 
        wireDiameter={params.wireDiameter} 
      />
    )
  }

  // 切割阶段：显示即将被切断的线材（橙色）
  if (currentPhase === 'cutting') {
    return (
      <group position={[0, 0, 20]}>
        <mesh>
          <tubeGeometry
            args={[unifiedCurve, 256, params.wireDiameter / 2, 16, false]}
          />
          <meshStandardMaterial
            color="#f59e0b"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>
    )
  }

  // 加工过程：显示统一曲线（直线+弯曲+螺旋）
  // 弹簧在工具前方生成(Z=20)，避免与圈径杆等干涉
  return (
    <group position={[0, 0, 20]}>
      <mesh>
        <tubeGeometry
          args={[unifiedCurve, 256, params.wireDiameter / 2, 16, false]}
        />
        <meshStandardMaterial
          color="#78716c"
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
    </group>
  )
}
