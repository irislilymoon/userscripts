// ==UserScript==
// @name         校园网自动登录
// @match        http://10.0.0.55/srun_portal_pc?*
// @grant        none
// ==/UserScript==

(function() {
    var maxWait = 30; // 最大等待秒数
    var interval = setInterval(function() {
        var btn = document.querySelector('#login');
        if (btn) {
            btn.click();
            clearInterval(interval); // 点击成功，退出脚本
        } else {
            maxWait--;
            if (maxWait <= 0) clearInterval(interval); // 超时未找到，退出脚本
        }
    }, 1000);
})();