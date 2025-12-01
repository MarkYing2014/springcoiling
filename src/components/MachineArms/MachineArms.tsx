import type { ReactNode } from 'react'
import { useProcessStore } from '../../stores/processStore'
import { useSpringStore } from '../../store/springStore'

/**
 * 4+1轴压簧机 - 标准坐标系
 * 
 * 坐标系（观察者视角）：
 * - 送线从后方(-Z)进入
 * - 成形点在Z=0
 * - 弹簧沿+Z方向生长（向观察者方向）
 * - 螺旋在X-Y平面
 * 
 * 侧视图（从+X看）：
 *   线材卷 ── 送料轮 ── 导线嘴 ──●── 弹簧 ──→ +Z
 *                              成形点
 */

/** 机架底座 - 备用 */
// @ts-ignore - 保留备用
function _MachineFrame(): ReactNode {
  return (
    <group position={[0, 0, -25]}>
      {/* 主机架 */}
      <mesh>
        <boxGeometry args={[50, 40, 10]} />
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* 成形区面板 */}
      <mesh position={[0, 0, 8]}>
        <boxGeometry args={[40, 35, 6]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/**
 * F轴 - 送料机构（从-Z方向送入）
 */
function FeedAxis(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  
  const feedPos = axisPositions?.feed ?? 0
  const currentCoils = axisPositions?.currentCoils ?? 0
  const rotation = ((feedPos + currentCoils * Math.PI * params.meanDiameter) / 10) * Math.PI
  
  return (
    <group position={[0, 0, -45]}>
      {/* 送料架 */}
      <mesh position={[0, 0, -8]}>
        <boxGeometry args={[25, 20, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
      </mesh>
      
      {/* 送料轮（绕X轴旋转，推动线材沿Z轴前进）*/}
      <mesh position={[0, 5, 0]} rotation={[rotation, 0, 0]}>
        <cylinderGeometry args={[4, 4, 15, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -5, 0]} rotation={[-rotation, 0, 0]}>
        <cylinderGeometry args={[4, 4, 15, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* 导线管（沿Z轴延伸到成形点）*/}
      <mesh position={[0, 0, 20]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 35, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* 导线嘴 */}
      <mesh position={[0, 0, 40]}>
        <boxGeometry args={[4, 4, 5]} />
        <meshStandardMaterial color="#10b981" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* 线材卷 */}
      <mesh position={[0, 0, -25]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[10, params.wireDiameter, 16, 32]} />
        <meshStandardMaterial color="#78716c" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

/** C轴 - 备用 */
// @ts-ignore
function _CoilingToolAxis(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const R = params.meanDiameter / 2
  
  return (
    <group position={[R + 8, 0, 0]}>
      {/* 成形刀 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 12, 24]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* 刀座 */}
      <mesh position={[6, 0, 0]}>
        <boxGeometry args={[8, 8, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** P轴 - 备用 */
// @ts-ignore
function _PitchToolAxis(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  const R = params.meanDiameter / 2
  const pitchPos = axisPositions?.pitch ?? 0
  
  return (
    <group position={[-(R + 8), 0, 0]}>
      {/* 节距刀座 */}
      <group position={[0, 0, pitchPos * 0.3]}>
        <mesh>
          <boxGeometry args={[5, 5, 5]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* 节距刀头 */}
        <mesh position={[4, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[6, 3, 4]} />
          <meshStandardMaterial color="#10b981" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>
      {/* 刀座 */}
      <mesh position={[-6, 0, 0]}>
        <boxGeometry args={[8, 8, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** K轴 - 备用 */
// @ts-ignore
function _CuttingAxis(): ReactNode {
  const axisPositions = useProcessStore((s) => s.axisPositions)
  const currentPhase = axisPositions?.currentPhase ?? 'idle'
  const cutPos = currentPhase === 'cutting' ? 10 : 0
  
  return (
    <group position={[0, 18, 0]}>
      {/* 切刀座 */}
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[8, 10, 6]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 切刀滑块 */}
      <group position={[0, -cutPos, 0]}>
        <mesh>
          <boxGeometry args={[5, 4, 4]} />
          <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* 切刀刀片 */}
        <mesh position={[0, -3, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[1.5, 6, 2]} />
          <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.15} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * 成形点指示 - 弹簧在此区域形成
 */
function FormingZone(): ReactNode {
  return (
    <group position={[0, 0, 0]}>
      {/* 成形点发光环 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[12, 0.2, 8, 32]} />
        <meshStandardMaterial 
          color="#22d3ee" 
          emissive="#22d3ee"
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  )
}

/**
 * 单个机械臂 - 静态展示
 */
interface ArmProps {
  angle: number
  color: string
  toolType: 'rod' | 'blade' | 'roller'
  radiusOverride?: number
  yOffset?: number
  zOffset?: number
  glow?: boolean
}

function Arm({ angle, color, toolType, radiusOverride, yOffset = 0, zOffset = 0, glow }: ArmProps): ReactNode {
  const baseRadius = 25
  const radius = radiusOverride ?? baseRadius
  const x = radius * Math.cos(angle)
  const y = radius * Math.sin(angle) + yOffset
  
  return (
    <group position={[x, y, zOffset]} rotation={[0, 0, angle + Math.PI]}>
      {/* 滑轨底座 */}
      <mesh position={[0, 0, -3]}>
        <boxGeometry args={[6, 4, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* 臂体 */}
      <mesh position={[-8, 0, 0]}>
        <boxGeometry args={[12, 3, 4]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* 工具头 - 在内侧（靠近中心/弹簧） */}
      {toolType === 'rod' && (
        <mesh position={[5, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 6, 16]} />
          <meshStandardMaterial
            color={color}
            metalness={0.7}
            roughness={0.25}
            emissive={glow ? color : '#000000'}
            emissiveIntensity={glow ? 0.5 : 0}
          />
        </mesh>
      )}
      {toolType === 'blade' && (
        <mesh position={[5, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[1, 5, 3]} />
          <meshStandardMaterial
            color={color}
            metalness={0.8}
            roughness={0.15}
            emissive={glow ? color : '#000000'}
            emissiveIntensity={glow ? 0.6 : 0}
          />
        </mesh>
      )}
      {toolType === 'roller' && (
        <mesh position={[5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[2, 2, 4, 16]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
        </mesh>
      )}
    </group>
  )
}

/**
 * 八爪机械臂系统 - 环形排列
 */
function EightArmSystem(): ReactNode {
  const axisPositions = useProcessStore((s) => s.axisPositions)
  const params = useSpringStore((s) => s.params)
  const R = params.meanDiameter / 2

  const coilingPos = axisPositions?.coiling ?? 0
  const pitchPos = axisPositions?.pitch ?? 0
  const cutPos = axisPositions?.cut ?? 30

  // 动态位移（修正方向）
  // 成形杆：coilingPos越大，越靠近中心（半径越小）
  const formingRadius = Math.max(12, 25 - (coilingPos - R) * 0.3)
  // 节距杆：pitchPos越大，沿+Z方向前进（向弹簧方向）
  const pitchZ = pitchPos * 0.15
  // 切刀：cutPos越小，越靠近中心（向下）
  const cutY = (cutPos - 15) * 0.3

  // 8个臂的配置（含动态属性）
  const arms = [
    { angle: 0, color: '#facc15', toolType: 'rod' as const, radiusOverride: formingRadius, glow: true },
    { angle: Math.PI / 4, color: '#10b981', toolType: 'rod' as const, zOffset: pitchZ, glow: true },
    { angle: Math.PI / 2, color: '#ef4444', toolType: 'blade' as const, yOffset: cutY, glow: true },
    { angle: 3 * Math.PI / 4, color: '#8b5cf6', toolType: 'roller' as const },
    { angle: Math.PI, color: '#f59e0b', toolType: 'rod' as const },
    { angle: 5 * Math.PI / 4, color: '#10b981', toolType: 'rod' as const },
    { angle: 3 * Math.PI / 2, color: '#3b82f6', toolType: 'blade' as const },
    { angle: 7 * Math.PI / 4, color: '#8b5cf6', toolType: 'roller' as const },
  ]

  return (
    <group>
      {arms.map((arm, index) => (
        <Arm
          key={index}
          angle={arm.angle}
          color={arm.color}
          toolType={arm.toolType}
          radiusOverride={arm.radiusOverride}
          yOffset={arm.yOffset}
          zOffset={arm.zOffset}
          glow={arm.glow}
        />
      ))}
    </group>
  )
}

/**
 * 中心面板 - 八爪机的中心
 */
function CenterPanel(): ReactNode {
  return (
    <group position={[0, 0, -5]}>
      {/* 方形中心面板 */}
      <mesh>
        <boxGeometry args={[50, 50, 8]} />
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* 中心孔 */}
      <mesh position={[0, 0, 5]}>
        <cylinderGeometry args={[8, 8, 2, 32]} />
        <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  )
}

/**
 * 主组件 - 八爪卷簧机
 * 
 * 布局：
 *              臂2(45°)    臂1(0°)
 *                 ╲        ╱
 *     臂3(90°) ────●────── 臂0
 *                 ╱        ╲
 *              臂4        臂7(315°)
 *                 
 * 坐标系：
 * - 成形点在Z=0
 * - 弹簧沿+Z方向生长
 * - 8个机械臂环形排列
 */
export function MachineArms(): ReactNode {
  return (
    <group>
      {/* 中心面板 */}
      <CenterPanel />
      
      {/* 八爪机械臂系统 */}
      <EightArmSystem />
      
      {/* 成形区指示 */}
      <FormingZone />
      
      {/* 保留送料机构 */}
      <FeedAxis />
    </group>
  )
}
