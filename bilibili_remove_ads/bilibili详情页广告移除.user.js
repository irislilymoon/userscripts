// ==UserScript==
// @name         Bilibili 视频详情页广告及推广移除
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  移除 Bilibili 视频详情页右侧的“小火箭推广视频”及“广告”卡片
// @author       GitHub Copilot
// @match        *://www.bilibili.com/video/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function removeAds() {
        // 1. 隐藏带有 video-card-ad-small 类的广告卡片
        const adSmallCards = document.querySelectorAll('.video-card-ad-small');
        adSmallCards.forEach(card => card.style.display = 'none');

        // 2. 隐藏带有 "广告" 文本的角标卡片
        const badgeTexts = document.querySelectorAll('.badge-text');
        badgeTexts.forEach(badge => {
            if (badge.textContent.trim() === '广告') {
                const card = badge.closest('.vcd') || badge.closest('.video-card-ad-small') || badge.closest('.bili-video-card') || badge.closest('.ad-report');
                if (card && card.style.display !== 'none') {
                    card.style.display = 'none';
                }
            }
        });

        // 3. 隐藏 id="slide_ad" 的滑动广告（通用泛化，不限于某个广告位）
        const slideAd = document.getElementById('slide_ad');
        if (slideAd) {
            slideAd.style.display = 'none';
        }

        // 4. 隐藏底部 floor 广告横幅（.ad-report.ad-floor-exp.right-bottom-banner）
        const floorAds = document.querySelectorAll('.ad-report.ad-floor-exp.right-bottom-banner');
        floorAds.forEach(ad => ad.style.display = 'none');

        // 5. 隐藏特殊推广卡片（.video-page-special-card-small，区别于正常 .video-page-card-small）
        const specialCards = document.querySelectorAll('.video-page-special-card-small');
        specialCards.forEach(card => card.style.display = 'none');

        // 6. 隐藏带有“小火箭” SVG 图标的推广视频 (充电专属/推广)
        const svgs = document.querySelectorAll('.badge-icon, .badge svg');
        svgs.forEach(svg => {
            // 小火箭的 SVG PATH 特征片段
            if (svg.innerHTML.includes('M6.079 13.1514') || svg.innerHTML.includes('11.2743 1.00196')) {
                const card = svg.closest('.vcd') || svg.closest('.bili-video-card') || svg.closest('.ad-report');
                if (card && card.style.display !== 'none') {
                    card.style.display = 'none';
                }
            }
        });
    }

    // 页面初次加载执行
    removeAds();

    // 监听后续动态加载的内容
    const observer = new MutationObserver((mutations) => {
        let shouldRun = false;
        for (let i = 0; i < mutations.length; i++) {
            if (mutations[i].addedNodes.length > 0) {
                shouldRun = true;
                break;
            }
        }
        if (shouldRun) {
            removeAds();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
