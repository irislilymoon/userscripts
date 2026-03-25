// ==UserScript==
// @name         精简 Bing 页面
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  在 Bing 隐藏指定元素，简化页面显示
// @author       GPT-5.3-Codex
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

    // 仅在“正在输入且 Suggestions 可用”时关闭圆角；其余状态保持 24px 圆角。
    function updateSearchBoxRadiusByAutosuggestType() {
        const inputEl = document.querySelector('#sb_form_q');
        const queryText = (inputEl?.value || '').trim();
        const hasInputText = queryText.length > 0;
        const isInputFocused = document.activeElement === inputEl;
        const hasSuggestion = !!document.querySelector('#sw_as #sa_sug_block');
        const isSuggestionActive = hasSuggestion && hasInputText && isInputFocused;

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

    // 仅在“输入框聚焦 + 有输入 + Suggestions 可用”时显示建议容器。
    function updateAutosuggestContainerVisibility() {
        const inputEl = document.querySelector('#sb_form_q');
        const queryText = (inputEl?.value || '').trim();
        const hasInputText = queryText.length > 0;
        const isInputFocused = document.activeElement === inputEl;
        const hasSuggestion = !!document.querySelector('#sw_as #sa_sug_block');
        const shouldShow = hasSuggestion && hasInputText && isInputFocused;

        // 防止手动检查器隐藏类残留导致容器即使 display:block 仍不可见。
        const inspectorHideClassNames = [
            '__web-inspector-hide-shortcut__',
            'web-inspector-hide-shortcut'
        ];

        const containers = document.querySelectorAll('#sw_as .sa_as');

        containers.forEach((el) => {
            inspectorHideClassNames.forEach((cls) => el.classList.remove(cls));

            if (shouldShow) {
                el.style.setProperty('display', 'block', 'important');
                el.style.setProperty('visibility', 'visible', 'important');
            } else {
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('visibility', 'hidden', 'important');
            }
        });

        // 与 .sa_as 同步处理父容器，避免父级仍被隐藏。
        document.querySelectorAll('#sw_as').forEach((el) => {
            inspectorHideClassNames.forEach((cls) => el.classList.remove(cls));

            if (shouldShow) {
                el.style.setProperty('display', 'block', 'important');
                el.style.setProperty('visibility', 'visible', 'important');
            } else {
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('visibility', 'hidden', 'important');
            }
        });
    }

    function run() {
        injectStyle();
        hideByScript();
        updateSearchBoxRadiusByAutosuggestType();
        removeTrendingAutosuggestBlock();
        updateAutosuggestContainerVisibility();
    }

    run();

    const observer = new MutationObserver(() => {
        hideByScript();
        updateSearchBoxRadiusByAutosuggestType();
        removeTrendingAutosuggestBlock();
        updateAutosuggestContainerVisibility();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
