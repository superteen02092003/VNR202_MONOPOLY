import { createInitialState, startMatch } from '../logic/setup'
import { beginTurn } from '../logic/turn'
import type { GameCore, GameSettings } from '../types'

/**
 * Dựng sẵn một ván đấu tất định để test: hạt giống RNG cố định,
 * thứ tự đi không xáo trộn (p1 → p2 → p3), đã mở sẵn lượt đầu tiên
 * đúng như store làm trong startGame().
 */
export function createTestGame(settings?: Partial<GameSettings>): GameCore {
  const state = createInitialState(20250203)

  const result = startMatch(state, {
    setups: [
      { id: 'p1', name: 'Nhóm 1', characterId: 'doraemon' },
      { id: 'p2', name: 'Nhóm 2', characterId: 'pikachu' },
      { id: 'p3', name: 'Nhóm 3', characterId: 'totoro' },
    ],
    settings,
    randomizeTurnOrder: false,
  })

  if (!result.ok) throw new Error(result.reason ?? 'Không dựng được ván test')
  beginTurn(state)
  return state
}

/** Ép một ô đất về đúng chủ và cấp công trình mong muốn, bỏ qua mọi ràng buộc tiền bạc. */
export function forceOwn(
  state: GameCore,
  tileId: number,
  ownerId: string,
  level: 1 | 2 | 3 | 4,
  invested = 100,
): void {
  state.properties[tileId] = {
    tileId,
    ownerId,
    level,
    invested,
    festivalTurnsLeft: 0,
    shielded: false,
  }
}
