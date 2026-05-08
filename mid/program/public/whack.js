const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('#score');
const timeLeftBoard = document.querySelector('#timeLeft');
const startBtn = document.querySelector('#startBtn');
let lastHole;
let timeUp = false;
let score = 0;
let timeLeft = 30;
let countdown;

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

function peep() {
    const time = randomTime(600, 1200);
    const hole = randomHole(holes);
    hole.classList.add('up');
    setTimeout(() => {
        hole.classList.remove('up');
        if (!timeUp) peep();
    }, time);
}

function startGame() {
    score = 0;
    timeLeft = 30;
    timeUp = false;
    scoreBoard.textContent = 0;
    timeLeftBoard.textContent = timeLeft;
    startBtn.style.display = 'none';

    peep();
    
    countdown = setInterval(() => {
        timeLeft--;
        timeLeftBoard.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            timeUp = true;
            alert(`時間到！你捕獲了 ${score} 點墨跡。`);
            submitScore(score);
            startBtn.style.display = 'inline-block';
        }
    }, 1000);
}

function bonk(e) {
    if (!e.isTrusted) return;
    if (!this.classList.contains('up')) return;
    
    score++;
    this.classList.remove('up');
    
    const blot = this.querySelector('.ink-blot');
    blot.classList.add('splashed');
    setTimeout(() => blot.classList.remove('splashed'), 300);

    scoreBoard.textContent = score;
}

holes.forEach(hole => hole.addEventListener('click', bonk));

async function submitScore(finalScore) {
    await fetch('/s111410509/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: "捕墨手", score: finalScore })
    });
}