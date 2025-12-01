/**
 * Virtual Eight-Jaw Spring Forming Machine Configuration
 * 
 * 8 jaws distributed at 45° increments around forming center (0,0,0)
 * Each jaw can mount different tools and has independent motion
 */

import type { ToolType } from '../tools/toolLibrary'

/** Single jaw configuration */
export interface JawConfig {
  /** Jaw identifier (J1-J8) */
  id: string
  /** Angular position in degrees (0, 45, 90, ..., 315) */
  angleDeg: number
  /** Base distance from center (mm) */
  baseRadius: number
  /** Direction vector pointing towards center */
  direction: [number, number, number]
  /** Maximum stroke length (mm) */
  stroke: number
  /** Default home position (mm from center) */
  defaultHome: number
  /** Currently mounted tool */
  mountedTool: ToolType
  /** Whether this jaw is active in current recipe */
  active: boolean
}

/** Machine configuration */
export interface MachineConfig {
  name: string
  jawCount: number
  jaws: JawConfig[]
  /** Forming center position */
  formingCenter: [number, number, number]
  /** Spring axis direction */
  springAxis: [number, number, number]
}

/**
 * Calculate direction vector from angle
 */
function angleToDirection(angleDeg: number): [number, number, number] {
  const rad = (angleDeg * Math.PI) / 180
  return [Math.cos(rad), Math.sin(rad), 0]
}

/**
 * Default Eight-Jaw Machine Configuration
 */
export const eightJawMachineConfig: MachineConfig = {
  name: 'Virtual Eight-Jaw Spring Former',
  jawCount: 8,
  formingCenter: [0, 0, 0],
  springAxis: [0, 0, 1], // Spring grows along +Z
  jaws: [
    {
      id: 'J1',
      angleDeg: 0,
      baseRadius: 30,
      direction: angleToDirection(180), // Points towards center
      stroke: 25,
      defaultHome: 30,
      mountedTool: 'coiling_pin',
      active: true,
    },
    {
      id: 'J2',
      angleDeg: 45,
      baseRadius: 30,
      direction: angleToDirection(225),
      stroke: 25,
      defaultHome: 30,
      mountedTool: 'pitch_tool',
      active: true,
    },
    {
      id: 'J3',
      angleDeg: 90,
      baseRadius: 30,
      direction: angleToDirection(270),
      stroke: 25,
      defaultHome: 30,
      mountedTool: 'cutting_tool',
      active: true,
    },
    {
      id: 'J4',
      angleDeg: 135,
      baseRadius: 30,
      direction: angleToDirection(315),
      stroke: 20,
      defaultHome: 30,
      mountedTool: 'guide',
      active: false,
    },
    {
      id: 'J5',
      angleDeg: 180,
      baseRadius: 30,
      direction: angleToDirection(0),
      stroke: 25,
      defaultHome: 30,
      mountedTool: 'coiling_pin',
      active: false,
    },
    {
      id: 'J6',
      angleDeg: 225,
      baseRadius: 30,
      direction: angleToDirection(45),
      stroke: 20,
      defaultHome: 30,
      mountedTool: 'idle',
      active: false,
    },
    {
      id: 'J7',
      angleDeg: 270,
      baseRadius: 30,
      direction: angleToDirection(90),
      stroke: 20,
      defaultHome: 30,
      mountedTool: 'idle',
      active: false,
    },
    {
      id: 'J8',
      angleDeg: 315,
      baseRadius: 30,
      direction: angleToDirection(135),
      stroke: 20,
      defaultHome: 30,
      mountedTool: 'guide',
      active: false,
    },
  ],
}

export default eightJawMachineConfig
