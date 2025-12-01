import { create } from 'zustand'
import type {
  SpringParameters,
  MaterialProperties
} from '../types'
import type { SpringCalculatedProperties } from '../utils/springCalculations'

interface SpringState {
  params: SpringParameters
  material: MaterialProperties
  calculated: SpringCalculatedProperties | null
  updateParam: <K extends keyof SpringParameters>(key: K, value: SpringParameters[K]) => void
  setCalculated: (value: SpringCalculatedProperties) => void
}

const defaultParams: SpringParameters = {
  type: 'compression',
  wireDiameter: 2,
  meanDiameter: 16,
  outerDiameter: 18,  // = meanDiameter + wireDiameter
  innerDiameter: 14,  // = meanDiameter - wireDiameter
  activeCoils: 6,     // 有效圈数（必须 <= totalCoils）
  totalCoils: 8,      // 总圈数（含首尾紧密圈）
  pitch: 5,           // 节距
  freeLength: 40,
  hand: 'RH',
  endType: 'closed_ground',
  variablePitch: [],
  conicalGeometry: undefined,
  designLoad: 100,
  designDeflection: 10,
  notes: '',
}

const defaultMaterial: MaterialProperties = {
  name: 'SUS304',
  youngModulus: 193000,
  shearModulus: 72000,
  density: 7850,
  allowableShearStress: 600,
  allowableTensileStress: 1000,
  springbackFactor: 0.1,
  recommendedSafetyFactorRange: [1.2, 2.0],
}

export const useSpringStore = create<SpringState>((set) => ({
  params: defaultParams,
  material: defaultMaterial,
  calculated: null,
  updateParam: (key, value) =>
    set((state) => {
      const newParams = { ...state.params, [key]: value }
      
      // 验证：有效圈数不能大于总圈数
      if (key === 'activeCoils' && typeof value === 'number') {
        // 如果设置有效圈数，确保不超过总圈数
        newParams.activeCoils = Math.min(value, newParams.totalCoils)
      }
      if (key === 'totalCoils' && typeof value === 'number') {
        // 如果设置总圈数，确保有效圈数不超过它
        newParams.activeCoils = Math.min(newParams.activeCoils, value)
      }
      
      // 自动计算外径和内径
      if (key === 'meanDiameter' || key === 'wireDiameter') {
        newParams.outerDiameter = newParams.meanDiameter + newParams.wireDiameter
        newParams.innerDiameter = newParams.meanDiameter - newParams.wireDiameter
      }
      
      // 切换弹簧类型时设置默认几何参数
      if (key === 'type') {
        if (value === 'conical' && !newParams.conicalGeometry) {
          // 锥形弹簧默认值：小端10mm，大端20mm
          newParams.conicalGeometry = {
            smallOuterDiameter: 10,
            largeOuterDiameter: 20,
            fromSmallToLarge: true
          }
        }
        if (value === 'variablePitch' && (!newParams.variablePitch || newParams.variablePitch.length === 0)) {
          // 变节距弹簧默认值：前半紧密，后半疏松
          newParams.variablePitch = [
            { startTurn: 0, endTurn: 2, pitch: 3 },
            { startTurn: 2, endTurn: 5, pitch: 6 },
            { startTurn: 5, endTurn: 8, pitch: 4 }
          ]
        }
      }
      
      return { params: newParams }
    }),
  setCalculated: (value) => set(() => ({ calculated: value })),
}))
