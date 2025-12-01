import type { ReactNode } from 'react'
import { useProcessStore } from '../../stores/processStore'
import { useSpringStore } from '../../store/springStore'

/**
 * 4+1轴压簧机 - 基于实际成形原理
 * 
 * 轴定义：
 * - F轴（FeedArm）：送料轴，控制钢丝送出长度
 * - C轴（CoilingToolArm）：成形/直径控制臂，决定线圈直径
 * - P轴（PitchToolArm）：螺距控制臂，决定螺距
 * - K轴（CuttingArm）：切刀臂，剪断钢丝
 * - A轴（AdditionalFormArm）：端圈整形臂（可选）
 * 
 * 成形原理：
 * 1. F轴送料：钢丝从后方送入成形区
 * 2. C轴成形刀：让钢丝"被迫绕圈"，形成弹簧直径
 * 3. P轴节距刀：推动钢丝沿轴向移动，形成螺距
 * 4. 弹簧向前（+Z）推出
 * 5. K轴切刀：切断完成的弹簧
 * 
 * 坐标系：
 * - 钢丝从-Z方向进入
 * - 成形点在Z=0附近
 * - 弹簧沿+Z方向生长
 */

/** 机架底座 - 固定在成形区后方 */
function MachineFrame(): ReactNode {
  return (
    <group position={[0, 0, -20]}>
      {/* 主机架 */}
      <mesh>
        <boxGeometry args={[60, 50, 8]} />
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* 成形区面板 - 带中心孔 */}
      <mesh position={[0, 0, 6]}>
        <boxGeometry args={[45, 40, 4]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/**
 * F轴 - 送料机构
 * 两个对滚的送料轮，将钢丝从后方送入成形区
 */
function FeedAxis(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  
  // 送料量决定滚轮旋转角度
  const feedPos = axisPositions?.feed ?? 0
  const currentCoils = axisPositions?.currentCoils ?? 0
  const rotation = ((feedPos + currentCoils * Math.PI * params.meanDiameter) / 10) * Math.PI
  
  return (
    <group position={[0, 0, -40]}>
      {/* 送料架 */}
      <mesh position={[0, 0, -5]}>
        <boxGeometry args={[30, 20, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
      </mesh>
      
      {/* 上送料轮 - 旋转 */}
      <mesh position={[0, 5, 0]} rotation={[0, 0, rotation]}>
        <cylinderGeometry args={[4, 4, 20, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 送料轮纹理 */}
      <mesh position={[0, 5, 0]} rotation={[0, 0, rotation]}>
        <torusGeometry args={[4, 0.3, 8, 24]} />
        <meshStandardMaterial color="#0f766e" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* 下送料轮 - 反向旋转 */}
      <mesh position={[0, -5, 0]} rotation={[0, 0, -rotation]}>
        <cylinderGeometry args={[4, 4, 20, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -5, 0]} rotation={[0, 0, -rotation]}>
        <torusGeometry args={[4, 0.3, 8, 24]} />
        <meshStandardMaterial color="#0f766e" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* 导线管 - 从送料轮到成形区 */}
      <mesh position={[0, 0, 15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2, 2, 25, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* 线材卷 */}
      <mesh position={[0, 0, -20]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[10, params.wireDiameter, 16, 32]} />
        <meshStandardMaterial color="#78716c" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

/**
 * C轴 - 成形刀/直径控制
 * 位于成形点，让钢丝"被迫绕圈"，决定弹簧直径
 */
function CoilingToolAxis(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  
  // C轴位置决定弹簧直径
  const coilingPos = axisPositions?.coiling ?? params.meanDiameter / 2
  
  return (
    <group position={[0, 0, 0]}>
      {/* 成形刀座 - 可径向移动 */}
      <group position={[params.meanDiameter / 2 + 5 + coilingPos * 0.1, 0, 0]}>
        {/* 刀座 */}
        <mesh>
          <boxGeometry args={[8, 6, 6]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
        
        {/* 成形刀头 - 钢丝绕此弯曲 */}
        <mesh position={[-5, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[3, 3, 8, 24]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* 刀头沟槽 */}
        <mesh position={[-5, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3, 0.4, 8, 24]} />
          <meshStandardMaterial color="#d97706" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      
      {/* 导轨 */}
      <mesh position={[25, 0, 0]}>
        <boxGeometry args={[30, 3, 3]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
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
