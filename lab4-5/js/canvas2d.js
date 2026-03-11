export class Canvas2DManager {
  constructor(canvases, world, onUpdate) {
    this.world = world;
    this.onUpdate = onUpdate;
    this.mode = 'sculpt';
    this.paintColor = '#e04040';
    this.cellSize = 25;

    this.views = {
      front: { canvas: canvases.front, ctx: canvases.front.getContext('2d'), label: 'Front (XY)' },
      top:   { canvas: canvases.top,   ctx: canvases.top.getContext('2d'),   label: 'Top (XZ)' },
      left:  { canvas: canvases.left,  ctx: canvases.left.getContext('2d'),  label: 'Left (ZY)' }
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
      canvas.addEventListener('mouseup',   ()  => this._onMouseUp());
      canvas.addEventListener('mouseleave', ()  => this._onMouseLeave(viewName));
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

    if (this.mode === 'sculpt') {
      this.isDrawing = true;
      this.activeView = viewName;
      this.drawValue = (e.button === 0);
      this.world.setProjectionPixel(viewName, col, row, this.drawValue);
      this.world.applySpaceCarving();
      this.redrawAll();
      this.onUpdate();
    } else if (this.mode === 'paint' && e.button === 0) {
      this.isDrawing = true;
      this.activeView = viewName;
      this._paintAt(viewName, col, row);
    }
  }

  _onMouseMove(e, viewName) {
    const { col, row } = this._getGridCoords(e, viewName);
    this._updateCrosshair(viewName, col, row);

    if (this.isDrawing && this.activeView === viewName && this._inBounds(col, row)) {
      if (this.mode === 'sculpt') {
        this.world.setProjectionPixel(viewName, col, row, this.drawValue);
        this.world.applySpaceCarving();
        this.onUpdate();
      } else if (this.mode === 'paint') {
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

  _updateCrosshair(viewName, col, row) {
    const s = this.world.size;
    this.crosshair = { x: null, y: null, z: null };

    if (!this._inBounds(col, row)) return;

    if (viewName === 'front') {
      this.crosshair.x = col;
      this.crosshair.y = s - 1 - row;
    } else if (viewName === 'top') {
      this.crosshair.x = col;
      this.crosshair.z = row;
    } else if (viewName === 'left') {
      this.crosshair.z = col;
      this.crosshair.y = s - 1 - row;
    }
  }

  _paintAt(viewName, col, row) {
    const v = this.world.getFirstVisible(viewName, col, row);
    if (v) {
      this.world.setColor(v.x, v.y, v.z, this.paintColor);
      this.redrawAll();
      this.onUpdate();
    }
  }

  /* ─── Drawing ─── */

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
        if (this.mode === 'sculpt') {
          if (this.world.getProjectionPixel(viewName, col, row)) {
            ctx.fillStyle = '#4a6a4a';
            ctx.fillRect(col * cell, row * cell, cell, cell);
          }
        } else {
          const color = this.world.getProjectionColor(viewName, col, row);
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(col * cell, row * cell, cell, cell);
          }
        }
      }
    }

    this._drawGrid(ctx, s, cell);
    this._drawCrosshairs(viewName, ctx, s, cell);
  }

  _drawGrid(ctx, s, cell) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
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

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, s * cell, s * cell);
  }

  _drawCrosshairs(viewName, ctx, s, cell) {
    const ch = this.crosshair;
    if (ch.x === null && ch.y === null && ch.z === null) return;

    let vLine = null;
    let hLine = null;

    if (viewName === 'front') {
      if (ch.x !== null) vLine = ch.x;
      if (ch.y !== null) hLine = s - 1 - ch.y;
    } else if (viewName === 'top') {
      if (ch.x !== null) vLine = ch.x;
      if (ch.z !== null) hLine = ch.z;
    } else if (viewName === 'left') {
      if (ch.z !== null) vLine = ch.z;
      if (ch.y !== null) hLine = s - 1 - ch.y;
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);

    if (vLine !== null) {
      const x = (vLine + 0.5) * cell;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, s * cell);
      ctx.stroke();
    }
    if (hLine !== null) {
      const y = (hLine + 0.5) * cell;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s * cell, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ─── Public API ─── */

  setMode(mode) {
    this.mode = mode;
    this.isDrawing = false;
    this.redrawAll();
  }

  setPaintColor(color) {
    this.paintColor = color;
  }

  clear() {
    this.world.clearAll();
    this.redrawAll();
    this.onUpdate();
  }
}
