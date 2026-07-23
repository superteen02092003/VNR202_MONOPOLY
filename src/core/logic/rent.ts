import { GAME_CONFIG } from '../config'
import { getPropertyState, getPropertyTile, hasActiveFestival, ownsWholeRegion } from './board'
import type { GameCore, TileId } from '../types'

export interface RentBreakdown {
  /** Tiền cơ sở của ô nhân hệ số cấp công trình. */
  base: number
  /** Có nhân đôi do sở hữu trọn vùng miền không (chỉ áp dụng ở cấp Đất trống). */
  regionMonopoly: boolean
  /** Có nhân đôi do đang đăng cai Festival không. */
  festival: boolean
  /** Số tiền cuối cùng phải nộp. */
  total: number
}

/**
 * Tính tiền tham quan / lưu trú của một ô đất.
 *
 * Công thức: baseRent × hệ số cấp công trình
 *            × 2 nếu chủ đất sở hữu trọn vùng miền (chỉ ở cấp Đất trống)
 *            × 2 nếu ô đang đăng cai Festival
 */
export function computeRentBreakdown(state: GameCore, tileId: TileId): RentBreakdown {
  const tile = getPropertyTile(tileId)
  const property = getPropertyState(state, tileId)

  if (!property.ownerId || property.level === 0) {
    return { base: 0, regionMonopoly: false, festival: false, total: 0 }
  }

  const base = tile.baseRent * GAME_CONFIG.RENT_BY_LEVEL[property.level]

  // Thưởng độc quyền vùng miền chỉ có ý nghĩa khi chưa xây gì —
  // từ cấp Trạm dừng chân trở lên, hệ số cấp đã đủ lớn.
  const regionMonopoly = property.level === 1 && ownsWholeRegion(state, property.ownerId, tileId)
  const festival = hasActiveFestival(property)

  let total = base
  if (regionMonopoly) total *= GAME_CONFIG.REGION_MONOPOLY_MULTIPLIER
  if (festival) total *= GAME_CONFIG.FESTIVAL_MULTIPLIER

  return { base, regionMonopoly, festival, total: Math.round(total) }
}

export function computeRent(state: GameCore, tileId: TileId): number {
  return computeRentBreakdown(state, tileId).total
}
