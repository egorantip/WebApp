export class UIManager {
  constructor(callbacks) {
    this.mode = 'sculpt';
    this.callbacks = callbacks;

    this.btnSculpt = document.getElementById('btn-sculpt');
    this.btnPaint = document.getElementById('btn-paint');
    this.colorPicker = document.getElementById('color-picker');
    this.btnClear = document.getElementById('btn-clear');
    this.modeLabel = document.getElementById('mode-label');
    this.voxelCount = document.getElementById('voxel-count');

    this._bind();
    this._refreshButtons();
  }

  _bind() {
    this.btnSculpt.addEventListener('click', () => this.setMode('sculpt'));
    this.btnPaint.addEventListener('click', () => this.setMode('paint'));

    this.colorPicker.addEventListener('input', (e) => {
      this.callbacks.onColorChange(e.target.value);
    });

    this.btnClear.addEventListener('click', () => this.callbacks.onClear());
  }

  setMode(mode) {
    this.mode = mode;
    this._refreshButtons();
    this.callbacks.onModeChange(mode);
  }

  _refreshButtons() {
    const isSculpt = this.mode === 'sculpt';

    // Кнопки режимов
    this.btnSculpt.className = 'nes-btn' + (isSculpt ? ' is-primary' : '');
    this.btnPaint.className = 'nes-btn' + (!isSculpt ? ' is-warning' : '');

    // Цветовой пикер — ВСЕГДА активен
    if (this.colorPicker) {
      this.colorPicker.style.opacity = '1';
      this.colorPicker.style.pointerEvents = 'auto';
    }

    // Подсказка
    if (this.modeLabel) {
      this.modeLabel.textContent = isSculpt
        ? 'Sculpt: ЛКМ — добавить (с текущим цветом), ПКМ — стереть'
        : 'Paint: клик по видимой грани — покрасить';
    }
  }

  updateVoxelCount(n) {
    if (this.voxelCount) {
      this.voxelCount.textContent = `Voxels: ${n}`;
    }
  }
}
