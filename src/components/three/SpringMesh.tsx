import { useMemo } from 'react'
import { CatmullRomCurve3, Vector3 } from 'three'
import { useSpringStore } from '../../store/springStore'

export function SpringMesh() {
  const { params } = useSpringStore()

  const curvePoints = useMemo(() => {
    const { outerDiameter, wireDiameter, activeCoils, pitch } = params
    const radius = outerDiameter / 2 - wireDiameter / 2
    const turns = Math.max(activeCoils, 1)
    const segmentsPerTurn = 32
    const totalSegments = Math.max(Math.round(turns * segmentsPerTurn), 16)

    const pts: Vector3[] = []
    for (let i = 0; i <= totalSegments; i += 1) {
      const t = i / totalSegments
      const angle = t * turns * Math.PI * 2
      const x = radius * Math.cos(angle)
      const y = t * turns * pitch
      const z = radius * Math.sin(angle)
      pts.push(new Vector3(x, y, z))
    }
    return pts
  }, [params])

  const curve = useMemo(() => new CatmullRomCurve3(curvePoints), [curvePoints])

  return (
    <group position={[0, -20, 0]}>
      <mesh rotation-x={Math.PI / 2} position={[0, curvePoints.at(-1)?.y ? curvePoints.at(-1)!.y / 2 : 0, 0]}>
        <tubeGeometry args={[curve, curvePoints.length * 2, params.wireDiameter / 2, 12, false]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.2} roughness={0.35} />
      </mesh>
    </group>
  )
}
