import { useSpringStore } from '../../store/springStore'
import { buildGenericSpringProgram } from '../../modules/gcode/genericSpringProgram'

export function ProgramPreviewPanel() {
  const { params } = useSpringStore()
  const program = buildGenericSpringProgram(params)

  return (
    <div className="flex h-full flex-col border-t border-slate-800/60">
      <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-300">
        <span className="font-medium">机床程序预览 (Generic)</span>
        <span className="text-[10px] text-slate-500">后续可切换 WAFIOS / Itaya / 自定义</span>
      </div>
      <pre className="flex-1 overflow-auto bg-slate-950 px-3 py-2 text-[10px] leading-relaxed text-emerald-200/90">
        {program.join('\n')}
      </pre>
    </div>
  )
}
