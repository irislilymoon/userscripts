// ==UserScript==
// @name         智慧树测验解除复制限制
// @version      3.3
// @description  解除测验的复制限制
// @author       Gemini 3.1 Pro
// @match        *://*.zhihuishu.com/*
// @icon         https://qah5.zhihuishu.com/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 拦截并在页面加载前就开始伪装
    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;

    window.setInterval = function (callback, delay) {
        // 将检测间隔设为浏览器允许的最大值 2147483647 毫秒（约24.8天）
        // 注意：如果我们随便乘一个太大的数字导致总延迟超过 2147483647，
        // 按照HTML5规范，浏览器会溢出并将其当作 1 毫秒立刻执行，这就是之前过一会大概率弹出的原因
        const newDelay = (delay && delay > 500) ? 2147483647 : delay;
        return originalSetInterval(callback, newDelay);
    };
    window.setInterval.toString = function() {
        return "function setInterval() { [native code] }";
    };

    window.setTimeout = function (callback, delay) {
        // 放过一些必要的短延迟，把可能会作为反挂脚本的延迟调至最大值
        const newDelay = (delay && delay < 500) ? delay : 2147483647;
        return originalSetTimeout(callback, newDelay);
    };
    window.setTimeout.toString = function() {
        return "function setTimeout() { [native code] }";
    };

    // 立即注入解除限制的核心函数
    function unblockCopy() {
        // 覆盖获取选区方法，防止网页清空选择
        document.getSelection = function () {
            return {
                removeAllRanges: function () {}
            };
        };

        // 允许选择、复制、剪切、粘贴和右键菜单
        document.onselectstart = true;
        document.oncopy = true;
        document.oncut = true;
        document.onpaste = true;
        document.oncontextmenu = true;
    }

    // 移除3秒等待，进去就立刻注入
    unblockCopy();

    // 在文档结构加载完成以及所有资源加载完成时再分别注入一次，确保不会被网页原本后续加载的脚本覆盖
    window.addEventListener('DOMContentLoaded', unblockCopy);
    window.addEventListener('load', unblockCopy);
})();