/**
 * Eight-Jaw Spring Forming Machine - 3D Model
 * 
 * Renders the virtual 8-jaw machine with:
 * - Base plate with center hole
 * - 8 radial rails
 * - Sliders on each rail
 * - Mounted tools on active jaws
 * 
 * Does NOT touch spring rendering (SpringMesh.tsx)
 */

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { eightJawMachineConfig, type JawConfig } from '../../config/machines/eightJawMachine'
import { toolLibrary, type ToolType } from '../../config/tools/toolLibrary'
import { useProcessStore } from '../../stores/processStore'

/**
 * Tool mesh component - renders the tool geometry
 */
function ToolMesh({ 
  toolType, 
  isActive = false 
}: { 
  toolType: ToolType
  isActive?: boolean 
}): ReactNode {
  const tool = toolLibrary[toolType]
  const { geometry, color, emissiveColor, metalness, roughness } = tool
  
  const rotation = geometry.rotation ?? [0, 0, 0]
  
  if (geometry.type === 'cylinder') {
    return (
      <mesh rotation={rotation as [number, number, number]}>
        <cylinderGeometry args={[geometry.dimensions[0], geometry.dimensions[0], geometry.dimensions[1], 16]} />
        <meshStandardMaterial
          color={color}
          emissive={isActive ? emissiveColor : '#000000'}
          emissiveIntensity={isActive ? 0.5 : 0}
          metalness={metalness}
          roughness={roughness}
        />
      </mesh>
    )
  }
  
  if (geometry.type === 'box') {
    return (
      <mesh rotation={rotation as [number, number, number]}>
        <boxGeometry args={geometry.dimensions} />
        <meshStandardMaterial
          color={color}
          emissive={isActive ? emissiveColor : '#000000'}
          emissiveIntensity={isActive ? 0.6 : 0}
          metalness={metalness}
          roughness={roughness}
        />
      </mesh>
    )
  }
  
  return null
}

/**
 * Single Jaw component - rail + slider + tool
 */
function Jaw({ 
  config, 
  currentPosition 
}: { 
  config: JawConfig
  currentPosition: number 
}): ReactNode {
  const angleRad = (config.angleDeg * Math.PI) / 180
  
  // Calculate jaw position based on current stroke
  const effectiveRadius = config.baseRadius - currentPosition
  const x = effectiveRadius * Math.cos(angleRad)
  const y = effectiveRadius * Math.sin(angleRad)
  
  return (
    <group>
      {/* Rail - fixed, extends from center outward */}
      <group 
        position={[
          (config.baseRadius + 5) * Math.cos(angleRad),
          (config.baseRadius + 5) * Math.sin(angleRad),
          -3
        ]}
        rotation={[0, 0, angleRad]}
      >
        <mesh>
          <boxGeometry args={[20, 4, 6]} />
          <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
      
      {/* Slider - moves along rail */}
      <group 
        position={[x, y, 0]}
        rotation={[0, 0, angleRad + Math.PI]}
      >
        {/* Slider body */}
        <mesh position={[-4, 0, 0]}>
          <boxGeometry args={[8, 5, 5]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
        
        {/* Tool mount */}
        <group position={[2, 0, 0]}>
          <ToolMesh toolType={config.mountedTool} isActive={config.active} />
        </group>
        
        {/* Jaw label */}
        {config.active && (
          <mesh position={[-8, 0, 4]}>
            <boxGeometry args={[2, 2, 0.5]} />
            <meshStandardMaterial 
              color={config.active ? '#22c55e' : '#64748b'} 
              emissive={config.active ? '#22c55e' : '#000000'}
              emissiveIntensity={0.3}
            />
          </mesh>
        )}
      </group>
    </group>
  )
}

/**
 * Base plate with center hole - 垂直于Z轴（弹簧轴）
 */
function BasePlate(): ReactNode {
  return (
    <group position={[0, 0, -8]}>
      {/* Main plate - 旋转使圆盘面朝Z轴 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[45, 45, 6, 32]} />
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
      </mesh>
      
      {/* Center hole rim */}
      <mesh position={[0, 0, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[10, 1, 8, 32]} />
        <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Center opening indicator */}
      <mesh position={[0, 0, 4]}>
        <ringGeometry args={[8, 10, 32]} />
        <meshStandardMaterial 
          color="#22d3ee" 
          emissive="#22d3ee"
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  )
}

/**
 * Forming zone indicator
 */
function FormingZoneIndicator(): ReactNode {
  return (
    <group position={[0, 0, 0]}>
      {/* Forming point ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[12, 0.2, 8, 32]} />
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

/**
 * Main Eight-Jaw Machine Component
 */
export function EightJawMachine(): ReactNode {
  const axisPositions = useProcessStore((s) => s.axisPositions)
  
  // Calculate jaw positions based on axis data
  const jawPositions = useMemo(() => {
    const positions: Record<string, number> = {}
    const config = eightJawMachineConfig
    
    config.jaws.forEach((jaw) => {
      // Map axis positions to jaw movements
      let position = 0
      
      if (jaw.id === 'J1' && axisPositions?.coiling !== undefined) {
        // J1 (coiling_pin) responds to coiling axis
        position = Math.min(axisPositions.coiling * 0.5, jaw.stroke)
      } else if (jaw.id === 'J2' && axisPositions?.pitch !== undefined) {
        // J2 (pitch_tool) responds to pitch axis - moves along Z
        position = Math.min(axisPositions.pitch * 0.1, jaw.stroke)
      } else if (jaw.id === 'J3' && axisPositions?.cut !== undefined) {
        // J3 (cutting_tool) responds to cut axis
        position = Math.max(0, (30 - axisPositions.cut) * 0.5)
      }
      
      positions[jaw.id] = position
    })
    
    return positions
  }, [axisPositions])
  
  return (
    <group>
      {/* Base plate */}
      <BasePlate />
      
      {/* All 8 jaws */}
      {eightJawMachineConfig.jaws.map((jaw) => (
        <Jaw 
          key={jaw.id} 
          config={jaw} 
          currentPosition={jawPositions[jaw.id] ?? 0}
        />
      ))}
      
      {/* Forming zone indicator */}
      <FormingZoneIndicator />
    </group>
  )
}

export default EightJawMachine
