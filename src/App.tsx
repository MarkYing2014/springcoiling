import type { ReactNode } from 'react'
import { ParameterPanel } from './components/SpringDesigner/ParameterPanel'
import { Scene3D } from './components/Scene3D/Scene3D'
import { PlaybackControls } from './components/ControlPanel/PlaybackControls'
import { MachineStatus } from './components/ControlPanel/MachineStatus'
import { CodePreview } from './components/ControlPanel/CodePreview'

function App(): ReactNode {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      overflow: 'hidden',
      backgroundColor: '#020617',
      color: '#f1f5f9'
    }}>
      {/* 顶部标题栏 - 固定高度 */}
      <header style={{ 
        padding: '8px 16px', 
        borderBottom: '1px solid #1e293b',
        flexShrink: 0
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
          CNC 卷簧机编程与 3D 仿真系统
        </h1>
      </header>

      {/* 主内容区 - 左右分栏 */}
      <main style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden'
      }}>
        {/* 左侧：参数面板 - 固定宽度 */}
        <aside style={{ 
          width: '240px', 
          flexShrink: 0,
          borderRight: '1px solid #1e293b',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          padding: '12px',
          overflowY: 'auto'
        }}>
          <ParameterPanel />
        </aside>

        {/* 右侧：3D视图 + 底部控制 */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minWidth: 0
        }}>
          {/* 3D 视图 - 占据主要空间 */}
          <div style={{ 
            flex: 1, 
            minHeight: '400px',
            borderBottom: '1px solid #1e293b'
          }}>
            <Scene3D />
          </div>

          {/* 底部控制条 - 固定高度 */}
          <div style={{ 
            height: '120px',
            display: 'flex',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            flexShrink: 0
          }}>
            <div style={{ 
              flex: 1, 
              borderRight: '1px solid #334155',
              padding: '8px',
              overflowY: 'auto'
            }}>
              <PlaybackControls />
              <MachineStatus />
            </div>
            <div style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
              <CodePreview />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
