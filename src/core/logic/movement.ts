import { GAME_CONFIG } from '../config'
import { getTile, normalizeTileId } from './board'
import { credit } from './payments'
import { pushEvent, pushLog } from './log'
import { getPlayer } from './players'
import { nextInt } from './random'
import type { GameCore, PlayerId, TileId } from '../types'

export interface MoveResult {
  from: TileId
  to: TileId
  steps: number
  passedStart: boolean
  landedOnStart: boolean
  /** Tiền thưởng đã nhận khi đi qua / dừng ở ô Xuất phát. */
  startBonus: number
}

/* ------------------------------------------------------------------ */
/* Xúc xắc                                                             */
/* ------------------------------------------------------------------ */

/**
 * Đổ 2 viên xúc xắc.
 * Nếu nhóm đã dùng thẻ "Chỉ Đạo Chiến Lược", kết quả được ép về đúng tổng đã chốt
 * (vẫn tách ra 2 mặt hợp lệ để viên xúc xắc 3D ở Giai đoạn 2 hiển thị đúng).
 */
export function rollDice(state: GameCore, playerId: PlayerId): [number, number] {
  const player = getPlayer(state, playerId)
  const faces = GAME_CONFIG.DICE_FACES

  if (player.forcedDiceTotal !== null) {
    const total = clampDiceTotal(player.forcedDiceTotal)
    const minFirst = Math.max(1, total - faces)
    const maxFirst = Math.min(faces, total - 1)
    const first = nextInt(state, minFirst, maxFirst)
    player.forcedDiceTotal = null
    return [first, total - first]
  }

  return [nextInt(state, 1, faces), nextInt(state, 1, faces)]
}

/** Ép tổng điểm về khoảng hợp lệ của 2 viên xúc xắc: 2..12. */
export function clampDiceTotal(total: number): number {
  const min = GAME_CONFIG.DICE_COUNT
  const max = GAME_CONFIG.DICE_COUNT * GAME_CONFIG.DICE_FACES
  return Math.min(max, Math.max(min, Math.round(total)))
}

/* ------------------------------------------------------------------ */
/* Di chuyển                                                           */
/* ------------------------------------------------------------------ */

/** Đi tới trước `steps` ô theo chiều kim đồng hồ, tự xử lý thưởng ô Xuất phát. */
export function movePlayer(state: GameCore, playerId: PlayerId, steps: number): MoveResult {
  const player = getPlayer(state, playerId)
  const from = player.position
  const to = normalizeTileId(from + steps)

  // Vượt qua mốc 0 nghĩa là đã đi hết một vòng bàn cờ.
  const passedStart = steps > 0 && from + steps >= GAME_CONFIG.BOARD_SIZE
  const landedOnStart = to === GAME_CONFIG.TILE_START

  player.position = to
  if (passedStart) player.stats.lapsCompleted += 1

  const startBonus = grantStartBonus(state, playerId, passedStart, landedOnStart)
  return { from, to, steps, passedStart, landedOnStart, startBonus }
}

/**
 * Dịch chuyển thẳng tới một ô (Sân bay Quốc tế, thẻ Chuyến Bay Đêm, Hoán Đổi Vị Trí).
 * Mặc định KHÔNG nhận thưởng ô Xuất phát vì không thực sự đi hết vòng.
 */
export function teleportPlayer(
  state: GameCore,
  playerId: PlayerId,
  tileId: TileId,
  options: { collectStartBonus?: boolean } = {},
): MoveResult {
  const player = getPlayer(state, playerId)
  const from = player.position
  const to = normalizeTileId(tileId)

  player.position = to

  const landedOnStart = to === GAME_CONFIG.TILE_START
  const startBonus = options.collectStartBonus
    ? grantStartBonus(state, playerId, false, landedOnStart)
    : 0

  return {
    from,
    to,
    steps: 0,
    passedStart: false,
    landedOnStart,
    startBonus,
  }
}

function grantStartBonus(
  state: GameCore,
  playerId: PlayerId,
  passedStart: boolean,
  landedOnStart: boolean,
): number {
  if (landedOnStart) {
    return credit(
      state,
      playerId,
      GAME_CONFIG.LAND_ON_START_BONUS,
      'dừng đúng ô Xuất phát, Nhà nước hỗ trợ vốn gấp đôi',
    )
  }
  if (passedStart) {
    return credit(
      state,
      playerId,
      GAME_CONFIG.PASS_START_BONUS,
      'đi qua ô Xuất phát, nhận vốn hỗ trợ',
    )
  }
  return 0
}

/* ------------------------------------------------------------------ */
/* Ô Kẹt xe – Cách ly                                                  */
/* ------------------------------------------------------------------ */

export function sendToJail(state: GameCore, playerId: PlayerId): void {
  const player = getPlayer(state, playerId)
  player.position = GAME_CONFIG.TILE_JAIL
  player.status = 'jailed'
  player.jailTurnsLeft = GAME_CONFIG.JAIL_TURNS
  player.pendingTravel = false

  pushLog(
    state,
    'warning',
    `${player.name} mắc kẹt tại ${getTile(GAME_CONFIG.TILE_JAIL).name} — nghỉ ${GAME_CONFIG.JAIL_TURNS} lượt.`,
    playerId,
  )
  pushEvent(state, 'player-jailed', playerId, { tileId: GAME_CONFIG.TILE_JAIL })
}

export function releaseFromJail(state: GameCore, playerId: PlayerId, reason: string): void {
  const player = getPlayer(state, playerId)
  if (player.status !== 'jailed') return

  player.status = 'active'
  player.jailTurnsLeft = 0
  pushLog(state, 'success', `${player.name} đã thoát ô Kẹt xe — ${reason}.`, playerId)
}
