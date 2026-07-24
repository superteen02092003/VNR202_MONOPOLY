import { describe, expect, it } from 'vitest'

import { GAME_CONFIG } from '../config'
import { BOARD, PROPERTY_TILES, REGIONS, TILES_BY_REGION } from '../data/board'
import { CHARACTERS } from '../data/characters'
import { normalizeTileId, stepsBetween } from '../logic/board'

describe('Bàn cờ', () => {
  it('có đúng 32 ô, id liên tục từ 0', () => {
    expect(BOARD).toHaveLength(GAME_CONFIG.BOARD_SIZE)
    BOARD.forEach((tile, index) => expect(tile.id).toBe(index))
  })

  it('đặt 4 ô đặc biệt đúng vào 4 góc', () => {
    expect(BOARD[GAME_CONFIG.TILE_START].type).toBe('start')
    expect(BOARD[GAME_CONFIG.TILE_JAIL].type).toBe('jail')
    expect(BOARD[GAME_CONFIG.TILE_FESTIVAL].type).toBe('festival')
    expect(BOARD[GAME_CONFIG.TILE_TRAVEL].type).toBe('travel')
  })

  it('có 24 ô đất chia đều cho 8 vùng miền, mỗi vùng 3 địa danh', () => {
    expect(PROPERTY_TILES).toHaveLength(24)
    expect(REGIONS).toHaveLength(8)
    for (const region of REGIONS) {
      expect(TILES_BY_REGION[region.id]).toHaveLength(3)
    }
  })

  it('giá đất tăng dần theo thứ tự vùng miền', () => {
    const averages = REGIONS.map((region) => {
      const tiles = TILES_BY_REGION[region.id].map(
        (id) => PROPERTY_TILES.find((t) => t.id === id)!,
      )
      return tiles.reduce((sum, t) => sum + t.price, 0) / tiles.length
    })

    for (let i = 1; i < averages.length; i++) {
      expect(averages[i]).toBeGreaterThan(averages[i - 1])
    }
  })

  it('không có tên địa danh hay tỉnh thành nào bị trùng', () => {
    const provinces = PROPERTY_TILES.map((t) => t.province)
    const landmarks = PROPERTY_TILES.map((t) => t.name)
    expect(new Set(provinces).size).toBe(provinces.length)
    expect(new Set(landmarks).size).toBe(landmarks.length)
  })

  it('khép kín: đi hết 32 bước thì quay về chỗ cũ', () => {
    expect(normalizeTileId(GAME_CONFIG.BOARD_SIZE)).toBe(0)
    expect(normalizeTileId(-1)).toBe(31)
    expect(stepsBetween(30, 2)).toBe(4)
    expect(stepsBetween(5, 5)).toBe(0)
  })
})

describe('Nhân vật', () => {
  it('đủ nhân vật cho số nhóm tối đa, id/model/màu không trùng nhau', () => {
    // Chỉ giữ nhân vật đã có file .glb; cần ít nhất MAX_PLAYERS để mỗi nhóm một nhân vật.
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(GAME_CONFIG.MAX_PLAYERS)
    const count = CHARACTERS.length
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(count)
    expect(new Set(CHARACTERS.map((c) => c.modelUrl)).size).toBe(count)
    expect(new Set(CHARACTERS.map((c) => c.color)).size).toBe(count)
  })
})
