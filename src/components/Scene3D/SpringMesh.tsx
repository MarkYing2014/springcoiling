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
 * 1. 直线段：送料直线
 * 2. 过渡圆弧：90°~120°圆弧，实现切向连续过渡
 * 3. 标准螺旋：从圆弧末端开始的螺旋
 * 
 * 几何布局：
 * - 导线沿-Y方向进入成形点
 * - 成形点在(0, 0, 0)
 * - 成形刀在+X方向，弯曲钢丝形成X-Y平面的圆弧
 * - 螺旋沿+Z方向生长
 */
function generateUnifiedWirePath(
  params: SpringParameters,
  currentCoils: number,
  feedLength: number
): Vector3[] {
  const points: Vector3[] = []
  const { meanDiameter, wireDiameter, pitch, totalCoils, type, variablePitch, conicalGeometry } = params
  const R = meanDiameter / 2  // 螺旋半径
  
  // ============================================
  // 段1: 直线送料（沿-Y方向进入）
  // ============================================
  // 导线从 (0, -feedLength, 0) 到 (0, 0, 0)
  const straightSamples = 8
  for (let i = 0; i < straightSamples; i++) {
    const t = i / straightSamples
    const y = -feedLength * (1 - t)
    points.push(new Vector3(0, y, 0))
  }
  
  // ============================================
  // 段2: 过渡圆弧（90°圆弧，切向连续）
  // ============================================
  // 圆弧在X-Y平面，中心在(R, 0, 0)，半径R
  // 起点A0 = (0, 0, 0)，切向方向(0, 1, 0)与直线方向一致
  // 终点A1 = (R, R, 0)，切向方向(1, 0, 0)
  // 绕圆心(R, 0, 0)从-90°转到0°
  
  const arcSamples = 12
  const arcSpan = Math.PI / 2  // 90度圆弧
  const arcCenter = new Vector3(R, 0, 0)
  const arcStartAngle = -Math.PI / 2  // 从-90°开始
  
  // 过渡圆弧期间，Z轴也有微小前进（约半个螺距的1/4）
  const arcZAdvance = pitch * 0.1
  
  for (let i = 1; i <= arcSamples; i++) {
    const t = i / arcSamples
    const angle = arcStartAngle + arcSpan * t  // -90° → 0°
    const x = arcCenter.x + R * Math.cos(angle)
    const y = arcCenter.y + R * Math.sin(angle)
    const z = arcZAdvance * t
    points.push(new Vector3(x, y, z))
  }
  
  // ============================================
  // 段3: 标准螺旋（从圆弧末端开始）
  // ============================================
  // 圆弧末端在(2R, 0, arcZAdvance)，角度θ=0
  // 螺旋从这里开始，绕中心(R, 0, z)旋转
  
  const coilsToRender = Math.min(currentCoils, totalCoils)
  if (coilsToRender > 0.1) {
    const samplesPerCoil = 36
    // 减去过渡圆弧占用的约0.25圈
    const effectiveCoils = Math.max(0, coilsToRender - 0.25)
    const totalSamples = Math.ceil(effectiveCoils * samplesPerCoil)
    
    let axialPos = arcZAdvance
    const spiralCenter = new Vector3(R, 0, 0)
    
    for (let i = 1; i <= totalSamples; i++) {
      const coilNum = i / samplesPerCoil
      const angle = coilNum * Math.PI * 2  // 从0开始
      
      // 获取当前圈的螺距和半径
      const currentPitch = getPitchAtCoil(coilNum + 0.25, totalCoils, pitch, wireDiameter, type, variablePitch)
      const currentRadius = getRadiusAtCoil(coilNum + 0.25, totalCoils, R, type, conicalGeometry)
      
      // 螺旋绕中心(R, 0, z)旋转
      const x = spiralCenter.x + currentRadius * Math.cos(angle)
      const y = spiralCenter.y + currentRadius * Math.sin(angle)
      axialPos += currentPitch / samplesPerCoil
      
      points.push(new Vector3(x, y, axialPos))
    }
  }
  
  return points
}

/**
 * 生成仅螺旋弹簧路径（切断后的独立弹簧）
 * 与成形路径保持一致的几何结构：中心偏移
 */
function generateSpringOnlyPath(params: SpringParameters): Vector3[] {
  const points: Vector3[] = []
  const { meanDiameter, wireDiameter, pitch, totalCoils, type, variablePitch, conicalGeometry } = params
  const R = meanDiameter / 2
  const samplesPerCoil = 36
  const totalSamples = Math.ceil(totalCoils * samplesPerCoil)
  
  let axialPos = 0
  const spiralCenter = new Vector3(R, 0, 0)  // 与成形路径一致的中心
  
  for (let i = 0; i <= totalSamples; i++) {
    const coilNum = i / samplesPerCoil
    const angle = coilNum * Math.PI * 2
    
    const currentPitch = getPitchAtCoil(coilNum, totalCoils, pitch, wireDiameter, type, variablePitch)
    const currentRadius = getRadiusAtCoil(coilNum, totalCoils, R, type, conicalGeometry)
    
    const x = spiralCenter.x + currentRadius * Math.cos(angle)
    const y = spiralCenter.y + currentRadius * Math.sin(angle)
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
