// ==UserScript==
// @name         Bilibili 移除推广板块
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  移除 Bilibili 首页等页面的分类推广板块卡片（如番剧、国创、直播等），不误伤正常视频。
// @author       GitHub Copilot
// @match        *://*.bilibili.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 需要移除的推广板块关键字列表
    const promoKeywords = [
        "番剧", "游戏中心", "会员购", "漫画", "赛事", "电影", "国创", "电视剧", "综艺",
        "纪录片", "动画", "游戏", "鬼畜", "音乐", "舞蹈", "影视", "娱乐", "知识",
        "科技数码", "资讯", "美食", "小剧场", "专栏", "直播", "活动", "课堂", "社区中心",
        "新歌热榜", "汽车", "时尚美妆", "体育运动", "动物", "vlog", "绘画", "人工智能",
        "家装房产", "户外潮流", "健身", "手工", "旅游出行", "三农", "亲子", "健康",
        "情感", "生活兴趣", "生活经验", "公益", "超高清"
    ];

    function removePromotions() {
        // 查找所有板块的角标文本元素
        const floorTitles = document.querySelectorAll('.badge .floor-title');
        
        floorTitles.forEach(titleNode => {
            const titleText = titleNode.textContent.trim();
            // 如果角标文字在我们的移除清单内
            if (promoKeywords.includes(titleText)) {
                // 向上寻找到整个板块卡片的容器并删除
                const card = titleNode.closest('.floor-single-card') || titleNode.closest('.bili-feed-card');
                if (card) {
                    card.remove();
                }
            }
        });
    }

    // 页面初次加载执行
    removePromotions();

    // 监听后续动态加载的内容（如向下滚动页面时）
    const observer = new MutationObserver((mutations) => {
        let shouldRun = false;
        for (let i = 0; i < mutations.length; i++) {
            if (mutations[i].addedNodes.length > 0) {
                shouldRun = true;
                break;
            }
        }
        if (shouldRun) {
            removePromotions();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
