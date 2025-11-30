/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'
import type { SpringParameters, MaterialProperties, MachineConfig } from '../types'
import {
  calculateSpringProperties,
  generateSpringPath,
  calculateMachineParameters,
  applySpringbackCompensation
} from '../utils/springCalculations'

const demoParams: SpringParameters = {
  type: 'compression',
  wireDiameter: 2,
  meanDiameter: 16,
  outerDiameter: 18,
  innerDiameter: 14,
  activeCoils: 8,
  totalCoils: 10,
  pitch: 4,
  freeLength: 40,
  hand: 'RH',
  endType: 'closed_ground',
  variablePitch: [],
  conicalGeometry: undefined,
  designLoad: 100,
  designDeflection: 10,
  notes: 'test spring'
}

const demoMaterial: MaterialProperties = {
  name: 'SUS304',
  youngModulus: 193000,
  shearModulus: 72000,
  density: 7850,
  allowableShearStress: 600,
  allowableTensileStress: 1000,
  springbackFactor: 0.1,
  recommendedSafetyFactorRange: [1.2, 2.0]
}

const demoMachine: MachineConfig = {
  name: 'Generic-16Axis',
  type: 'Generic',
  maxFeedSpeed: 2000,
  maxCoilingRpm: 1200,
  maxPitchStroke: 50,
  maxBendAngle: 180,
  maxAcceleration: 5000,
  axes: []
}

describe('springCalculations', () => {
  it('calculateSpringProperties returns reasonable values', () => {
    const result = calculateSpringProperties(demoParams, demoMaterial)
    expect(result.stiffnessNPerMm).toBeGreaterThan(0)
    expect(result.wireLengthMm).toBeGreaterThan(0)
    expect(result.massGrams).toBeGreaterThan(0)
  })

  it('generateSpringPath respects progress', () => {
    const full = generateSpringPath(demoParams, 1)
    const half = generateSpringPath(demoParams, 0.5)
    expect(full.length).toBeGreaterThan(half.length)
    expect(full[0].x).toBeCloseTo(half[0].x, 5)
  })

  it('calculateMachineParameters does not exceed machine limits', () => {
    const result = calculateMachineParameters(demoParams, demoMachine)
    expect(result.feedSpeedMmPerSec).toBeLessThanOrEqual(demoMachine.maxFeedSpeed)
    expect(result.coilingRpm).toBeLessThanOrEqual(demoMachine.maxCoilingRpm)
  })

  it('applySpringbackCompensation reduces geometry values', () => {
    const adjusted = applySpringbackCompensation(demoParams, demoMaterial)
    expect(adjusted.outerDiameter).toBeLessThan(demoParams.outerDiameter)
    expect(adjusted.pitch).toBeLessThan(demoParams.pitch)
  })
})
