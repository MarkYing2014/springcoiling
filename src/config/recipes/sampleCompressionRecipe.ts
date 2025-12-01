/**
 * Sample Compression Spring Recipe
 * 
 * A complete SpringRecipe demonstrating:
 * - Spring parameters for a standard compression spring
 * - Jaw motion profiles for FEED, J1 (coiling), J2 (pitch), J3 (cut)
 * 
 * Timeline (total ~10 seconds):
 * - 0.0s - 0.5s: Idle / setup
 * - 0.5s - 2.0s: First closed coils (tight pitch)
 * - 2.0s - 7.0s: Body coils (working pitch)
 * - 7.0s - 8.5s: End closed coils (tight pitch)
 * - 8.5s - 9.0s: Pre-cut
 * - 9.0s - 9.5s: Cutting
 * - 9.5s - 10.0s: Reset
 */

import type { SpringRecipe, JawProfile } from '../../types/machine'
import type { SpringParameters } from '../../types'

/**
 * Sample spring parameters
 */
const sampleSpringParams: SpringParameters = {
  type: 'compression',
  wireDiameter: 2.0,        // 2mm wire
  meanDiameter: 20.0,       // 20mm mean diameter
  outerDiameter: 22.0,      // 22mm outer
  innerDiameter: 18.0,      // 18mm inner
  activeCoils: 5,           // 5 active coils
  totalCoils: 7,            // 7 total (including end coils)
  pitch: 4.0,               // 4mm pitch for body coils
  freeLength: 28.0,         // 28mm free length
  hand: 'RH',               // Right-hand
  endType: 'closed_ground',
}

/**
 * Feed axis profile (FEED)
 * Controls wire feeding - continuous during coiling
 */
const feedProfile: JawProfile = {
  axisId: 'FEED',
  name: 'Wire Feed',
  unit: 'mm',
  keyframes: [
    { time: 0.0, position: 0 },
    { time: 0.5, position: 0 },           // Idle
    { time: 2.0, position: 15 },          // First coils (~1.5 coils worth)
    { time: 7.0, position: 95 },          // Body coils (~5 coils worth)
    { time: 8.5, position: 110 },         // End coils
    { time: 9.0, position: 110 },         // Hold during cut
    { time: 10.0, position: 110 },        // Done
  ],
}

/**
 * J1 (Coiling Pin) profile
 * Controls spring diameter - moves radially
 */
const j1Profile: JawProfile = {
  axisId: 'J1',
  name: 'Coiling Pin',
  unit: 'mm',
  keyframes: [
    { time: 0.0, position: 0 },           // Home (retracted)
    { time: 0.3, position: 8 },           // Move to forming position
    { time: 0.5, position: 10 },          // Engaged for coiling
    { time: 8.5, position: 10 },          // Hold during coiling
    { time: 9.0, position: 5 },           // Retract slightly for cut
    { time: 9.5, position: 0 },           // Retract fully
    { time: 10.0, position: 0 },          // Home
  ],
}

/**
 * J2 (Pitch Tool) profile
 * Controls pitch - radial movement to engage/disengage with wire
 * Stays at outer edge, does not penetrate spring
 */
const j2Profile: JawProfile = {
  axisId: 'J2',
  name: 'Pitch Tool',
  unit: 'mm',
  keyframes: [
    { time: 0.0, position: 0 },           // Home (retracted)
    { time: 0.5, position: 15 },          // Engage - move to working position
    { time: 8.5, position: 15 },          // Hold at working position
    { time: 9.0, position: 0 },           // Retract for cut
    { time: 10.0, position: 0 },          // Home
  ],
}

/**
 * J3 (Cutting Tool) profile
 * Cuts the wire at the end of the cycle
 * Stroke needs to reach spring (radius ~10mm from center, jaw base at 40mm)
 */
const j3Profile: JawProfile = {
  axisId: 'J3',
  name: 'Cutting Tool',
  unit: 'mm',
  keyframes: [
    { time: 0.0, position: 0 },           // Home (retracted)
    { time: 8.5, position: 0 },           // Stay retracted during coiling
    { time: 9.0, position: 20 },          // Pre-cut position (approach)
    { time: 9.2, position: 28 },          // Quick cut stroke (reach spring)
    { time: 9.4, position: 0 },           // Retract
    { time: 10.0, position: 0 },          // Home
  ],
}

/**
 * Sample Compression Spring Recipe
 * 
 * Complete recipe with spring parameters and jaw motion profiles
 */
export const SAMPLE_COMPRESSION_RECIPE: SpringRecipe = {
  id: 'sample-compression-001',
  name: 'Sample Compression Spring',
  description: 'A standard compression spring with 5 active coils, 2mm wire, 20mm mean diameter',
  springParams: sampleSpringParams,
  jawProfiles: [
    feedProfile,
    j1Profile,
    j2Profile,
    j3Profile,
  ],
  totalCycleTime: 10.0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export default SAMPLE_COMPRESSION_RECIPE
