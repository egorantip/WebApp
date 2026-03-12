import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const FACES = [
  { dir: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] }
];

export class Renderer3D {
  constructor(container, world) {
    this.container = container;
    this.world = world;
    this.mesh = null;
    this.faceMap = [];
    this.paintColor = '#e04040';
    this.mode = 'sculpt';
    this.onPainted = null;

    this._setupScene();
    this._setupControls();
    this._setupRaycast();
    this.buildMesh();
    this._animate();
  }

  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111122);

    const w = this.container.clientWidth || 400;
    const h = this.container.clientHeight || 400;

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
    this.camera.position.set(18, 14, 18);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(12, 20, 16);
    this.scene.add(dir);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dir2.position.set(-10, -5, -8);
    this.scene.add(dir2);

    this._addAxesHelper();

    new ResizeObserver(() => this._onResize()).observe(this.container);
  }

  _addAxesHelper() {
    const s = this.world.size / 2 + 1;
    const axes = new THREE.AxesHelper(s);
    axes.position.set(-this.world.size / 2, -this.world.size / 2, -this.world.size / 2);
    this.scene.add(axes);
  }

  _setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.target.set(0, 0, 0);
  }

  _setupRaycast() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this._dragStart = null;

    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', (e) => {
      this._dragStart = { x: e.clientX, y: e.clientY };
    });

    el.addEventListener('pointerup', (e) => {
      if (!this._dragStart) return;
      const dx = e.clientX - this._dragStart.x;
      const dy = e.clientY - this._dragStart.y;
      if (Math.sqrt(dx * dx + dy * dy) < 4) {
        this._onPaintClick(e);
      }
      this._dragStart = null;
    });
  }

  _onPaintClick(e) {
    if (this.mode !== 'paint' || !this.mesh) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObject(this.mesh);

    if (hits.length > 0) {
      const quadIdx = Math.floor(hits[0].faceIndex / 2);
      const info = this.faceMap[quadIdx];
      if (info) {
        this.world.setColor(info.x, info.y, info.z, this.paintColor);
        this.buildMesh();
        if (this.onPainted) this.onPainted();
      }
    }
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /* ─── Mesh building with face culling ─── */

  buildMesh() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }

    const s = this.world.size;
    const half = s / 2;
    const positions = [];
    const normals = [];
    const colors = [];
    this.faceMap = [];

    const tmpColor = new THREE.Color();

    for (let x = 0; x < s; x++) {
      for (let y = 0; y < s; y++) {
        for (let z = 0; z < s; z++) {
          if (!this.world.isActive(x, y, z)) continue;

          tmpColor.set(this.world.getColor(x, y, z));

          for (const face of FACES) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            if (this.world.isActive(nx, ny, nz)) continue;

            const [v0, v1, v2, v3] = face.corners;

            this._pushTri(positions, normals, colors,
              v0[0] + x - half, v0[1] + y - half, v0[2] + z - half,
              v1[0] + x - half, v1[1] + y - half, v1[2] + z - half,
              v2[0] + x - half, v2[1] + y - half, v2[2] + z - half,
              face.dir, tmpColor);

            this._pushTri(positions, normals, colors,
              v0[0] + x - half, v0[1] + y - half, v0[2] + z - half,
              v2[0] + x - half, v2[1] + y - half, v2[2] + z - half,
              v3[0] + x - half, v3[1] + y - half, v3[2] + z - half,
              face.dir, tmpColor);

            this.faceMap.push({ x, y, z });
          }
        }
      }
    }

    if (positions.length === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);
  }

  _pushTri(pos, nrm, col,
    ax, ay, az, bx, by, bz, cx, cy, cz,
    normal, color) {
    pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    for (let i = 0; i < 3; i++) nrm.push(normal[0], normal[1], normal[2]);
    for (let i = 0; i < 3; i++) col.push(color.r, color.g, color.b);
  }

  /* ─── Animation loop ─── */

  _animate() {
    requestAnimationFrame(() => this._animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /* ─── Public API ─── */

  setMode(mode) { this.mode = mode; }
  setPaintColor(c) { this.paintColor = c; }
}
