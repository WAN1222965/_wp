const canvas = document.getElementById('inkCanvas');
const ctx = canvas.getContext('2d');

const THEME_COLORS = {
    light: { bg: [242, 240, 233], ink: [0, 0, 0] },
    dark: { bg: [26, 26, 26], ink: [200, 200, 200] }
};

function getThemeColors() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    return THEME_COLORS[theme] || THEME_COLORS.light;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let particles = [];

class InkParticle {
    constructor(x, y, size, colors, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.targetSize = size * (Math.random() * 3 + 2);
        this.colors = colors;
        this.opacity = Math.random() * 0.3 + 0.1;
        this.vx = velocityX || (Math.random() - 0.5) * 0.5;
        this.vy = velocityY || (Math.random() - 0.5) * 0.5;
        this.growSpeed = Math.random() * 0.5 + 0.1;
        this.fadeSpeed = Math.random() * 0.002 + 0.001;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.size < this.targetSize) {
            this.size += this.growSpeed;
        }

        this.opacity -= this.fadeSpeed;
        if (this.opacity < 0) this.opacity = 0;
    }

    draw() {
        ctx.save();
        ctx.filter = `blur(${this.size / 3}px)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

        const [r, g, b] = this.colors;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
        ctx.fill();
        ctx.restore();
    }
}

function createInk(x, y, count = 1, isAuto = false) {
    const colors = getThemeColors().ink;
    for (let i = 0; i < count; i++) {
        let size = isAuto ? Math.random() * 10 + 5 : Math.random() * 5 + 2;

        let vx = isAuto ? null : (Math.random() - 0.5) * 2;
        let vy = isAuto ? null : (Math.random() - 0.5) * 2;

        particles.push(new InkParticle(x, y, size, colors, vx, vy));
    }
}

function animate() {
    const bg = getThemeColors().bg;
    ctx.fillStyle = `rgba(${bg[0]}, ${bg[1]}, ${bg[2]}, 0.05)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].opacity <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }

    requestAnimationFrame(animate);
}

window.inkBg = {
  updateTheme: function () {
    // Theme is read dynamically from data-theme attribute every frame
  }
};

window.addEventListener('mousemove', (event) => {
    if (Math.random() > 0.8) {
        createInk(event.clientX, event.clientY, 1, false);
    }
});

window.addEventListener('click', (event) => {
    createInk(event.clientX, event.clientY, 5, false);
});

setInterval(() => {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    if (particles.length < 50) {
        createInk(x, y, 1, true);
    }
}, 2000);

animate();