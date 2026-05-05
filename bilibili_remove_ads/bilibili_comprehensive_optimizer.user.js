// ==UserScript==
// @name         Bilibili 综合增强：无推广与丝滑滚动
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  合并去除推广板块、移除各处广告，以及首页无感丝滑滚动
// @author       GitHub Copilot
// @match        *://*.bilibili.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 基于 pathname 进行严谨的页面级路由诊断
    const pathname = window.location.pathname;
    const isHomePage = (pathname === '/' || pathname === '/index.html');
    const isVideoPage = pathname.startsWith('/video/');

    // ==========================================
    // 模块 1：首页丝滑滚动 (必须在 document-start 同步拦截)
    // ==========================================
    if (isHomePage) {
        console.log("[BAPI] 🚀 Bilibili 丝滑滚动无感加载 - 已激活 (几何欺骗)");
        const EXTRA_HEIGHT = 4000;

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

        try {
            const originalClientHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight');
            if (originalClientHeight) {
                Object.defineProperty(document.documentElement, 'clientHeight', {
                    get: function() {
                        const realHeight = originalClientHeight.get.call(this);
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

        let lastScrollY = 0;
        window.addEventListener('scroll', () => {
            let currentY = window.scrollY;
            if (currentY > lastScrollY) {
                let maxScroll = document.documentElement.scrollHeight - window.innerHeight + EXTRA_HEIGHT;
                if (maxScroll - currentY < EXTRA_HEIGHT * 1.5) {
                    document.documentElement.dispatchEvent(new Event('scroll'));
                }
            }
            lastScrollY = currentY;
        }, { passive: true });
    } else {
        console.log("[BAPI] 非首页环境，丝滑滚动模块关闭，防止页面滚动轴及布局错乱。");
    }

    // ==========================================
    // 模块 2：全局去除推广板块 (原 remove_promotions)
    // ==========================================
    const promoKeywords = [
        "番剧", "游戏中心", "会员购", "漫画", "赛事", "电影", "国创", "电视剧", "综艺",
        "纪录片", "动画", "游戏", "鬼畜", "音乐", "舞蹈", "影视", "娱乐", "知识",
        "科技数码", "资讯", "美食", "小剧场", "专栏", "直播", "活动", "课堂", "社区中心",
        "新歌热榜", "汽车", "时尚美妆", "体育运动", "动物", "vlog", "绘画", "人工智能",
        "家装房产", "户外潮流", "健身", "手工", "旅游出行", "三农", "亲子", "健康",
        "情感", "生活兴趣", "生活经验", "公益", "超高清"
    ];
    function removePromotions() {
        const floorTitles = document.querySelectorAll('.badge .floor-title');
        floorTitles.forEach(titleNode => {
            const titleText = titleNode.textContent.trim();
            if (promoKeywords.includes(titleText)) {
                const card = titleNode.closest('.floor-single-card') || titleNode.closest('.bili-feed-card');
                if (card) {
                    card.remove();
                }
            }
        });
    }

    // ==========================================
    // 模块 3：全局移除各类主板广告 (原 remove_ads)
    // ==========================================
    function removeAdsGlobal() {
        const feedCards = document.querySelectorAll('.feed-card, .bili-feed-card');
        feedCards.forEach(card => {
            let isAd = false;
            const statsTexts = card.querySelectorAll('.bili-video-card__stats--text');
            for (let i = 0; i < statsTexts.length; i++) {
                if (statsTexts[i].textContent.trim() === '广告') {
                    isAd = true;
                    break;
                }
            }
            if (!isAd) {
                const svgs = card.querySelectorAll('.bili-video-card__stats svg.vui_icon.bili-video-card__stats--icon path');
                for (let i = 0; i < svgs.length; i++) {
                    const d = svgs[i].getAttribute('d');
                    if (d && d.startsWith('M16.9122')) {
                        isAd = true;
                        break;
                    }
                }
            }
            if (isAd) card.remove();
        });

        const adblockTips = document.querySelectorAll('.adblock-tips');
        adblockTips.forEach(tip => tip.remove());

        const fixedChannels = document.querySelectorAll('.header-channel-fixed');
        fixedChannels.forEach(channel => channel.remove());
    }

    // ==========================================
    // 模块 4：视频详情页专属广告清理 (原 detail_ads)
    // ==========================================
    function removeAdsDetail() {
        // 因在 CSS 加载时就隐藏可能会好一点，所以这里全部使用 style.display = 'none' 处理
        const adSmallCards = document.querySelectorAll('.video-card-ad-small');
        adSmallCards.forEach(card => card.style.display = 'none');

        const badgeTexts = document.querySelectorAll('.badge-text');
        badgeTexts.forEach(badge => {
            if (badge.textContent.trim() === '广告') {
                const card = badge.closest('.vcd') || badge.closest('.video-card-ad-small') || badge.closest('.bili-video-card') || badge.closest('.ad-report');
                if (card && card.style.display !== 'none') {
                    card.style.display = 'none';
                }
            }
        });

        const svgs = document.querySelectorAll('.badge-icon, .badge svg');
        svgs.forEach(svg => {
            if (svg.innerHTML.includes('M6.079 13.1514') || svg.innerHTML.includes('11.2743 1.00196')) {
                const card = svg.closest('.vcd') || svg.closest('.bili-video-card') || svg.closest('.ad-report');
                if (card && card.style.display !== 'none') {
                    card.style.display = 'none';
                }
            }
        });
    }

    // ==========================================
    // DOM 元素监控分发器（综合调度）
    // ==========================================
    function runDOMTasks() {
        removePromotions();
        removeAdsGlobal();
        if (isVideoPage) {
            removeAdsDetail();
        }
    }

    function initDOMObserver() {
        // 初次加载时运行一轮
        runDOMTasks();

        // 将之前分散在各脚本的 mutation observer 合并为一个单例观测器
        const observer = new MutationObserver((mutations) => {
            let shouldRun = false;
            for (let i = 0; i < mutations.length; i++) {
                if (mutations[i].addedNodes.length > 0) {
                    shouldRun = true;
                    break;
                }
            }
            if (shouldRun) {
                runDOMTasks();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ==========================================
    // 生命周期初始化
    // ==========================================
    // 因为 `@run-at document-start`，此时 document.body 不一定存在，
    // 所以底层 API 的劫持直接执行（模块1），但 DOM 节点的扫描必须等到 DOMContentLoaded
    if (document.body) {
        initDOMObserver();
    } else {
        window.addEventListener('DOMContentLoaded', initDOMObserver);
    }

})();