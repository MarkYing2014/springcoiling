import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { ReactNode } from 'react'
import { SpringMesh } from './SpringMesh'

export function SpringScene(): ReactNode {
  return (
    <Canvas camera={{ position: [0, 40, 120], fov: 40 }} className="h-full w-full bg-slate-900">
      <color attach="background" args={[0.02, 0.03, 0.06]} />
      <hemisphereLight intensity={0.5} groundColor={0x000000} />
      <directionalLight position={[30, 50, 30]} intensity={1.2} />
      <gridHelper args={[200, 20, '#334155', '#0f172a']} />
      <SpringMesh />
      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  )
}
