import { GAME_CONFIG } from '../config'
import { getPropertyState, getTile } from './board'
import { getFestivalEligibleTiles } from './festival'
import { pushLog } from './log'
import { sendToJail } from './movement'
import { getPlayer } from './players'
import { canTakeover, getNextLevel, getTakeoverCost, getUpgradeCost } from './property'
import { computeRent } from './rent'
import type { GameCore, PendingAction, PlayerId } from '../types'

/**
 * Xác định việc Host phải xử lý sau khi quân cờ đáp xuống một ô.
 * Hàm này chỉ đọc trạng thái và sinh ra PendingAction — trừ ô Kẹt xe
 * (bắt giữ luôn) và ô Sân bay (ghi nhận quyền bay ở lượt sau).
 */
export function resolveLanding(state: GameCore, playerId: PlayerId): PendingAction {
  const player = getPlayer(state, playerId)
  const tile = getTile(player.position)

  switch (tile.type) {
    case 'start':
      // Tiền thưởng đã được cộng ngay trong movePlayer.
      return { kind: 'idle' }

    case 'jail': {
      sendToJail(state, playerId)
      return { kind: 'jail', turns: GAME_CONFIG.JAIL_TURNS }
    }

    case 'festival': {
      const eligibleTileIds = getFestivalEligibleTiles(state, playerId)
      if (eligibleTileIds.length === 0) {
        pushLog(
          state,
          'info',
          `${player.name} dừng ở ô Đăng cai Festival nhưng chưa có địa danh nào phù hợp.`,
          playerId,
        )
        return { kind: 'idle' }
      }
      return { kind: 'festival', eligibleTileIds }
    }

    case 'travel': {
      player.pendingTravel = true
      pushLog(
        state,
        'success',
        `${player.name} tới Sân bay Quốc tế — lượt sau được bay thẳng tới ô bất kỳ.`,
        playerId,
      )
      return { kind: 'travel' }
    }

    case 'chance':
      return { kind: 'chance' }

    case 'tax':
      return { kind: 'tax', tileId: tile.id, amount: tile.amount }

    case 'property': {
      const property = getPropertyState(state, tile.id)

      /* Đất trống chưa ai mua */
      if (!property.ownerId) {
        return {
          kind: 'buy',
          tileId: tile.id,
          price: tile.price,
          affordable: player.cash >= tile.price,
        }
      }

      /* Đất của chính mình → nâng cấp */
      if (property.ownerId === playerId) {
        const nextLevel = getNextLevel(state, tile.id)
        const cost = getUpgradeCost(state, tile.id)
        if (nextLevel === null || cost === null) {
          pushLog(
            state,
            'info',
            `${player.name} về thăm ${tile.province} — công trình đã đạt cấp tối đa.`,
            playerId,
          )
          return { kind: 'idle' }
        }
        return {
          kind: 'upgrade',
          tileId: tile.id,
          cost,
          nextLevel,
          affordable: player.cash >= cost,
        }
      }

      /* Đất đối thủ → nộp tiền lưu trú, hoặc thâu tóm */
      const rent = player.rentImmunity ? 0 : computeRent(state, tile.id)
      const takeoverCheck = canTakeover(state, playerId, tile.id)

      return {
        kind: 'rent',
        tileId: tile.id,
        ownerId: property.ownerId,
        rent,
        takeoverCost: takeoverCheck.ok ? getTakeoverCost(state, tile.id) : null,
        takeoverBlockedReason: takeoverCheck.ok ? null : takeoverCheck.reason,
      }
    }

    default:
      return { kind: 'idle' }
  }
}
