/**
 * Virtual Eight-Jaw Spring Forming Machine Configuration
 * 
 * Layout: 8 jaws distributed at 45° increments around Y-axis
 * Forming center at origin, spring grows along +Z
 */

import type { ToolKind } from '../tools'

/** Jaw identifier type */
export type JawId = 'J1' | 'J2' | 'J3' | 'J4' | 'J5' | 'J6' | 'J7' | 'J8'

/** Single jaw configuration (virtual machine) */
export interface VirtualJawConfig {
  /** Jaw identifier */
  id: JawId
  /** Motion type (currently only linear supported) */
  motionType: 'linear'
  /** Base position [x, y, z] in mm */
  basePosition: [number, number, number]
  /** Direction vector pointing towards forming center */
  baseDirection: [number, number, number]
  /** Stroke limits { min, max } in mm */
  stroke: { min: number; max: number }
  /** Default home position in mm */
  defaultHome: number
  /** Mounted tool kind */
  mountedTool: ToolKind
}

/** Machine configuration (virtual machine) */
export interface VirtualMachineConfig {
  /** Machine identifier */
  id: string
  /** Display name */
  name: string
  /** Forming center position [x, y, z] */
  formingCenter: [number, number, number]
  /** Wire feed exit point [x, y, z] */
  feedExit: [number, number, number]
  /** Wire feed direction vector */
  feedDirection: [number, number, number]
  /** Jaw configurations */
  jaws: VirtualJawConfig[]
}

/** Machine layout constants */
const RADIUS = 40
const JAW_ANGLES_DEG = [0, 45, 90, 135, 180, 225, 270, 315]

/** Tool assignments for each jaw */
const JAW_TOOLS: Record<JawId, ToolKind> = {
  J1: 'coiling_pin',
  J2: 'pitch_tool',
  J3: 'cutting_tool',
  J4: 'guide',
  J5: 'guide',
  J6: 'guide',
  J7: 'guide',
  J8: 'guide',
}

/**
 * Calculate base position from angle (around Z-axis)
 * Jaws arranged in X-Y plane, spring grows along +Z
 * @param angleDeg - Angle in degrees
 * @param radius - Distance from center
 */
function calculateBasePosition(angleDeg: number, radius: number): [number, number, number] {
  const rad = (angleDeg * Math.PI) / 180
  // Jaws arranged in X-Y plane, around Z-axis
  return [
    radius * Math.cos(rad),
    radius * Math.sin(rad),
    0,
  ]
}

/**
 * Calculate direction vector pointing towards center
 * @param angleDeg - Angle in degrees
 */
function calculateBaseDirection(angleDeg: number): [number, number, number] {
  const rad = (angleDeg * Math.PI) / 180
  // Direction points inward (towards center) in X-Y plane
  return [
    -Math.cos(rad),
    -Math.sin(rad),
    0,
  ]
}

/**
 * Generate jaw configurations
 */
function generateJawConfigs(): VirtualJawConfig[] {
  return JAW_ANGLES_DEG.map((angleDeg, index) => {
    const jawId = `J${index + 1}` as JawId
    return {
      id: jawId,
      motionType: 'linear' as const,
      basePosition: calculateBasePosition(angleDeg, RADIUS),
      baseDirection: calculateBaseDirection(angleDeg),
      stroke: { min: 0, max: 25 },
      defaultHome: 0,
      mountedTool: JAW_TOOLS[jawId],
    }
  })
}

/**
 * Virtual Eight-Jaw Spring Forming Machine
 * 
 * Layout (top view, looking down -Y):
 * 
 *              J3 (90°)
 *               │
 *     J4 (135°) │  J2 (45°)
 *         ╲     │     ╱
 *          ╲    │    ╱
 *   J5 ─────────●───────── J1 (0°)
 *  (180°)      │╱╲
 *         ╱    │    ╲
 *     J6 (225°)│  J8 (315°)
 *               │
 *              J7 (270°)
 * 
 * Coordinate system:
 * - Forming center at origin (0,0,0)
 * - Wire feeds from -Z direction
 * - Spring grows along +Z
 * - Jaws arranged in X-Z plane
 */
export const VIRTUAL_EIGHT_JAW_MACHINE: VirtualMachineConfig = {
  id: 'virtual-eight-jaw',
  name: 'Virtual Eight-Jaw Spring Former',
  formingCenter: [0, 0, 0],
  feedExit: [0, 0, -50],
  feedDirection: [0, 0, 1],
  jaws: generateJawConfigs(),
}

export default VIRTUAL_EIGHT_JAW_MACHINE
