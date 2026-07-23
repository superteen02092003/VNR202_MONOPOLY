import type { GameCore, Player, PlayerId, PlayerStats } from '../types'

export function createEmptyStats(): PlayerStats {
  return {
    correctAnswers: 0,
    wrongAnswers: 0,
    rentCollected: 0,
    rentPaid: 0,
    propertiesBought: 0,
    upgradesBuilt: 0,
    landmarksBuilt: 0,
    takeoversMade: 0,
    takeoversSuffered: 0,
    lapsCompleted: 0,
    cardsPlayed: 0,
  }
}

/** Tìm nhóm theo id; trả về undefined nếu không có. */
export function findPlayer(state: GameCore, playerId: PlayerId): Player | undefined {
  return state.players.find((p) => p.id === playerId)
}

/** Tìm nhóm theo id; ném lỗi nếu không có — dùng khi id chắc chắn hợp lệ. */
export function getPlayer(state: GameCore, playerId: PlayerId): Player {
  const player = findPlayer(state, playerId)
  if (!player) throw new Error(`Không tìm thấy nhóm: ${playerId}`)
  return player
}

/** Nhóm đang tới lượt. Trả về undefined khi đang ở sảnh chờ hoặc đã kết thúc ván. */
export function getCurrentPlayer(state: GameCore): Player | undefined {
  const playerId = state.turnOrder[state.currentPlayerIndex]
  return playerId ? findPlayer(state, playerId) : undefined
}

/** Các nhóm chưa phá sản, theo đúng thứ tự đi. */
export function getSolventPlayers(state: GameCore): Player[] {
  return state.turnOrder
    .map((id) => findPlayer(state, id))
    .filter((p): p is Player => p !== undefined && p.status !== 'bankrupt')
}

/** Đối thủ của một nhóm (chưa phá sản). */
export function getOpponents(state: GameCore, playerId: PlayerId): Player[] {
  return getSolventPlayers(state).filter((p) => p.id !== playerId)
}

/** Xóa các hiệu ứng chỉ có tác dụng trong một lượt. */
export function resetTurnEffects(player: Player): void {
  player.rentImmunity = false
  player.forcedDiceTotal = null
}
