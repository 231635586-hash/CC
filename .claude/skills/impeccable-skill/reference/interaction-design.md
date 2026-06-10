# Interaction Design（交互设计）

---

## 八种交互状态

每个交互元素需要设计所有八种状态：

| 状态 | 视觉处理 |
|-------|-----------------|
| Default | 基础样式 |
| Hover | 微妙提升、颜色变化 |
| Focus | 可见焦点环 |
| Active | 按下、更深 |
| Disabled | 降低透明度、无指针光标 |
| Loading | 旋转器或骨架屏 |
| Error | 红色边框、图标、消息 |
| Success | 绿色勾选、确认 |

**常见遗漏**：设计 hover 没有 focus，或者 vice versa。键盘用户永远不会看到 hover 状态——它们必须单独设计。

---

## 焦点环：正确做

**绝不要 `outline: none` 没有替代方案。** 这是无障碍违规。

使用 `:focus-visible` 仅对键盘导航显示焦点环（不是鼠标点击）：

```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

焦点环要求：
- 高对比度（与相邻颜色相比至少 3:1）
- 2–3px 厚
- 从元素偏移（不是内部）
- 所有交互元素一致

---

## 表单设计：不显而易见

- 始终使用显式 `<label>` 元素——占位符在输入时消失
- 在 blur 时验证（离开字段后），而不是在按键时
- 错误消息在字段下方，带 ARIA 关联（`aria-describedby`）
- 标记可选字段，而不是必填——这是一个更短的列表

**乐观更新**：立即显示成功，失败时回滚。适用于低风险操作（点赞、关注）。绝不用于支付或破坏性操作。

---

## 加载状态

**骨架屏 > 旋转器**：它们预览内容形状，感觉比通用旋转器更快。

使用上下文加载状态：
- 内容区域的内联骨架
- 表单提交按钮旋转器（也禁用按钮）
- 仅在初始页面加载时使用全页骨架
- 绝不因部分加载阻塞整个界面

---

## Modals：惰性方法

使用原生 `<dialog>` 和 `inert` 属性现在很简单：

```html
<dialog id="modal">
  <!-- content -->
</dialog>
```

背景内容上的 `inert` 属性防止焦点逃离。原 `<dialog>` 处理焦点管理、ESC 键和背景点击。

---

## Popover API

```html
<button popovertarget="tip">Help</button>
<div id="tip" popover>Helpful content</div>
```

内置好处：light-dismiss（点击外部关闭）、正确堆叠、无 z-index 战争、默认可访问。元素在顶层渲染——高于所有其他内容。

---

## 下拉菜单和覆盖层定位

**#1 下拉菜单 bug**：`overflow: hidden` 或 `overflow: auto` 容器内的 `position: absolute` 会裁剪下拉菜单。解决方案：使用 `position: fixed`、Popover API（顶层）或 portal。

**CSS Anchor Positioning**（Chrome 125+、Edge 125+）：

```css
.trigger { anchor-name: --my-trigger; }
.dropdown {
  position: fixed;
  position-anchor: --my-trigger;
  top: anchor(bottom);
  left: anchor(left);
}
```

通过 `@position-try` 块自动处理视口边缘。

**Popover + Anchor 组合**：最佳模式——结合顶层堆叠、light-dismiss、无障碍和正确定位。

**Portal/Teleport 模式**：在 React（`createPortal`）或 Vue（`<Teleport>`）中，在文档根渲染下拉菜单并用 `getBoundingClientRect()` + `position: fixed` 定位。在滚动和调整大小时重新计算。

**语义 z-index 比例**（绝不要任意值）：
```css
--z-dropdown: 100;
--z-sticky: 200;
--z-modal-backdrop: 300;
--z-modal: 400;
--z-toast: 500;
--z-tooltip: 600;
```

---

## 破坏性操作：撤销 > 确认

确认对话框被点击而没有阅读。撤销是更好的 UX：

1. 立即移除项目
2. 显示撤销 toast（5–10 秒）
3. Toast 到期后执行实际删除

仅对真正不可逆、高成本或批量操作使用确认对话框——不是常规交互。

---

## 键盘导航模式

**Roving tabindex**：对于组件组（tabs、菜单项），一次只有一个项目可 tab 访问。Tab 前进到下一个组件；箭头键在组内导航。

**Skip 链接**：为键盘用户提供跳转到内容的链接。屏幕外隐藏，获得焦点时显示：

```css
.skip-link { position: absolute; transform: translateY(-100%); }
.skip-link:focus { transform: translateY(0); }
```

---

## 手势可发现性

滑动删除和类似手势是不可见的。始终暗示它们的存在：
- **部分揭示**：显示从边缘窥视的操作按钮
- **Onboarding**：首次使用时的教练标记
- **后备**：始终提供可见的替代方案（带"删除"的菜单）

绝不要将手势作为执行操作的唯一方法。

---

## 反模式

- 移除焦点指示器而没有替代方案
- 占位符文本作为唯一的标签
- 触摸目标小于 44×44px
- 通用错误消息（"Something went wrong"）
- 没有 ARIA 角色和键盘支持的自定义控件
- 仅悬停功能（触摸用户不能悬停）
- `z-index: 9999`（使用语义比例）
- `overflow: hidden` 容器内的 `position: absolute` 下拉菜单