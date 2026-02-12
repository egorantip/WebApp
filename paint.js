const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let tool = 'pencil';
let color = '#000';
let isDrawing = false;

// Палитра цветов
const colors = ['#000', '#333', '#666', '#999', '#ccc', '#f00', '#c00', '#800', '#0f0', '#080'];
const palette = document.getElementById('palette');

// Палитра с активным классом
function setColor(newColor, clickedElement) {
    color = newColor;

    // Снимаем active со ВСЕХ цветов
    document.querySelectorAll('.color').forEach(el => el.classList.remove('active'));

    // Добавляем active к выбранному
    clickedElement.classList.add('active');
}

palette.addEventListener('click', (e) => {
    if (e.target.classList.contains('color')) {
        setColor(e.target.style.backgroundColor, e.target);
    }
});

colors.forEach(c => {
    const div = document.createElement('div');
    div.className = 'color';
    div.style.backgroundColor = c;
    palette.appendChild(div);
});

// Инструменты — с активным классом
const pencilBtn = document.getElementById('pencil');
const eraserBtn = document.getElementById('eraser');
const clearBtn = document.getElementById('clear');

function setTool(newTool) {
    tool = newTool;
    pencilBtn.classList.remove('active');
    eraserBtn.classList.remove('active');
    clearBtn.classList.remove('active');
    if (newTool === 'pencil') pencilBtn.classList.add('active');
    if (newTool === 'eraser') eraserBtn.classList.add('active');
}

pencilBtn.addEventListener('click', () => setTool('pencil'));
eraserBtn.addEventListener('click', () => setTool('eraser'));
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTool('pencil');
});

// Инициализация
setTool('pencil');

// События мыши
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

    // Описание инструментов:
    // - 'pencil': обычная кисть, цвет из палитры, source-over
    // - 'eraser': стирание, белый цвет + destination-out (удаляет пиксели)
    if (tool === 'eraser') { // Eraser - ластик
        ctx.strokeStyle = '#fff';
        ctx.globalCompositeOperation = 'destination-out';
    } else { // Pencil или другие
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