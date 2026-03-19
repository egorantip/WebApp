import { createVoxelGrid } from './voxel/voxelGrid.js'
import { initCanvasViews, clearAll, resetMasksAndRedraw } from './ui/canvasViews.js'
import { initRenderer, updateMesh } from './render/renderer.js'
import { initToolbar } from './ui/toolbar.js'

function initApp() {
  const GRID_SIZE = 16
  const grid = createVoxelGrid(GRID_SIZE)
  const state = {
    mode: 'shape',
    color: '#00e5ff',
  }

  initRenderer(grid)
  initCanvasViews(grid, state)

  // 🔧 СОЗДАЁМ ui ПЕРЕД использованием
  const ui = new UIManager({
    onModeChange(mode) {
      canvas2D.setMode(mode)
      renderer3D.setMode(mode)
    },
    onColorChange(color) {
      canvas2D.setPaintColor(color)
      renderer3D.setPaintColor(color)
    },
    onClear() {
      canvas2D.clear()
      renderer3D.buildMesh()
      ui.updateVoxelCount(world.countActiveVoxels())
    }
  })

  const canvas2D = new Canvas2DManager(
    {
      front: document.getElementById('canvas-front'),
      top: document.getElementById('canvas-top'),
      left: document.getElementById('canvas-left')
    },
    grid,  // передаём grid, а не world
    () => {
      renderer3D.buildMesh()
      ui.updateVoxelCount(countVoxels(grid))  // используем функцию из voxelGrid.js
    }
  )

  const renderer3D = new Renderer3D(
    document.getElementById('three-container'),
    grid
  )

  // 🔧 Теперь ui уже определён, можно использовать
  renderer3D.onPainted = () => {
    canvas2D.redrawAll()
    ui.updateVoxelCount(countVoxels(grid))
  }

  initToolbar(
    state,
    grid,
    () => {
      clearAll()
      renderer3D.buildMesh()
      ui.updateVoxelCount(countVoxels(grid))
    },
    (loadedGrid) => {
      const size = Math.min(grid.length, loadedGrid.length)
      for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid.length; y++) {
          for (let z = 0; z < grid.length; z++) {
            grid[x][y][z] = (x < size && y < size && z < size)
              ? (loadedGrid[x]?.[y]?.[z] ?? null)
              : null
          }
        }
      }
      updateMesh(grid)
      resetMasksAndRedraw()
    }
  )

  ui.updateVoxelCount(countVoxels(grid))
}

initApp()