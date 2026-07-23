import { GAME_CONFIG } from '../config'
import type { GameCore, GameEventType, LogKind, PlayerId, TileId } from '../types'

/** Sinh id duy nhất, tăng dần theo state — không dùng Math.random để test tái lập được. */
export function nextId(state: GameCore, prefix: string): string {
  state.seq += 1
  return `${prefix}-${state.seq}`
}

/** Ghi một dòng vào nhật ký ván đấu (hiển thị trên dashboard của Host). */
export function pushLog(
  state: GameCore,
  kind: LogKind,
  message: string,
  playerId: PlayerId | null = null,
): void {
  state.log.push({
    id: nextId(state, 'log'),
    turn: state.turnCount,
    playerId,
    kind,
    message,
  })

  // Giữ nhật ký gọn để không phình state qua một ván dài.
  if (state.log.length > GAME_CONFIG.MAX_LOG_ENTRIES) {
    state.log.splice(0, state.log.length - GAME_CONFIG.MAX_LOG_ENTRIES)
  }
}

/**
 * Phát một sự kiện cho lớp 3D / âm thanh bắt lấy.
 *
 * Khác với pushLog (dành cho Host đọc), đây là tín hiệu dành cho máy:
 * `useGameEvents` ở Giai đoạn 2 dựa vào `seq` tăng dần để biết sự kiện nào chưa diễn.
 */
export function pushEvent(
  state: GameCore,
  type: GameEventType,
  playerId: PlayerId | null = null,
  extra: { tileId?: TileId; amount?: number } = {},
): void {
  state.seq += 1
  state.events.push({
    id: `evt-${state.seq}`,
    seq: state.seq,
    type,
    playerId,
    tileId: extra.tileId ?? null,
    amount: extra.amount ?? null,
    turn: state.turnCount,
  })

  if (state.events.length > GAME_CONFIG.MAX_EVENT_ENTRIES) {
    state.events.splice(0, state.events.length - GAME_CONFIG.MAX_EVENT_ENTRIES)
  }
}
