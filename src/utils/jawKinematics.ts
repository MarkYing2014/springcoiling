/**
 * Jaw Kinematics - Interpolation helpers for jaw motion
 * 
 * Pure math utilities for sampling jaw positions from SpringRecipe keyframes.
 * No React hooks or Zustand imports - just math.
 */

import type { JawId, JawProfile, SpringRecipe, AxisKeyframe } from '../types/machine'

/**
 * Sample axis position at a given time from a JawProfile
 * 
 * @param profile - The jaw profile containing keyframes
 * @param t - Time in seconds
 * @returns Position in mm (or degrees for rotary axes)
 */
export function sampleAxisPosition(profile: JawProfile, t: number): number {
  const { keyframes } = profile
  
  // No keyframes - return 0
  if (!keyframes || keyframes.length === 0) {
    return 0
  }
  
  // Before first keyframe - clamp to first position
  if (t <= keyframes[0].time) {
    return keyframes[0].position
  }
  
  // After last keyframe - clamp to last position
  if (t >= keyframes[keyframes.length - 1].time) {
    return keyframes[keyframes.length - 1].position
  }
  
  // Find surrounding keyframes and interpolate
  for (let i = 0; i < keyframes.length - 1; i++) {
    const k0: AxisKeyframe = keyframes[i]
    const k1: AxisKeyframe = keyframes[i + 1]
    
    if (t >= k0.time && t < k1.time) {
      // Linear interpolation
      const dt = k1.time - k0.time
      if (dt <= 0) {
        return k0.position
      }
      const ratio = (t - k0.time) / dt
      return k0.position + ratio * (k1.position - k0.position)
    }
  }
  
  // Fallback (should not reach here)
  return keyframes[keyframes.length - 1].position
}

/**
 * Sample a specific jaw's position at a given time from a SpringRecipe
 * 
 * @param recipe - The spring recipe containing jaw profiles
 * @param jawId - The jaw identifier (J1-J8 or FEED)
 * @param t - Time in seconds
 * @returns Position in mm, or 0 if jaw not found
 */
export function sampleJawAtTime(
  recipe: SpringRecipe | null,
  jawId: JawId,
  t: number
): number {
  // No recipe - return 0
  if (!recipe) {
    return 0
  }
  
  // Find the jaw profile
  const profile = recipe.jawProfiles.find((p) => p.axisId === jawId)
  
  // Jaw not found in recipe - return 0
  if (!profile) {
    return 0
  }
  
  return sampleAxisPosition(profile, t)
}

/**
 * Sample all jaw positions at a given time
 * 
 * @param recipe - The spring recipe
 * @param t - Time in seconds
 * @returns Record of jaw positions keyed by JawId
 */
export function sampleAllJawsAtTime(
  recipe: SpringRecipe | null,
  t: number
): Record<JawId, number> {
  const allJaws: JawId[] = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8', 'FEED']
  const positions: Record<string, number> = {}
  
  for (const jawId of allJaws) {
    positions[jawId] = sampleJawAtTime(recipe, jawId, t)
  }
  
  return positions as Record<JawId, number>
}

/**
 * Get the time range of a jaw profile
 * 
 * @param profile - The jaw profile
 * @returns [startTime, endTime] or [0, 0] if no keyframes
 */
export function getProfileTimeRange(profile: JawProfile): [number, number] {
  const { keyframes } = profile
  
  if (!keyframes || keyframes.length === 0) {
    return [0, 0]
  }
  
  return [keyframes[0].time, keyframes[keyframes.length - 1].time]
}

/**
 * Get the position range of a jaw profile
 * 
 * @param profile - The jaw profile
 * @returns [minPosition, maxPosition] or [0, 0] if no keyframes
 */
export function getProfilePositionRange(profile: JawProfile): [number, number] {
  const { keyframes } = profile
  
  if (!keyframes || keyframes.length === 0) {
    return [0, 0]
  }
  
  let min = keyframes[0].position
  let max = keyframes[0].position
  
  for (const kf of keyframes) {
    if (kf.position < min) min = kf.position
    if (kf.position > max) max = kf.position
  }
  
  return [min, max]
}
