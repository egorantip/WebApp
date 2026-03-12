import { VoxelWorld } from './voxels.js';
import { Canvas2DManager } from './canvas2d.js';
import { Renderer3D } from './renderer3d.js';
import { UIManager } from './ui.js';

const GRID_SIZE = 16;

const world = new VoxelWorld(GRID_SIZE);

let renderer3D = null;

function onVoxelUpdate() {
  if (renderer3D) renderer3D.buildMesh();
  ui.updateVoxelCount(world.countActiveVoxels());
}

const canvas2D = new Canvas2DManager(
  {
    front: document.getElementById('canvas-front'),
    top: document.getElementById('canvas-top'),
    left: document.getElementById('canvas-left')
  },
  world,
  onVoxelUpdate
);

// Устанавливаем начальный цвет
canvas2D.setPaintColor('#58a858');  // или любой другой

renderer3D = new Renderer3D(
  document.getElementById('three-container'),
  world
);

renderer3D.onPainted = () => {
  canvas2D.redrawAll();
  ui.updateVoxelCount(world.countActiveVoxels());
};

const ui = new UIManager({
  onModeChange(mode) {
    canvas2D.setMode(mode);
    renderer3D.setMode(mode);
  },
  onColorChange(color) {
    canvas2D.setPaintColor(color);
    renderer3D.setPaintColor(color);
  },
  onClear() {
    canvas2D.clear();
    renderer3D.buildMesh();
    ui.updateVoxelCount(world.countActiveVoxels());
  }
});

ui.updateVoxelCount(world.countActiveVoxels());