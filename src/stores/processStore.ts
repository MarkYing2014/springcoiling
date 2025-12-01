/**
 * 工艺过程状态管理
 * 
 * 管理压簧生产过程的时间轴和各轴状态
 */

import { create } from 'zustand'
import type { CompressionSpringProcess, AxisPositions, ProcessInputParams } from '../types/process'
import type { SpringRecipe } from '../types/machine'
import { generateCompressionSpringProcess, interpolateAxisPositions } from '../utils/processGenerator'
import { SAMPLE_COMPRESSION_RECIPE } from '../config/recipes/sampleCompressionRecipe'

interface ProcessState {
  /** 当前工艺过程 */
  process: CompressionSpringProcess | null
  /** 当前时间 (秒) */
  currentTime: number
  /** 是否正在播放 */
  isPlaying: boolean
  /** 播放速度倍率 */
  playbackSpeed: number
  /** 当前各轴位置 */
  axisPositions: AxisPositions | null
  /** 当前配方 (SpringRecipe) */
  currentRecipe: SpringRecipe | null
  /** 总时长 (秒) - 来自 process 或 recipe */
  duration: number

  /** 根据参数生成工艺过程 */
  generateProcess: (params: ProcessInputParams) => void
  /** 设置当前时间 */
  setTime: (time: number) => void
  /** 播放 */
  play: () => void
  /** 暂停 */
  pause: () => void
  /** 重置 */
  reset: () => void
  /** 设置播放速度 */
  setPlaybackSpeed: (speed: number) => void
  /** 更新帧（由动画循环调用） */
  tick: (deltaTime: number) => void
  /** 设置当前配方 */
  setCurrentRecipe: (recipe: SpringRecipe | null) => void
}

export const useProcessStore = create<ProcessState>((set, get) => ({
  process: null,
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1.0,
  axisPositions: null,
  currentRecipe: SAMPLE_COMPRESSION_RECIPE, // Initialize with sample recipe
  duration: SAMPLE_COMPRESSION_RECIPE.totalCycleTime ?? 10.0,

  generateProcess: (params) => {
    const process = generateCompressionSpringProcess(params)
    const axisPositions = interpolateAxisPositions(process, 0)
    set({ process, currentTime: 0, axisPositions })
  },

  setTime: (time) => {
    const { process } = get()
    if (!process) return
    const clampedTime = Math.max(0, Math.min(time, process.totalCycleTime))
    const axisPositions = interpolateAxisPositions(process, clampedTime)
    set({ currentTime: clampedTime, axisPositions })
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  reset: () => {
    const { process } = get()
    if (!process) return
    const axisPositions = interpolateAxisPositions(process, 0)
    set({ currentTime: 0, axisPositions, isPlaying: false })
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  tick: (deltaTime) => {
    const { isPlaying, currentTime, process, playbackSpeed, duration } = get()
    if (!isPlaying) return

    let newTime = currentTime + deltaTime * playbackSpeed
    
    // 循环播放 - use duration (from recipe or process)
    const maxTime = process?.totalCycleTime ?? duration
    if (newTime >= maxTime) {
      newTime = 0
    }

    // Update axis positions if process exists
    const axisPositions = process ? interpolateAxisPositions(process, newTime) : null
    set({ currentTime: newTime, axisPositions })
  },

  setCurrentRecipe: (recipe) => {
    const newDuration = recipe?.totalCycleTime ?? 10.0
    set({ 
      currentRecipe: recipe, 
      duration: newDuration,
      currentTime: 0,
    })
  },
}))
