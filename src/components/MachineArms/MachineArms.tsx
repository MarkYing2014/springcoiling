import type { ReactNode } from 'react'
import { useProcessStore } from '../../stores/processStore'
import { useSpringStore } from '../../store/springStore'

/**
 * 4+1轴压簧机 - 基于正确几何布局
 * 
 * 几何原则（来自真实机床）：
 * - 导线方向 = 圆在切点T的切线方向
 * - 圆心C到送线直线的距离 = R（弹簧半径）
 * 
 * 坐标系：
 * - 送线沿+X方向（从左到右）
 * - 切点T在(0, 0, 0)
 * - 圆心C在(0, R, 0)
 * - 螺旋沿+Z方向生长
 * 
 * 布局图（俯视）：
 *           +Y (圆心方向)
 *            ↑
 *            ○ C (芯棒/圆心)
 *           ╱
 *          ╱
 *   ━━━━━━●T ━━━━━━→ +X
 *   导线嘴  切点
 */

/** 机架底座 */
function MachineFrame(): ReactNode {
  return (
    <group position={[0, 10, -5]}>
      {/* 主机架 - 在成形区上方 */}
      <mesh>
        <boxGeometry args={[50, 8, 30]} />
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  )
}

/**
 * F轴 - 送料机构
 * 从-X方向送入，沿+X方向到达切点
 */
function FeedAxis(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  
  const feedPos = axisPositions?.feed ?? 0
  const currentCoils = axisPositions?.currentCoils ?? 0
  const rotation = ((feedPos + currentCoils * Math.PI * params.meanDiameter) / 10) * Math.PI
  
  return (
    <group position={[-35, 0, 0]}>
      {/* 送料架 */}
      <mesh position={[-10, 0, 0]}>
        <boxGeometry args={[15, 18, 15]} />
        <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
      </mesh>
      
      {/* 送料轮 - 绕Z轴旋转 */}
      <mesh position={[-5, 4, 0]} rotation={[Math.PI / 2, 0, rotation]}>
        <cylinderGeometry args={[3.5, 3.5, 12, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-5, -4, 0]} rotation={[Math.PI / 2, 0, -rotation]}>
        <cylinderGeometry args={[3.5, 3.5, 12, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* 导线管 - 沿X轴到达切点 */}
      <mesh position={[15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.5, 1.5, 25, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* 导线嘴 - 在切点附近 */}
      <mesh position={[30, 0, 0]}>
        <boxGeometry args={[5, 4, 4]} />
        <meshStandardMaterial color="#10b981" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* 线材卷 */}
      <mesh position={[-25, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[8, params.wireDiameter, 16, 32]} />
        <meshStandardMaterial color="#78716c" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

/**
 * C轴 - 成形刀/芯棒
 * 位于圆心位置(0, R, 0)，钢丝绕此弯曲
 */
function CoilingToolAxis(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const R = params.meanDiameter / 2
  
  return (
    <group position={[0, R, 0]}>
      {/* 芯棒/成形刀 - 钢丝绕此弯曲成圈 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 10, 24]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* 沟槽 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3, 0.5, 8, 24]} />
        <meshStandardMaterial color="#d97706" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* 芯棒支架 */}
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[6, 12, 6]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/**
 * P轴 - 螺距控制刀
 * 沿弹簧轴向（Z轴）移动，推动钢丝形成螺距
 */
function PitchToolAxis(): ReactNode {
  const axisPositions = useProcessStore((s) => s.axisPositions)
  
  // P轴位置决定螺距
  const pitchPos = axisPositions?.pitch ?? 0
  
  return (
    <group position={[-15, 0, 0]}>
      {/* 节距刀座 - 可沿Z轴移动 */}
      <group position={[0, 0, pitchPos * 0.5]}>
        <mesh>
          <boxGeometry args={[6, 5, 5]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
        
        {/* 节距刀头 - 斜面推动钢丝 */}
        <mesh position={[5, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[8, 3, 4]} />
          <meshStandardMaterial color="#10b981" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>
      
      {/* Z向导轨 */}
      <mesh position={[0, 0, 15]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[3, 40, 3]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/**
 * K轴 - 切刀
 * 在弹簧完成后切断钢丝
 */
function CuttingAxis(): ReactNode {
  const axisPositions = useProcessStore((s) => s.axisPositions)
  const currentPhase = axisPositions?.currentPhase ?? 'idle'
  
  // 切割阶段时切刀伸出
  const cutPos = currentPhase === 'cutting' ? 12 : 0
  
  return (
    <group position={[0, 20, 5]}>
      {/* 切刀座 */}
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[8, 12, 5]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* 切刀滑块 - 可向下移动 */}
      <group position={[0, -cutPos, 0]}>
        <mesh>
          <boxGeometry args={[6, 5, 4]} />
          <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* 切刀刀片 */}
        <mesh position={[0, -4, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[1.5, 8, 2.5]} />
          <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.15} />
        </mesh>
      </group>
      
      {/* 导轨 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 20, 3]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
      </mesh>
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
