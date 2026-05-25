(function() {
const canvas = document.getElementById('inkCanvas');
if (!canvas) return;
const ctx = canvas.getContext('2d');

const THEME_COLORS = {
    light: { bg: [242, 240, 233], ink: [0, 0, 0] },
    dark: { bg: [26, 26, 26], ink: [200, 200, 200] }
};

function getThemeColors() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    return THEME_COLORS[theme] || THEME_COLORS.light;
}

let canvasWidth = 0;
let canvasHeight = 0;

function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let particles = [];
const MAX_PARTICLES = 100;
const AUTO_PARTICLE_LIMIT = 60;
const TRAIL_ALPHA = 0.08;

class InkParticle {
    constructor(x, y, size, colors, vx, vy) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.targetSize = size * (Math.random() * 2.5 + 1.5);
        this.colors = colors;
        this.opacity = Math.random() * 0.25 + 0.08;
        this.vx = vx;
        this.vy = vy;
        this.growSpeed = Math.random() * 0.4 + 0.05;
        this.fadeSpeed = Math.random() * 0.002 + 0.0008;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.size < this.targetSize) {
            this.size += this.growSpeed;
            if (this.size > this.targetSize) this.size = this.targetSize;
        }

        this.opacity -= this.fadeSpeed;
        if (this.opacity < 0) this.opacity = 0;
    }

    draw() {
        if (this.size > 0.5 && this.opacity > 0.001) {
            ctx.save();
            const blur = Math.max(1, this.size / 4);
            ctx.filter = 'blur(' + blur + 'px)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            const [r, g, b] = this.colors;
            ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + this.opacity + ')';
            ctx.fill();
            ctx.restore();
        }
    }
}

function createInk(x, y, count, isAuto) {
    if (particles.length >= MAX_PARTICLES) return;
    count = count || 1;
    const colors = getThemeColors().ink;
    const actualCount = Math.min(count, MAX_PARTICLES - particles.length);
    for (let i = 0; i < actualCount; i++) {
        let size = isAuto ? Math.random() * 8 + 3 : Math.random() * 4 + 1;
        let vx = isAuto ? (Math.random() - 0.5) * 0.3 : (Math.random() - 0.5) * 1.5;
        let vy = isAuto ? (Math.random() - 0.5) * 0.3 : (Math.random() - 0.5) * 1.5;
        particles.push(new InkParticle(x, y, size, colors, vx, vy));
    }
}

function animate() {
    const bg = getThemeColors().bg;
    ctx.fillStyle = 'rgba(' + bg[0] + ',' + bg[1] + ',' + bg[2] + ',' + TRAIL_ALPHA + ')';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let alive = 0;
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.opacity > 0) {
            alive++;
        } else {
            particles[i] = null;
        }
    }
    // Compact array
    if (alive < particles.length) {
        particles = particles.filter(Boolean);
    }

    requestAnimationFrame(animate);
}

window.createInk = createInk;
window.inkBg = {
  updateTheme: function () {}
};

let lastMove = 0;
window.addEventListener('mousemove', function(event) {
    const now = Date.now();
    if (now - lastMove < 30) return;
    lastMove = now;
    if (Math.random() > 0.75 && particles.length < MAX_PARTICLES) {
        createInk(event.clientX, event.clientY, 1, false);
    }
});

window.addEventListener('click', function(event) {
    if (particles.length < MAX_PARTICLES - 5) {
        createInk(event.clientX, event.clientY, 5, false);
    }
});

let autoTimer = null;
function startAutoInk() {
    if (autoTimer) return;
    autoTimer = setInterval(function() {
        if (particles.length < AUTO_PARTICLE_LIMIT) {
            createInk(Math.random() * canvasWidth, Math.random() * canvasHeight, 1, true);
        }
    }, 3000);
}
startAutoInk();

animate();
})();