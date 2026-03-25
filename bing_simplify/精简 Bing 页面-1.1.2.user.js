// ==UserScript==
// @name         精简 Bing 页面
// @namespace    http://tampermonkey.net/
// @version      1.1.2
// @description  在 Bing 隐藏指定元素，简化页面显示
// @author       GPT-5.3-Codex & Gemini 3.1 Pro Preview
// @match        https://cn.bing.com/*
// @match        https://www.bing.com/*
// @match        https://bing.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 通过样式隐藏，避免反复删除造成布局抖动。
    const css = `
ul.scopes[role="menubar"],
#id_qrcode,
#id_qrcode_popup_positioner,
#id_qrcode_popup_container,
div.hp_trivia_inner[data-iid="Trivia"],
div.musCard,
div.mic_cont.icon,
div.sb_form_placeholder,
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
            '#id_qrcode_popup_positioner',
            '#id_qrcode_popup_container',
            'div.hp_trivia_inner[data-iid="Trivia"]',
            'div.musCard',
            'div.mic_cont.icon',
            'div.sb_form_placeholder',
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

        // 额外移除二维码弹层，避免被页面脚本再次激活。
        document.querySelectorAll('#id_qrcode_popup_container, #id_qrcode_popup_positioner').forEach((el) => {
            el.remove();
        });
    }

    // 仅移除“今日热点”块，保留正常的搜索建议（Suggestions）。
    function removeTrendingAutosuggestBlock() {
        // Bing 通常把“今日热点”放在 #sa_pn_block。
        document.querySelectorAll('#sw_as #sa_pn_block').forEach((el) => el.remove());

        // 兜底：按标题文本识别“今日热点”，防止结构或 id 变更。
        document.querySelectorAll('#sw_as .asSectionHeading').forEach((heading) => {
            if ((heading.textContent || '').trim() === '今日热点') {
                const block = heading.closest('#sa_pn_block, .sa_hd')?.parentElement;
                if (block) {
                    block.remove();
                }
            }
        });
    }

    // 国际站/国内站结构可能略有不同，兼容“有建议块”或“有建议项”。
    // 强制检查是否有真实的建议列表项（li），避免空容器撑开
    function hasSuggestionData() {
        const hasSugItems = !!document.querySelector('#sw_as li.sa_sg, #sw_as li[role="option"]');
        return hasSugItems;
    }

    function isElementVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    // 圆角逻辑只和 suggestion 是否“真正出现”绑定。
    function isSuggestionPanelVisible() {
        const swAs = document.querySelector('#sw_as');
        const saAs = document.querySelector('#sw_as .sa_as');
        return isElementVisible(swAs) && isElementVisible(saAs) && hasSuggestionData();
    }

    // 仅在 suggestion 面板有效时关闭圆角；其余状态保持 24px 圆角。
    function updateSearchBoxRadiusByAutosuggestType() {
        const isSuggestionActive = isSuggestionPanelVisible();

        const targets = document.querySelectorAll(
            '.sbox .sb_form.as_show, .sbox_cn .sb_form.as_show, .sbox_sl .sb_form.as_show, .sbox .sb_form.c_show_form.as_show, .sbox_cn .sb_form.c_show_form.as_show, .sbox_sl .sb_form.c_show_form.as_show, .sbox_sl .sb_form.as_show.c_text, .sbox_sl .sb_form.as_show.c_show_form_expanded, .sbox_sl .sb_form.c_show_form.as_show.c_text, .sbox_sl .sb_form.c_show_form.as_show.c_show_form_expanded'
        );

        targets.forEach((el) => {
            if (isSuggestionActive) {
                el.style.removeProperty('border-radius');
            } else {
                el.style.setProperty('border-radius', '24px', 'important');
            }
        });
    }

    // 仅做清理与空状态隐藏，避免原本“今日热点”被删后遗留空白阴影条。
    function updateAutosuggestContainerVisibility() {
        // 防止手动检查器隐藏类残留导致容器即使 display:block 仍不可见。
        const inspectorHideClassNames = [
            '__web-inspector-hide-shortcut__',
            'web-inspector-hide-shortcut'
        ];

        const containers = document.querySelectorAll('#sw_as .sa_as');

        containers.forEach((el) => {
            inspectorHideClassNames.forEach((cls) => el.classList.remove(cls));
        });

        // 与 .sa_as 同步清理父容器残留隐藏类。
        document.querySelectorAll('#sw_as').forEach((el) => {
            inspectorHideClassNames.forEach((cls) => el.classList.remove(cls));
        });

        // 隐藏没有真实建议项时残留的高度/阴影条
        // !!! 绝对不能用 display: none，因为 Bing 的原生联想脚本会测量布局尺寸，强行 display:none 会导致脚本执行中断、联想功能彻底死掉 !!!
        const swAs = document.querySelector('#sw_as');
        const saAs = document.querySelector('#sw_as .sa_as');

        if (swAs && saAs) {
            if (hasSuggestionData()) {
                saAs.style.removeProperty('opacity');
                saAs.style.removeProperty('visibility');
                saAs.style.removeProperty('pointer-events');
            } else {
                // 不阻断 DOM 的结构，仅视觉隐身，让 Bing 得以顺利插入下拉项
                saAs.style.setProperty('opacity', '0', 'important');
                saAs.style.setProperty('visibility', 'hidden', 'important');
                saAs.style.setProperty('pointer-events', 'none', 'important');
            }
        }
    }

    let isApplying = false;

    function applyState() {
        if (isApplying) return;
        isApplying = true;
        try {
            hideByScript();
            removeTrendingAutosuggestBlock();
            updateAutosuggestContainerVisibility();
            updateSearchBoxRadiusByAutosuggestType();
        } finally {
            isApplying = false;
        }
    }

    function run() {
        injectStyle();
        applyState();
    }

    run();

    let syncPending = false;
    function scheduleSync() {
        if (syncPending) return;
        syncPending = true;

        // 先立即同步，减少可感知延迟；下一帧再复核一次处理异步渲染。
        applyState();
        requestAnimationFrame(() => {
            syncPending = false;
            applyState();
        });
    }

    const inputEl = document.querySelector('#sb_form_q');
    if (inputEl) {
        ['focus', 'blur', 'input', 'keyup'].forEach((evt) => {
            inputEl.addEventListener(evt, scheduleSync, true);
        });
    }

    document.addEventListener('click', scheduleSync, true);

    const observer = new MutationObserver(() => {
        if (isApplying) return;
        scheduleSync();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'aria-expanded']
    });
})();
