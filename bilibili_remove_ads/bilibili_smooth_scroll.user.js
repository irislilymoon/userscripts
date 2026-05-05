// ==UserScript==
// @name         Bilibili 丝滑滚动无感加载
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  提前拦截并触发 Bilibili 瀑布流和懒加载，解决下滑出现灰色方块和卡顿的问题
// @author       GitHub Copilot
// @match        *://www.bilibili.com/
// @match        *://www.bilibili.com/?*
// @exclude      *://www.bilibili.com/*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 严格限制只在首页生效，避免破坏视频、专栏等其他嵌套页面的 UI 和滚动条
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        return;
    }

    console.log("[BAPI] 🚀 Bilibili 丝滑滚动无感加载 - 已切换为终极方案 (几何欺骗)");

    // 方案三核心思路：几何视觉欺骗
    // B站的 JS 脚本是通过计算 (已滚动的距离 + 屏幕可视区域的高度 >= 页面总高度 - 阈值) 来请求下一页的。
    // 我们直接劫持浏览器获取“可视区域高度”的底层接口，告诉 B站：我的屏幕比真正大 4000 像素！
    // 这样 B站 永远会提前好几屏就把数据请求回来，并把骨架屏渲染成真实视频。完全无感。

    const EXTRA_HEIGHT = 4000; // 提前加载的虚拟高度

    // 1. 劫持 window.innerHeight
    try {
        const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight') 
                                 || Object.getOwnPropertyDescriptor(Window.prototype, 'innerHeight');
        if (originalInnerHeight) {
            Object.defineProperty(window, 'innerHeight', {
                get: function() {
                    return originalInnerHeight.get.call(this) + EXTRA_HEIGHT;
                },
                configurable: true
            });
        }
    } catch (e) {
        console.warn("window.innerHeight 劫持失败", e);
    }

    // 2. 劫持 document.documentElement.clientHeight (绝大部分前端框架依赖这个)
    try {
        const originalClientHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight');
        if (originalClientHeight) {
            Object.defineProperty(document.documentElement, 'clientHeight', {
                get: function() {
                    const realHeight = originalClientHeight.get.call(this);
                    // 仅对 documentElement 放大，避免网页里其他普通的小 div 布局错乱
                    if (this === document.documentElement) {
                        return realHeight + EXTRA_HEIGHT;
                    }
                    return realHeight;
                },
                configurable: true
            });
        }
    } catch (e) {
        console.warn("clientHeight 劫持失败", e);
    }

    // 3. 兜底策略：主动分发深蹲滚动事件
    // 部分现代懒加载组件由于防抖机制，需要真正的 scroll 动作刺激
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        let currentY = window.scrollY;
        // 向下滚动时
        if (currentY > lastScrollY) {
            let maxScroll = document.documentElement.scrollHeight - window.innerHeight + EXTRA_HEIGHT;
            // 距离真正的底部还有很大距离时（利用原本闲置的网络时间提前触发）
            if (maxScroll - currentY < EXTRA_HEIGHT * 1.5) {
                // 派发一个虚假的触底事件目标，如果 B 站绑定了别的东西也能中招
                document.documentElement.dispatchEvent(new Event('scroll'));
            }
        }
        lastScrollY = currentY;
    }, { passive: true });

})();
