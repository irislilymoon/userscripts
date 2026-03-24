// ==UserScript==
// @name         精简 Bing 页面
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在 cn.bing.com 隐藏指定元素，简化页面显示
// @author       You
// @match        https://cn.bing.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 通过样式隐藏，避免反复删除造成布局抖动。
    const css = `
ul.scopes[role="menubar"],
#id_qrcode,
div.hp_trivia_inner[data-iid="Trivia"],
div.musCard,
button#sb_feedback,
div.moduleCont,
footer#footer {
    display: none !important;
    visibility: hidden !important;
}

/* 去掉下滑时的灰色遮罩与渐变层 */
div.dimmer,
div.shaders,
div.hp_top_cover_dim,
div.hp_media_container_gradient {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    background: transparent !important;
}
`;

    function injectStyle() {
        if (document.getElementById('tm-bing-simplify-style')) return;

        const style = document.createElement('style');
        style.id = 'tm-bing-simplify-style';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    function hideByScript() {
        const selectors = [
            'ul.scopes[role="menubar"]',
            '#id_qrcode',
            'div.hp_trivia_inner[data-iid="Trivia"]',
            'div.musCard',
            'button#sb_feedback',
            'div.moduleCont',
            'footer#footer',
            'div.dimmer',
            'div.shaders',
            'div.hp_top_cover_dim',
            'div.hp_media_container_gradient'
        ];

        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('visibility', 'hidden', 'important');
            });
        });
    }

    function run() {
        injectStyle();
        hideByScript();
    }

    run();

    const observer = new MutationObserver(() => {
        hideByScript();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
