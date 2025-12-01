import type { ChangeEvent, ReactNode } from 'react'
import { useSpringStore } from '../../store/springStore'
import { useSpringCalculation } from '../../hooks/useSpringCalculation'
import type { VariablePitchSegment, ConicalGeometry } from '../../types'

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

  // 更新锥形弹簧参数
  const handleConicalChange = (field: keyof ConicalGeometry) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = field === 'fromSmallToLarge' 
        ? e.target.value === 'true'
        : Number(e.target.value)
      const newConical: ConicalGeometry = {
        smallOuterDiameter: params.conicalGeometry?.smallOuterDiameter ?? 10,
        largeOuterDiameter: params.conicalGeometry?.largeOuterDiameter ?? 20,
        fromSmallToLarge: params.conicalGeometry?.fromSmallToLarge ?? true,
        [field]: value
      }
      updateParam('conicalGeometry', newConical)
    }

  // 更新变节距弹簧参数
  const handleVariablePitchChange = (index: number, field: keyof VariablePitchSegment) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      const segments = [...(params.variablePitch ?? [])]
      if (segments[index]) {
        segments[index] = { ...segments[index], [field]: value }
        updateParam('variablePitch', segments)
      }
    }

  // 添加新的节距段
  const addPitchSegment = () => {
    const segments = [...(params.variablePitch ?? [])]
    const lastEnd = segments.length > 0 ? segments[segments.length - 1].endTurn : 0
    segments.push({
      startTurn: lastEnd,
      endTurn: lastEnd + 2,
      pitch: params.pitch
    })
    updateParam('variablePitch', segments)
  }

  // 删除节距段
  const removePitchSegment = (index: number) => {
    const segments = [...(params.variablePitch ?? [])]
    segments.splice(index, 1)
    updateParam('variablePitch', segments)
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
          {/* 标准节距 - 非变节距类型显示 */}
          {params.type !== 'variablePitch' && (
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
          )}

          {/* 锥形弹簧专属参数 */}
          {params.type === 'conical' && (
            <div className="mt-2 space-y-2 rounded border border-amber-900/50 bg-amber-950/20 p-2">
              <div className="text-[11px] font-medium text-amber-400">锥形参数</div>
              <div className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-slate-300">小端外径 (mm)</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={params.conicalGeometry?.smallOuterDiameter ?? 10}
                  onChange={handleConicalChange('smallOuterDiameter')}
                  className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-slate-300">大端外径 (mm)</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={params.conicalGeometry?.largeOuterDiameter ?? 20}
                  onChange={handleConicalChange('largeOuterDiameter')}
                  className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-slate-300">锥形方向</span>
                <select
                  value={String(params.conicalGeometry?.fromSmallToLarge ?? true)}
                  onChange={handleConicalChange('fromSmallToLarge')}
                  className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="true">小→大</option>
                  <option value="false">大→小</option>
                </select>
              </div>
            </div>
          )}

          {/* 变节距弹簧专属参数 */}
          {params.type === 'variablePitch' && (
            <div className="mt-2 space-y-2 rounded border border-green-900/50 bg-green-950/20 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-green-400">节距分段</span>
                <button
                  onClick={addPitchSegment}
                  className="rounded bg-green-700 px-2 py-0.5 text-[10px] text-white hover:bg-green-600"
                >
                  + 添加
                </button>
              </div>
              {(params.variablePitch ?? []).map((segment, idx) => (
                <div key={idx} className="flex items-center gap-1 text-[10px]">
                  <span className="text-slate-400">圈</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={segment.startTurn}
                    onChange={handleVariablePitchChange(idx, 'startTurn')}
                    className="w-12 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={segment.endTurn}
                    onChange={handleVariablePitchChange(idx, 'endTurn')}
                    className="w-12 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-slate-400">节距</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={segment.pitch}
                    onChange={handleVariablePitchChange(idx, 'pitch')}
                    className="w-14 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-slate-400">mm</span>
                  <button
                    onClick={() => removePitchSegment(idx)}
                    className="ml-1 rounded bg-red-800 px-1.5 py-0.5 text-[9px] text-white hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              {(params.variablePitch ?? []).length === 0 && (
                <div className="text-[10px] text-slate-500">点击"添加"创建节距分段</div>
              )}
            </div>
          )}

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
