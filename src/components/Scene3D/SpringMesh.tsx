import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Vector3 } from 'three'
import { useSpringStore } from '../../store/springStore'
import { useProcessStore } from '../../stores/processStore'

/**
 * 生成统一的线材路径：直线段 + 过渡弧 + 螺旋弹簧
 * 
 * 这是一条连续的曲线，从送线辊出口到弹簧末端
 * 随着加工进行，直线段缩短，螺旋段增长
 */
function generateUnifiedWirePath(
  meanDiameter: number,
  wireDiameter: number,
  pitch: number,
  currentCoils: number,
  totalCoils: number,
  feedLength: number  // 待加工的直线段长度
): Vector3[] {
  const points: Vector3[] = []
  const radius = meanDiameter / 2
  
  // === 第一段：直线段（从送线辊到成形点）===
  // 直线沿 -Y 方向延伸（弹簧沿 +Y 方向生长）
  const straightSamples = 20
  for (let i = 0; i < straightSamples; i++) {
    const t = i / straightSamples
    // 从远处(-feedLength)到成形点(0)
    const y = -feedLength * (1 - t)
    points.push(new Vector3(0, y, 0))
  }
  
  // === 第二段：过渡弧（直线开始弯曲成螺旋）===
  // 从直线(0,0,0)过渡到第一圈螺旋的起点
  const transitionSamples = 12
  for (let i = 1; i <= transitionSamples; i++) {
    const t = i / transitionSamples
    // 逐渐从中心(0)移动到螺旋半径
    const currentRadius = radius * t
    // 沿螺旋方向转一小段角度
    const angle = t * Math.PI * 0.25  // 转45度作为过渡
    const x = currentRadius * Math.cos(angle)
    const z = currentRadius * Math.sin(angle)
    // 轴向略微前进
    const y = t * wireDiameter * 0.5
    points.push(new Vector3(x, y, z))
  }
  
  // === 第三段：螺旋弹簧段 ===
  const coilsToRender = Math.min(currentCoils, totalCoils)
  if (coilsToRender > 0.1) {
    const samplesPerCoil = 36
    const totalSamples = Math.ceil(coilsToRender * samplesPerCoil)
    
    // 起始位置（接续过渡段的末尾）
    const startAngle = Math.PI * 0.25  // 过渡段结束的角度
    let axialPos = wireDiameter * 0.5  // 过渡段结束的轴向位置
    
    for (let i = 1; i <= totalSamples; i++) {
      const coilNum = i / samplesPerCoil
      const angle = startAngle + coilNum * Math.PI * 2
      
      // 计算当前螺距
      let currentPitch = pitch
      if (coilNum < 1) {
        currentPitch = wireDiameter * 1.1  // 首圈紧密
      } else if (coilNum > totalCoils - 1 && totalCoils > 2) {
        currentPitch = wireDiameter * 1.1  // 末圈紧密
      }
      
      const x = radius * Math.cos(angle)
      const z = radius * Math.sin(angle)
      axialPos += currentPitch / samplesPerCoil
      
      points.push(new Vector3(x, axialPos, z))
    }
  }
  
  return points
}

export function SpringMesh(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  const tick = useProcessStore((s) => s.tick)

  // 驱动动画更新
  useFrame((_, delta) => {
    tick(delta)
  })

  const currentCoils = axisPositions?.currentCoils ?? 0
  const currentPhase = axisPositions?.currentPhase ?? 'idle'
  
  // 计算待加工的直线段长度
  // 随着弹簧生成，直线段缩短（线材被消耗）
  const wirePerCoil = Math.PI * params.meanDiameter
  const usedWireLength = currentCoils * wirePerCoil
  const baseFeedLength = 60  // 基础送线长度
  const remainingFeedLength = Math.max(10, baseFeedLength - usedWireLength * 0.3)

  const curve = useMemo(() => {
    const path = generateUnifiedWirePath(
      params.meanDiameter,
      params.wireDiameter,
      params.pitch,
      currentCoils,
      params.totalCoils,
      remainingFeedLength
    )
    return new CatmullRomCurve3(path)
  }, [params.meanDiameter, params.wireDiameter, params.pitch, currentCoils, params.totalCoils, remainingFeedLength])

  // 空闲状态不显示线材
  if (currentPhase === 'idle') {
    return null
  }

  /**
   * 统一线材位置说明：
   * - 线材从送线辊(Y负方向)延伸到成形点(Y=0)
   * - 成形点处弯曲成螺旋
   * - 螺旋向前(Y正方向)生长
   * - rotation [Math.PI/2, 0, 0] 使Y轴变为Z轴
   * - 成形点在机械臂工作区 (Z=10)
   */
  return (
    <group position={[0, 0, 10]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <tubeGeometry
          args={[curve, 256, params.wireDiameter / 2, 16, false]}
        />
        <meshStandardMaterial
          color="#78716c"  // 线材颜色（银灰色）
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
    </group>
  )
}
