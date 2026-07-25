import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { GAME_CONFIG } from '../core/config'
import type {
  CardEffect,
  CardTarget,
  GameCore,
  GameSettings,
  PlayerId,
  TileId,
} from '../core/types'
import {
  beginTurn,
  buyProperty,
  createInitialState,
  createSeed,
  drawCard,
  endMatch,
  endTurn as endTurnCore,
  formatMoney,
  formatPropertyPrice,
  getCurrentPlayer,
  getPropertyState,
  getPropertyTile,
  getTile,
  playCard,
  pushEvent,
  pushLog,
  releaseFromJail,
  resolveLanding,
  resolveTrivia,
  rollDice as rollDiceCore,
  settleDebt,
  serveJailTurn,
  startFestival,
  startMatch,
  takeoverProperty,
  teleportPlayer,
  tickTimer,
  movePlayer,
  upgradeProperty,
} from '../core/logic'
import type { PlayerSetup, StartMatchResult } from '../core/logic'

/** Kết quả trả về cho UI của Host: thao tác có thành công không, nếu không thì vì sao. */
export interface ActionResult {
  ok: boolean
  reason: string | null
  cardEffect?: CardEffect | null
  cardSaved?: boolean
  cardUsedImmediately?: boolean
  cardMovedPlayer?: boolean
}

const ok: ActionResult = { ok: true, reason: null }
const no = (reason: string): ActionResult => ({ ok: false, reason })

export interface GameActions {
  /* --- Sảnh chờ --- */
  updateSettings: (patch: Partial<GameSettings>) => void
  startGame: (setups: PlayerSetup[], options?: { randomizeTurnOrder?: boolean }) => StartMatchResult
  /** Xác nhận màn sẵn sàng và mở lượt Hỏi Đáp đầu tiên. */
  beginGame: () => ActionResult
  resetGame: (seed?: number) => void

  /* --- Vòng Hỏi Đáp --- */
  answerTrivia: (answerIndex: number | null) => ActionResult

  /**
   * Kích hoạt một Thẻ Cơ hội trong túi đồ của nhóm đang tới lượt.
   * Cố tình KHÔNG đặt tên `useCard` để tránh bị nhầm là React Hook.
   */
  playCard: (instanceId: string, target?: CardTarget) => ActionResult
  chooseTravelDestination: (tileId: TileId) => ActionResult
  skipTravel: () => ActionResult

  /* --- Vòng Di chuyển --- */
  rollDice: () => ActionResult
  /** Giai đoạn 2: ghi nhận kết quả từ 2 viên xúc xắc vật lý Cannon.js. */
  setDiceResult: (dice: [number, number]) => ActionResult
  /** Giai đoạn 2: đánh dấu quân cờ đang nhảy parabol qua các ô. */
  markMoving: () => void
  /** Áp dụng kết quả di chuyển và mở Vòng Hành động. */
  applyMovement: () => ActionResult

  /* --- Vòng Hành động --- */
  confirmBuy: () => ActionResult
  confirmUpgrade: () => ActionResult
  payRent: () => ActionResult
  confirmTakeover: () => ActionResult
  payTax: () => ActionResult
  chooseFestivalTile: (tileId: TileId) => ActionResult
  drawChanceCard: () => ActionResult
  payBail: () => ActionResult
  /** Bỏ qua lời đề nghị hiện tại (không mua, không nâng cấp, chấp nhận nghỉ lượt...). */
  declineAction: () => ActionResult

  /* --- Chốt lượt & đồng hồ tổng --- */
  endTurn: () => ActionResult
  tick: (elapsedMs: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  finishMatch: (reason?: string) => void
}

export type GameStore = GameCore & GameActions

/* ------------------------------------------------------------------ */
/* Lưu tiến trình ván đấu (chống mất dữ liệu khi người dùng bấm F5)    */
/* ------------------------------------------------------------------ */

/** Khóa localStorage; đổi hậu tố khi cấu trúc state thay đổi để bỏ bản cũ. */
const STORAGE_KEY = 'vnr202-monopoly:v1'

/**
 * Bộ nhớ tạm dùng khi không có `window.localStorage`
 * (chạy test Node, SSR...). Nhờ nó `persist` không bao giờ ném lỗi.
 */
const memoryStore = new Map<string, string>()
const memoryStorage: StateStorage = {
  getItem: (name) => memoryStore.get(name) ?? null,
  setItem: (name, value) => {
    memoryStore.set(name, value)
  },
  removeItem: (name) => {
    memoryStore.delete(name)
  },
}

const gameStorage = createJSONStorage<GameCore>(() => {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  return memoryStorage
})

export const useGameStore = create<GameStore>()(persist(
  immer((set) => ({
    ...createInitialState(),

    /* ================================================================ */
    /* Sảnh chờ                                                         */
    /* ================================================================ */

    updateSettings: (patch) =>
      set((state) => {
        state.settings = { ...state.settings, ...patch }
        if (patch.matchMinutes !== undefined && state.phase === 'lobby') {
          state.timeRemainingMs = patch.matchMinutes * 60_000
        }
      }),

    startGame: (setups, options) => {
      let result: StartMatchResult = { ok: false, reason: 'Chưa khởi tạo được ván đấu.' }
      set((state) => {
        result = startMatch(state, {
          setups,
          settings: state.settings,
          randomizeTurnOrder: options?.randomizeTurnOrder ?? true,
        })
        if (result.ok) state.isTimerRunning = false
      })
      return result
    },

    beginGame: () => {
      let result: ActionResult = ok
      set((state) => {
        if (
          state.phase !== 'turn-end' ||
          state.turnCount !== 0 ||
          state.turnOrder.length === 0 ||
          !getCurrentPlayer(state)
        ) {
          result = no('Ván đấu không ở trạng thái chờ bắt đầu.')
          return
        }

        beginTurn(state)
        state.isTimerRunning = true
      })
      return result
    },

    resetGame: (seed) =>
      set((state) => {
        const fresh = createInitialState(seed ?? createSeed())
        Object.assign(state, fresh)
      }),

    /* ================================================================ */
    /* Vòng Hỏi Đáp                                                     */
    /* ================================================================ */

    answerTrivia: (answerIndex) => {
      let result: ActionResult = ok
      set((state) => {
        if (state.phase !== 'trivia') {
          result = no('Hiện không ở Vòng Hỏi Đáp.')
          return
        }

        const trivia = resolveTrivia(state, answerIndex)
        if (trivia) {
          result = {
            ...ok,
            cardEffect: trivia.cardEffect,
            cardSaved: trivia.cardSaved,
            cardUsedImmediately: trivia.cardUsedImmediately,
          }
        }
        state.currentQuestion = null
        openTacticalPhase(state)
      })
      return result
    },

    /* ================================================================ */
    /* Vòng Chiến thuật                                                 */
    /* ================================================================ */

    playCard: (instanceId, target = { kind: 'none' }) => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        if (!player) {
          result = no('Chưa xác định được nhóm đang tới lượt.')
          return
        }
        if (state.phase !== 'pre-roll' && state.phase !== 'action') {
          result = no('Chỉ được dùng thẻ ở Vòng Chiến thuật hoặc Vòng Hành động.')
          return
        }

        const played = playCard(state, player.id, instanceId, target)
        if (!played.ok) {
          result = no(played.reason ?? 'Không dùng được thẻ này.')
          return
        }

        // Thoát ô Kẹt xe bằng thẻ → nhóm được đi tiếp ngay trong lượt này.
        if (played.effect === 'escape-jail' && state.pendingAction.kind === 'jailed') {
          state.pendingAction = { kind: 'idle' }
          state.phase = 'pre-roll'
        }

        // Chuyến Bay Đêm thay luôn lượt di chuyển.
        if (played.movedPlayer && state.phase === 'pre-roll') {
          state.pendingAction = resolveLanding(state, player.id)
          state.phase = 'action'
        }

        // Miễn phí lưu trú dùng ngay khi đang bị tính tiền → cập nhật lại số tiền.
        if (played.effect === 'free-stay' && state.pendingAction.kind === 'rent') {
          state.pendingAction = { ...state.pendingAction, rent: 0 }
        }
      })
      return result
    },

    chooseTravelDestination: (tileId) => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        if (!player) {
          result = no('Chưa xác định được nhóm đang tới lượt.')
          return
        }
        if (state.pendingAction.kind !== 'travel-choose') {
          result = no('Nhóm không có quyền bay ở lượt này.')
          return
        }

        player.pendingTravel = false
        teleportPlayer(state, player.id, tileId)

        const tile = getTile(tileId)
        pushLog(state, 'success', `${player.name} bay thẳng tới ${tile.name}.`, player.id)

        state.pendingAction = resolveLanding(state, player.id)
        state.phase = 'action'
      })
      return result
    },

    skipTravel: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        if (!player || state.pendingAction.kind !== 'travel-choose') {
          result = no('Không có chuyến bay nào để bỏ qua.')
          return
        }
        player.pendingTravel = false
        state.pendingAction = { kind: 'idle' }
        pushLog(state, 'info', `${player.name} không dùng quyền bay, đổ xúc xắc như thường.`, player.id)
      })
      return result
    },

    /* ================================================================ */
    /* Vòng Di chuyển                                                   */
    /* ================================================================ */

    rollDice: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        if (!player) {
          result = no('Chưa xác định được nhóm đang tới lượt.')
          return
        }
        if (state.phase !== 'pre-roll') {
          result = no('Chưa tới bước đổ xúc xắc.')
          return
        }
        if (state.pendingAction.kind === 'travel-choose') {
          result = no('Nhóm cần chọn điểm đến hoặc bỏ qua quyền bay trước.')
          return
        }

        state.dice = rollDiceCore(state, player.id)
        state.phase = 'rolling'
        pushLog(
          state,
          'info',
          `${player.name} đổ được ${state.dice[0]} + ${state.dice[1]} = ${state.dice[0] + state.dice[1]}.`,
          player.id,
        )
      })
      return result
    },

    setDiceResult: (dice) => {
      let result: ActionResult = ok
      set((state) => {
        if (state.phase !== 'pre-roll' && state.phase !== 'rolling') {
          result = no('Chưa tới bước đổ xúc xắc.')
          return
        }
        state.dice = dice
        state.phase = 'rolling'
      })
      return result
    },

    markMoving: () =>
      set((state) => {
        if (state.phase === 'rolling') state.phase = 'moving'
      }),

    applyMovement: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        if (!player) {
          result = no('Chưa xác định được nhóm đang tới lượt.')
          return
        }
        if (state.phase !== 'rolling' && state.phase !== 'moving') {
          result = no('Chưa có kết quả xúc xắc để di chuyển.')
          return
        }
        if (!state.dice) {
          result = no('Chưa có kết quả xúc xắc.')
          return
        }

        const steps = state.dice[0] + state.dice[1]
        const move = movePlayer(state, player.id, steps)
        const tile = getTile(move.to)

        pushLog(state, 'info', `${player.name} đi ${steps} bước và dừng tại ${tile.name}.`, player.id)
        pushEvent(state, 'player-moved', player.id, { tileId: move.to })

        state.pendingAction = resolveLanding(state, player.id)
        state.phase = 'action'
      })
      return result
    },

    /* ================================================================ */
    /* Vòng Hành động                                                   */
    /* ================================================================ */

    confirmBuy: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        const pending = state.pendingAction
        if (!player || pending.kind !== 'buy') {
          result = no('Hiện không có lời mời đầu tư nào.')
          return
        }
        if (!buyProperty(state, player.id, pending.tileId)) {
          result = no('Nhóm không đủ tiền mặt để đầu tư.')
          return
        }
        state.pendingAction = { kind: 'idle' }
      })
      return result
    },

    confirmUpgrade: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        const pending = state.pendingAction
        if (!player || pending.kind !== 'upgrade') {
          result = no('Hiện không có công trình nào chờ nâng cấp.')
          return
        }
        if (!upgradeProperty(state, player.id, pending.tileId)) {
          result = no('Không đủ điều kiện nâng cấp công trình này.')
          return
        }
        state.pendingAction = { kind: 'idle' }
      })
      return result
    },

    payRent: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        const pending = state.pendingAction
        if (!player || pending.kind !== 'rent') {
          result = no('Hiện không có khoản lưu trú nào phải nộp.')
          return
        }

        const tile = getPropertyTile(pending.tileId)

        if (pending.rent <= 0) {
          pushLog(
            state,
            'success',
            `${player.name} được miễn phí lưu trú tại ${tile.province}.`,
            player.id,
          )
          state.pendingAction = { kind: 'idle' }
          return
        }

        const settlement = settleDebt(
          state,
          player.id,
          pending.rent,
          pending.ownerId,
          `tiền tham quan ${tile.province} – ${tile.name}`,
        )

        player.stats.rentPaid += settlement.paid
        const owner = state.players.find((p) => p.id === pending.ownerId)
        if (owner) owner.stats.rentCollected += settlement.paid

        pushEvent(state, 'rent-paid', player.id, {
          tileId: pending.tileId,
          amount: settlement.paid,
        })
        state.pendingAction = { kind: 'idle' }
      })
      return result
    },

    confirmTakeover: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        const pending = state.pendingAction
        if (!player || pending.kind !== 'rent') {
          result = no('Hiện không có ô đất nào để thâu tóm.')
          return
        }
        if (pending.takeoverCost === null) {
          result = no(pending.takeoverBlockedReason ?? 'Không thể thâu tóm ô đất này.')
          return
        }

        // Thâu tóm thay cho việc nộp tiền lưu trú: nhóm mua đứt thay vì trả phí.
        if (!takeoverProperty(state, player.id, pending.tileId)) {
          result = no('Bảo Hộ Di Sản đã chặn thương vụ; lá chắn hiện đã được sử dụng.')
          state.pendingAction = { kind: 'idle' }
          return
        }
        state.pendingAction = { kind: 'idle' }
      })
      return result
    },

    payTax: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        const pending = state.pendingAction
        if (!player || pending.kind !== 'tax') {
          result = no('Hiện không có khoản thuế nào phải nộp.')
          return
        }
        settleDebt(state, player.id, pending.amount, null, getTile(pending.tileId).name)
        state.pendingAction = { kind: 'idle' }
      })
      return result
    },

    chooseFestivalTile: (tileId) => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        const pending = state.pendingAction
        if (!player || pending.kind !== 'festival') {
          result = no('Hiện không ở ô Đăng cai lễ hội.')
          return
        }
        if (!pending.eligibleTileIds.includes(tileId)) {
          result = no('Địa danh này không đủ điều kiện đăng cai.')
          return
        }
        if (!startFestival(state, player.id, tileId)) {
          result = no('Không tổ chức được lễ hội tại địa danh này.')
          return
        }
        state.pendingAction = { kind: 'idle' }
      })
      return result
    },

    drawChanceCard: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        if (!player || state.pendingAction.kind !== 'chance') {
          result = no('Hiện không ở ô Cơ hội.')
          return
        }
        const drawn = drawCard(state, player.id, { immediate: true })
        result = {
          ...ok,
          cardEffect: drawn.card?.effect ?? null,
          cardSaved: drawn.saved,
          cardUsedImmediately: drawn.usedImmediately,
          cardMovedPlayer: drawn.movedPlayer,
        }
        state.pendingAction = drawn.movedPlayer ? resolveLanding(state, player.id) : { kind: 'idle' }
      })
      return result
    },

    payBail: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        const pending = state.pendingAction
        if (!player || pending.kind !== 'jailed') {
          result = no('Nhóm không ở trong ô Kẹt xe.')
          return
        }
        if (player.cash < pending.bail) {
          result = no(`Nhóm không đủ ${formatMoney(pending.bail)} để trả phí giải tỏa.`)
          return
        }

        settleDebt(state, player.id, pending.bail, null, 'phí giải tỏa ô Kẹt xe')
        releaseFromJail(state, player.id, 'trả phí giải tỏa')

        state.pendingAction = { kind: 'idle' }
        state.phase = 'pre-roll'
      })
      return result
    },

    declineAction: () => {
      let result: ActionResult = ok
      set((state) => {
        const player = getCurrentPlayer(state)
        const pending = state.pendingAction

        switch (pending.kind) {
          case 'buy': {
            const tile = getPropertyTile(pending.tileId)
            if (player) {
              pushLog(
                state,
                'info',
                `${player.name} bỏ qua cơ hội đầu tư ${tile.province} (${formatPropertyPrice(pending.price)}).`,
                player.id,
              )
            }
            break
          }
          case 'upgrade': {
            const tile = getPropertyTile(pending.tileId)
            if (player) {
              pushLog(state, 'info', `${player.name} chưa nâng cấp ${tile.province} lần này.`, player.id)
            }
            break
          }
          case 'festival': {
            if (player) {
              pushLog(state, 'info', `${player.name} không đăng cai lễ hội lượt này.`, player.id)
            }
            break
          }
          case 'jailed': {
            if (player) {
              pushLog(state, 'info', `${player.name} chấp nhận nghỉ lượt tại ô Kẹt xe.`, player.id)
              serveJailTurn(state)
            }
            break
          }
          case 'rent': {
            result = no('Khoản tiền lưu trú là bắt buộc, không thể bỏ qua.')
            return
          }
          case 'tax': {
            result = no('Khoản thuế là bắt buộc, không thể bỏ qua.')
            return
          }
          default:
            break
        }

        state.pendingAction = { kind: 'idle' }
      })
      return result
    },

    /* ================================================================ */
    /* Chốt lượt & đồng hồ tổng                                         */
    /* ================================================================ */

    endTurn: () => {
      let result: ActionResult = ok
      set((state) => {
        if (state.phase !== 'action') {
          result = no('Chỉ có thể chốt lượt sau khi hoàn tất Vòng Hành động.')
          return
        }
        if (state.pendingAction.kind === 'rent' || state.pendingAction.kind === 'tax') {
          result = no('Nhóm phải hoàn tất khoản thanh toán bắt buộc trước khi chốt lượt.')
          return
        }
        if (state.pendingAction.kind !== 'idle') {
          result = no('Hãy xử lý hoặc bỏ qua hành động hiện tại trước khi chốt lượt.')
          return
        }

        const finished = endTurnCore(state)
        if (!finished) beginTurn(state)
      })
      return result
    },

    tick: (elapsedMs) =>
      set((state) => {
        tickTimer(state, elapsedMs)
      }),

    pauseTimer: () =>
      set((state) => {
        state.isTimerRunning = false
      }),

    resumeTimer: () =>
      set((state) => {
        if (
          state.phase !== 'lobby' &&
          state.phase !== 'game-over' &&
          state.turnCount > 0 &&
          !state.isFinalTurn
        ) {
          state.isTimerRunning = true
        }
      }),

    finishMatch: (reason = 'Host kết thúc ván sớm') =>
      set((state) => {
        endMatch(state, reason)
      }),
  })),
  {
    name: STORAGE_KEY,
    version: 1,
    storage: gameStorage,
    // Chỉ lưu dữ liệu ván đấu (GameCore); bỏ qua các action (hàm).
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(([, value]) => typeof value !== 'function'),
      ) as unknown as GameCore,
  },
))

/* ------------------------------------------------------------------ */
/* Điều hướng nội bộ                                                   */
/* ------------------------------------------------------------------ */

/**
 * Sau Vòng Hỏi Đáp: nhóm đang kẹt xe thì xử lý ô Kẹt xe,
 * nhóm vừa qua Sân bay thì được mời chọn điểm bay, còn lại vào Vòng Chiến thuật.
 */
function openTacticalPhase(state: GameCore): void {
  const player = getCurrentPlayer(state)
  if (!player) return

  if (player.status === 'jailed') {
    state.phase = 'action'
    state.pendingAction = {
      kind: 'jailed',
      bail: GAME_CONFIG.JAIL_BAIL,
      turnsLeft: player.jailTurnsLeft,
    }
    return
  }

  state.phase = 'pre-roll'
  state.pendingAction = player.pendingTravel ? { kind: 'travel-choose' } : { kind: 'idle' }
}

/* ------------------------------------------------------------------ */
/* Tiện ích cho Giai đoạn 2 & 3                                        */
/* ------------------------------------------------------------------ */

/** Đọc trạng thái hiện tại ngoài React (dùng cho vòng lặp render 3D). */
export function getGameSnapshot(): GameStore {
  return useGameStore.getState()
}

/** Trạng thái một ô đất, tiện cho component Tile ở Giai đoạn 2. */
export function selectPropertyState(state: GameStore, tileId: TileId) {
  return getPropertyState(state, tileId)
}

/** Nhóm đang tới lượt — dùng nhiều nhất trên Host Dashboard. */
export function selectCurrentPlayer(state: GameStore) {
  return getCurrentPlayer(state)
}

/** Nhóm theo id. */
export function selectPlayer(state: GameStore, playerId: PlayerId) {
  return state.players.find((p) => p.id === playerId)
}

/** Đồng hồ tổng đã bước vào 5 phút cuối chưa (để đổi màu đỏ và nhấp nháy). */
export function selectIsEndgameWarning(state: GameStore): boolean {
  return (
    state.phase !== 'lobby' &&
    state.phase !== 'game-over' &&
    state.timeRemainingMs <= GAME_CONFIG.ENDGAME_WARNING_MS
  )
}
