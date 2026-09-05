export class Canvas2DManager {
  constructor(canvases, world, onUpdate) {
    this.world = world;
    this.onUpdate = onUpdate;
    this.mode = 'sculpt';
    this.paintColor = '#e04040';
    this.cellSize = 25;

    this.views = {
      front: { canvas: canvases.front, ctx: canvases.front.getContext('2d') },
      top: { canvas: canvases.top, ctx: canvases.top.getContext('2d') },
      left: { canvas: canvases.left, ctx: canvases.left.getContext('2d') }
    };

    this.crosshair = { x: null, y: null, z: null };
    this.isDrawing = false;
    this.drawValue = true;
    this.activeView = null;

    this._setupCanvases();
    this._bindEvents();
    this.redrawAll();
  }

  _setupCanvases() {
    const px = this.world.size * this.cellSize;
    for (const key of ['front', 'top', 'left']) {
      this.views[key].canvas.width = px;
      this.views[key].canvas.height = px;
    }
  }

  _bindEvents() {
    for (const viewName of ['front', 'top', 'left']) {
      const canvas = this.views[viewName].canvas;

      canvas.addEventListener('mousedown', (e) => this._onMouseDown(e, viewName));
      canvas.addEventListener('mousemove', (e) => this._onMouseMove(e, viewName));
      canvas.addEventListener('mouseup', () => this._onMouseUp());
      canvas.addEventListener('mouseleave', () => this._onMouseLeave(viewName));
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  _getGridCoords(e, viewName) {
    const canvas = this.views[viewName].canvas;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const col = Math.floor((e.clientX - rect.left) * scaleX / this.cellSize);
    const row = Math.floor((e.clientY - rect.top) * scaleY / this.cellSize);

    return { col, row };
  }

  _inBounds(col, row) {
    return col >= 0 && col < this.world.size && row >= 0 && row < this.world.size;
  }

  _onMouseDown(e, viewName) {
    e.preventDefault();

    const { col, row } = this._getGridCoords(e, viewName);
    if (!this._inBounds(col, row)) return;

    this.isDrawing = true;
    this.activeView = viewName;
    this.drawValue = (e.button === 0);

    if (this.mode === 'sculpt') {
      this._sculptVoxel(viewName, col, row, this.drawValue);
    }

    else if (this.mode === 'paint' && e.button === 0) {
      this._paintAt(viewName, col, row);
    }

    this.redrawAll();
    this.onUpdate();
  }

  _onMouseMove(e, viewName) {

    const { col, row } = this._getGridCoords(e, viewName);
    this._updateCrosshair(viewName, col, row);

    if (this.isDrawing && this.activeView === viewName && this._inBounds(col, row)) {

      if (this.mode === 'sculpt') {
        this._sculptVoxel(viewName, col, row, this.drawValue);
        this.onUpdate();
      }

      else if (this.mode === 'paint') {
        this._paintAt(viewName, col, row);
      }
    }

    this.redrawAll();
  }

  _onMouseUp() {
    this.isDrawing = false;
    this.activeView = null;
  }

  _onMouseLeave(viewName) {
    if (this.activeView === viewName) {
      this.isDrawing = false;
      this.activeView = null;
    }

    this.crosshair = { x: null, y: null, z: null };
    this.redrawAll();
  }

  _sculptVoxel(view, col, row, add) {

    const s = this.world.size;

    if (view === 'front') {

      const x = col;
      const y = s - 1 - row;

      if (add) {

        for (let z = s - 1; z >= 0; z--) {
          if (!this.world.active[x][y][z]) {
            this.world.active[x][y][z] = true;
            this.world.setColor(x, y, z, this.paintColor);
            break;
          }
        }

      } else {

        const v = this.world.getFirstVisible('front', col, row);
        if (v) this.world.active[v.x][v.y][v.z] = false;

      }

    }

    else if (view === 'top') {

      const x = col;
      const z = row;

      if (add) {

        for (let y = s - 1; y >= 0; y--) {
          if (!this.world.active[x][y][z]) {
            this.world.active[x][y][z] = true;
            this.world.setColor(x, y, z, this.paintColor);
            break;
          }
        }

      } else {

        const v = this.world.getFirstVisible('top', col, row);
        if (v) this.world.active[v.x][v.y][v.z] = false;

      }

    }

    else if (view === 'left') {

      const z = col;
      const y = s - 1 - row;

      if (add) {

        for (let x = 0; x < s; x++) {
          if (!this.world.active[x][y][z]) {
            this.world.active[x][y][z] = true;
            this.world.setColor(x, y, z, this.paintColor);
            break;
          }
        }

      } else {

        const v = this.world.getFirstVisible('left', col, row);
        if (v) this.world.active[v.x][v.y][v.z] = false;

      }

    }

  }

  _updateCrosshair(viewName, col, row) {

    const s = this.world.size;
    this.crosshair = { x: null, y: null, z: null };

    if (!this._inBounds(col, row)) return;

    if (viewName === 'front') {
      this.crosshair.x = col;
      this.crosshair.y = s - 1 - row;
    }

    else if (viewName === 'top') {
      this.crosshair.x = col;
      this.crosshair.z = row;
    }

    else if (viewName === 'left') {
      this.crosshair.z = col;
      this.crosshair.y = s - 1 - row;
    }
  }

  _paintAt(viewName, col, row) {

    const v = this.world.getFirstVisible(viewName, col, row);

    if (v) {
      this.world.setColor(v.x, v.y, v.z, this.paintColor);
      this.onUpdate();
    }
  }

  redrawAll() {

    this._drawView('front');
    this._drawView('top');
    this._drawView('left');
  }

  _drawView(viewName) {

    const { ctx, canvas } = this.views[viewName];
    const s = this.world.size;
    const cell = this.cellSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let col = 0; col < s; col++) {
      for (let row = 0; row < s; row++) {

        const color = this.world.getProjectionColor(viewName, col, row);

        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(col * cell, row * cell, cell, cell);
        }

      }
    }

    this._drawGrid(ctx, s, cell);
  }

  _drawGrid(ctx, s, cell) {

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= s; i++) {

      const pos = i * cell;

      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, s * cell);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(s * cell, pos);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, s * cell, s * cell);
  }

  setMode(mode) {
    this.mode = mode;
    this.isDrawing = false;
    this.redrawAll();
  }

  setPaintColor(color) {
    this.paintColor = color;
  }

  clear() {
    this.world.active = this.world._create3D(false);
    this.redrawAll();
    this.onUpdate();
  }
}