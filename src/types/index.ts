/**
 * 弹簧类型枚举。
 */
export type SpringType =
  | 'compression'
  | 'tension'
  | 'torsion'
  | 'variablePitch'
  | 'conical'

/** 端部形式 */
export type SpringEndType =
  | 'plain'
  | 'ground'
  | 'closed'
  | 'closed_ground'
  | 'hook_german'
  | 'hook_english'

/** 变节距定义 */
export interface VariablePitchSegment {
  /** 区段起始圈号，从 0 或 1 开始（无单位） */
  startTurn: number
  /** 区段结束圈号（无单位） */
  endTurn: number
  /** 区段内名义节距，单位 mm，典型范围 0.5 ~ 50 */
  pitch: number
}

/** 锥形几何定义 */
export interface ConicalGeometry {
  /** 小端外径，单位 mm，典型范围 2 ~ 100 */
  smallOuterDiameter: number
  /** 大端外径，单位 mm，典型范围 2 ~ 200 */
  largeOuterDiameter: number
  /** 是否由小端到大端（true 表示从小径到大径渐变） */
  fromSmallToLarge: boolean
}

/** 弹簧几何与工艺参数 */
export interface SpringParameters {
  /** 弹簧类型，决定几何与加工逻辑 */
  type: SpringType
  /** 线径 d，单位 mm，典型范围 0.1 ~ 20 */
  wireDiameter: number
  /** 中径 Dm，单位 mm，典型范围 1 ~ 300 */
  meanDiameter: number
  /** 外径 D = Dm + d，单位 mm，典型范围 1 ~ 320 */
  outerDiameter: number
  /** 内径 Di = Dm - d，单位 mm，典型范围 0.5 ~ 300 */
  innerDiameter: number
  /** 有效圈数 n，典型范围 1 ~ 200 */
  activeCoils: number
  /** 总圈数 including 端圈，典型范围 1 ~ 250 */
  totalCoils: number
  /** 名义节距 p，单位 mm，典型范围 0.5 ~ 80 */
  pitch: number
  /** 自由高度 H0，单位 mm，典型范围 1 ~ 1000 */
  freeLength: number
  /** 左旋/右旋：'LH' = left-hand, 'RH' = right-hand */
  hand: 'LH' | 'RH'
  /** 端部形式 */
  endType: SpringEndType
  /** 变节距定义，可为空表示等节距 */
  variablePitch?: VariablePitchSegment[]
  /** 锥形几何定义，非锥形时为 undefined */
  conicalGeometry?: ConicalGeometry
  /** 目标工作载荷 F，单位 N，典型范围 0.1 ~ 10_000 */
  designLoad?: number
  /** 目标工作行程 Δ，单位 mm，典型范围 0.1 ~ 500 */
  designDeflection?: number
  /** 备注或工艺说明 */
  notes?: string
}

/** 材料物理与工艺属性 */
export interface MaterialProperties {
  /** 材料牌号，如 SUS304, SWPB 等 */
  name: string
  /** 弹性模量 E，单位 MPa，典型范围 100_000 ~ 220_000 */
  youngModulus: number
  /** 剪切模量 G，单位 MPa，典型范围 35_000 ~ 80_000 */
  shearModulus: number
  /** 密度 ρ，单位 kg/m^3，典型范围 7_000 ~ 8_500 */
  density: number
  /** 许用剪切应力 τ_allow，单位 MPa，典型范围 300 ~ 1200 */
  allowableShearStress: number
  /** 许用拉伸应力 σ_allow，单位 MPa，典型范围 500 ~ 2000 */
  allowableTensileStress: number
  /** 回弹系数 (0~1)，用于几何补偿，典型范围 0.05 ~ 0.3 */
  springbackFactor: number
  /** 推荐安全系数范围，例如 [1.2, 2.0] */
  recommendedSafetyFactorRange?: [number, number]
}

/** 单个机床轴的当前状态 */
export interface MachineArmState {
  /** 轴 ID 或名称，例如 'feed', 'coiling', 'pitch', 'bend', 'cut' */
  id: string
  /** 轴类型，用于 UI / 计算 */
  type: 'feed' | 'coiling' | 'pitch' | 'bend' | 'cut' | 'aux'
  /** 线性位置，单位 mm，对旋转轴可以折算成弧长 */
  positionMm: number
  /** 角度位置，单位度，典型范围 -360 ~ 360 */
  angleDeg: number
  /** 线速度，单位 mm/s */
  velocityMmPerSec: number
  /** 角速度，单位 deg/s */
  angularVelocityDegPerSec: number
  /** 是否正在运动 */
  moving: boolean
  /** 状态灯：'idle' | 'running' | 'alarm' | 'warning' */
  status: 'idle' | 'running' | 'alarm' | 'warning'
  /** 关联的 3D 对象名称，用于碰撞检测和高亮 */
  meshName?: string
}

/** 机床配置参数 */
export interface MachineConfig {
  /** 机床名称或型号 */
  name: string
  /** 机床类型：通用 / WAFIOS / Itaya / 自定义 */
  type: 'Generic' | 'WAFIOS' | 'Itaya' | 'Custom'
  /** 最大送线速度，单位 mm/s */
  maxFeedSpeed: number
  /** 最大卷绕主轴转速，单位 rpm */
  maxCoilingRpm: number
  /** 最大节距轴行程，单位 mm */
  maxPitchStroke: number
  /** 最大折弯角度，单位度，典型范围 0 ~ 360 */
  maxBendAngle: number
  /** 允许的最大加速度，单位 mm/s^2 或折算值 */
  maxAcceleration: number
  /** 每个轴的配置（行程范围、零点偏移等） */
  axes: {
    id: MachineArmState['id']
    type: MachineArmState['type']
    minPositionMm: number
    maxPositionMm: number
    homePositionMm: number
  }[]
}

/** 仿真状态，驱动 3D 场景和时间轴 */
export interface SimulationState {
  /** 当前是否播放中 */
  playing: boolean
  /** 当前仿真时间，单位秒，从 0 开始 */
  currentTimeSec: number
  /** 仿真总时长，单位秒 */
  totalTimeSec: number
  /** 播放速度倍数，例如 0.5, 1, 2, 4 */
  speedFactor: number
  /** 当前圈数（用于 UI 显示），典型范围 0 ~ totalCoils */
  currentTurn: number
  /** 总圈数 */
  totalTurns: number
  /** 当前轴状态快照，用于 3D 动画 */
  armStates: MachineArmState[]
  /** 当前弹簧路径进度 0~1，用于 TubeGeometry 截取 */
  springProgress: number
  /** 是否开启碰撞调试可视化 */
  debugCollisions: boolean
  /** 当前是否检测到碰撞 */
  hasCollision: boolean
  /** 理论节拍时间，单位秒（若尚未计算则为 undefined） */
  estimatedCycleTimeSec?: number
}

// Re-export machine types
export * from './machine'
