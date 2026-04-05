// ==UserScript==
// @name         删除 z.ai 关闭按钮和公告
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  删除 chat.z.ai 网站上特定的 SVG 关闭按钮和公告元素
// @author       You
// @match        https://chat.z.ai/*
// @match        https://chat.z.ai/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=z.ai
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 删除目标关闭按钮的函数（仅删除右上角绝对定位的那个）
    function removeTargetSVG() {
        const buttons = document.querySelectorAll('button');

        buttons.forEach(button => {
            // 只匹配: <button class="absolute top-2 right-2 text-[#0D0D0D]/40 dark:text-white/40">...</button>
            const isTargetButton =
                button.classList.contains('absolute') &&
                button.classList.contains('top-2') &&
                button.classList.contains('right-2') &&
                button.classList.contains('text-[#0D0D0D]/40') &&
                button.classList.contains('dark:text-white/40');

            if (!isTargetButton) return;

            const svg = button.querySelector('svg.size-4[viewBox="0 0 24 24"]');
            const path = svg && svg.querySelector('path[d="M6 18 18 6M6 6l12 12"]');
            if (path) {
                button.remove();
                console.log('已删除目标关闭按钮');
            }
        });
    }

    // 删除公告元素的函数
    function removeAnnouncementElements() {
        // 删除"新产品发布"标题
        const titleDivs = document.querySelectorAll('div.font-medium.text-\\[\\#0D0D0D\\].text-sm.leading-6, div.font-medium.dark\\:text-white\\/80.text-sm.leading-6');
        titleDivs.forEach(div => {
            if (div.textContent.trim() === '新产品发布') {
                div.remove();
                console.log('已删除"新产品发布"元素');
            }
        });

        // 删除"点击进入，探索更多模型能力"描述
        const descDivs = document.querySelectorAll('div.mb-3.text-xs.leading-4');
        descDivs.forEach(div => {
            if (div.textContent.trim() === '点击进入，探索更多模型能力') {
                div.remove();
                console.log('已删除"点击进入，探索更多模型能力"元素');
            }
        });
    }

    // 统一删除函数
    function removeTargetElements() {
        removeTargetSVG();
        removeAnnouncementElements();
    }

    // 初始执行一次
    removeTargetElements();

    // 创建 MutationObserver 来监听 DOM 变化
    const observer = new MutationObserver(function(mutations) {
        removeTargetElements();
    });

    // 开始监听整个文档的变化
    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });

    console.log('油猴脚本已启动：监听并删除目标元素');
})();
