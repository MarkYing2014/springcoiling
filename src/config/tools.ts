/**
 * Tool Library - Tool definitions for Eight-Jaw Spring Forming Machine
 * 
 * This file provides a simplified tool interface for recipe/configuration use.
 * For 3D rendering details, see ./tools/toolLibrary.ts
 */

/** Tool kind enumeration */
export type ToolKind = 
  | 'idle'
  | 'coiling_pin'
  | 'pitch_tool'
  | 'cutting_tool'
  | 'guide'
  | 'custom'

/** Tool definition interface (simplified for recipe use) */
export interface SimpleToolDefinition {
  /** Tool kind identifier */
  kind: ToolKind
  /** Display name */
  name: string
  /** Offset from jaw tip to tool working point [x, y, z] in mm */
  tipOffset: [number, number, number]
  /** Pin radius for coiling pins (mm) */
  pinRadius?: number
  /** Blade width for cutting tools (mm) */
  bladeWidth?: number
  /** Custom description */
  description?: string
}

/**
 * Standard Tool Library
 */
export const TOOL_LIBRARY: SimpleToolDefinition[] = [
  {
    kind: 'coiling_pin',
    name: 'Standard Coiling Pin',
    tipOffset: [0, 0, 0],
    pinRadius: 8,
    description: '成形杆 - 控制弹簧直径',
  },
  {
    kind: 'pitch_tool',
    name: 'Pitch Tool',
    tipOffset: [0, 0, 0],
    description: '节距刀 - 控制弹簧节距',
  },
  {
    kind: 'cutting_tool',
    name: 'Cutting Tool',
    tipOffset: [0, 0, 0],
    bladeWidth: 2,
    description: '切刀 - 切断线材',
  },
  {
    kind: 'guide',
    name: 'Wire Guide',
    tipOffset: [0, 0, 0],
    description: '导向 - 引导线材',
  },
  {
    kind: 'idle',
    name: 'Idle (no tool)',
    tipOffset: [0, 0, 0],
    description: '空闲 - 无工具安装',
  },
]

/** Idle tool fallback */
const IDLE_TOOL: SimpleToolDefinition = {
  kind: 'idle',
  name: 'Idle (no tool)',
  tipOffset: [0, 0, 0],
  description: '空闲 - 无工具安装',
}

/**
 * Get tool definition by kind
 * @param kind - Tool kind to look up
 * @returns Matching tool definition, or idle tool if not found
 */
export function getToolByKind(kind: ToolKind): SimpleToolDefinition {
  const tool = TOOL_LIBRARY.find((t) => t.kind === kind)
  return tool ?? IDLE_TOOL
}

/**
 * Get all tools of a specific kind
 * @param kind - Tool kind to filter by
 * @returns Array of matching tool definitions
 */
export function getToolsByKind(kind: ToolKind): SimpleToolDefinition[] {
  return TOOL_LIBRARY.filter((t) => t.kind === kind)
}

/**
 * Check if a tool kind is valid
 * @param kind - Tool kind to check
 * @returns True if the kind exists in the library
 */
export function isValidToolKind(kind: string): kind is ToolKind {
  return ['idle', 'coiling_pin', 'pitch_tool', 'cutting_tool', 'guide', 'custom'].includes(kind)
}

export default TOOL_LIBRARY
