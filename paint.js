const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let tool = 'pencil';
let color = '#000';
let isDrawing = false;

// Палитра цветов
const colors = ['#000', '#333', '#666', '#999', '#ccc', '#f00', '#c00', '#800', '#0f0', '#080'];
const palette = document.getElementById('palette');
colors.forEach(c => {
    const div = document.createElement('div');
    div.className = 'color';
    div.style.backgroundColor = c;
    div.addEventListener('click', () => color = c);
    palette.appendChild(div);
});

// Инструменты
document.getElementById('pencil').addEventListener('click', () => tool = 'pencil');
document.getElementById('eraser').addEventListener('click', () => tool = 'eraser');
document.getElementById('clear').addEventListener('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

// События мыши (делигирование на canvas)
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    draw(e);
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    if (tool === 'eraser') {
        ctx.strokeStyle = '#fff';
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.strokeStyle = color;
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// Предотвращение drag
canvas.addEventListener('dragstart', e => e.preventDefault());