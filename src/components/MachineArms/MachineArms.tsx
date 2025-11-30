import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useProcessStore } from '../../stores/processStore'
import { useSpringStore } from '../../store/springStore'

/**
 * 数控万能八爪弹簧机（8工位爪臂）
 * 
 * 结构说明：
 * - 工作面板：圆形，8个工位爪臂呈放射状分布
 * - 爪臂：可正反向360°旋转，由凸轮片控制工作顺序
 * - 凸轮轴：通过凸轮片形状/角度决定各爪臂的进退时序
 * - 转芯轴：中心芯棒，弹簧绕其成形
 * - 送线轴：将线材送入成形区
 * 
 * 辅助工具（安装在爪臂上）：
 * - 曲线规：控制弹簧直径
 * - 折角器：制作折弯
 * - 撞刀：成形工具
 * - 切刀：切断线材
 * 
 * 工作原理：
 * 1. 送线轴将线材送入成形区
 * 2. 凸轮轴旋转，各爪臂按凸轮角度依次进退
 * 3. 爪臂上的工具推动线材绕芯棒成形
 * 4. 弹簧逐圈生成并沿芯棒向前推出
 */

/** 中心面板 - 方形金属面板 */
function CenterPanel(): ReactNode {
  return (
    <group>
      {/* 主面板 - 方形，参照实际机器 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[100, 100, 6]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 面板边框 */}
      <mesh position={[0, 0, 1]}>
        <boxGeometry args={[104, 104, 2]} />
        <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* 中心成形区 - 带孔阵列 */}
      <mesh position={[0, 0, 4]}>
        <cylinderGeometry args={[18, 18, 4, 32]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* 中心孔阵列 */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const angle = (i / 12) * Math.PI * 2
        const r = 12
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r
        return (
          <mesh key={i} position={[x, y, 5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2, 2, 6, 12]} />
            <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
          </mesh>
        )
      })}
    </group>
  )
}

/** 
 * 芯棒/转芯轴 - 只在成形点位置
 * 实际中弹簧成形后就脱离芯棒，芯棒不穿过弹簧
 */
function Arbor(): ReactNode {
  const params = useSpringStore((s) => s.params)
  // 芯棒直径略小于弹簧内径
  const arborRadius = (params.meanDiameter - params.wireDiameter) / 2 - 0.3
  const safeRadius = Math.max(arborRadius, 1.5)

  return (
    <group>
      {/* 芯棒座 - 固定在面板上 */}
      <mesh position={[0, 0, 4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[8, 10, 8, 24]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 芯棒主体 - 较短，只在成形区 */}
      <mesh position={[0, 0, 14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[safeRadius, safeRadius, 16, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* 芯棒尖端 - 锥形，引导线材 */}
      <mesh position={[0, 0, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[safeRadius, 4, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} />
      </mesh>
    </group>
  )
}

/** 工位爪臂配置 */
interface ArmProps {
  /** 工位编号 (0-7) */
  index: number
  /** 在面板上的角度位置 (弧度) */
  angle: number
  /** 凸轮摆动角度 */
  camSwing: number
  /** 滑轨伸出量 (0-1) */
  extension: number
  /** 安装的工具类型 */
  toolType: 'curveGuide' | 'striker' | 'cutter' | 'none'
  /** 工具颜色 */
  color: string
}

/** 
 * 单个工位爪臂组件 - 参照真实机器照片
 * 结构：凸轮摇臂（黑色弯曲）+ 滑轨（银色直线）+ 工具
 */
function WorkArm({ angle, camSwing, extension, toolType, color }: ArmProps): ReactNode {
  // 爪臂安装位置（面板角落区域）
  const mountRadius = 45
  const mountX = Math.cos(angle) * mountRadius
  const mountY = Math.sin(angle) * mountRadius

  // 滑轨参数
  const slideLength = 35
  const slideOffset = extension * 20  // 滑块行程

  return (
    <group position={[mountX, mountY, 4]}>
      {/* 整个爪臂绕其安装点旋转，指向中心 */}
      <group rotation={[0, 0, angle + Math.PI + camSwing]}>
        
        {/* 凸轮/摇臂机构 - 黑色弯曲形状 */}
        <group position={[0, 0, 0]}>
          {/* 凸轮盘 - 圆形 */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[10, 10, 5, 24]} />
            <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
          </mesh>
          {/* 凸轮臂 - 弯曲部分（用多个部件模拟） */}
          <mesh position={[8, 4, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[14, 6, 4]} />
            <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
          </mesh>
          <mesh position={[18, 8, 0]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[12, 5, 4]} />
            <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
          </mesh>
        </group>

        {/* 滑轨导轨 - 银色直线，从凸轮延伸到中心 */}
        <mesh position={[slideLength / 2 + 5, 0, 2]}>
          <boxGeometry args={[slideLength, 4, 3]} />
          <meshStandardMaterial color="#d1d5db" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* 滑轨侧边导条 */}
        <mesh position={[slideLength / 2 + 5, 3, 2]}>
          <boxGeometry args={[slideLength, 1.5, 4]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[slideLength / 2 + 5, -3, 2]}>
          <boxGeometry args={[slideLength, 1.5, 4]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* 滑块 - 在滑轨上移动 */}
        <group position={[slideLength - 5 + slideOffset, 0, 3]}>
          {/* 滑块本体 */}
          <mesh>
            <boxGeometry args={[10, 7, 5]} />
            <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.4} />
          </mesh>

          {/* 工具座 */}
          <mesh position={[7, 0, 0]}>
            <boxGeometry args={[6, 6, 6]} />
            <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.4} />
          </mesh>

          {/* 工具头 */}
          {toolType === 'curveGuide' && (
            <mesh position={[12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[3, 3, 6, 16]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
            </mesh>
          )}
          {toolType === 'striker' && (
            <mesh position={[12, 0, 0]}>
              <boxGeometry args={[4, 5, 8]} />
              <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
            </mesh>
          )}
          {toolType === 'cutter' && (
            <mesh position={[12, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[2, 10, 3]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.15} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  )
}

/** 送线机构 - 从上方送线到成形区 */
function FeedMechanism(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  const feedPos = axisPositions?.feed ?? 0
  const rotation = (feedPos / 10) * Math.PI

  const wireRadius = params.wireDiameter / 2

  return (
    <group position={[0, 50, -18]}>
      {/* 送线辊架 */}
      <mesh position={[0, 10, 0]}>
        <boxGeometry args={[30, 20, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* 送线辊 */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, rotation]}>
        <cylinderGeometry args={[8, 8, 25, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 导线管 - 从送线辊向下到成形区 */}
      <mesh position={[0, -25, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 40, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* 进线线材 - 沿Y轴向下 */}
      <mesh position={[0, -30, 0]}>
        <cylinderGeometry args={[wireRadius, wireRadius, 50, 8]} />
        <meshStandardMaterial color="#a8a29e" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

/** 八爪工位系统 - 8个工位爪臂 */
function EightArmSystem(): ReactNode {
  const axisPositions = useProcessStore((s) => s.axisPositions)

  // 当前加工状态
  const currentPhase = axisPositions?.currentPhase ?? 'idle'
  const currentCoils = axisPositions?.currentCoils ?? 0

  // 凸轮角度 - 基于当前圈数（每圈凸轮旋转360度）
  const camAngle = (currentCoils % 1) * Math.PI * 2

  // 8个工位爪臂配置
  const arms = useMemo(() => {
    const isWorking = currentPhase !== 'idle' && currentPhase !== 'reset'
    const isCutting = currentPhase === 'cutting'

    // 各工位的工具配置和动作（参照真实机器照片）
    return [
      // 工位0 (上方) - 送线位置附近
      { 
        index: 0, 
        angle: Math.PI * 0.5,
        camSwing: Math.sin(camAngle) * 0.03, 
        extension: isWorking ? 0.4 : 0, 
        toolType: 'striker' as const, 
        color: '#94a3b8' 
      },
      // 工位1 (右上 45°) - 曲线规
      { 
        index: 1, 
        angle: Math.PI * 0.25, 
        camSwing: Math.sin(camAngle + 0.5) * 0.04, 
        extension: isWorking ? 0.7 : 0, 
        toolType: 'curveGuide' as const, 
        color: '#eab308' 
      },
      // 工位2 (右 0°) - 撞刀
      { 
        index: 2, 
        angle: 0, 
        camSwing: Math.sin(camAngle + 1) * 0.05, 
        extension: isWorking ? 0.5 + Math.sin(camAngle) * 0.2 : 0, 
        toolType: 'striker' as const, 
        color: '#ec4899' 
      },
      // 工位3 (右下 -45°) - 曲线规
      { 
        index: 3, 
        angle: -Math.PI * 0.25, 
        camSwing: Math.sin(camAngle + 1.5) * 0.04, 
        extension: isWorking ? 0.6 : 0, 
        toolType: 'curveGuide' as const, 
        color: '#6366f1' 
      },
      // 工位4 (下 -90°) - 撞刀
      { 
        index: 4, 
        angle: -Math.PI * 0.5, 
        camSwing: -Math.sin(camAngle) * 0.04, 
        extension: isWorking ? 0.55 : 0, 
        toolType: 'striker' as const, 
        color: '#22c55e' 
      },
      // 工位5 (左下 -135°) - 切刀
      { 
        index: 5, 
        angle: -Math.PI * 0.75, 
        camSwing: 0, 
        extension: isCutting ? 0.9 : 0, 
        toolType: 'cutter' as const, 
        color: '#f97316' 
      },
      // 工位6 (左 180°) - 曲线规
      { 
        index: 6, 
        angle: Math.PI, 
        camSwing: Math.sin(camAngle + 2) * 0.04, 
        extension: isWorking ? 0.5 : 0, 
        toolType: 'curveGuide' as const, 
        color: '#8b5cf6' 
      },
      // 工位7 (左上 135°) - 撞刀
      { 
        index: 7, 
        angle: Math.PI * 0.75, 
        camSwing: Math.sin(camAngle + 2.5) * 0.03, 
        extension: isWorking ? 0.45 : 0, 
        toolType: 'striker' as const, 
        color: '#14b8a6' 
      },
    ]
  }, [currentPhase, camAngle])

  return (
    <group>
      {arms.map((arm) => (
        <WorkArm key={arm.index} {...arm} />
      ))}
    </group>
  )
}

/** 成形点指示 - 弹簧实际成形的位置（在芯棒根部，面板前方） */
function FormingPointIndicator(): ReactNode {
  return (
    <group position={[0, 0, 12]}>
      {/* 发光环指示成形点 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[12, 0.5, 8, 32]} />
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

export function MachineArms(): ReactNode {
  return (
    <group>
      {/* 
       * 八爪弹簧机布局：
       * - 面板在后方（Z负方向），带8个工位爪臂
       * - 芯棒从面板中心向前（Z正方向）伸出
       * - 8个爪臂呈放射状分布，各带不同工具
       * - 弹簧在成形区（芯棒根部）生成，向前推出
       * - 送线从上方送入成形区
       */}
      <group position={[0, 0, -30]}>
        <CenterPanel />
        <Arbor />
        <EightArmSystem />
        <FormingPointIndicator />
      </group>
      <FeedMechanism />
    </group>
  )
}
