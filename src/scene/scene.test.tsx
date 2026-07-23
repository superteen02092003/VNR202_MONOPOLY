import { beforeAll, describe, expect, it, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Box3 } from 'three'
import type { Group, Mesh, MeshBasicMaterial } from 'three'

beforeAll(() => {
  // Cho React biết đây là môi trường test để act(...) chạy được các khung hình.
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

import { Building } from './Building'
import { PlaceholderPawn } from './PlaceholderPawn'
import { PropertyScenery } from './PropertyScenery'
import { TileArtwork } from './TileArtwork'
import { BOARD, BOARD_3D } from '../core'
import { useGameStore } from '../store/useGameStore'
import type { PlayerSetup } from '../core/logic/setup'

const SETUPS: PlayerSetup[] = [
  { id: 'p1', name: 'Nhóm 1', characterId: 'doraemon' },
  { id: 'p2', name: 'Nhóm 2', characterId: 'pikachu' },
]

type TestScene = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>['scene']

function newMatch() {
  useGameStore.getState().resetGame(20250203)
  useGameStore.getState().startGame(SETUPS, { randomizeTurnOrder: false })
}

/** Đếm mọi mesh trong cây scene, kể cả lồng nhau nhiều tầng. */
function countMeshes(node: { type: string; children: unknown[] }): number {
  const children = node.children as { type: string; children: unknown[] }[]
  const self = node.type === 'Mesh' ? 1 : 0
  return self + children.reduce((sum, child) => sum + countMeshes(child), 0)
}

function getPlaceholderParts(scene: TestScene) {
  const root = scene.children[0]
  const visual = root.children.find((child) => child.type === 'Group')
  const shadow = root.children.find(
    (child) =>
      child.type === 'Mesh' &&
      (child.instance as Mesh).geometry.type === 'CircleGeometry',
  )

  if (!visual || !shadow) {
    throw new Error('PlaceholderPawn must expose one animated visual group and one static shadow')
  }

  return {
    root,
    shadow: shadow.instance as Mesh,
    visual: visual.instance as Group,
  }
}

describe('Công trình 3D', () => {
  it('ô chưa ai sở hữu thì không dựng gì cả', async () => {
    newMatch()
    const renderer = await ReactThreeTestRenderer.create(<Building tileId={9} />)
    expect(countMeshes(renderer.scene)).toBe(0)
    await renderer.unmount()
  })

  it('dựng đúng công trình cho cả 4 cấp mà không lỗi', async () => {
    for (const level of [1, 2, 3, 4] as const) {
      newMatch()
      useGameStore.setState((s) => {
        s.properties[9] = {
          tileId: 9,
          ownerId: 'p1',
          level,
          invested: 200,
          festivalTurnsLeft: 0,
          shielded: false,
        }
      })

      const renderer = await ReactThreeTestRenderer.create(<Building tileId={9} />)
      expect(countMeshes(renderer.scene)).toBeGreaterThan(0)
      await renderer.unmount()
    }
  })

  it('Biểu tượng Địa phương cao hơn công trình khởi đầu', async () => {
    const maximumHeightAt = async (level: 1 | 4) => {
      newMatch()
      useGameStore.setState((s) => {
        s.properties[9] = {
          tileId: 9,
          ownerId: 'p1',
          level,
          invested: 200,
          festivalTurnsLeft: 0,
          shielded: false,
        }
      })
      const renderer = await ReactThreeTestRenderer.create(<Building tileId={9} />)
      const root = renderer.scene.children[0].instance as Group
      root.updateMatrixWorld(true)
      const maximumHeight = new Box3().setFromObject(root).max.y
      await renderer.unmount()
      return maximumHeight
    }

    expect(await maximumHeightAt(4)).toBeGreaterThan(await maximumHeightAt(1))
  })

  it('ô đang có Festival thì cắm thêm cờ đuôi nheo', async () => {
    const meshesWithFestival = async (festivalTurnsLeft: number | null) => {
      newMatch()
      useGameStore.setState((s) => {
        s.properties[9] = {
          tileId: 9,
          ownerId: 'p1',
          level: 2,
          invested: 200,
          festivalTurnsLeft,
          shielded: false,
        }
      })
      const renderer = await ReactThreeTestRenderer.create(<Building tileId={9} />)
      const count = countMeshes(renderer.scene)
      await renderer.unmount()
      return count
    }

    expect(await meshesWithFestival(null)).toBeGreaterThan(await meshesWithFestival(0))
  })
})

describe('Quân cờ tạm', () => {
  it('dựng được và chạy hoạt ảnh cả ba trạng thái mà không lỗi', async () => {
    for (const animation of ['idle', 'jump', 'celebrate'] as const) {
      const renderer = await ReactThreeTestRenderer.create(
        <PlaceholderPawn color="#38bdf8" animation={animation} />,
      )
      expect(countMeshes(renderer.scene)).toBeGreaterThan(0)

      // Chạy vài khung hình để chắc chắn useFrame không ném lỗi.
      await ReactThreeTestRenderer.act(async () => {
        renderer.advanceFrames(6, 0.016)
      })
      await renderer.unmount()
    }
  })

  it('mỗi trạng thái hoạt ảnh cho ra một dáng quân cờ khác nhau', async () => {
    const readScale = async (animation: 'idle' | 'jump') => {
      const renderer = await ReactThreeTestRenderer.create(
        <PlaceholderPawn color="#38bdf8" animation={animation} />,
      )
      await ReactThreeTestRenderer.act(async () => {
        renderer.advanceFrames(2, 0.016)
      })

      const { visual } = getPlaceholderParts(renderer.scene)
      const scale = { x: visual.scale.x, y: visual.scale.y }
      await renderer.unmount()
      return scale
    }

    // Jump kéo dãn theo chiều dọc và bóp lại theo chiều ngang.
    const jump = await readScale('jump')
    expect(jump.x).toBeCloseTo(0.9)
    expect(jump.y).toBeCloseTo(1.15)

    // Idle giữ bề ngang nguyên vẹn — chứng tỏ useFrame thật sự chạy theo trạng thái.
    const idle = await readScale('idle')
    expect(idle.x).toBeCloseTo(1)
    expect(idle.y).not.toBeCloseTo(1.15)
  })

  it('giữ bóng tĩnh tách khỏi nhóm visual và đặt toàn bộ thân quân trên mặt bàn', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <PlaceholderPawn color="#38bdf8" animation="idle" />,
    )
    const { root, shadow, visual } = getPlaceholderParts(renderer.scene)

    root.instance.updateMatrixWorld(true)
    const visualBounds = new Box3().setFromObject(visual)

    expect(shadow.parent).toBe(root.instance)
    expect(visual.parent).toBe(root.instance)
    expect(shadow.parent).not.toBe(visual)
    expect(shadow.position.y).toBeGreaterThanOrEqual(0)
    expect(shadow.position.y).toBeLessThan(visualBounds.min.y)
    expect(visualBounds.min.y).toBeGreaterThanOrEqual(0)

    await renderer.unmount()
  })
})

describe('Nhãn cố định trên ô cờ', () => {
  it('render bằng WebGL texture có depth-test và không vẽ emoji mặc định', async () => {
    const drawnText: string[] = []
    const context = createCanvasContext(drawnText)
    const canvas = {
      getContext: () => context,
      height: 0,
      width: 0,
    }
    // Khởi tạo test renderer trước khi stub `document`; nếu không Three sẽ nhầm
    // canvas giả dùng cho texture với canvas WebGL của chính renderer.
    const renderer = await ReactThreeTestRenderer.create(<group />)
    vi.stubGlobal('document', {
      createElement: () => canvas,
    })

    try {
      const tile = BOARD[0]
      await renderer.update(
        <TileArtwork
          accentColor="#5f8500"
          depth={BOARD_3D.CORNER_SIZE}
          isCorner
          tile={tile}
          width={BOARD_3D.CORNER_SIZE}
        />,
      )
      const artworkNode = renderer.scene.find(
        (node) => node.instance.userData.role === 'tile-artwork',
      )
      const artwork = artworkNode.instance as Mesh
      const material = artwork.material as MeshBasicMaterial

      expect(artwork.type).toBe('Mesh')
      expect(artwork.position.y).toBeGreaterThan(BOARD_3D.TILE_HEIGHT)
      expect(material.depthTest).toBe(true)
      expect(material.depthWrite).toBe(true)
      expect(material.map).toBeTruthy()
      expect(drawnText.join(' ')).not.toMatch(/\p{Extended_Pictographic}/u)

      await renderer.unmount()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('Cảnh quan địa danh', () => {
  it('hiển thị cụm kiến trúc mini khi địa danh chưa được xây', async () => {
    newMatch()
    const renderer = await ReactThreeTestRenderer.create(<PropertyScenery tileId={9} />)
    const scenery = renderer.scene.find(
      (node) => node.instance.userData.role === 'property-scenery',
    )

    expect(countMeshes(renderer.scene)).toBeGreaterThan(0)
    expect(scenery.instance.userData.tileId).toBe(9)

    await renderer.unmount()
  })

  it('ẩn cụm kiến trúc mini khi địa danh đã có công trình', async () => {
    for (const level of [1, 4] as const) {
      newMatch()
      useGameStore.setState((state) => {
        state.properties[9] = {
          tileId: 9,
          ownerId: 'p1',
          level,
          invested: 200,
          festivalTurnsLeft: 0,
          shielded: false,
        }
      })

      const renderer = await ReactThreeTestRenderer.create(<PropertyScenery tileId={9} />)
      expect(countMeshes(renderer.scene)).toBe(0)
      await renderer.unmount()
    }
  })
})

function createCanvasContext(drawnText: string[]) {
  return {
    beginPath() {},
    clearRect() {},
    closePath() {},
    fill() {},
    fillText(text: string) {
      drawnText.push(text)
    },
    lineTo() {},
    measureText(text: string) {
      return { width: text.length * 28 }
    },
    moveTo() {},
    quadraticCurveTo() {},
    restore() {},
    save() {},
    scale() {},
    stroke() {},
    translate() {},
  } as unknown as CanvasRenderingContext2D
}
