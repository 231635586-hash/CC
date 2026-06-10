/**
 * Apple-prototype 交互逻辑封装
 * 提供通用手势、动画、主题管理组件
 */

'use strict';

// ========================================
// 动效工具函数
// ========================================

const Easing = {
    /** Spring弹性曲线 */
    spring: (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },

    /** 弹性回弹曲线 */
    elastic: (t) => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },

    /** 平滑退出曲线 */
    smooth: (t) => 1 - Math.pow(1 - t, 3),

    /** 苹果标准曲线 */
    standard: (t) => {
        if (t < 0.5) return 2 * t * t;
        return 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
};

// ========================================
// CSS动画类
// ========================================

const Animations = {
    /** 淡入 */
    fadeIn: (el, duration = 250) => {
        el.style.opacity = '0';
        el.style.transition = `opacity ${duration}ms ease`;
        requestAnimationFrame(() => {
            el.style.opacity = '1';
        });
    },

    /** 淡出 */
    fadeOut: (el, duration = 250, onComplete) => {
        el.style.opacity = '1';
        el.style.transition = `opacity ${duration}ms ease`;
        requestAnimationFrame(() => {
            el.style.opacity = '0';
            if (onComplete) setTimeout(onComplete, duration);
        });
    },

    /** 滑入 */
    slideIn: (el, direction = 'right', duration = 300) => {
        const transforms = {
            left: 'translateX(-100%)',
            right: 'translateX(100%)',
            top: 'translateY(-100%)',
            bottom: 'translateY(100%)'
        };

        el.style.transform = transforms[direction] || transforms.right;
        el.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
        requestAnimationFrame(() => {
            el.style.transform = 'translateX(0)';
        });
    },

    /** 缩放出现 */
    scaleIn: (el, duration = 250) => {
        el.style.transform = 'scale(0.9)';
        el.style.opacity = '0';
        el.style.transition = `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
        requestAnimationFrame(() => {
            el.style.transform = 'scale(1)';
            el.style.opacity = '1';
        });
    }
};

// ========================================
// 手势处理
// ========================================

class GestureHandler {
    /**
     * @param {HTMLElement} element - 绑定手势的元素
     * @param {Object} options - 配置项
     */
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            onSwipeLeft: null,
            onSwipeRight: null,
            onSwipeUp: null,
            onSwipeDown: null,
            onLongPress: null,
            onTap: null,
            threshold: 50,
            longPressDelay: 500,
            ...options
        };

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.longPressTimer = null;
        this.isTouching = false;

        this.bindEvents();
    }

    bindEvents() {
        this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

        this.element.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.element.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.element.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.element.addEventListener('click', (e) => this.handleClick(e));
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.isTouching = true;

        if (this.options.onLongPress) {
            this.longPressTimer = setTimeout(() => {
                if (this.isTouching) this.options.onLongPress(e);
            }, this.options.longPressDelay);
        }
    }

    handleTouchMove(e) {
        if (!this.isTouching) return;
        this.touchEndX = e.touches[0].clientX;
        this.touchEndY = e.touches[0].clientY;
        this.clearLongPress();
    }

    handleTouchEnd(e) {
        if (!this.isTouching) return;
        this.isTouching = false;
        this.clearLongPress();
        this.emitSwipe();
    }

    handleMouseDown(e) {
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
        this.isTouching = true;
    }

    handleMouseMove(e) {
        if (!this.isTouching) return;
        this.touchEndX = e.clientX;
        this.touchEndY = e.clientY;
    }

    handleMouseUp(e) {
        if (!this.isTouching) return;
        this.isTouching = false;
        this.emitSwipe();
    }

    handleClick(e) {
        if (this.longPressTimer) {
            const deltaX = Math.abs(e.clientX - this.touchStartX);
            const deltaY = Math.abs(e.clientY - this.touchStartY);
            if (deltaX < 5 && deltaY < 5 && this.options.onTap) {
                this.options.onTap(e);
            }
        }
    }

    clearLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    emitSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;

        if (Math.abs(deltaX) < this.options.threshold && Math.abs(deltaY) < this.options.threshold) return;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0 && this.options.onSwipeRight) this.options.onSwipeRight(this.createEvent('swipe-right'));
            else if (deltaX < 0 && this.options.onSwipeLeft) this.options.onSwipeLeft(this.createEvent('swipe-left'));
        } else {
            if (deltaY > 0 && this.options.onSwipeDown) this.options.onSwipeDown(this.createEvent('swipe-down'));
            else if (deltaY < 0 && this.options.onSwipeUp) this.options.onSwipeUp(this.createEvent('swipe-up'));
        }
    }

    createEvent(type) {
        return { type, startX: this.touchStartX, startY: this.touchStartY, endX: this.touchEndX, endY: this.touchEndY };
    }

    destroy() {
        clearTimeout(this.longPressTimer);
    }
}

// ========================================
// 主题管理
// ========================================

class ThemeManager {
    /**
     * @param {Object} options - 配置项
     */
    constructor(options = {}) {
        this.options = {
            defaultTheme: 'dark',
            storageKey: 'prototype-theme',
            onChange: null,
            themes: ['dark', 'light'],
            ...options
        };

        this.currentTheme = this.getStoredTheme() || this.options.defaultTheme;
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
    }

    getStoredTheme() {
        try { return localStorage.getItem(this.options.storageKey); } catch { return null; }
    }

    setStoredTheme(theme) {
        try { localStorage.setItem(this.options.storageKey, theme); } catch {}
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
    }

    /** 切换主题 */
    toggle() {
        const currentIndex = this.options.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.options.themes.length;
        const newTheme = this.options.themes[nextIndex];

        this.setStoredTheme(newTheme);
        this.applyTheme(newTheme);

        if (this.options.onChange) this.options.onChange(newTheme);
        return newTheme;
    }

    /** 设置指定主题 */
    setTheme(theme) {
        if (!this.options.themes.includes(theme)) return;
        this.setStoredTheme(theme);
        this.applyTheme(theme);
        if (this.options.onChange) this.options.onChange(theme);
    }

    getTheme() { return this.currentTheme; }
}

// ========================================
// Modal弹窗
// ========================================

class Modal {
    constructor(options = {}) {
        this.options = {
            title: '',
            content: '',
            width: 400,
            maskClose: true,
            onConfirm: null,
            onCancel: null,
            ...options
        };

        this.el = null;
        this.create();
    }

    create() {
        const html = `
            <div class="modal-mask">
                <div class="modal" style="width: ${this.options.width}px;">
                    <div class="modal-header">
                        <span class="modal-title">${this.options.title}</span>
                        <span class="modal-close icon icon-md" data-close>
                            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </span>
                    </div>
                    <div class="modal-body">${this.options.content}</div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-cancel>取消</button>
                        <button class="btn btn-primary" data-confirm>确定</button>
                    </div>
                </div>
            </div>
        `;

        this.el = document.createElement('div');
        this.el.innerHTML = html;
        document.body.appendChild(this.el);

        this.el.querySelector('[data-close]').addEventListener('click', () => this.close());
        this.el.querySelector('[data-cancel]').addEventListener('click', () => {
            if (this.options.onCancel) this.options.onCancel();
            this.close();
        });
        this.el.querySelector('[data-confirm]').addEventListener('click', () => {
            if (this.options.onConfirm) this.options.onConfirm();
            this.close();
        });

        if (this.options.maskClose) {
            this.el.querySelector('.modal-mask').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.close();
            });
        }
    }

    open() {
        this.el.querySelector('.modal-mask').classList.add('open');
    }

    close() {
        const mask = this.el.querySelector('.modal-mask');
        mask.classList.remove('open');
        setTimeout(() => this.destroy(), 250);
    }

    destroy() {
        if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }
}

// ========================================
// Drawer抽屉
// ========================================

class Drawer {
    constructor(options = {}) {
        this.options = {
            title: '',
            content: '',
            placement: 'right',
            width: 320,
            onClose: null,
            ...options
        };

        this.el = null;
        this.create();
    }

    create() {
        const html = `
            <div class="drawer-mask">
                <div class="drawer" style="width: ${this.options.width}px; ${this.options.placement === 'left' ? 'left: 0; right: auto; transform: translateX(-100%);' : ''}">
                    <div class="drawer-header">
                        <span class="drawer-title">${this.options.title}</span>
                        <span class="drawer-close icon icon-md" data-close>
                            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </span>
                    </div>
                    <div class="drawer-body">${this.options.content}</div>
                    <div class="drawer-footer">
                        <button class="btn btn-secondary btn-full" data-cancel>取消</button>
                        <button class="btn btn-primary btn-full" data-confirm>确定</button>
                    </div>
                </div>
            </div>
        `;

        this.el = document.createElement('div');
        this.el.innerHTML = html;
        document.body.appendChild(this.el);

        this.el.querySelector('[data-close]').addEventListener('click', () => this.close());
        this.el.querySelector('[data-cancel]').addEventListener('click', () => {
            this.close();
        });
        this.el.querySelector('[data-confirm]').addEventListener('click', () => {
            if (this.options.onConfirm) this.options.onConfirm();
            this.close();
        });

        this.el.querySelector('.drawer-mask').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.close();
        });
    }

    open() {
        this.el.querySelector('.drawer-mask').classList.add('open');
    }

    close() {
        this.el.querySelector('.drawer-mask').classList.remove('open');
        if (this.options.onClose) this.options.onClose();
    }

    destroy() {
        if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }
}

// ========================================
// Toast轻提示
// ========================================

class Toast {
    static container = null;

    static init() {
        if (!Toast.container) {
            Toast.container = document.createElement('div');
            Toast.container.className = 'toast-container';
            document.body.appendChild(Toast.container);
        }
    }

    /**
     * 显示Toast
     * @param {string} message - 提示文字
     * @param {Object} options - 配置项
     */
    static show(message, options = {}) {
        Toast.init();

        const { type = 'info', duration = 3000, icon } = options;

        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5AC8FA" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icon || icons[type] || icons.info}</span>
            <span>${message}</span>
        `;

        Toast.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('toast-out');
                setTimeout(() => toast.remove(), 200);
            }, duration);
        }

        return toast;
    }

    /** 关闭所有Toast */
    static clear() {
        Toast.init();
        Toast.container.innerHTML = '';
    }
}

// ========================================
// Tabs标签页
// ========================================

class Tabs {
    /**
     * @param {HTMLElement|string} container - 容器元素或选择器
     * @param {Object} options - 配置项
     */
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            activeClass: 'active',
            onChange: null,
            ...options
        };

        this.init();
    }

    init() {
        this.tabs = Array.from(this.container.querySelectorAll('.tab'));
        this.panels = this.container.querySelectorAll('.tab-panel');

        this.tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => this.switchTo(index));
        });
    }

    switchTo(index) {
        this.tabs.forEach(t => t.classList.remove(this.options.activeClass));
        this.panels.forEach(p => p.classList.remove(this.options.activeClass));

        this.tabs[index].classList.add(this.options.activeClass);
        if (this.panels[index]) this.panels[index].classList.add(this.options.activeClass);

        if (this.options.onChange) this.options.onChange(index, this.tabs[index]);
    }
}

// ========================================
// Accordion手风琴
// ========================================

class Accordion {
    /**
     * @param {HTMLElement|string} container - 容器元素或选择器
     * @param {Object} options - 配置项
     */
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            activeClass: 'active',
            oneOpen: true,
            onChange: null,
            ...options
        };

        this.init();
    }

    init() {
        this.items = Array.from(this.container.querySelectorAll('.accordion-item'));

        this.items.forEach((item, index) => {
            const header = item.querySelector('.accordion-header');
            if (header) {
                header.addEventListener('click', () => this.toggle(index));
            }
        });
    }

    toggle(index) {
        const item = this.items[index];
        const isActive = item.classList.contains(this.options.activeClass);

        if (this.options.oneOpen) {
            this.items.forEach(i => i.classList.remove(this.options.activeClass));
        }

        if (isActive) {
            item.classList.remove(this.options.activeClass);
        } else {
            item.classList.add(this.options.activeClass);
            if (this.options.onChange) this.options.onChange(index, item);
        }
    }

    open(index) {
        if (this.options.oneOpen) {
            this.items.forEach(i => i.classList.remove(this.options.activeClass));
        }
        this.items[index].classList.add(this.options.activeClass);
    }

    close(index) {
        this.items[index].classList.remove(this.options.activeClass);
    }
}

// ========================================
// Dropdown下拉菜单
// ========================================

class Dropdown {
    /**
     * @param {HTMLElement} trigger - 触发器元素
     * @param {Object} options - 配置项
     */
    constructor(trigger, options = {}) {
        this.trigger = trigger;
        this.options = {
            placement: 'bottom',
            width: null,
            onSelect: null,
            ...options
        };

        this.panel = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
    }

    setContent(html) {
        this.panel = document.createElement('div');
        this.panel.className = 'dropdown-panel';
        this.panel.innerHTML = html;
        this.panel.style.position = 'absolute';

        if (this.options.width) {
            this.panel.style.width = this.options.width + 'px';
        }

        document.body.appendChild(this.panel);

        const rect = this.trigger.getBoundingClientRect();
        const placements = {
            bottom: { top: rect.bottom + 4, left: rect.left },
            top: { top: rect.top - this.panel.offsetHeight - 4, left: rect.left },
            left: { top: rect.top, left: rect.left - this.panel.offsetWidth - 4 },
            right: { top: rect.top, left: rect.right + 4 }
        };

        const pos = placements[this.options.placement] || placements.bottom;
        this.panel.style.top = pos.top + 'px';
        this.panel.style.left = pos.left + 'px';

        this.panel.querySelectorAll('[data-value]').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                if (this.options.onSelect) this.options.onSelect(value, item);
                this.close();
            });
        });

        document.addEventListener('click', this.handleOutsideClick);
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (!this.panel) this.setContent(this.trigger.dataset.content || '');
        this.panel.classList.add('open');
        this.isOpen = true;
    }

    close() {
        if (this.panel) {
            this.panel.classList.remove('open');
        }
        this.isOpen = false;
    }

    handleOutsideClick = (e) => {
        if (!this.trigger.contains(e.target) && (!this.panel || !this.panel.contains(e.target))) {
            this.close();
        }
    };

    destroy() {
        document.removeEventListener('click', this.handleOutsideClick);
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }
    }
}

// ========================================
// 导出
// ========================================

window.ApplePrototype = {
    // 动效
    Easing,
    Animations,

    // 组件类
    GestureHandler,
    ThemeManager,
    Modal,
    Drawer,
    Toast,
    Tabs,
    Accordion,
    Dropdown,

    // 版本
    version: '1.0.1'
};