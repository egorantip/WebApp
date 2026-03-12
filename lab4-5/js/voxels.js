export class VoxelWorld {
  constructor(size = 16) {
    this.size = size;
    this.defaultColor = '#58a858';

    this.projections = {
      front: this._create2D(true),
      top: this._create2D(true),
      left: this._create2D(true)
    };

    this.colors = this._create3D(this.defaultColor);
    this.active = this._create3D(false);
    this.applySpaceCarving();
  }

  _create2D(value) {
    const a = [];
    for (let i = 0; i < this.size; i++) {
      a[i] = new Array(this.size).fill(value);
    }
    return a;
  }

  _create3D(value) {
    const a = [];
    for (let x = 0; x < this.size; x++) {
      a[x] = [];
      for (let y = 0; y < this.size; y++) {
        a[x][y] = new Array(this.size).fill(value);
      }
    }
    return a;
  }

  applySpaceCarving(currentPaintColor = null) {
    const s = this.size;
    for (let x = 0; x < s; x++) {
      for (let y = 0; y < s; y++) {
        for (let z = 0; z < s; z++) {
          const frontFilled = this.projections.front[x][s - 1 - y];
          const topFilled = this.projections.top[x][z];
          const leftFilled = this.projections.left[z][s - 1 - y];

          const shouldBeActive = frontFilled && topFilled && leftFilled;

          if (shouldBeActive && !this.active[x][y][z]) {
            if (currentPaintColor) {
              this.colors[x][y][z] = currentPaintColor;
            }
          }

          this.active[x][y][z] = shouldBeActive;
        }
      }
    }
  }

  setProjectionPixel(view, col, row, value) {
    if (col < 0 || col >= this.size || row < 0 || row >= this.size) return;
    this.projections[view][col][row] = value;
  }

  getProjectionPixel(view, col, row) {
    if (col < 0 || col >= this.size || row < 0 || row >= this.size) return false;
    return this.projections[view][col][row];
  }

  isActive(x, y, z) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size || z < 0 || z >= this.size) return false;
    return this.active[x][y][z];
  }

  getColor(x, y, z) {
    return this.colors[x][y][z];
  }

  setColor(x, y, z, color) {
    if (this.isActive(x, y, z)) {
      this.colors[x][y][z] = color;
    }
  }

  getFirstVisible(view, col, row) {
    const s = this.size;
    if (col < 0 || col >= s || row < 0 || row >= s) return null;

    if (view === 'front') {
      const x = col;
      const y = s - 1 - row;
      for (let z = s - 1; z >= 0; z--) {
        if (this.isActive(x, y, z)) return { x, y, z };
      }
    } else if (view === 'top') {
      const x = col;
      const z = row;
      for (let y = s - 1; y >= 0; y--) {
        if (this.isActive(x, y, z)) return { x, y, z };
      }
    } else if (view === 'left') {
      const z = col;
      const y = s - 1 - row;
      for (let x = 0; x < s; x++) {
        if (this.isActive(x, y, z)) return { x, y, z };
      }
    }
    return null;
  }

  getProjectionColor(view, col, row) {
    const v = this.getFirstVisible(view, col, row);
    return v ? this.colors[v.x][v.y][v.z] : null;
  }

  clearAll() {
    const s = this.size;
    for (let i = 0; i < s; i++) {
      for (let j = 0; j < s; j++) {
        this.projections.front[i][j] = true;
        this.projections.top[i][j] = true;
        this.projections.left[i][j] = true;
      }
    }
    this.colors = this._create3D(this.defaultColor);
    this.applySpaceCarving();
  }

  countActiveVoxels() {
    let n = 0;
    const s = this.size;
    for (let x = 0; x < s; x++)
      for (let y = 0; y < s; y++)
        for (let z = 0; z < s; z++)
          if (this.active[x][y][z]) n++;
    return n;
  }
}