import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../stores/simulationStore'

/**
 * 在 Three 渲染循环中驱动弹簧加工进度。
 */
export function useSpringAnimation() {
  const tick = useSimulationStore((s) => s.tick)

  useFrame((_, delta) => {
    tick(delta)
  })

  useEffect(() => {
    // 组件挂载时重置一次进度
    useSimulationStore.setState({ springProgress: 0 })
  }, [])
}
