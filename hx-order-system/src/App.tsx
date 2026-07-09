import { useEffect } from 'react'
import { AppRouter } from './router'
import { startGpsStream, stopGpsStream } from '@/mock/gpsStream'
import { bindGpsToDispatch } from '@/mock/gpsDispatchBridge'
import { registerCrossOriginListener } from '@/services/crossOrigin'

/**
 * 华翔订单管理系统 - 根组件（M3 阶段：GPS 自动打卡）
 *
 * 启动项（仅一次）：
 *  1. 车辆 GPS 位置流（mock 阶段用 gpsStream；真实阶段替换为 JT/T 808 接入）
 *  2. GPS → 调车单 store 桥接（边界比对入/离园）
 *  3. H5 ↔ Web 跨 origin 监听（兼容旧扫码链接）
 */
function App() {
  useEffect(() => {
    // 1) 启动位置流（5s tick）
    startGpsStream(5000)
    // 2) 启动 GPS → dispatch 桥接
    const unbind = bindGpsToDispatch()
    // 3) 注册 H5 postMessage 监听
    registerCrossOriginListener()

    return () => {
      stopGpsStream()
      unbind()
    }
  }, [])

  return <AppRouter />
}

export default App
