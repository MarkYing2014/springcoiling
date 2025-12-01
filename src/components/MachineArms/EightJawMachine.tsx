/**
 * Eight-Jaw Spring Forming Machine - 3D Model
 * 
 * Uses VIRTUAL_EIGHT_JAW_MACHINE configuration
 * Renders:
 * - Forming center (cyan sphere)
 * - Feed exit (green box + tube)
 * - 8 jaws with rails, sliders, and tools
 * 
 * Does NOT touch spring rendering (SpringMesh.tsx)
 */

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import * as THREE from 'three'
import { VIRTUAL_EIGHT_JAW_MACHINE, type VirtualJawConfig } from '../../config/machines/virtual-eight-jaw'
import { getToolByKind, type ToolKind } from '../../config/tools'
import { useProcessStore } from '../../stores/processStore'
import { sampleJawAtTime } from '../../utils/jawKinematics'
import type { JawId } from '../../types/machine'

/**
 * Tool mesh component - renders tool based on kind
 * All tools are modeled with their working axis along +X (for quaternion rotation)
 */
function ToolMesh({ toolKind }: { toolKind: ToolKind }): ReactNode {
  const tool = getToolByKind(toolKind)
  
  switch (tool.kind) {
    case 'coiling_pin':
      // Orange cylinder - axis along +X
      return (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.5, 1.5, 10, 16]} />
          <meshStandardMaterial color="#f97316" metalness={0.7} roughness={0.3} />
        </mesh>
      )
    
    case 'pitch_tool':
      // Green thin box - long axis along +X
      return (
        <mesh>
          <boxGeometry args={[8, 3, 4]} />
          <meshStandardMaterial color="#22c55e" metalness={0.6} roughness={0.35} />
        </mesh>
      )
    
    case 'cutting_tool':
      // Red thin blade - long axis along +X
      return (
        <mesh>
          <boxGeometry args={[8, 1.5, 4]} />
          <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.2} />
        </mesh>
      )
    
    case 'guide':
      // Purple block - face points along +X
      return (
        <mesh>
          <boxGeometry args={[5, 3, 3]} />
          <meshStandardMaterial color="#8b5cf6" metalness={0.4} roughness={0.5} />
        </mesh>
      )
    
    case 'idle':
    default:
      // Dark gray block
      return (
        <mesh>
          <boxGeometry args={[3, 3, 3]} />
          <meshStandardMaterial color="#4b5563" metalness={0.3} roughness={0.6} />
        </mesh>
      )
  }
}

/**
 * Single Jaw component - rail + slider + tool
 * Jaws arranged in X-Y plane, around Z-axis
 * Layout: [Outside] --- Rail --- Slider --- Tool --- [Center]
 * 
 * Jaw position is driven by SpringRecipe keyframes via processStore
 */
function Jaw({ config }: { config: VirtualJawConfig }): ReactNode {
  // Get current recipe and time from process store
  const currentRecipe = useProcessStore((s) => s.currentRecipe)
  const currentTime = useProcessStore((s) => s.currentTime)
  
  // Get jaw configuration
  const basePos = useMemo(() => new THREE.Vector3(...config.basePosition), [config.basePosition])
  
  // Calculate rotation around Z-axis for rail/slider (local +X points outward)
  const angleZ = Math.atan2(basePos.y, basePos.x)
  
  // Base radius from config
  const baseRadius = basePos.length()
  
  // Get jaw position from recipe keyframes (in mm)
  const jawPosition = sampleJawAtTime(currentRecipe, config.id as JawId, currentTime)
  
  // Calculate slider position: move towards center as jawPosition increases
  // Subtract jawPosition because positive jawPosition means moving inward
  const sliderOffset = baseRadius - 5 - jawPosition
  
  // Tool orientation - only coiling_pin needs special rotation
  // Other tools are already aligned by the parent group's angleZ rotation
  const toolRotation = useMemo((): [number, number, number] => {
    if (config.mountedTool === 'coiling_pin') {
      // Coiling pin should be tangential (perpendicular to radial direction)
      // Rotate 90 degrees around Z axis from radial
      return [0, 0, Math.PI / 2]
    }
    // Other tools: no additional rotation needed, they point radially inward
    return [0, 0, 0]
  }, [config.mountedTool])
  
  return (
    <group>
      {/* Rail - dark gray box, at outer position (static) */}
      <group rotation={[0, 0, angleZ]}>
        <mesh position={[baseRadius + 5, 0, basePos.z - 3]}>
          <boxGeometry args={[18, 4, 6]} />
          <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
      
      {/* Slider + Tool group (driven by recipe) */}
      <group rotation={[0, 0, angleZ]}>
        <group position={[sliderOffset, 0, basePos.z]}>
          {/* Slider body */}
          <mesh position={[3, 0, 0]}>
            <boxGeometry args={[10, 5, 5]} />
            <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
          </mesh>
          
          {/* Tool mount - attached to slider, at inner end, same Z level */}
          <group position={[-5, 0, 0]} rotation={toolRotation}>
            <ToolMesh toolKind={config.mountedTool} />
          </group>
        </group>
      </group>
    </group>
  )
}

/**
 * Forming center indicator - cyan sphere
 */
function FormingCenter(): ReactNode {
  const [x, y, z] = VIRTUAL_EIGHT_JAW_MACHINE.formingCenter
  
  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[2, 16, 16]} />
      <meshStandardMaterial 
        color="#22d3ee" 
        emissive="#22d3ee"
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

/**
 * Feed exit indicator - green box + feed tube
 */
function FeedExit(): ReactNode {
  const [x, y, z] = VIRTUAL_EIGHT_JAW_MACHINE.feedExit
  const [dx, dy, dz] = VIRTUAL_EIGHT_JAW_MACHINE.feedDirection
  
  // Calculate rotation to align tube with feed direction
  const angleX = Math.atan2(dy, dz)
  const angleY = Math.atan2(dx, dz)
  
  return (
    <group position={[x, y, z]}>
      {/* Feed exit box */}
      <mesh>
        <boxGeometry args={[8, 8, 6]} />
        <meshStandardMaterial color="#22c55e" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Feed tube */}
      <mesh position={[dx * 15, dy * 15, dz * 15]} rotation={[angleX + Math.PI / 2, angleY, 0]}>
        <cylinderGeometry args={[2, 2, 25, 16]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Wire guide hole */}
      <mesh position={[dx * 3, dy * 3, dz * 3]}>
        <torusGeometry args={[1.5, 0.3, 8, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  )
}

/**
 * Base plate - perpendicular to Z axis
 */
function BasePlate(): ReactNode {
  return (
    <group position={[0, 0, -10]}>
      {/* Main plate */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[50, 50, 6, 32]} />
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
      </mesh>
      
      {/* Center hole rim */}
      <mesh position={[0, 0, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[12, 1.5, 8, 32]} />
        <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/**
 * Main Eight-Jaw Machine Component
 * Uses VIRTUAL_EIGHT_JAW_MACHINE configuration
 */
export function EightJawMachine(): ReactNode {
  const machine = VIRTUAL_EIGHT_JAW_MACHINE
  
  return (
    <group>
      {/* Base plate */}
      <BasePlate />
      
      {/* Forming center indicator */}
      <FormingCenter />
      
      {/* Feed exit */}
      <FeedExit />
      
      {/* All 8 jaws */}
      {machine.jaws.map((jaw) => (
        <Jaw key={jaw.id} config={jaw} />
      ))}
    </group>
  )
}

export default EightJawMachine
