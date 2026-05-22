const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('#score');
const timeLeftBoard = document.querySelector('#timeLeft');
const startBtn = document.querySelector('#startBtn');
const comboBoard = document.querySelector('#combo');
const highScoreBoard = document.querySelector('#highScore');
let lastHole;
let timeUp = false;
let score = 0;
let timeLeft = 30;
let countdown;
let combo = 0;
let highScore = parseInt(localStorage.getItem('whackHighScore')) || 0;
const scoreDetails = document.querySelector('#scoreDetails');
const bestComboBoard = document.querySelector('#bestCombo');
let bestCombo = 0;
let totalHits = 0;
let totalMisses = 0;

if (highScoreBoard) highScoreBoard.textContent = highScore;

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    const idx = Math.floor(Math.random() * holes.length);
    const hole = holes[idx];
    if (hole === lastHole) return randomHole(holes);
    lastHole = hole;
    return hole;
}

function getDifficulty() {
    if (timeLeft > 20) return { min: 1800, max: 2800 };
    if (timeLeft > 10) return { min: 1400, max: 2200 };
    return { min: 1000, max: 1600 };
}

function peep() {
    if (timeUp) return;
    const diff = getDifficulty();
    const time = randomTime(diff.min, diff.max);
    const hole = randomHole(holes);
    hole.dataset.appear = Date.now();
    hole.classList.add('up');
    setTimeout(() => {
        hole.classList.remove('up');
        delete hole.dataset.appear;
        if (!timeUp) peep();
    }, time);
}

function showFloatingScore(hole, points) {
    const existing = hole.querySelector('.float-score');
    if (existing) existing.remove();
    const el = document.createElement('span');
    el.className = 'float-score';
    el.textContent = `+${points}`;
    hole.appendChild(el);
    requestAnimationFrame(() => el.classList.add('float-up'));
    setTimeout(() => el.remove(), 500);
}

function startGame() {
    score = 0;
    timeLeft = 30;
    timeUp = false;
    combo = 0;
    bestCombo = 0;
    totalHits = 0;
    totalMisses = 0;
    scoreBoard.textContent = 0;
    timeLeftBoard.textContent = timeLeft;
    if (comboBoard) comboBoard.textContent = '0';
    if (bestComboBoard) bestComboBoard.textContent = '0';
    if (scoreDetails) scoreDetails.textContent = '';
    startBtn.style.display = 'none';

    peep();

    countdown = setInterval(() => {
        timeLeft--;
        timeLeftBoard.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            timeUp = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('whackHighScore', highScore);
                if (highScoreBoard) highScoreBoard.textContent = highScore;
            }
            submitScore(score).then(() => {
                alert(`時間到！你捕獲了 ${score} 點墨跡。`);
                startBtn.textContent = '再玩一次';
                startBtn.style.display = 'inline-block';
            });
        }
    }, 1000);
}

function bonk(e) {
    if (!e.isTrusted) return;
    if (!this.classList.contains('up')) {
        if (combo > bestCombo) bestCombo = combo;
        combo = 0;
        totalMisses++;
        if (comboBoard) comboBoard.textContent = '0';
        return;
    }

    this.classList.remove('up');
    totalHits++;
    combo++;
    if (combo > bestCombo) bestCombo = combo;

    // Base: 1pt + combo bonus every 3 streaks
    let base = 1 + Math.floor(combo / 3);

    // Reaction bonus: hit within 500ms
    const elapsed = Date.now() - parseInt(this.dataset.appear || Date.now());
    let bonus = 0;
    if (elapsed < 300) bonus = 2;
    else if (elapsed < 600) bonus = 1;

    const points = base + bonus;

    score += points;
    scoreBoard.textContent = score;
    if (comboBoard) comboBoard.textContent = combo;
    if (bestComboBoard) bestComboBoard.textContent = bestCombo;
    if (scoreDetails) scoreDetails.textContent = base + '+' + bonus;

    const blot = this.querySelector('.ink-blot');
    if (blot) {
        blot.classList.add('splashed');
        setTimeout(() => blot.classList.remove('splashed'), 300);
    }
    showFloatingScore(this, points);
}

holes.forEach(hole => hole.addEventListener('click', bonk));

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && startBtn.style.display !== 'none') {
        e.preventDefault();
        startGame();
    }
});

async function submitScore(finalScore) {
    const BASE = window.location.pathname.replace(/\/[^/]*$/, '') || '';
    try {
        await fetch(BASE + '/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: "捕墨手", score: finalScore })
        });
    } catch (_) {}
}
