import { GAME_CONFIG } from '../config'
import {
  getOwnedTileIds,
  getPropertyState,
  getPropertyTile,
  hasActiveFestival,
} from './board'
import { pushEvent, pushLog } from './log'
import { getPlayer } from './players'
import type { GameCore, PlayerId, TileId } from '../types'

/**
 * Các địa danh nhóm được phép chọn để đăng cai Festival:
 * phải đang sở hữu và chưa có Festival nào đang diễn ra.
 */
export function getFestivalEligibleTiles(state: GameCore, playerId: PlayerId): TileId[] {
  return getOwnedTileIds(state, playerId).filter(
    (tileId) => !hasActiveFestival(getPropertyState(state, tileId)),
  )
}

/**
 * Đăng cai Festival tại một địa danh: tiền tham quan / lưu trú của ô nhân đôi.
 * Thời hạn lấy từ GAME_CONFIG.FESTIVAL_DURATION_TURNS (null = vĩnh viễn).
 */
export function startFestival(state: GameCore, playerId: PlayerId, tileId: TileId): boolean {
  const property = getPropertyState(state, tileId)
  if (property.ownerId !== playerId) return false
  if (hasActiveFestival(property)) return false

  property.festivalTurnsLeft = GAME_CONFIG.FESTIVAL_DURATION_TURNS

  const tile = getPropertyTile(tileId)
  const player = getPlayer(state, playerId)
  const duration =
    GAME_CONFIG.FESTIVAL_DURATION_TURNS === null
      ? 'vĩnh viễn'
      : `trong ${GAME_CONFIG.FESTIVAL_DURATION_TURNS} lượt`

  pushLog(
    state,
    'success',
    `${player.name} đăng cai Festival tại ${tile.province} — tiền lưu trú nhân đôi ${duration}!`,
    playerId,
  )
  pushEvent(state, 'festival-started', playerId, { tileId })
  return true
}

/** Trừ dần thời hạn Festival sau mỗi lượt. Festival vĩnh viễn (null) không bị ảnh hưởng. */
export function tickFestivals(state: GameCore): void {
  for (const property of Object.values(state.properties)) {
    if (property.festivalTurnsLeft !== null && property.festivalTurnsLeft > 0) {
      property.festivalTurnsLeft -= 1
    }
  }
}
