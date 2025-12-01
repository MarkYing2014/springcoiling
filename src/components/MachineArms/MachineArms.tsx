import type { ReactNode } from 'react'
import { useProcessStore } from '../../stores/processStore'
import { useSpringStore } from '../../store/springStore'

/**
 * 卷簧机 - 基于实际工作原理
 * 
 * 工作原理：
 * 1. 送线滚轮将钢丝从导向板穿入
 * 2. 钢丝接触上/下圈径杆，形成3个摩擦点（导向板出口+上圈径杆+下圈径杆）
 * 3. 在3个摩擦点的限位和导向下，钢丝弯曲变形，绕芯轴成形
 * 4. 节距杆沿轴向移动，控制弹簧螺距
 * 5. 切刀在芯轴配合下切断钢丝
 * 
 * 关键工具：
 * - 芯轴（半圆形）：钢丝绕其弯曲成形
 * - 上圈径杆：上弯曲点，控制弹簧直径
 * - 下圈径杆：下弯曲点，控制弹簧直径
 * - 节距杆：控制螺距
 * - 切刀：切断钢丝
 * - 导向板：引导钢丝进入成形区
 */

/** 机架底座 */
function MachineBase(): ReactNode {
  return (
    <group>
      {/* 主机架 */}
      <mesh position={[0, 0, -5]}>
        <boxGeometry args={[80, 60, 10]} />
        <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* 成形区面板 */}
      <mesh position={[0, 0, 2]}>
        <boxGeometry args={[50, 40, 4]} />
        <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** 
 * 半圆形芯轴 - 钢丝绕其外侧弯曲成形
 * 参照图片：芯轴是半圆形，钢丝从导向板出来后绕芯轴弯曲
 */
function SemiCircularArbor(): ReactNode {
  const params = useSpringStore((s) => s.params)
  // 芯轴半径 = 弹簧内径的一半
  const arborRadius = (params.meanDiameter - params.wireDiameter) / 2
  const safeRadius = Math.max(arborRadius, 3)

  return (
    <group position={[0, 0, 5]}>
      {/* 芯轴座 */}
      <mesh position={[0, 0, -2]}>
        <cylinderGeometry args={[safeRadius + 3, safeRadius + 4, 4, 32]} />
        <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* 半圆形芯轴主体 - 钢丝绕此成形 */}
      <mesh position={[safeRadius / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[safeRadius, safeRadius, 3, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial 
          color="#94a3b8" 
          metalness={0.85} 
          roughness={0.15}
          side={2}  // DoubleSide
        />
      </mesh>
      
      {/* 芯轴轴向延伸（弹簧推出方向） */}
      <mesh position={[0, 0, 8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[safeRadius * 0.3, safeRadius * 0.3, 12, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} />
      </mesh>
    </group>
  )
}

/** 
 * 上圈径杆 - 从上方伸入，与导向板出口形成弯曲点
 * 可移动以控制弹簧圈径
 */
function UpperCoilingRod(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  
  // 圈径杆位置随弹簧直径变化
  const coilingPos = axisPositions?.coiling ?? 10
  const rodOffset = params.meanDiameter / 2 + 2
  
  return (
    <group position={[rodOffset, 15, 5]}>
      {/* 滑槽导轨 */}
      <mesh position={[0, 10, 0]}>
        <boxGeometry args={[4, 25, 3]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* 圈径杆滑块 */}
      <group position={[0, -coilingPos * 0.5, 0]}>
        <mesh>
          <boxGeometry args={[5, 6, 4]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* 圈径杆头部 - 带沟槽，钢丝在此弯曲 */}
        <mesh position={[0, -5, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[2, 2, 8, 16]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* 沟槽指示 */}
        <mesh position={[0, -9, 0]}>
          <torusGeometry args={[2, 0.5, 8, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

/** 
 * 下圈径杆 - 从下方伸入，与导向板出口和上圈径杆形成3点弯曲
 */
function LowerCoilingRod(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  
  const coilingPos = axisPositions?.coiling ?? 10
  const rodOffset = params.meanDiameter / 2 + 2
  
  return (
    <group position={[rodOffset, -15, 5]}>
      {/* 滑槽导轨 */}
      <mesh position={[0, -10, 0]}>
        <boxGeometry args={[4, 25, 3]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* 圈径杆滑块 */}
      <group position={[0, coilingPos * 0.5, 0]}>
        <mesh>
          <boxGeometry args={[5, 6, 4]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* 圈径杆头部 */}
        <mesh position={[0, 5, 0]}>
          <cylinderGeometry args={[2, 2, 8, 16]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* 沟槽 */}
        <mesh position={[0, 9, 0]}>
          <torusGeometry args={[2, 0.5, 8, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

/** 
 * 节距杆 - 沿弹簧轴线方向移动，控制螺距
 * 钢丝接触节距杆斜面，被推动形成螺距
 */
function PitchTool(): ReactNode {
  const axisPositions = useProcessStore((s) => s.axisPositions)
  const pitchPos = axisPositions?.pitch ?? 0
  
  return (
    <group position={[-15, 0, 5]}>
      {/* 节距杆导轨（沿Z轴，即弹簧轴向） */}
      <mesh position={[0, 0, 10]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[4, 25, 3]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* 节距杆滑块 */}
      <group position={[0, 0, pitchPos * 0.3]}>
        <mesh>
          <boxGeometry args={[5, 5, 5]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* 节距杆头部 - 斜面 */}
        <mesh position={[4, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[6, 3, 4]} />
          <meshStandardMaterial color="#10b981" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>
    </group>
  )
}

/** 
 * 切刀 - 在芯轴配合下切断钢丝
 */
function Cutter(): ReactNode {
  const axisPositions = useProcessStore((s) => s.axisPositions)
  const currentPhase = axisPositions?.currentPhase ?? 'idle'
  
  // 切割阶段时切刀伸出
  const cutPos = currentPhase === 'cutting' ? 15 : 0
  
  return (
    <group position={[0, 25, 8]}>
      {/* 切刀导轨 */}
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[6, 20, 4]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* 切刀滑块 */}
      <group position={[0, -cutPos, 0]}>
        <mesh>
          <boxGeometry args={[8, 6, 5]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* 切刀刀片 */}
        <mesh position={[0, -5, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[1.5, 10, 3]} />
          <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.15} />
        </mesh>
      </group>
    </group>
  )
}

/** 
 * 送线滚轮和导向板 - 将钢丝送入成形区
 * 参照图片：滚轮在左侧，钢丝水平穿入导向板
 */
function FeedRollersAndGuide(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  
  const feedPos = axisPositions?.feed ?? 0
  const currentCoils = axisPositions?.currentCoils ?? 0
  const rotation = ((feedPos + currentCoils * 10) / 5) * Math.PI
  const wireRadius = params.wireDiameter / 2

  return (
    <group position={[-50, 0, 5]}>
      {/* 送线辊架 */}
      <mesh position={[-20, 0, 0]}>
        <boxGeometry args={[15, 25, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.6} />
      </mesh>
      
      {/* 上送线辊 */}
      <mesh position={[-20, 6, 0]} rotation={[Math.PI / 2, rotation, 0]}>
        <cylinderGeometry args={[5, 5, 8, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-20, 6, 0]} rotation={[Math.PI / 2, rotation, 0]}>
        <torusGeometry args={[5, 0.4, 8, 24]} />
        <meshStandardMaterial color="#0f766e" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* 下送线辊 */}
      <mesh position={[-20, -6, 0]} rotation={[Math.PI / 2, -rotation, 0]}>
        <cylinderGeometry args={[5, 5, 8, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-20, -6, 0]} rotation={[Math.PI / 2, -rotation, 0]}>
        <torusGeometry args={[5, 0.4, 8, 24]} />
        <meshStandardMaterial color="#0f766e" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* 导向板 - 钢丝穿过此处 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[20, 12, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 导向孔 */}
      <mesh position={[10, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[wireRadius + 0.5, wireRadius + 0.5, 5, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* 待送线材卷 */}
      <mesh position={[-40, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[12, wireRadius * 3, 16, 32]} />
        <meshStandardMaterial color="#78716c" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

/** 成形点指示 - 3点弯曲成形区 */
function FormingPointIndicator(): ReactNode {
  return (
    <group position={[0, 0, 20]}>
      {/* 发光环指示成形点 - 弹簧在此区域生成 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[15, 0.3, 8, 32]} />
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
 * 主组件 - 卷簧机完整结构
 * 
 * 布局（参照图片）：
 *           切刀(上方)
 *              ↓
 *     ┌───────────────┐
 *     │  上圈径杆  ←─┐│
 *     │              ││
 * 导向板→━━━┳━━━━━━━┫│ ← 芯轴(半圆)
 *  送线    ┃        ││
 *     │  下圈径杆  ←─┘│
 *     │               │
 *     └───────────────┘
 *            │
 *         节距杆(侧面)
 */
export function MachineArms(): ReactNode {
  return (
    <group>
      <group position={[0, 0, 0]}>
        {/* 机架底座 */}
        <MachineBase />
        
        {/* 半圆形芯轴 - 钢丝绕此弯曲成形 */}
        <SemiCircularArbor />
        
        {/* 上圈径杆 - 形成上弯曲点 */}
        <UpperCoilingRod />
        
        {/* 下圈径杆 - 形成下弯曲点 */}
        <LowerCoilingRod />
        
        {/* 节距杆 - 控制螺距 */}
        <PitchTool />
        
        {/* 切刀 - 切断钢丝 */}
        <Cutter />
        
        {/* 送线滚轮和导向板 */}
        <FeedRollersAndGuide />
        
        {/* 成形点指示 */}
        <FormingPointIndicator />
      </group>
    </group>
  )
}
