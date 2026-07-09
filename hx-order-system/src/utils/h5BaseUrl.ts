/**
 * 司机端 H5（mobile-h5）基础 URL（M2 跨 origin 通信锚点）
 *
 * - 开发期：mobile-h5 默认 5177 端口
 * - 生产期：通过 .env.production 配置或写死为部署域名
 *
 * 在库房后台生成"扫码入场链接"时拼接：
 *   `${H5_BASE_URL}/pages/driver/scan-in?token=${token}&snapshot=${snapshot}`
 */

export const H5_BASE_URL =
  (typeof window !== 'undefined' && (window as any).__H5_BASE_URL__) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_H5_BASE_URL) ||
  'http://localhost:5177'