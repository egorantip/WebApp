import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

// Настройки: шаг перемещения, размер камер, цвета
const CONFIG = {
    step: 0.5,
    frustumSize: 15,
    colors: { background: 0x2a2a2a, floor: 0x808080 }
};

// Хранилище состояния: сцена, камеры, объекты, выбранный элемент
const state = {
    scene: null,
    cameras: {},
    renderers: {},
    controls: null,
    objects: [],
    selected: null
};

function init() {
    state.scene = setupScene();
    createObjects();
    setupViewports();
    setupEvents();
    animate();
}

function setupScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.colors.background);

    // HemisphereLight даёт мягкое освещение: сверху светлое, снизу тёмное
    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    light.position.set(0, 20, 0);
    scene.add(light);

    scene.add(new THREE.AxesHelper(5));   // Оси: X=красный, Y=зелёный, Z=синий
    scene.add(new THREE.GridHelper(20, 20)); // Сетка для ориентации в пространстве

    return scene;
}

// Универсальная функция создания объекта: геометрия + материал + позиция
function addSceneObject(geometry, position, name) {
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);  // copy() принимает объект {x,y,z}
    mesh.name = name;
    state.scene.add(mesh);
    state.objects.push(mesh);
    return mesh;
}

function createObjects() {
    addSceneObject(new THREE.BoxGeometry(2, 2, 2), { x: -4, y: 1, z: 0 }, "Cube");
    addSceneObject(new THREE.SphereGeometry(1, 32, 16), { x: 4, y: 1, z: 0 }, "Sphere");

    // Каждые 3 числа = одна вершина (x,y,z)
    const vertices = new Float32Array([
        // Основание (2 треугольника)
        -1, 0, -1, 1, 0, -1, 1, 0, 1,
        -1, 0, -1, 1, 0, 1, -1, 0, 1,
        // Боковые грани (4 треугольника, вершина пирамиды = 0,3,0)
        -1, 0, 1, 1, 0, 1, 0, 2, 0,   // Передняя
        1, 0, 1, 1, 0, -1, 0, 2, 0,   // Правая
        1, 0, -1, -1, 0, -1, 0, 2, 0, // Задняя
        -1, 0, -1, -1, 0, 1, 0, 2, 0  // Левая
    ]);
    const pyramidGeo = new THREE.BufferGeometry();
    pyramidGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    // computeVertexNormals() обязателен для корректного освещения граней
    pyramidGeo.computeVertexNormals();
    addSceneObject(pyramidGeo, { x: 0, y: 0, z: 4 }, "Pyramid");

    // Пол: PlaneGeometry по умолчанию вертикальный, поворачиваем на -90° по X
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshLambertMaterial({ color: CONFIG.colors.floor, side: THREE.DoubleSide })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.1;  // Чуть ниже объектов для избежания z-fighting
    state.scene.add(plane);

    updateObjectList();
    selectObject(state.objects[0]);
}

function setupViewports() {
    const cams = {
        top: { ortho: true, pos: [0, 20, 0], target: [0, 0, 0] },
        front: { ortho: true, pos: [0, 0, 20], target: [0, 0, 0] },
        right: { ortho: true, pos: [20, 0, 0], target: [0, 0, 0] },
        persp: { ortho: false, pos: [15, 15, 15], target: [0, 0, 0] }
    };

    Object.entries(cams).forEach(([key, cfg]) => {
        const container = document.getElementById(`view-${key}`);
        if (!container) {
            console.error(`Container view-${key} not found`);
            return;
        }

        // Получаем реальные размеры контейнера
        const w = container.clientWidth;
        const h = container.clientHeight;

        // Создаём камеру
        state.cameras[key] = cfg.ortho
            ? createOrthoCamera(CONFIG.frustumSize, w, h)
            : new THREE.PerspectiveCamera(45, w / h, 1, 1000);

        state.cameras[key].position.set(...cfg.pos);
        state.cameras[key].lookAt(...cfg.target);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        container.appendChild(renderer.domElement);

        state.renderers[key] = renderer;

        if (key === 'persp') {
            state.controls = new OrbitControls(state.cameras.persp, renderer.domElement);
            state.controls.enableDamping = true;
        }
    });
}

// Ортографическая камера: нет перспективы, параллельные линии не сходятся
function createOrthoCamera(size, width, height) {
    const aspect = width / height;
    return new THREE.OrthographicCamera(
        -size * aspect / 2, size * aspect / 2,  // left, right
        size / 2, -size / 2,                     // top, bottom
        1, 1000
    );
}

function setupEvents() {
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);

    // При смене объекта в списке — выбираем его и обновляем цвет в пикере
    document.getElementById('objectSelect').onchange = e =>
        selectObject(state.objects.find(o => o.id === e.target.value));

    // При изменении цвета — применяем к выбранному объекту
    document.getElementById('colorPicker').oninput = e =>
        state.selected && state.selected.material.color.set(e.target.value);
}

// Маппинг клавиш: какая клавиша → какая ось → направление
const keyMap = {
    'ArrowLeft': { axis: 'x', dir: -1 },
    'ArrowRight': { axis: 'x', dir: 1 },
    'ArrowUp': { axis: 'z', dir: -1 },  // В Three.js +Z — "от камеры", поэтому ↑ уменьшает Z
    'ArrowDown': { axis: 'z', dir: 1 },
    '+': { axis: 'y', dir: 1 },   // Вверх
    '-': { axis: 'y', dir: -1 }    // Вниз
};

function onKeyDown(e) {
    // Игнорируем нажатия, если фокус в поле ввода (чтобы не ломать работу форм)
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (['input', 'select', 'textarea'].includes(tag) || !state.selected) return;

    // Проверяем и event.key (значение клавиши), и event.code (физическая клавиша) для совместимости
    const move = keyMap[e.key] || keyMap[e.code];

    if (move) {
        state.selected.position[move.axis] += CONFIG.step * move.dir;
        // Отменяем стандартное поведение браузера (скролл страницы на +/-, PageUp и т.д.)
        e.preventDefault();
        e.stopPropagation();
    }
}

function updateObjectList() {
    const select = document.getElementById('objectSelect');
    // Генерируем <option> для каждого объекта, используя id как уникальный value
    select.innerHTML = state.objects.map(o =>
        `<option value="${o.id}">${o.name}</option>`
    ).join('');
}

function selectObject(obj) {
    state.selected = obj;
    document.getElementById('objectSelect').value = obj?.id;
    // getHexString() возвращает цвет без "#"
    document.getElementById('colorPicker').value = obj
        ? '#' + obj.material.color.getHexString()
        : '#ff0000';
}

function onResize() {
    Object.entries(state.renderers).forEach(([key, renderer]) => {
        const container = document.getElementById(`view-${key}`);
        if (!container) return;

        const camera = state.cameras[key];
        const w = container.clientWidth, h = container.clientHeight;

        renderer.setSize(w, h);

        if (camera.isOrthographicCamera) {
            const a = w / h, f = CONFIG.frustumSize;
            camera.left = -f * a / 2; camera.right = f * a / 2;
            camera.top = f / 2; camera.bottom = -f / 2;
            camera.updateProjectionMatrix();
        } else {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
    });
}

function animate() {
    requestAnimationFrame(animate);  // Запрашивает следующий кадр
    state.controls?.update();        // ?.-оператор: вызовёт update(), если controls существует

    // Рендер одной и той же сцены с разных камер в разные canvas
    Object.keys(state.renderers).forEach(key =>
        state.renderers[key].render(state.scene, state.cameras[key])
    );
}

init();