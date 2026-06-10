# UX Writing（UX 文案）

数字界面用户可见副本的实用标准。

---

## 核心规则

### 按钮标签

具体的动词+宾语组合，不是通用术语：
- "Save changes" 不是 "OK"
- "Create account" 不是 "Submit"
- "Delete 5 items" 不是 "Delete selected"（对于破坏性操作——要明确）

### 错误消息

三部分公式：发生了什么 → 为什么 → 如何修复。

"Email address isn't valid. Please include an @ symbol." — 不是 "Invalid input."

绝不责怪用户。绝不在错误状态使用感叹号。

### 空状态

引导机会，不是死胡同。承认空白 → 解释价值 → 提示操作。

"No projects yet. Create your first project to get started." + CTA 按钮。

### 确认对话框

谨慎使用。首选撤销功能——对于大多数操作它是优越的用户体验。当对话框必要时：清楚说明具体操作和后果。

---

## Voice 与 Tone

**Voice** 是你一致的品牌个性。**Tone** 适应上下文。

错误时刻需要共情、有帮助的语言——绝不是幽默。沮丧的用户需要解决方案，不是笑话。

---

## 无障碍

- 独立链接文本："View pricing plans" 不是 "click here"
- 图标按钮需要 `aria-label` 属性供屏幕阅读器使用
- Alt 文本描述内容和功能，而不是外观

---

## 术语一致性

为每个概念选择一个术语并在整个产品中强制执行。不要为同一事物混合 "workspace"/"project"/"space"。

---

## 国际化

德语文本比英语扩展约 30%—— Deliberately 分配空间。避免不会翻译的成语、文化参考和双关语。使用 Unicode 感知的字符串处理。

---

## 实用检查表

- [ ] 每个按钮标签以动词开头
- [ ] 每个错误消息说明接下来要做什么
- [ ] 占位符文本不是唯一的标签
- [ ] 链接在上下文中之外有意义
- [ ] 整个项目中一致的术语
- [ ] 没有行内定义的行话
- [ ] 破坏性操作明确说明后果