import { getOwnedTileIds, getPropertyState } from './board'
import { formatMoney, normalizeAmount } from './money'
import { pushLog } from './log'
import { getPlayer } from './players'
import {
  getLiquidationValue,
  liquidateOneStep,
  releaseAllProperties,
  transferAllProperties,
} from './property'
import type { GameCore, PlayerId, TileId } from '../types'

export interface SettlementResult {
  /** Số tiền chủ nợ thực nhận. */
  paid: number
  /** Phần còn thiếu sau khi đã bán sạch tài sản. */
  shortfall: number
  /** Nhóm trả tiền có bị phá sản không. */
  bankrupted: boolean
  /** Số lần phải thanh lý công trình để gom đủ tiền. */
  liquidations: number
}

/** Cộng tiền cho một nhóm (thưởng, bán đất, nhận trợ cấp...). */
export function credit(
  state: GameCore,
  playerId: PlayerId,
  amount: number,
  reason: string,
): number {
  const value = normalizeAmount(amount)
  if (value === 0) return 0

  const player = getPlayer(state, playerId)
  player.cash += value
  pushLog(state, 'money', `${player.name} nhận ${formatMoney(value)} — ${reason}.`, playerId)
  return value
}

/**
 * Chọn công trình nên thanh lý tiếp theo khi nhóm thiếu tiền.
 *
 * Ưu tiên hạ cấp công trình cao nhất trước (thu về nhiều tiền mà vẫn giữ được đất),
 * chỉ khi không còn gì để hạ mới bán hẳn đất trống, và bán ô rẻ nhất trước.
 */
function pickLiquidationTarget(state: GameCore, playerId: PlayerId): TileId | null {
  const owned = getOwnedTileIds(state, playerId)

  const upgraded = owned.filter((id) => getPropertyState(state, id).level >= 2)
  if (upgraded.length > 0) {
    return upgraded.sort((a, b) => {
      const levelDiff = getPropertyState(state, b).level - getPropertyState(state, a).level
      if (levelDiff !== 0) return levelDiff
      return getLiquidationValue(state, b) - getLiquidationValue(state, a)
    })[0]
  }

  const bare = owned.filter((id) => getPropertyState(state, id).level === 1)
  if (bare.length > 0) {
    return bare.sort((a, b) => getLiquidationValue(state, a) - getLiquidationValue(state, b))[0]
  }

  return null
}

/**
 * Thanh toán một khoản bắt buộc (tiền lưu trú, thuế, phí giải tỏa...).
 *
 * Quy trình: trả bằng tiền mặt → thiếu thì tự động thanh lý công trình →
 * vẫn thiếu thì tuyên bố phá sản và bàn giao toàn bộ tài sản cho chủ nợ.
 *
 * @param creditorId Chủ nợ; null nghĩa là nộp cho ngân hàng / nhà nước.
 */
export function settleDebt(
  state: GameCore,
  payerId: PlayerId,
  amount: number,
  creditorId: PlayerId | null,
  reason: string,
): SettlementResult {
  const debt = normalizeAmount(amount)
  const payer = getPlayer(state, payerId)

  if (debt === 0) return { paid: 0, shortfall: 0, bankrupted: false, liquidations: 0 }

  // 1. Gom đủ tiền mặt bằng cách thanh lý dần công trình.
  let liquidations = 0
  while (payer.cash < debt) {
    const target = pickLiquidationTarget(state, payerId)
    if (target === null) break
    liquidateOneStep(state, target)
    liquidations += 1
  }

  // 2. Trả được đủ.
  if (payer.cash >= debt) {
    payer.cash -= debt
    if (creditorId) {
      const creditor = getPlayer(state, creditorId)
      creditor.cash += debt
    }
    pushLog(
      state,
      'money',
      `${payer.name} chi ${formatMoney(debt)} — ${reason}.`,
      payerId,
    )
    return { paid: debt, shortfall: 0, bankrupted: false, liquidations }
  }

  // 3. Bán sạch vẫn không đủ → phá sản.
  const paid = payer.cash
  payer.cash = 0
  if (creditorId) getPlayer(state, creditorId).cash += paid

  pushLog(
    state,
    'money',
    `${payer.name} chỉ trả được ${formatMoney(paid)} / ${formatMoney(debt)} — ${reason}.`,
    payerId,
  )

  declareBankruptcy(state, payerId, creditorId)

  return { paid, shortfall: debt - paid, bankrupted: true, liquidations }
}

/**
 * Tuyên bố phá sản: bàn giao toàn bộ bất động sản còn lại
 * cho chủ nợ (nếu có) hoặc trả về ngân hàng.
 */
export function declareBankruptcy(
  state: GameCore,
  playerId: PlayerId,
  creditorId: PlayerId | null,
): void {
  const player = getPlayer(state, playerId)
  if (player.status === 'bankrupt') return

  const transferred = creditorId
    ? transferAllProperties(state, playerId, creditorId)
    : releaseAllProperties(state, playerId)

  player.status = 'bankrupt'
  player.cards = []
  player.jailTurnsLeft = 0
  player.pendingTravel = false
  player.rentImmunity = false
  player.forcedDiceTotal = null

  if (creditorId && transferred.length > 0) {
    const creditor = getPlayer(state, creditorId)
    pushLog(
      state,
      'warning',
      `💥 ${player.name} PHÁ SẢN! Toàn bộ ${transferred.length} địa danh được bàn giao cho ${creditor.name}.`,
      playerId,
    )
  } else {
    pushLog(
      state,
      'warning',
      `💥 ${player.name} PHÁ SẢN! Toàn bộ tài sản được thu hồi về ngân hàng.`,
      playerId,
    )
  }
}
