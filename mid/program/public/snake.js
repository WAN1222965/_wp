const canvas = document.getElementById('snakeGame');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreVal');

const grid = 20;
let count = 0, score = 0, gameOver = false;

let snake = {
  x: 160, y: 160,
  dx: grid, dy: 0,
  cells: [],
  maxCells: 4
};

let apple = { x: 320, y: 320 };

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function resetGame() {
  snake.x = 160; snake.y = 160;
  snake.cells = [];
  snake.maxCells = 4;
  snake.dx = grid; snake.dy = 0;
  score = 0; gameOver = false;
  if (scoreElement) scoreElement.textContent = '0';
  apple.x = getRandomInt(0, 20) * grid;
  apple.y = getRandomInt(0, 20) * grid;
}

function loop() {
  requestAnimationFrame(loop);
  if (++count < 6) return;
  count = 0;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameOver) return;

  snake.x += snake.dx;
  snake.y += snake.dy;

  if (snake.x < 0) snake.x = canvas.width - grid;
  else if (snake.x >= canvas.width) snake.x = 0;
  if (snake.y < 0) snake.y = canvas.height - grid;
  else if (snake.y >= canvas.height) snake.y = 0;

  snake.cells.unshift({ x: snake.x, y: snake.y });
  if (snake.cells.length > snake.maxCells) snake.cells.pop();

  ctx.shadowBlur = 15;
  ctx.shadowColor = '#f43f5e';
  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(apple.x, apple.y, grid - 1, grid - 1);

  ctx.shadowBlur = 10;
  ctx.shadowColor = '#38bdf8';
  ctx.fillStyle = '#38bdf8';

  snake.cells.forEach(function(cell, index) {
    ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

    if (cell.x === apple.x && cell.y === apple.y) {
      snake.maxCells++;
      score += 10;
      if (scoreElement) scoreElement.textContent = score;
      apple.x = getRandomInt(0, 20) * grid;
      apple.y = getRandomInt(0, 20) * grid;
    }

    for (let i = index + 1; i < snake.cells.length; i++) {
      if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
        gameOver = true;
        submitScore(score);
        setTimeout(resetGame, 1500);
        return;
      }
    }
  });
}

document.addEventListener('keydown', function(e) {
  if (e.key.startsWith('Arrow')) e.preventDefault();
  if (e.key === 'ArrowLeft' && snake.dx === 0) { snake.dx = -grid; snake.dy = 0; }
  else if (e.key === 'ArrowUp' && snake.dy === 0) { snake.dy = -grid; snake.dx = 0; }
  else if (e.key === 'ArrowRight' && snake.dx === 0) { snake.dx = grid; snake.dy = 0; }
  else if (e.key === 'ArrowDown' && snake.dy === 0) { snake.dy = grid; snake.dx = 0; }
});

// touch swipe
let tx = 0, ty = 0;
canvas.addEventListener('touchstart', e => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && snake.dx === 0) { snake.dx = grid; snake.dy = 0; }
    else if (dx < 0 && snake.dx === 0) { snake.dx = -grid; snake.dy = 0; }
  } else {
    if (dy > 0 && snake.dy === 0) { snake.dy = grid; snake.dx = 0; }
    else if (dy < 0 && snake.dy === 0) { snake.dy = -grid; snake.dx = 0; }
  }
});

async function submitScore(finalScore) {
  const BASE = window.location.pathname.replace(/\/[^/]*$/, '') || '';
  await fetch(BASE + '/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '無名書生', score: finalScore })
  }).catch(() => {});
}

requestAnimationFrame(loop);
