import type { SpringParameters } from '../spring/springTypes'

export function buildGenericSpringProgram(params: SpringParameters): string[] {
  const { meanDiameter, wireDiameter, activeCoils, pitch, type } = params
  const outerDiameter = meanDiameter + wireDiameter

  const lines: string[] = []
  lines.push('%SPRING-PROGRAM')
  lines.push(`; TYPE=${type}`)
  lines.push(`; OD=${outerDiameter.toFixed(3)} Dm=${meanDiameter.toFixed(3)} WIRE=${wireDiameter.toFixed(3)} N=${activeCoils} PITCH=${pitch.toFixed(3)}`)
  lines.push('G90 G21')
  lines.push('G92 X0 Y0 Z0 ; 参考点复位')
  lines.push('')
  lines.push('; --- 送线与卷绕 ---')
  lines.push('M03 ; 主轴启动 / 卷簧主轴')
  lines.push('G01 F1000 ; 设定进给速度')
  lines.push('')

  const turns = Math.max(activeCoils, 1)
  const step = 1
  for (let i = 0; i < turns; i += step) {
    const z = i * pitch
    lines.push(`G01 X${(outerDiameter / 2).toFixed(3)} Z${z.toFixed(3)}`)
  }

  lines.push('')
  lines.push('; --- 收尾与切断 ---')
  lines.push('M05 ; 停止主轴')
  lines.push('M10 ; 刀具切断 (示意)')
  lines.push('G00 X0 Z0')
  lines.push('M30')

  return lines
}
