// ==UserScript==
// @name         Bilibili 移除推广视频和广告
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  移除 Bilibili 首页及其他页面的推广视频和广告，以及反广告拦截提示框和冗余板块选择栏
// @author       GitHub Copilot
// @match        *://*.bilibili.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function removeAds() {
        // 1. 查找并删除带有“广告”标签的视频卡片
        // 获取所有可能的视频卡片容器
        const feedCards = document.querySelectorAll('.feed-card, .bili-feed-card');
        feedCards.forEach(card => {
            let isAd = false;
            
            // 查找卡片内部的统计文本元素，通过文字“广告”判断
            const statsTexts = card.querySelectorAll('.bili-video-card__stats--text');
            for (let i = 0; i < statsTexts.length; i++) {
                if (statsTexts[i].textContent.trim() === '广告') {
                    isAd = true;
                    break;
                }
            }

            // 查找卡片内部的 SVG 推广图标判断（B站现在使用 SVG 绘制推广相关的标签）
            if (!isAd) {
                const svgs = card.querySelectorAll('.bili-video-card__stats svg.vui_icon.bili-video-card__stats--icon path');
                for (let i = 0; i < svgs.length; i++) {
                    const d = svgs[i].getAttribute('d');
                    if (d && d.startsWith('M16.9122')) { // 匹配推广视频特征图标的 path
                        isAd = true;
                        break;
                    }
                }
            }

            if (isAd) {
                card.remove();
            }
        });

        // 2. 查找并删除反广告拦截弹窗
        const adblockTips = document.querySelectorAll('.adblock-tips');
        adblockTips.forEach(tip => {
            tip.remove();
        });

        // 3. 查找并删除顶部固定频道区
        const fixedChannels = document.querySelectorAll('.header-channel-fixed');
        fixedChannels.forEach(channel => {
            channel.remove();
        });
    }

    // 初始运行一次
    removeAds();

    // 监听后续动态加载的内容
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                removeAds();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
