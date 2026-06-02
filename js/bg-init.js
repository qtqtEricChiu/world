/* ============================================================
   mocabolka.world - Background Init (Pre-DOM)
   必须在 DOM 渲染前执行，防止背景闪烁
   1. 从 localStorage 读取全站统一背景列表（优先）
   2. 预加载所有背景图到浏览器缓存（避免跨页重新加载）
   3. 直接写入 style 标签设置背景图
   ============================================================ */
(function() {
    var DEFAULT_BGS = [
        'https://s1.1ovv.com/2026/03/21/Ix6I.png',
        'https://s1.1ovv.com/2026/03/21/IxkP.png',
        'https://s1.1ovv.com/2026/03/21/I5rf.png',
        'https://s1.1ovv.com/2026/03/21/I5Wi.png',
        'https://s1.1ovv.com/2026/06/02/qDcv.png',
        'https://s1.1ovv.com/2026/06/02/qDHn.jpeg',
        'https://s1.1ovv.com/2026/06/02/qSdF.jpeg'
    ];

    // 优先从 localStorage 读取全站统一的背景列表
    var bgs = DEFAULT_BGS;
    var stored = localStorage.getItem('mocabolka_bg_list');
    if (stored) {
        try {
            var parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length === 4) {
                bgs = parsed;
            }
        } catch (e) {}
    }

    // 预加载所有背景图片到浏览器缓存
    // 使用 new Image() 确保浏览器提前下载并缓存
    for (var i = 0; i < bgs.length; i++) {
        (new Image()).src = bgs[i];
    }

    var savedIndex = sessionStorage.getItem('bg-index');
    if (savedIndex === null) {
        savedIndex = Math.floor(Math.random() * bgs.length);
        sessionStorage.setItem('bg-index', savedIndex);
    }
    document.write('<style>#mainBg{background-image:url(\'' + bgs[savedIndex] + '\')}</style>');
})();
