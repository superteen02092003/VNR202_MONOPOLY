import { GAME_CONFIG } from '../config'
import { getOwnedTileIds, getPropertyState } from './board'
import { getPortfolioValue } from './property'
import type { GameCore, Standing } from '../types'

/**
 * Quy đổi tổng tài sản để xếp hạng cuối ván:
 *   Tài sản ròng = Tiền mặt + Tổng vốn đã rót vào các công trình đang sở hữu.
 *
 * Nhóm phá sản luôn xếp sau các nhóm còn trụ lại, bất kể con số.
 * Đồng hạng về tài sản thì xét tiếp số Biểu tượng Địa phương, rồi số địa danh.
 */
export function computeStandings(state: GameCore): Standing[] {
  const rows = state.players.map((player) => {
    const ownedTileIds = getOwnedTileIds(state, player.id)
    const propertyValue = getPortfolioValue(state, player.id)
    const landmarks = ownedTileIds.filter(
      (tileId) => getPropertyState(state, tileId).level >= GAME_CONFIG.MAX_BUILD_LEVEL,
    ).length

    return {
      rank: 0,
      playerId: player.id,
      name: player.name,
      characterId: player.characterId,
      color: player.color,
      cash: player.cash,
      propertyValue,
      netWorth: player.cash + propertyValue,
      propertiesOwned: ownedTileIds.length,
      landmarks,
      status: player.status,
      stats: { ...player.stats },
    } satisfies Standing
  })

  rows.sort((a, b) => {
    const aBankrupt = a.status === 'bankrupt' ? 1 : 0
    const bBankrupt = b.status === 'bankrupt' ? 1 : 0
    if (aBankrupt !== bBankrupt) return aBankrupt - bBankrupt

    if (b.netWorth !== a.netWorth) return b.netWorth - a.netWorth
    if (b.landmarks !== a.landmarks) return b.landmarks - a.landmarks
    if (b.propertiesOwned !== a.propertiesOwned) return b.propertiesOwned - a.propertiesOwned
    return b.stats.correctAnswers - a.stats.correctAnswers
  })

  rows.forEach((row, index) => {
    row.rank = index + 1
  })

  return rows
}
