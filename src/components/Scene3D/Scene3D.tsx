import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { SpringMesh } from './SpringMesh'
import { MachineArms } from '../MachineArms/MachineArms'

export function Scene3D(): ReactNode {
  return (
    <Canvas 
      camera={{ 
        position: [60, 40, 60],  // 从右前方斜上方观察
        fov: 50 
      }} 
      className="h-full w-full"
    >
      <color attach="background" args={[0.02, 0.03, 0.06]} />
      <ambientLight intensity={0.5} />
      <hemisphereLight intensity={0.7} groundColor={0x111111} />
      <directionalLight position={[50, 80, 50]} intensity={1.5} castShadow />
      <directionalLight position={[-30, 40, -30]} intensity={0.4} />
      <Grid args={[200, 20]} position={[0, -60, 0]} cellColor="#1e293b" sectionColor="#334155" />
      <MachineArms />
      <SpringMesh />
      <OrbitControls 
        enablePan 
        enableZoom 
        enableRotate 
        target={[0, 0, -10]}  // 对准成形区
        minDistance={40}
        maxDistance={250}
      />
    </Canvas>
  )
}
