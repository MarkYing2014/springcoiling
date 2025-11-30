import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Vector3 } from 'three'
import { useSpringStore } from '../../store/springStore'
import { useProcessStore } from '../../stores/processStore'

/**
 * 根据当前圈数生成弹簧路径
 * 生成均匀的螺旋线路径
 */
function generateSpringPathByCoils(
  meanDiameter: number,
  wireDiameter: number,
  pitch: number,
  currentCoils: number,
  totalCoils: number
): Vector3[] {
  const points: Vector3[] = []
  const radius = meanDiameter / 2
  
  // 计算实际要渲染的圈数
  const coilsToRender = Math.min(currentCoils, totalCoils)
  if (coilsToRender <= 0.1) {
    return [new Vector3(0, 0, 0), new Vector3(0.1, 0, 0)]
  }

  // 每圈的采样点数 - 足够平滑
  const samplesPerCoil = 36
  const totalSamples = Math.ceil(coilsToRender * samplesPerCoil)

  // 累积轴向位置
  let axialPos = 0

  for (let i = 0; i <= totalSamples; i++) {
    const coilNum = i / samplesPerCoil  // 当前圈数（小数）
    const angle = coilNum * Math.PI * 2
    
    // 计算当前位置的螺距
    let currentPitch = pitch
    // 首圈和末圈可以紧密，中间圈正常螺距
    if (coilNum < 1) {
      currentPitch = wireDiameter * 1.1  // 首圈紧密
    } else if (coilNum > totalCoils - 1 && totalCoils > 2) {
      currentPitch = wireDiameter * 1.1  // 末圈紧密
    }
    
    // X-Z平面上的圆周位置
    const x = radius * Math.cos(angle)
    const z = radius * Math.sin(angle)
    
    // Y方向是弹簧轴向（沿弹簧长度方向）
    // 每个采样点增加 pitch/samplesPerCoil 的轴向距离
    if (i > 0) {
      axialPos += currentPitch / samplesPerCoil
    }

    points.push(new Vector3(x, axialPos, z))
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

  const curve = useMemo(() => {
    const path = generateSpringPathByCoils(
      params.meanDiameter,
      params.wireDiameter,
      params.pitch,
      currentCoils,
      params.totalCoils
    )
    return new CatmullRomCurve3(path)
  }, [params.meanDiameter, params.wireDiameter, params.pitch, currentCoils, params.totalCoils])

  // 如果还没有开始，不渲染弹簧
  if (currentCoils < 0.1) {
    return null
  }

  /**
   * 弹簧位置说明（八爪机布局）：
   * - 机器组在 Z=-20
   * - 芯棒尖端在 Z=-20+25=5
   * - 成形点/机械臂工具在 Z=-20+8=-12
   * - 弹簧从成形点开始，向前（Z正方向）生长
   * - rotation [Math.PI/2, 0, 0] 使弹簧沿Z轴生长
   */
  return (
    <group position={[0, 0, -10]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <tubeGeometry
          args={[curve, 256, params.wireDiameter / 2, 16, false]}
        />
        <meshStandardMaterial
          color="#60a5fa"
          metalness={0.7}
          roughness={0.15}
        />
      </mesh>
    </group>
  )
}
