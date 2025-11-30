import type { ChangeEvent } from 'react'
import { useSpringStore } from '../../store/springStore'

export function SpringParameterPanel() {
  const { params, updateParam } = useSpringStore()

  const handleNumberChange = (key: keyof typeof params) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (!Number.isNaN(value)) {
      updateParam(key, value)
    }
  }

  return (
    <div className="space-y-3 text-xs">
      <h2 className="text-sm font-semibold text-slate-100">弹簧参数</h2>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="block text-slate-300">外径 D (mm)</span>
          <input
            type="number"
            value={params.outerDiameter}
            onChange={handleNumberChange('outerDiameter')}
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-slate-300">线径 d (mm)</span>
          <input
            type="number"
            value={params.wireDiameter}
            onChange={handleNumberChange('wireDiameter')}
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-slate-300">有效圈数 n</span>
          <input
            type="number"
            value={params.activeCoils}
            onChange={handleNumberChange('activeCoils')}
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-slate-300">节距 p (mm)</span>
          <input
            type="number"
            value={params.pitch}
            onChange={handleNumberChange('pitch')}
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </label>
      </div>
      <p className="text-[10px] text-slate-500">
        当前支持简化的等节距压缩弹簧，后续可扩展拉伸/扭转/变节距/锥形等类型。
      </p>
    </div>
  )
}
