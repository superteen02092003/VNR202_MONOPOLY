/** Các hàm truy vấn bàn cờ và trạng thái ô đất. */

import { BOARD, REGION_BY_ID, TILES_BY_REGION } from '../data/board'
import { GAME_CONFIG } from '../config'
import type { GameCore, PlayerId, PropertyState, PropertyTile, Region, Tile, TileId } from '../types'

/** Đưa một chỉ số bất kỳ về khoảng hợp lệ 0..31 (bàn cờ khép kín). */
export function normalizeTileId(index: number): TileId {
  const size = GAME_CONFIG.BOARD_SIZE
  return ((index % size) + size) % size
}

export function getTile(tileId: TileId): Tile {
  const tile = BOARD[normalizeTileId(tileId)]
  if (!tile) throw new Error(`Không tìm thấy ô cờ: ${tileId}`)
  return tile
}

export function isProperty(tile: Tile): tile is PropertyTile {
  return tile.type === 'property'
}

/** Lấy ô đất; ném lỗi nếu chỉ số trỏ vào ô đặc biệt. */
export function getPropertyTile(tileId: TileId): PropertyTile {
  const tile = getTile(tileId)
  if (!isProperty(tile)) throw new Error(`Ô ${tileId} (${tile.name}) không phải ô đất.`)
  return tile
}

export function getRegionOfTile(tileId: TileId): Region {
  return REGION_BY_ID[getPropertyTile(tileId).region]
}

export function getPropertyState(state: GameCore, tileId: TileId): PropertyState {
  const property = state.properties[normalizeTileId(tileId)]
  if (!property) throw new Error(`Chưa khởi tạo trạng thái cho ô đất: ${tileId}`)
  return property
}

/** Số bước cần đi theo chiều kim đồng hồ để tới ô đích. */
export function stepsBetween(from: TileId, to: TileId): number {
  return normalizeTileId(to - from)
}

/** Danh sách ô đất một nhóm đang sở hữu. */
export function getOwnedTileIds(state: GameCore, playerId: PlayerId): TileId[] {
  return Object.values(state.properties)
    .filter((p) => p.ownerId === playerId)
    .map((p) => p.tileId)
    .sort((a, b) => a - b)
}

/** Nhóm có sở hữu trọn cả 3 địa danh của vùng miền chứa ô này không? */
export function ownsWholeRegion(state: GameCore, playerId: PlayerId, tileId: TileId): boolean {
  const tile = getPropertyTile(tileId)
  const siblings = TILES_BY_REGION[tile.region]
  return siblings.every((id) => state.properties[id]?.ownerId === playerId)
}

/** Các ô cùng vùng miền (kể cả chính nó). */
export function getRegionSiblings(tileId: TileId): TileId[] {
  return TILES_BY_REGION[getPropertyTile(tileId).region]
}

/** Ô có đang được tổ chức Festival (x2 tiền thu) không? */
export function hasActiveFestival(property: PropertyState): boolean {
  return property.festivalTurnsLeft === null || property.festivalTurnsLeft > 0
}

/**
 * Tổng vốn chủ đất đã rót vào ô — dùng để tính giá thâu tóm,
 * tiền thanh lý và tài sản ròng cuối ván.
 */
export function getPropertyValue(state: GameCore, tileId: TileId): number {
  const property = getPropertyState(state, tileId)
  return property.ownerId ? property.invested : 0
}
