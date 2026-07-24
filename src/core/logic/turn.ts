import { tickFestivals } from './festival'
import { pushLog } from './log'
import { getCurrentPlayer, getSolventPlayers, resetTurnEffects } from './players'
import { computeStandings } from './scoring'
import { drawQuestion } from './trivia'
import { formatMoneyLong } from './money'
import type { GameCore } from '../types'

/* ------------------------------------------------------------------ */
/* Mở lượt                                                             */
/* ------------------------------------------------------------------ */

/**
 * Mở một lượt mới cho nhóm đang tới phiên: dọn hiệu ứng cũ,
 * rút câu hỏi VNR202 và chuyển sang Vòng Hỏi Đáp.
 */
export function beginTurn(state: GameCore): void {
  if (state.phase === 'game-over') return

  const player = getCurrentPlayer(state)
  if (!player) return

  state.turnCount += 1
  state.dice = null
  state.triviaResult = null
  state.pendingAction = { kind: 'idle' }
  resetTurnEffects(player)

  state.currentQuestion = drawQuestion(state)
  state.phase = 'trivia'

  pushLog(state, 'info', `— Lượt ${state.turnCount}: ${player.name} —`, player.id)
}

/* ------------------------------------------------------------------ */
/* Đóng lượt                                                           */
/* ------------------------------------------------------------------ */

/**
 * Kết thúc lượt hiện tại: trừ thời hạn Festival rồi kiểm tra điều kiện
 * kết thúc ván trước khi chuyển nhóm.
 *
 * @returns true nếu ván đấu kết thúc tại đây.
 */
export function endTurn(state: GameCore): boolean {
  if (state.phase === 'game-over') return true

  const player = getCurrentPlayer(state)
  if (player) {
    resetTurnEffects(player)
  }

  tickFestivals(state)

  // Hết giờ: nhóm hiện tại vừa đi nốt lượt cuối → đóng băng bàn cờ.
  if (state.isFinalTurn) {
    endMatch(state, 'Hết thời gian thi đấu')
    return true
  }

  // Chỉ còn một nhóm trụ lại → kết thúc sớm.
  if (getSolventPlayers(state).length <= 1) {
    endMatch(state, 'Các nhóm còn lại đều đã phá sản')
    return true
  }

  advanceToNextPlayer(state)
  state.phase = 'turn-end'
  return false
}

/**
 * Ghi nhận một lượt thực sự phải nghỉ ở ô Kẹt xe – Cách ly.
 * Hàm này chỉ được gọi khi nhóm chọn "Chấp nhận nghỉ lượt", không gọi trong
 * endTurn vì lượt vừa rơi vào Kẹt xe chưa phải là một lượt nghỉ.
 */
export function serveJailTurn(state: GameCore): boolean {
  const player = getCurrentPlayer(state)
  if (!player || player.status !== 'jailed') return false

  player.jailTurnsLeft -= 1
  if (player.jailTurnsLeft <= 0) {
    player.status = 'active'
    player.jailTurnsLeft = 0
    pushLog(state, 'success', `${player.name} đã hết hạn cách ly, lượt sau được đi tiếp.`, player.id)
  } else {
    pushLog(
      state,
      'info',
      `${player.name} còn phải nghỉ ${player.jailTurnsLeft} lượt ở ô Kẹt xe.`,
      player.id,
    )
  }
  return true
}

/** Chuyển sang nhóm kế tiếp, bỏ qua các nhóm đã phá sản. */
export function advanceToNextPlayer(state: GameCore): void {
  const total = state.turnOrder.length
  if (total === 0) return

  for (let step = 1; step <= total; step++) {
    const index = (state.currentPlayerIndex + step) % total
    const candidateId = state.turnOrder[index]
    const candidate = state.players.find((p) => p.id === candidateId)
    if (candidate && candidate.status !== 'bankrupt') {
      state.currentPlayerIndex = index
      return
    }
  }
}

/* ------------------------------------------------------------------ */
/* Đồng hồ tổng & kết thúc ván                                         */
/* ------------------------------------------------------------------ */

/**
 * Trừ đồng hồ tổng. Khi về 0, KHÔNG dừng ván ngay mà bật cờ isFinalTurn
 * để nhóm hiện tại được đi nốt lượt cuối (theo đúng GDD).
 *
 * @returns true nếu vừa chuyển sang trạng thái lượt cuối.
 */
export function tickTimer(state: GameCore, elapsedMs: number): boolean {
  if (!state.isTimerRunning || state.phase === 'lobby' || state.phase === 'game-over') return false

  state.timeRemainingMs = Math.max(0, state.timeRemainingMs - elapsedMs)
  if (state.timeRemainingMs > 0 || state.isFinalTurn) return false

  state.isFinalTurn = true
  state.isTimerRunning = false
  pushLog(state, 'warning', '⏰ HẾT GIỜ! Nhóm hiện tại đi nốt lượt cuối rồi chốt bảng xếp hạng.')
  return true
}

/** Đóng băng bàn cờ, quy đổi tổng tài sản và chốt bảng xếp hạng. */
export function endMatch(state: GameCore, reason: string): void {
  if (state.phase === 'game-over') return

  state.phase = 'game-over'
  state.isTimerRunning = false
  state.pendingAction = { kind: 'idle' }
  state.currentQuestion = null
  state.standings = computeStandings(state)

  pushLog(state, 'info', `Kết thúc ván — ${reason}.`)

  const champion = state.standings[0]
  if (champion) {
    pushLog(
      state,
      'success',
      `Quán quân: ${champion.name} với tổng tài sản ${formatMoneyLong(champion.netWorth)}.`,
      champion.playerId,
    )
  }
}
