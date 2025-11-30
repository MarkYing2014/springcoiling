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
 * 芯棒/转芯轴 - 从面板中心向前延伸到成形区
 * 弹簧线材从中间穿出，绕芯棒成形
 */
function Arbor(): ReactNode {
  const params = useSpringStore((s) => s.params)
  // 芯棒直径略小于弹簧内径，更细的芯棒
  const arborRadius = (params.meanDiameter - params.wireDiameter) / 2 * 0.6
  const safeRadius = Math.max(arborRadius, 1)

  return (
    <group>
      {/* 送线管道 - 穿过面板中心 */}
      <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 10, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* 芯棒座 - 面板前方，更小 */}
      <mesh position={[0, 0, 5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[4, 5, 4, 24]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 芯棒主体 - 更细 */}
      <mesh position={[0, 0, 15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[safeRadius, safeRadius, 14, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* 芯棒尖端 - 更小的锥形 */}
      <mesh position={[0, 0, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[safeRadius, 2, 24]} />
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
  // 爪臂安装位置 - 需要够近以便工具能工作在弹簧成形区
  const mountRadius = 28  // 距离中心的半径
  const mountX = Math.cos(angle) * mountRadius
  const mountY = Math.sin(angle) * mountRadius

  // 滑轨参数
  const slideLength = 12
  const slideTravel = 8  // 最大行程，伸出后工具接近弹簧
  const slideOffset = extension * slideTravel

  return (
    // 工位臂在弹簧尾端前方，工具在成形点工作
    <group position={[mountX, mountY, 30]}>
      {/* 整个爪臂绕中心旋转，工具端指向中心 */}
      <group rotation={[0, 0, angle + Math.PI + camSwing]}>
        
        {/* 爪臂底座 - 紧凑 */}
        <mesh position={[-2, 0, -3]}>
          <boxGeometry args={[5, 3, 6]} />
          <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.5} />
        </mesh>

        {/* 凸轮盘 - 紧凑 */}
        <mesh position={[-4, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[3, 3, 2, 16]} />
          <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
        </mesh>

        {/* 滑轨导轨 */}
        <mesh position={[slideLength / 2, 0, 0]}>
          <boxGeometry args={[slideLength, 2, 2]} />
          <meshStandardMaterial color="#d1d5db" metalness={0.7} roughness={0.2} />
        </mesh>

        {/* 滑块和工具 */}
        <group position={[slideLength - 1 + slideOffset, 0, 0]}>
          <mesh>
            <boxGeometry args={[3, 2.5, 2.5]} />
            <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
          </mesh>

          {/* 工具头 */}
          {toolType === 'curveGuide' && (
            <mesh position={[3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[1, 1, 2, 12]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
            </mesh>
          )}
          {toolType === 'striker' && (
            <mesh position={[3, 0, 0]}>
              <boxGeometry args={[1.5, 2, 3]} />
              <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
            </mesh>
          )}
          {toolType === 'cutter' && (
            <mesh position={[3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.8, 4, 1.5]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.15} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  )
}

/** 送线机构 - 从后方通过面板中心送线 */
function FeedMechanism(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const axisPositions = useProcessStore((s) => s.axisPositions)
  
  // 送线辊旋转 - 基于送线量和圈数
  const feedPos = axisPositions?.feed ?? 0
  const currentCoils = axisPositions?.currentCoils ?? 0
  const rotation = ((feedPos + currentCoils * 10) / 5) * Math.PI
  
  // 线材参数（用于显示线材卷）
  const wireRadius = params.wireDiameter / 2

  return (
    <group position={[0, 0, -30]}>
      {/* 送线辊架 - 面板后方 */}
      <mesh position={[0, 0, -25]}>
        <boxGeometry args={[35, 25, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.6} />
      </mesh>
      
      {/* 上送线辊 - 旋转动画 */}
      <mesh position={[0, 6, -20]} rotation={[0, 0, rotation]}>
        <cylinderGeometry args={[5, 5, 30, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 送线辊纹理 */}
      <mesh position={[0, 6, -20]} rotation={[0, 0, rotation]}>
        <torusGeometry args={[5, 0.3, 8, 24]} />
        <meshStandardMaterial color="#0f766e" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* 下送线辊 - 反向旋转 */}
      <mesh position={[0, -6, -20]} rotation={[0, 0, -rotation]}>
        <cylinderGeometry args={[5, 5, 30, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -6, -20]} rotation={[0, 0, -rotation]}>
        <torusGeometry args={[5, 0.3, 8, 24]} />
        <meshStandardMaterial color="#0f766e" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* 导线管 - 从送线辊到面板中心 */}
      <mesh position={[0, 0, -5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 20, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* 注意：线材现在由 SpringMesh 组件统一渲染 */}
      {/* 包含直线段 + 过渡弧 + 螺旋弹簧，形成连续曲线 */}
      
      {/* 待送线材卷（后方储存的线材） */}
      <mesh position={[0, 0, -45]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8, wireRadius * 2, 8, 32]} />
        <meshStandardMaterial color="#78716c" metalness={0.8} roughness={0.3} />
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

/** 成形点指示 - 弹簧在机械臂工作区成形 */
function FormingPointIndicator(): ReactNode {
  return (
    <group position={[0, 0, 30]}>
      {/* 发光环指示成形点 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[12, 0.25, 8, 32]} />
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
       * 八爪弹簧机布局（参照实际机器）：
       * - 面板在后方，8个工位爪臂安装在面板前面
       * - 芯棒从面板中心穿过，延伸到爪臂工作区域
       * - 弹簧线从后方通过中心送入，绕芯棒成形
       * - 爪臂工具向中心（芯棒）方向工作
       * - 弹簧成形后从芯棒前端推出
       * - 切刀在完成后切断弹簧线
       */}
      <group position={[0, 0, -20]}>
        <CenterPanel />
        <Arbor />
        <EightArmSystem />
        <FormingPointIndicator />
        <FeedMechanism />
      </group>
    </group>
  )
}
