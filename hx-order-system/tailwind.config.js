/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
  corePlugins: { preflight: false }, // 关闭 reset，使用 antd 主题
}
