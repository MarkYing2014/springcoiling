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

/** 机架底座 */
function MachineFrame(): ReactNode {
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

/**
 * C轴 - 成形刀（在成形点侧面，控制直径）
 */
function CoilingToolAxis(): ReactNode {
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

/**
 * P轴 - 螺距控制刀（在成形点对侧）
 */
function PitchToolAxis(): ReactNode {
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

/**
 * K轴 - 切刀（在成形点上方）
 */
function CuttingAxis(): ReactNode {
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
      {/* 弹簧生长方向指示 */}
      <mesh position={[0, 0, 20]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[15, 0.15, 8, 32]} />
        <meshStandardMaterial 
          color="#a5f3fc" 
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  )
}

/**
 * 主组件 - 4+1轴压簧机完整结构
 * 
 * 布局：
 *                    K轴切刀(上方)
 *                       │
 *     ┌─────────────────┼─────────────────┐
 *     │                 ↓                 │
 *     │  P轴节距刀 ←── 成形点 ──→ C轴成形刀│
 *     │                 ↑                 │
 *     └─────────────────┼─────────────────┘
 *                       │
 *                   F轴送料
 *                       │
 *                    线材卷
 * 
 * 坐标系：
 * - 钢丝从-Z方向进入
 * - 成形点在Z=0
 * - 弹簧沿+Z方向生长
 */
export function MachineArms(): ReactNode {
  return (
    <group>
      {/* 机架 */}
      <MachineFrame />
      
      {/* F轴 - 送料机构 */}
      <FeedAxis />
      
      {/* C轴 - 成形刀/直径控制 */}
      <CoilingToolAxis />
      
      {/* P轴 - 螺距控制刀 */}
      <PitchToolAxis />
      
      {/* K轴 - 切刀 */}
      <CuttingAxis />
      
      {/* 成形区指示 */}
      <FormingZone />
    </group>
  )
}
