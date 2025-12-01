/**
 * Tool Library for Eight-Jaw Spring Forming Machine
 * 
 * Defines tool types and their geometry for 3D rendering
 */

/** Available tool types */
export type ToolType = 
  | 'coiling_pin'    // 成形杆 - controls spring diameter
  | 'pitch_tool'     // 节距刀 - controls pitch
  | 'cutting_tool'   // 切刀 - cuts the wire
  | 'guide'          // 导向 - guides wire
  | 'idle'           // 空闲 - no tool mounted

/** Tool geometry for 3D rendering */
export interface ToolGeometry {
  type: 'cylinder' | 'box' | 'cone'
  /** Dimensions [width/radius, height/length, depth] */
  dimensions: [number, number, number]
  /** Rotation in radians [x, y, z] */
  rotation?: [number, number, number]
}

/** Tool definition */
export interface ToolDefinition {
  id: ToolType
  name: string
  /** Display color */
  color: string
  /** Emissive color when active */
  emissiveColor: string
  /** Offset from jaw tip to tool working point */
  tipOffset: number
  /** Tool geometry for rendering */
  geometry: ToolGeometry
  /** Metalness for material */
  metalness: number
  /** Roughness for material */
  roughness: number
}

/**
 * Tool Library - all available tools
 */
export const toolLibrary: Record<ToolType, ToolDefinition> = {
  coiling_pin: {
    id: 'coiling_pin',
    name: '成形杆',
    color: '#facc15',      // Yellow
    emissiveColor: '#fbbf24',
    tipOffset: 3,
    geometry: {
      type: 'cylinder',
      dimensions: [1.5, 8, 1.5],  // radius, height, radius
      rotation: [Math.PI / 2, 0, 0],
    },
    metalness: 0.8,
    roughness: 0.2,
  },
  pitch_tool: {
    id: 'pitch_tool',
    name: '节距刀',
    color: '#10b981',      // Green
    emissiveColor: '#34d399',
    tipOffset: 4,
    geometry: {
      type: 'box',
      dimensions: [3, 6, 4],
      rotation: [0, 0, Math.PI / 6],
    },
    metalness: 0.7,
    roughness: 0.25,
  },
  cutting_tool: {
    id: 'cutting_tool',
    name: '切刀',
    color: '#ef4444',      // Red
    emissiveColor: '#f87171',
    tipOffset: 2,
    geometry: {
      type: 'box',
      dimensions: [1.5, 6, 3],
      rotation: [0, 0, Math.PI / 4],
    },
    metalness: 0.85,
    roughness: 0.15,
  },
  guide: {
    id: 'guide',
    name: '导向',
    color: '#8b5cf6',      // Purple
    emissiveColor: '#a78bfa',
    tipOffset: 2,
    geometry: {
      type: 'cylinder',
      dimensions: [2, 5, 2],
      rotation: [0, Math.PI / 2, 0],
    },
    metalness: 0.6,
    roughness: 0.3,
  },
  idle: {
    id: 'idle',
    name: '空闲',
    color: '#64748b',      // Gray
    emissiveColor: '#94a3b8',
    tipOffset: 0,
    geometry: {
      type: 'cylinder',
      dimensions: [1, 3, 1],
      rotation: [Math.PI / 2, 0, 0],
    },
    metalness: 0.4,
    roughness: 0.5,
  },
}

/**
 * Get tool definition by type
 */
export function getTool(toolType: ToolType): ToolDefinition {
  return toolLibrary[toolType]
}

export default toolLibrary
