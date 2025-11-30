import type { ReactNode } from 'react'

export function CodePreview(): ReactNode {
  return (
    <div className="flex h-full flex-col border-l border-slate-800/60">
      <div className="px-3 py-1.5 text-xs text-slate-300">G 代码预览 (占位)</div>
      <pre className="flex-1 overflow-auto bg-slate-950/80 px-3 py-2 text-[10px] text-emerald-200/80">
        {`(后续将调用 generateGCode 实时生成机床程序...)`}
      </pre>
    </div>
  )
}
