const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');

const tileSize = 40;
const rows = 10;
const cols = 10;

const maze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 3, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 2, 1, 0, 0, 0, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

let player = { x: 1, y: 8 };

function drawMaze() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let x = col * tileSize;
            let y = row * tileSize;

            if (maze[row][col] === 1) {
                ctx.fillStyle = "#222";
                ctx.fillRect(x, y, tileSize, tileSize);
            } else if (maze[row][col] === 2) {
                ctx.fillStyle = "#4a9";
                ctx.globalAlpha = 0.3;
                ctx.fillRect(x, y, tileSize, tileSize);
                ctx.globalAlpha = 1;
                
                ctx.font = "bold 16px 'Noto Serif TC', serif";
                ctx.fillStyle = "#2a5";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("起", x + tileSize / 2, y + tileSize / 2);
            } else if (maze[row][col] === 3) {
                ctx.strokeStyle = "#b02528";
                ctx.lineWidth = 3;
                ctx.strokeRect(x + 5, y + 5, tileSize - 10, tileSize - 10);
                
                ctx.font = "bold 20px 'Noto Serif TC', serif";
                ctx.fillStyle = "#b02528";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("成", x + tileSize / 2, y + tileSize / 2);
                
                ctx.lineWidth = 1;
            }
        }
    }
}

function drawPlayer() {
    ctx.beginPath();
    ctx.arc(
        player.x * tileSize + tileSize / 2, 
        player.y * tileSize + tileSize / 2, 
        12, 0, Math.PI * 2
    );
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.shadowBlur = 5;
    ctx.shadowColor = "black";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

window.addEventListener('keydown', (e) => {
    let nextX = player.x;
    let nextY = player.y;

    if (e.key === "ArrowUp") nextY--;
    if (e.key === "ArrowDown") nextY++;
    if (e.key === "ArrowLeft") nextX--;
    if (e.key === "ArrowRight") nextX++;

    if (nextY < 0 || nextY >= rows || nextX < 0 || nextX >= cols) {
        return;
    }

    if (maze[nextY][nextX] === 1) {
        if (typeof createInk === 'function') {
            createInk(player.x * tileSize + 20, player.y * tileSize + 20, 1);
        }
        return;
    } else if (maze[nextY][nextX] === 3) {
        player.x = nextX;
        player.y = nextY;
        render();
        setTimeout(() => {
            alert("墨成！順利抵達。");
            player = { x: 1, y: 8 };
            render();
        }, 100);
    } else {
        player.x = nextX;
        player.y = nextY;
    }
    render();
});

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    drawMaze();
    drawPlayer();
}

render();