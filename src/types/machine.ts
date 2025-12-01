/**
 * Machine Types - Unified types for Eight-Jaw Machine and Spring Recipe
 * 
 * These types allow jaws and spring to share the same timeline.
 */

import type { SpringParameters } from './index'

/**
 * Jaw identifier for Eight-Jaw Machine
 * J1-J8: Individual jaws
 * FEED: Feed axis (wire feeding)
 */
export type JawId = 
  | 'J1' 
  | 'J2' 
  | 'J3' 
  | 'J4' 
  | 'J5' 
  | 'J6' 
  | 'J7' 
  | 'J8' 
  | 'FEED'

/**
 * Single keyframe for axis motion
 * Compatible with simulationStore.time scale
 */
export interface AxisKeyframe {
  /** Time in seconds (same scale as simulationStore.time) */
  time: number
  /** Position in mm (linear) or degrees (rotary) */
  position: number
  /** Optional velocity for interpolation (mm/s or deg/s) */
  velocity?: number
}

/**
 * Motion profile for a single jaw/axis
 */
export interface JawProfile {
  /** Jaw/axis identifier */
  axisId: JawId
  /** Keyframes defining the motion curve */
  keyframes: AxisKeyframe[]
  /** Optional display name */
  name?: string
  /** Optional unit (default: mm) */
  unit?: string
}

/**
 * Complete spring recipe including spring parameters and jaw motion profiles
 * This allows synchronized playback of spring forming and jaw motion
 */
export interface SpringRecipe {
  /** Unique recipe identifier */
  id: string
  /** Display name */
  name: string
  /** Spring geometric and process parameters */
  springParams: SpringParameters
  /** Motion profiles for each active jaw */
  jawProfiles: JawProfile[]
  /** Total cycle time in seconds */
  totalCycleTime?: number
  /** Optional description */
  description?: string
  /** Creation timestamp */
  createdAt?: string
  /** Last modified timestamp */
  updatedAt?: string
}

/**
 * Helper function to interpolate jaw position at a given time
 */
export function interpolateJawPosition(profile: JawProfile, time: number): number {
  const { keyframes } = profile
  
  if (keyframes.length === 0) return 0
  if (time <= keyframes[0].time) return keyframes[0].position
  if (time >= keyframes[keyframes.length - 1].time) {
    return keyframes[keyframes.length - 1].position
  }
  
  // Find the keyframe interval
  for (let i = 0; i < keyframes.length - 1; i++) {
    const k0 = keyframes[i]
    const k1 = keyframes[i + 1]
    
    if (time >= k0.time && time < k1.time) {
      // Linear interpolation
      const ratio = (time - k0.time) / (k1.time - k0.time)
      return k0.position + ratio * (k1.position - k0.position)
    }
  }
  
  return keyframes[keyframes.length - 1].position
}

/**
 * Get all jaw positions at a given time from a recipe
 */
export function getJawPositionsAtTime(
  recipe: SpringRecipe, 
  time: number
): Record<JawId, number> {
  const positions: Partial<Record<JawId, number>> = {}
  
  for (const profile of recipe.jawProfiles) {
    positions[profile.axisId] = interpolateJawPosition(profile, time)
  }
  
  // Default to 0 for any missing jaws
  const allJaws: JawId[] = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8', 'FEED']
  for (const jawId of allJaws) {
    if (positions[jawId] === undefined) {
      positions[jawId] = 0
    }
  }
  
  return positions as Record<JawId, number>
}
