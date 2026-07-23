import { GAME_CONFIG } from '../config'
import type { GameCore, LogKind, PlayerId } from '../types'

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
