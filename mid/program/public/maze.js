const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');

const SIZE = 400;
let rows, cols, cellSize;
let grid = [], stack = [];
let player = { x: 0, y: 0 };
let moves = 0, wallsHit = 0, level = 1, gameWon = false;

function size(lv) {
  return Math.min(6 + lv, 18);
}

function Cell(i, j) {
  this.i = i; this.j = j;
  this.walls = [true, true, true, true];
  this.visited = false;
}

function idx(i, j) {
  if (i < 0 || j < 0 || i >= cols || j >= rows) return -1;
  return i + j * cols;
}

function neighbors(cell) {
  const n = [];
  const dirs = [
    [0, -1], [1, 0], [0, 1], [-1, 0]
  ];
  for (const [di, dj] of dirs) {
    const ni = cell.i + di, nj = cell.j + dj;
    const id = idx(ni, nj);
    if (id !== -1 && !grid[id].visited) n.push(grid[id]);
  }
  return n;
}

function removeWall(a, b) {
  const dx = a.i - b.i, dy = a.j - b.j;
  if (dx === 1) { a.walls[3] = false; b.walls[1] = false; }
  else if (dx === -1) { a.walls[1] = false; b.walls[3] = false; }
  if (dy === 1) { a.walls[0] = false; b.walls[2] = false; }
  else if (dy === -1) { a.walls[2] = false; b.walls[0] = false; }
}

function generateMaze() {
  grid = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++)
      grid.push(new Cell(i, j));

  stack = [];
  const start = grid[0];
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const nb = neighbors(cur);
    if (nb.length > 0) {
      const next = nb[Math.floor(Math.random() * nb.length)];
      next.visited = true;
      removeWall(cur, next);
      stack.push(next);
    } else {
      stack.pop();
    }
  }
}

function setup() {
  rows = cols = size(level);
  cellSize = Math.floor(SIZE / rows);
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  generateMaze();
  player = { x: 0, y: 0 };
  moves = 0; wallsHit = 0; gameWon = false;

  const el = id => document.getElementById(id);
  if (el('movesCount')) el('movesCount').textContent = '0';
  if (el('wallsCount')) el('wallsCount').textContent = '0';
  if (el('levelNum')) el('levelNum').textContent = level;
  if (el('winOverlay')) el('winOverlay').style.display = 'none';

  draw();
}

function draw() {
  const cs = cellSize;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  for (const c of grid) {
    const x = c.i * cs, y = c.j * cs;
    if (c.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cs, y); ctx.stroke(); }
    if (c.walls[1]) { ctx.beginPath(); ctx.moveTo(x + cs, y); ctx.lineTo(x + cs, y + cs); ctx.stroke(); }
    if (c.walls[2]) { ctx.beginPath(); ctx.moveTo(x, y + cs); ctx.lineTo(x + cs, y + cs); ctx.stroke(); }
    if (c.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cs); ctx.stroke(); }
  }

  // goal
  const gx = (cols - 1) * cs, gy = (rows - 1) * cs;
  ctx.fillStyle = '#f43f5e';
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(gx + cs / 2, gy + cs / 2, cs / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.min(cs * 0.5, 16)}px "Noto Serif TC", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('成', gx + cs / 2, gy + cs / 2 + 1);

  // start
  ctx.fillStyle = '#22c55e';
  ctx.shadowColor = '#22c55e';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cs / 2, cs / 2, cs / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.min(cs * 0.45, 14)}px "Noto Serif TC", serif`;
  ctx.fillText('起', cs / 2, cs / 2 + 1);

  // player
  if (!gameWon) {
    const px = player.x * cs + cs / 2;
    const py = player.y * cs + cs / 2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, py, cs / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px, py, cs / 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function move(nx, ny) {
  if (gameWon) return;
  if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;

  const cur = grid[idx(player.x, player.y)];
  const dx = nx - player.x, dy = ny - player.y;
  let blocked = false;
  if (dx === 1 && cur.walls[1]) blocked = true;
  if (dx === -1 && cur.walls[3]) blocked = true;
  if (dy === 1 && cur.walls[2]) blocked = true;
  if (dy === -1 && cur.walls[0]) blocked = true;

  if (blocked) {
    wallsHit++;
    const el = document.getElementById('wallsCount');
    if (el) el.textContent = wallsHit;
    if (typeof window.createInk === 'function') {
      const cs = cellSize;
      window.createInk(
        ((player.x + nx) / 2) * cs + cs / 2,
        ((player.y + ny) / 2) * cs + cs / 2, 8
      );
    }
    player.x = 0; player.y = 0; moves = 0;
    const me = document.getElementById('movesCount');
    if (me) me.textContent = '0';
    draw();
    return;
  }

  player.x = nx; player.y = ny; moves++;
  const me = document.getElementById('movesCount');
  if (me) me.textContent = moves;

  if (nx === cols - 1 && ny === rows - 1) {
    gameWon = true;
    draw();
    if (typeof window.createInk === 'function') {
      for (let i = 0; i < 20; i++) {
        setTimeout(() => window.createInk(
          Math.random() * canvas.width, Math.random() * canvas.height, 3
        ), i * 100);
      }
    }
    const wm = document.getElementById('winMoves');
    if (wm) wm.textContent = moves;
    const wo = document.getElementById('winOverlay');
    if (wo) wo.style.display = 'flex';
    submitScore();
    return;
  }
  draw();
}

// keyboard
document.addEventListener('keydown', e => {
  if (gameWon) return;
  let nx = player.x, ny = player.y;
  if (e.key.startsWith('Arrow') || e.key === 'w' || e.key === 'W') e.preventDefault();
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') ny--;
  else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') ny++;
  else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') nx--;
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') nx++;
  else return;
  move(nx, ny);
});

// touch
let tx = 0, ty = 0;
canvas.addEventListener('touchstart', e => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (gameWon) return;
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
  let nx = player.x, ny = player.y;
  if (Math.abs(dx) > Math.abs(dy)) nx += dx > 0 ? 1 : -1;
  else ny += dy > 0 ? 1 : -1;
  move(nx, ny);
});

// level button
const nextBtn = document.getElementById('nextLevelBtn');
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    level++;
    setup();
  });
}

function submitScore() {
  const BASE = window.location.pathname.replace(/\/[^/]*$/, '') || '';
  const score = Math.max(200 - wallsHit * 10 - moves + level * 20, 1);
  fetch(BASE + '/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '墨陣行者', score })
  }).catch(() => {});
}

setup();
