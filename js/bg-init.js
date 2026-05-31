/* ============================================================
   mocabolka.world - Background Init (Pre-DOM)
   必须在 DOM 渲染前执行，防止背景闪烁
   1. 预加载所有背景图到浏览器缓存（避免跨页重新加载）
   2. 直接写入 style 标签设置背景图
   ============================================================ */
(function() {
    var bgs = [
        'https://s1.1ovv.com/2026/03/21/Ix6I.png',
        'https://s1.1ovv.com/2026/03/21/IxkP.png',
        'https://s1.1ovv.com/2026/03/21/I5rf.png',
        'https://s1.1ovv.com/2026/03/21/I5Wi.png'
    ];

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
