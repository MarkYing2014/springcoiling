import { useEffect } from 'react'
import { useSpringStore } from '../store/springStore'
import { calculateSpringProperties } from '../utils/springCalculations'

/**
 * 监听弹簧参数与材料变化，自动更新 store 中的计算结果。
 */
export function useSpringCalculation() {
  const params = useSpringStore((s) => s.params)
  const material = useSpringStore((s) => s.material)
  const setCalculated = useSpringStore((s) => s.setCalculated)
  const calculated = useSpringStore((s) => s.calculated)

  useEffect(() => {
    const result = calculateSpringProperties(params, material)
    setCalculated(result)
  }, [params, material, setCalculated])

  return calculated
}
