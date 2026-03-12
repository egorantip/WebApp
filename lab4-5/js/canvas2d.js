export class Canvas2DManager {
  constructor(canvases, world, onUpdate) {
    this.world = world;
    this.onUpdate = onUpdate;
    this.mode = 'sculpt';
    this.paintColor = '#e04040';  // начальный цвет
    this.cellSize = 25;

    this.views = {
      front: { canvas: canvases.front, ctx: canvases.front.getContext('2d'), label: 'Front (XY)' },
      top: { canvas: canvases.top, ctx: canvases.top.getContext('2d'), label: 'Top (XZ)' },
      left: { canvas: canvases.left, ctx: canvases.left.getContext('2d'), label: 'Left (ZY)' }
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

    if (this.mode === 'sculpt') {
      this.isDrawing = true;
      this.activeView = viewName;
      this.drawValue = (e.button === 0);

      this.world.setProjectionPixel(viewName, col, row, this.drawValue);
      this.world.applySpaceCarving(this.paintColor);  // ← передаём текущий цвет
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
        this.world.applySpaceCarving(this.paintColor);  // ← передаём цвет при каждом движении
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