/**
 * 司机端 H5（mobile-h5）基础 URL（v0.2.0-M2 跨 origin 通信锚点）
 *
 * - 开发期：mobile-h5 默认 5181 端口（HX 矩阵约定，原 5174 已让位给移动端原型静态服务）
 * - 生产期：通过 .env.production 配置或写死为部署域名
 *
 * 用途：
 *  - PC 端生成客户签收链接（订单详情页"生成签收链接"按钮）
 *  - PC 端跨 origin 通信锚点（postMessage targetOrigin）
 *
 * 配置优先级：
 *  1. window.__H5_BASE_URL__（运行时注入，备用）
 *  2. import.meta.env.VITE_H5_URL（Vite 环境变量，与 MainLayout 一致）
 *  3. 默认值 'http://localhost:5181/'
 */

export const H5_BASE_URL =
  (typeof window !== 'undefined' && (window as any).__H5_BASE_URL__) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_H5_URL) ||
  'http://localhost:5181/'