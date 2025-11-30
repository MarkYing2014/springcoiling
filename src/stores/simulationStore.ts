import { create } from 'zustand'

interface SimulationStateInternal {
  playing: boolean
  springProgress: number // 0 ~ 1，对应加工进度
  speedFactor: number // 播放倍速
  setPlaying: (value: boolean) => void
  reset: () => void
  tick: (deltaSec: number) => void
}

const DURATION_SEC = 4 // 默认一件 4 秒加工完

export const useSimulationStore = create<SimulationStateInternal>((set, get) => ({
  playing: false,
  springProgress: 0,
  speedFactor: 1,
  setPlaying: (value) => set({ playing: value }),
  reset: () => set({ springProgress: 0, playing: false }),
  tick: (deltaSec) => {
    const { playing, springProgress, speedFactor } = get()
    if (!playing) return
    const delta = (deltaSec * speedFactor) / DURATION_SEC
    const next = Math.min(1, springProgress + delta)
    set({ springProgress: next, playing: next < 1 })
  },
}))
