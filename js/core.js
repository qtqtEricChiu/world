/* ============================================================
   mocabolka.world - Core JavaScript
   核心引擎：背景同步、光标系统、粒子系统、闪黑过渡、Dock
   ============================================================ */

/**
 * mocabolka.core - 全局核心对象
 * 初始化时自动运行背景、光标、粒子三大系统
 */
window.mocabolka = window.mocabolka || {};

(function(core) {
    'use strict';

    // ============================================================
    //  0. 初始化 — 检测设备类型 & 闪黑遮罩管理
    // ============================================================
    core.isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 768;

    var isFirstVisit = sessionStorage.getItem('site-visited') !== '1';
    var overlay = document.getElementById('initial-load-overlay');
    var isFlashTransition = sessionStorage.getItem('flash-transition') === '1';

    if (overlay) {
        if (isFirstVisit) {
            // 首次访问：CSS animation 控制渐消（base.css 中定义）
            overlay.classList.add('first-visit');
        } else if (isFlashTransition) {
            // 跨页导航到达目标页：从黑屏渐消，配合内容展现
            overlay.classList.add('fade-in');
            sessionStorage.removeItem('flash-transition');
        } else {
            // 非跨页导航（如浏览器后退）：跳过遮罩
            overlay.classList.add('skip-overlay');
        }
    }

    // 仅首次访问时播放 bg-switcher 入场动画（跨页不重复动画）
    if (isFirstVisit) {
        var switcher = document.querySelector('.bg-switcher');
        if (switcher) switcher.classList.add('animate-in');
    }

    // 标记已访问
    sessionStorage.setItem('site-visited', '1');

    // ============================================================
    //  1. 背景系统 (Bg Sync)
    // ============================================================
    core.bgs = [
        'https://s1.1ovv.com/2026/03/21/Ix6I.png',
        'https://s1.1ovv.com/2026/03/21/IxkP.png',
        'https://s1.1ovv.com/2026/03/21/I5rf.png',
        'https://s1.1ovv.com/2026/03/21/I5Wi.png'
    ];

    core.bgIndex = parseInt(sessionStorage.getItem('bg-index')) || 0;

    core.applyBg = function(index) {
        var bgEl = document.getElementById('mainBg');
        if (!bgEl) return;
        // 仅当索引不同时才更新背景图（避免重复触发浏览器重新请求）
        if (core.bgIndex !== index) {
            bgEl.style.backgroundImage = 'url("' + core.bgs[index] + '")';
        }
        sessionStorage.setItem('bg-index', index);
        core.bgIndex = index;
        var swBtns = document.querySelectorAll('.sw-btn');
        swBtns.forEach(function(btn, i) {
            btn.classList.toggle('active', i === index);
        });
    };

    core.changeBg = function(index) {
        core.applyBg(index);
    };

    // 立即应用已保存的背景
    core.applyBg(core.bgIndex);

    // ============================================================
    //  2. 光标系统 (Cursor System)
    // ============================================================
    core.cursorDot = document.getElementById('cursor-dot');
    core.cursorRing = document.getElementById('cursor-ring');

    core.mouseX = parseFloat(sessionStorage.getItem('cursor-x')) || window.innerWidth / 2;
    core.mouseY = parseFloat(sessionStorage.getItem('cursor-y')) || window.innerHeight / 2;
    core.ringX = core.mouseX;
    core.ringY = core.mouseY;
    core.isCursorActive = false;

    function updateCursorPos(e) {
        if (!core.isCursorActive) {
            if (core.cursorDot) core.cursorDot.style.opacity = '1';
            if (core.cursorRing) core.cursorRing.style.opacity = '1';
            document.body.style.cursor = 'none';
            core.isCursorActive = true;
        }
        core.mouseX = e.clientX;
        core.mouseY = e.clientY;
        if (core.cursorDot) {
            core.cursorDot.style.transform = 'translate(' + core.mouseX + 'px, ' + core.mouseY + 'px)';
        }
    }

    window.addEventListener('mousemove', updateCursorPos);

    window.addEventListener('touchstart', function() {
        core.isCursorActive = false;
        if (core.cursorDot) core.cursorDot.style.opacity = '0';
        if (core.cursorRing) core.cursorRing.style.opacity = '0';
        document.body.style.cursor = 'auto';
    });

    function renderCursor() {
        if (core.isCursorActive || sessionStorage.getItem('cursor-x')) {
            if (!core.isCursorActive) {
                if (core.cursorDot) core.cursorDot.style.opacity = '1';
                if (core.cursorRing) core.cursorRing.style.opacity = '1';
                core.isCursorActive = true;
            }
            core.ringX += (core.mouseX - core.ringX) * 0.2;
            core.ringY += (core.mouseY - core.ringY) * 0.2;
            if (core.cursorRing) {
                core.cursorRing.style.transform = 'translate(' + core.ringX + 'px, ' + core.ringY + 'px)';
            }
            if (core.cursorDot) {
                core.cursorDot.style.transform = 'translate(' + core.mouseX + 'px, ' + core.mouseY + 'px)';
            }
        }
        requestAnimationFrame(renderCursor);
    }
    renderCursor();

    // 交互元素悬浮光标效果
    function bindCursorHover() {
        document.querySelectorAll('.interactable').forEach(function(el) {
            el.addEventListener('mouseenter', function() {
                if (core.cursorDot) core.cursorDot.classList.add('hovered');
                if (core.cursorRing) core.cursorRing.classList.add('hovered');
            });
            el.addEventListener('mouseleave', function() {
                if (core.cursorDot) core.cursorDot.classList.remove('hovered');
                if (core.cursorRing) core.cursorRing.classList.remove('hovered');
            });
        });
    }
    bindCursorHover();

    // ============================================================
    //  3. 粒子系统 (Particles System)
    // ============================================================
    function initParticles() {
        var canvas = document.getElementById('particle-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var particlesArray = [];
        var activeMouse = { x: null, y: null };

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        window.addEventListener('mousemove', function(e) {
            activeMouse.x = e.clientX;
            activeMouse.y = e.clientY;
        });

        // 点击爆破效果
        window.addEventListener('click', function(e) {
            if (e.target.closest('.interactable')) return;
            var shockX = e.clientX, shockY = e.clientY;
            particlesArray.forEach(function(p) {
                var dx = p.x - shockX;
                var dy = p.y - shockY;
                var distance = Math.hypot(dx, dy) || 1;
                var force = Math.min(1200 / distance, 60);
                p.vx += (dx / distance) * force;
                p.vy += (dy / distance) * force;
                p.baseAlpha = 1;
            });
        });

        function Particle() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 0.5;
            this.baseAlpha = Math.random() * 0.6 + 0.2;
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = (Math.random() - 0.5) * 1;
            this.friction = 0.94;
        }

        Particle.prototype.draw = function() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(154, 200, 226, ' + this.baseAlpha + ')';
            ctx.fill();
        };

        Particle.prototype.update = function() {
            var speed = Math.hypot(this.vx, this.vy);
            if (speed < 3 && activeMouse.x != null && activeMouse.y != null) {
                var dx = activeMouse.x - this.x;
                var dy = activeMouse.y - this.y;
                var distance = Math.hypot(dx, dy);
                if (distance < 350) {
                    var force = (350 - distance) / 350;
                    if (distance > 40) {
                        this.vx += (dx / distance) * force * 0.5;
                        this.vy += (dy / distance) * force * 0.5;
                    } else {
                        this.vx -= (dx / distance) * force * 0.8;
                        this.vy -= (dy / distance) * force * 0.8;
                    }
                    this.vx += (-dy / distance) * force * 0.35;
                    this.vy += (dx / distance) * force * 0.35;
                    this.baseAlpha = Math.min(this.baseAlpha + 0.05, 1);
                } else {
                    this.baseAlpha = Math.max(this.baseAlpha - 0.01, 0.2);
                }
            } else {
                this.baseAlpha = Math.max(this.baseAlpha - 0.01, 0.2);
            }

            if (speed > 30) {
                this.vx = (this.vx / speed) * 30;
                this.vy = (this.vy / speed) * 30;
            }
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0) this.x = canvas.width;
            else if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            else if (this.y > canvas.height) this.y = 0;

            this.draw();
        };

        var maxParticles = Math.min(Math.floor((canvas.width * canvas.height) / 6000), 350);
        for (var i = 0; i < maxParticles; i++) {
            particlesArray.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
            }
            requestAnimationFrame(animate);
        }
        animate();
    }
    initParticles();

    // ============================================================
    //  4. 闪黑过渡 - 跨页面导航
    //    原理：
    //      离开页：overlay 播放 flashBlackOut（快速变黑 → 渐消）
    //      动画中途触发导航，浏览器开始加载新页面
    //      新页面：overlay 播放 fade-in（从黑渐消），与内容同时展现
    //    时序设计：
    //      flashBlackOut 在 0.25s 处变全黑，0.42s 开始渐消
    //      在 0.35s 处导航 — 此时画面全黑，用户看不到内容切换
    // ============================================================
    function bindPageTransition() {
        document.querySelectorAll('.page-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
                var href = link.getAttribute('href');
                if (!href) return;

                // 保存光标和背景状态
                sessionStorage.setItem('cursor-x', core.mouseX);
                sessionStorage.setItem('cursor-y', core.mouseY);
                sessionStorage.setItem('bg-index', core.bgIndex);

                // 标记：目标页面应播放闪黑入场动画
                sessionStorage.setItem('flash-transition', '1');

                // 阻止默认导航
                e.preventDefault();

                var overlay = document.getElementById('initial-load-overlay');
                if (!overlay) {
                    window.location.href = href;
                    return;
                }

                // 移除其他状态类，启动 flashBlackOut 动画
                overlay.classList.remove('first-visit', 'fade-in', 'skip-overlay');
                overlay.classList.add('flash-out');

                // 在闪黑完全覆盖画面后导航（350ms）
                setTimeout(function() {
                    window.location.href = href;
                }, 350);
            });
        });
    }
    bindPageTransition();

    // ============================================================
    //  5. Dock 面板交互
    // ============================================================
    function initDock() {
        var toggleBtn = document.getElementById('toggleBtn');
        var dockPanel = document.getElementById('dockPanel');
        if (!toggleBtn || !dockPanel) return;

        var btnSvg = toggleBtn.querySelector('svg');
        var isDockOpen = false;

        core.setDockState = function(open) {
            isDockOpen = open;
            if (isDockOpen) {
                dockPanel.classList.add('active');
                if (btnSvg) btnSvg.style.transform = 'rotate(-90deg)';
                toggleBtn.style.background = 'rgba(154, 200, 226, 0.2)';
            } else {
                dockPanel.classList.remove('active');
                if (btnSvg) btnSvg.style.transform = 'rotate(0deg)';
                toggleBtn.style.background = 'rgba(154, 200, 226, 0.03)';
            }
        };

        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            core.setDockState(!isDockOpen);
        });

        // 点击空白区域关闭 Dock
        // 排除 aboutModal 和 btn-about：当"关于我"弹窗打开时 Dock 保持展开
        document.addEventListener('click', function(e) {
            var aboutModal = document.getElementById('aboutModal');
            var btnAbout = document.getElementById('btn-about');
            if (isDockOpen &&
                !dockPanel.contains(e.target) &&
                !toggleBtn.contains(e.target) &&
                (!aboutModal || !aboutModal.contains(e.target)) &&
                (!btnAbout || !btnAbout.contains(e.target))) {
                core.setDockState(false);
            }
        });
    }
    initDock();

})(window.mocabolka);
