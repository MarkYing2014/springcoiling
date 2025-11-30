/**
 * 压簧生产工艺类型定义
 * 
 * 基于 4+1 轴压簧机模型：
 * - F轴 (Feed): 送料轴，控制钢丝送出长度
 * - C轴 (Coiling): 成形/直径控制臂，控制线圈直径
 * - P轴 (Pitch): 螺距控制臂，控制轴向位移
 * - K轴 (Cut): 切刀臂，剪断钢丝
 * - A轴 (Additional): 端圈整形臂（可选）
 */

/** 工艺阶段枚举 */
export type ProcessPhase =
  | 'idle'              // 待机
  | 'first_closed_coil' // 首圈紧密圈
  | 'body_coils'        // 主体工作圈
  | 'end_closed_coil'   // 末端紧密圈
  | 'pre_cut'           // 切断准备
  | 'cutting'           // 切断动作
  | 'done'              // 切断完成，弹簧独立
  | 'reset'             // 回位

/** 轴标识符 */
export type AxisId = 'feed' | 'coiling' | 'pitch' | 'cut' | 'additional'

/** 单个关键帧 */
export interface Keyframe {
  /** 相对时间 (秒) */
  time: number
  /** 目标位置 (mm 或角度) */
  position: number
  /** 速度 (可选，用于插补) */
  velocity?: number
}

/** 单轴的运动曲线 */
export interface AxisProfile {
  axisId: AxisId
  /** 轴的显示名称 */
  name: string
  /** 单位 */
  unit: string
  /** 关键帧序列 */
  keyframes: Keyframe[]
}

/** 单个工艺阶段 */
export interface ProcessPhaseData {
  /** 阶段名称 */
  name: ProcessPhase
  /** 阶段显示名称 */
  displayName: string
  /** 开始时间 (秒) */
  startTime: number
  /** 结束时间 (秒) */
  endTime: number
  /** 阶段描述 */
  description: string
}

/** 完整的压簧生产过程 */
export interface CompressionSpringProcess {
  /** 总周期时间 (秒) */
  totalCycleTime: number
  /** 各阶段定义 */
  phases: ProcessPhaseData[]
  /** 各轴运动曲线 */
  axes: AxisProfile[]
  /** 弹簧几何参数（用于生成弹簧路径） */
  springGeometry: {
    wireDiameter: number
    meanDiameter: number
    pitch: number
    totalCoils: number
    activeCoils: number
    /** 每圈的线材长度 */
    wirePerCoil: number
    /** 总线材长度 */
    totalWireLength: number
  }
}

/** 工艺计算的输入参数 */
export interface ProcessInputParams {
  /** 线径 (mm) */
  wireDiameter: number
  /** 中径 (mm) */
  meanDiameter: number
  /** 有效圈数 */
  activeCoils: number
  /** 总圈数 */
  totalCoils: number
  /** 螺距 (mm) */
  pitch: number
  /** 端部形式 */
  endType: 'open' | 'closed' | 'ground'
  /** 送料速度 (mm/s) */
  feedSpeed: number
}

/**
 * 根据当前时间获取各轴的插值位置
 */
export interface AxisPositions {
  feed: number      // 送料位置 (mm)
  coiling: number   // 成形刀位置 (mm)
  pitch: number     // 节距刀位置 (mm)
  cut: number       // 切刀位置 (mm)
  additional: number // 辅助臂位置 (mm)
  /** 当前阶段 */
  currentPhase: ProcessPhase
  /** 当前已完成的圈数 (用于弹簧渲染) */
  currentCoils: number
}
