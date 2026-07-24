import { describe, expect, it } from 'vitest'

import { BOARD_3D, GAME_CONFIG } from '../core/config'
import {
  BOARD_HALF,
  PAWN_SURFACE_CLEARANCE,
  getBuildingSlot,
  getHopPath,
  getOutwardVector,
  getPawnSlot,
  getRoundedSlabRadius,
  getTileSurface,
  getTileTransform,
  isCornerTile,
} from './layout'

const ALL_TILES = Array.from({ length: GAME_CONFIG.BOARD_SIZE }, (_, i) => i)

describe('Bo góc các lớp đế bàn', () => {
  it('giới hạn bán kính nhỏ hơn nửa độ dày để RoundedBox không che các ô cờ', () => {
    const thinSlabs = [
      { height: 0.32, requestedRadius: 0.14 },
      { height: 0.2, requestedRadius: 0.085 },
      { height: 0.09, requestedRadius: 0.2 },
      { height: BOARD_3D.TILE_HEIGHT, requestedRadius: 0.2 },
    ]

    for (const slab of thinSlabs) {
      const radius = getRoundedSlabRadius(slab.height, slab.requestedRadius)
      expect(radius).toBeGreaterThanOrEqual(0)
      expect(radius).toBeLessThan(slab.height / 2)
    }
  })

  it('giữ nguyên bán kính hợp lệ và chặn bán kính âm', () => {
    expect(getRoundedSlabRadius(0.2, 0.085)).toBe(0.085)
    expect(getRoundedSlabRadius(0.2, -0.1)).toBe(0)
  })
})

describe('Hình học bàn cờ', () => {
  it('đặt đúng 4 ô góc vào 4 góc bàn cờ', () => {
    const corners = ALL_TILES.filter(isCornerTile)
    expect(corners).toEqual([
      GAME_CONFIG.TILE_START,
      GAME_CONFIG.TILE_JAIL,
      GAME_CONFIG.TILE_FESTIVAL,
      GAME_CONFIG.TILE_TRAVEL,
    ])
  })

  it('mọi ô đều nằm trong phạm vi bàn cờ', () => {
    for (const id of ALL_TILES) {
      const [x, , z] = getTileTransform(id).position
      expect(Math.abs(x)).toBeLessThanOrEqual(BOARD_HALF + 0.001)
      expect(Math.abs(z)).toBeLessThanOrEqual(BOARD_HALF + 0.001)
    }
  })

  it('mọi ô đều nằm sát mép, không ô nào lọt vào giữa bàn cờ', () => {
    for (const id of ALL_TILES) {
      const [x, , z] = getTileTransform(id).position
      // Ít nhất một trục phải chạm vành ngoài.
      const onEdge = Math.max(Math.abs(x), Math.abs(z))
      expect(onEdge).toBeGreaterThan(BOARD_HALF - 1.5)
    }
  })

  it('không có hai ô nào trùng vị trí', () => {
    const keys = ALL_TILES.map((id) => {
      const [x, , z] = getTileTransform(id).position
      return `${x.toFixed(3)},${z.toFixed(3)}`
    })
    expect(new Set(keys).size).toBe(GAME_CONFIG.BOARD_SIZE)
  })

  it('các ô liền kề cách nhau đều đặn và không nhảy cóc', () => {
    for (const id of ALL_TILES) {
      const a = getTileTransform(id).position
      const b = getTileTransform((id + 1) % GAME_CONFIG.BOARD_SIZE).position
      const distance = Math.hypot(b[0] - a[0], b[2] - a[2])
      expect(distance).toBeGreaterThan(0.5)
      expect(distance).toBeLessThan(3)
    }
  })

  it('đi hết 32 ô là về đúng chỗ cũ, tạo thành vòng khép kín', () => {
    const first = getTileTransform(0).position
    const wrapped = getTileTransform(GAME_CONFIG.BOARD_SIZE).position
    expect(wrapped).toEqual(first)
  })
})

describe('Hướng ra ngoài của ô', () => {
  it('trục +Z cục bộ của mọi ô đều chỉ ra xa tâm bàn cờ', () => {
    for (const id of ALL_TILES) {
      const { position, rotationY } = getTileTransform(id)
      const [outX, outZ] = getOutwardVector(rotationY)

      // Đi theo hướng "ra ngoài" thì phải xa tâm hơn trước.
      const before = Math.hypot(position[0], position[2])
      const after = Math.hypot(position[0] + outX * 0.5, position[2] + outZ * 0.5)
      expect(after).toBeGreaterThan(before)
    }
  })

  it('công trình nằm về phía trong, trên vùng đất trống của ô', () => {
    for (const id of ALL_TILES) {
      const tile = getTileTransform(id)
      if (tile.isCorner) continue

      const building = getBuildingSlot(id)
      const tileDistance = Math.hypot(tile.position[0], tile.position[2])
      const buildingDistance = Math.hypot(building.position[0], building.position[2])
      const buildingAboveName = [
        9, 10, 11, 12, 13, 14, 15,
        17, 18, 19, 20, 21, 22, 23,
      ].includes(id)
      if (buildingAboveName) expect(buildingDistance).toBeGreaterThan(tileDistance)
      else expect(buildingDistance).toBeLessThan(tileDistance)
    }
  })

  it('vị trí công trình vẫn nằm trong toàn bộ mặt bàn', () => {
    for (const id of ALL_TILES) {
      if (isCornerTile(id)) continue

      const [x, y, z] = getBuildingSlot(id).position
      expect(Math.abs(x)).toBeLessThanOrEqual(BOARD_HALF)
      expect(Math.abs(z)).toBeLessThanOrEqual(BOARD_HALF)
      expect(y).toBeCloseTo(BOARD_3D.TILE_HEIGHT)
    }
  })
})

describe('Chỗ đứng quân cờ', () => {
  it('luôn có một khe hở dương phía trên mặt ô để quân không bị chìm', () => {
    expect(PAWN_SURFACE_CLEARANCE).toBeGreaterThan(0)

    for (const id of ALL_TILES) {
      const [, y] = getTileSurface(id)
      expect(y).toBeGreaterThan(BOARD_3D.TILE_HEIGHT)
      expect(y - BOARD_3D.TILE_HEIGHT).toBeCloseTo(PAWN_SURFACE_CLEARANCE)
    }
  })

  it('một nhóm thì đứng đúng tâm ô', () => {
    const [x, , z] = getPawnSlot(5, 0, 1)
    const tile = getTileTransform(5).position
    expect(x).toBeCloseTo(tile[0])
    expect(z).toBeCloseTo(tile[2])
  })

  it('năm nhóm cùng ô thì không quân nào chồng lên quân nào', () => {
    const slots = Array.from({ length: 5 }, (_, i) => getPawnSlot(5, i, 5))
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const distance = Math.hypot(slots[i][0] - slots[j][0], slots[i][2] - slots[j][2])
        expect(distance).toBeGreaterThan(0.2)
      }
    }
  })
})

describe('Đường nhảy', () => {
  it('trả về đúng số ô phải nhảy qua', () => {
    expect(getHopPath(0, 3)).toEqual([1, 2, 3])
  })

  it('vòng qua ô Xuất phát đúng cách', () => {
    expect(getHopPath(30, 4)).toEqual([31, 0, 1, 2])
  })
})
