import type { ChangeEvent, ReactNode } from 'react'
import { useSpringStore } from '../../store/springStore'
import { useSpringCalculation } from '../../hooks/useSpringCalculation'

export function ParameterPanel(): ReactNode {
  const params = useSpringStore((s) => s.params)
  const updateParam = useSpringStore((s) => s.updateParam)
  const calculated = useSpringCalculation()

  const handleNumberChange = (key: keyof typeof params) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      if (!Number.isNaN(value)) {
        updateParam(key as never, value as never)
      }
    }

  const handleSelectChange = (key: keyof typeof params) =>
    (e: ChangeEvent<HTMLSelectElement>) => {
      updateParam(key as never, e.target.value as never)
    }

  return (
    <div className="flex h-full flex-col gap-3 text-xs">
      <div>
        <h2 className="text-sm font-semibold text-slate-100">弹簧参数</h2>
        <p className="text-[11px] text-slate-400">
          修改几何参数后，右侧 3D 与下方机床参数/刚度会自动更新。
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="block text-slate-300">类型</span>
            <select
              value={params.type}
              onChange={handleSelectChange('type')}
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="compression">压缩</option>
              <option value="tension">拉伸</option>
              <option value="torsion">扭转</option>
              <option value="variablePitch">变节距</option>
              <option value="conical">锥形</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="block text-slate-300">左右旋</span>
            <select
              value={params.hand}
              onChange={handleSelectChange('hand')}
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="RH">右旋</option>
              <option value="LH">左旋</option>
            </select>
          </label>
        </div>

        {/* 每行：标签在左，输入框在右，避免混淆 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-slate-300">线径 d (mm)</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={params.wireDiameter}
              onChange={handleNumberChange('wireDiameter')}
              className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-slate-300">中径 Dm (mm)</span>
            <input
              type="number"
              step="0.5"
              min="1"
              value={params.meanDiameter}
              onChange={handleNumberChange('meanDiameter')}
              className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-slate-300">总圈数 N<sub>t</sub></span>
            <input
              type="number"
              step="0.5"
              min="1"
              value={params.totalCoils}
              onChange={handleNumberChange('totalCoils')}
              className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-slate-300">有效圈数 n</span>
            <input
              type="number"
              step="0.5"
              min="1"
              max={params.totalCoils}
              value={params.activeCoils}
              onChange={handleNumberChange('activeCoils')}
              className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <span className="text-[10px] text-slate-500">≤N<sub>t</sub></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-slate-300">节距 p (mm)</span>
            <input
              type="number"
              step="0.5"
              min="0"
              value={params.pitch}
              onChange={handleNumberChange('pitch')}
              className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-slate-300">自由高度 H₀ (mm)</span>
            <input
              type="number"
              step="1"
              min="1"
              value={params.freeLength}
              onChange={handleNumberChange('freeLength')}
              className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-1 rounded border border-slate-800 bg-slate-900/70 p-2 text-[11px] text-slate-200">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-semibold">计算结果</span>
        </div>
        {calculated ? (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>刚度 k</span>
              <span>{calculated.stiffnessNPerMm.toFixed(2)} N/mm</span>
            </div>
            <div className="flex justify-between">
              <span>展开长度</span>
              <span>{calculated.wireLengthMm.toFixed(1)} mm</span>
            </div>
            <div className="flex justify-between">
              <span>重量</span>
              <span>{calculated.massGrams.toFixed(1)} g</span>
            </div>
            <div className="flex justify-between">
              <span>推荐安全系数</span>
              <span>{calculated.recommendedSafetyFactor.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="text-slate-500">等待计算...</div>
        )}
      </div>
    </div>
  )
}
