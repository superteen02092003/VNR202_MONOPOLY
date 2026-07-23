import { DEFAULT_SETTINGS, GAME_CONFIG } from '../config'
import { PROPERTY_TILES } from '../data/board'
import { getCharacter } from '../data/characters'
import { createEmptyStats } from './players'
import { createSeed, shuffle } from './random'
import { pushLog } from './log'
import type {
  CharacterId,
  GameCore,
  GameSettings,
  Player,
  PlayerId,
  PropertyState,
  TileId,
} from '../types'

/** Thông tin một nhóm mà Host nhập ở sảnh chờ. */
export interface PlayerSetup {
  id?: PlayerId
  name: string
  characterId: CharacterId
}

/** Trạng thái ban đầu của toàn bộ 24 ô đất: chưa ai sở hữu. */
export function createPropertyStates(): Record<TileId, PropertyState> {
  const states: Record<TileId, PropertyState> = {}
  for (const tile of PROPERTY_TILES) {
    states[tile.id] = {
      tileId: tile.id,
      ownerId: null,
      level: 0,
      invested: 0,
      festivalTurnsLeft: 0,
      shielded: false,
    }
  }
  return states
}

export function createPlayer(id: PlayerId, setup: PlayerSetup, startingCash: number): Player {
  const character = getCharacter(setup.characterId)
  return {
    id,
    name: setup.name.trim() || character.name,
    characterId: setup.characterId,
    color: character.color,
    cash: startingCash,
    position: GAME_CONFIG.TILE_START,
    status: 'active',
    jailTurnsLeft: 0,
    cards: [],
    pendingTravel: false,
    rentImmunity: false,
    forcedDiceTotal: null,
    stats: createEmptyStats(),
  }
}

/** Ván trống ở sảnh chờ — điểm khởi đầu của store. */
export function createInitialState(seed: number = createSeed()): GameCore {
  return {
    phase: 'lobby',
    settings: { ...DEFAULT_SETTINGS },
    players: [],
    turnOrder: [],
    currentPlayerIndex: 0,
    turnCount: 0,
    properties: createPropertyStates(),
    dice: null,
    currentQuestion: null,
    askedQuestionIds: [],
    triviaResult: null,
    pendingAction: { kind: 'idle' },
    log: [],
    events: [],
    timeRemainingMs: DEFAULT_SETTINGS.matchMinutes * 60_000,
    isTimerRunning: false,
    isFinalTurn: false,
    standings: null,
    rngState: seed | 0,
    seq: 0,
  }
}

export interface StartMatchOptions {
  setups: PlayerSetup[]
  settings?: Partial<GameSettings>
  /** Xáo trộn thứ tự đi. Tắt đi khi viết test để kết quả cố định. */
  randomizeTurnOrder?: boolean
}

export interface StartMatchResult {
  ok: boolean
  reason: string | null
}

/**
 * Bắt đầu ván mới từ sảnh chờ: tạo nhóm, chốt thứ tự đi, nạp đồng hồ tổng.
 * Ván chỉ thực sự chạy khi store gọi tiếp beginTurn().
 */
export function startMatch(state: GameCore, options: StartMatchOptions): StartMatchResult {
  const { setups, settings, randomizeTurnOrder = true } = options

  if (setups.length < GAME_CONFIG.MIN_PLAYERS) {
    return { ok: false, reason: `Cần ít nhất ${GAME_CONFIG.MIN_PLAYERS} nhóm để bắt đầu.` }
  }
  if (setups.length > GAME_CONFIG.MAX_PLAYERS) {
    return { ok: false, reason: `Tối đa ${GAME_CONFIG.MAX_PLAYERS} nhóm trong một ván.` }
  }

  const characters = setups.map((s) => s.characterId)
  if (new Set(characters).size !== characters.length) {
    return { ok: false, reason: 'Mỗi nhóm phải chọn một nhân vật khác nhau.' }
  }

  const merged: GameSettings = { ...DEFAULT_SETTINGS, ...settings }

  state.settings = merged
  state.players = setups.map((setup, index) =>
    createPlayer(setup.id ?? `p${index + 1}`, setup, merged.startingCash),
  )

  const ids = state.players.map((p) => p.id)
  state.turnOrder = randomizeTurnOrder ? shuffle(state, ids) : ids

  // Ván đã mở nhưng chưa vào lượt đầu tiên — người gọi phải tiếp tục bằng beginTurn().
  state.phase = 'turn-end'
  state.currentPlayerIndex = 0
  state.turnCount = 0
  state.properties = createPropertyStates()
  state.dice = null
  state.currentQuestion = null
  state.askedQuestionIds = []
  state.triviaResult = null
  state.pendingAction = { kind: 'idle' }
  state.log = []
  state.events = []
  state.timeRemainingMs = merged.matchMinutes * 60_000
  state.isTimerRunning = true
  state.isFinalTurn = false
  state.standings = null

  pushLog(
    state,
    'info',
    `Bắt đầu ván đấu ${merged.matchMinutes} phút với ${state.players.length} nhóm.`,
  )
  pushLog(
    state,
    'info',
    `Thứ tự đi: ${state.turnOrder
      .map((id, i) => `${i + 1}. ${state.players.find((p) => p.id === id)?.name ?? id}`)
      .join(' → ')}`,
  )

  return { ok: true, reason: null }
}
