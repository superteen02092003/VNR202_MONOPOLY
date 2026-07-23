import { beforeEach, describe, expect, it } from 'vitest'

import { GAME_CONFIG } from '../../core/config'
import { getPropertyTile } from '../../core/logic/board'
import { selectCurrentPlayer, useGameStore } from '../useGameStore'
import type { PlayerSetup } from '../../core/logic/setup'

const SETUPS: PlayerSetup[] = [
  { id: 'p1', name: 'Nhóm 1', characterId: 'doraemon' },
  { id: 'p2', name: 'Nhóm 2', characterId: 'pikachu' },
  { id: 'p3', name: 'Nhóm 3', characterId: 'kirby' },
]

const store = () => useGameStore.getState()

/** currentPlayerIndex trỏ vào turnOrder chứ không phải mảng players. */
const currentId = () => store().turnOrder[store().currentPlayerIndex]

/** Mở ván tất định: cùng hạt giống, thứ tự đi p1 → p2 → p3. */
function newMatch() {
  store().resetGame(20250203)
  const result = store().startGame(SETUPS, { randomizeTurnOrder: false })
  expect(result.ok).toBe(true)
  expect(store().beginGame().ok).toBe(true)
}

/** Đưa nhóm đang tới lượt dừng đúng ô mong muốn, bỏ qua ngẫu nhiên của xúc xắc. */
function landOn(tileId: number) {
  const playerId = currentId()
  useGameStore.setState((s) => {
    const target = s.players.find((p) => p.id === playerId)!
    // Lùi lại đúng 2 bước để cú đổ xúc xắc [1,1] đáp xuống ô cần test.
    target.position = (tileId - 2 + GAME_CONFIG.BOARD_SIZE) % GAME_CONFIG.BOARD_SIZE
  })
  store().setDiceResult([1, 1])
  store().applyMovement()
}

/** Quay vòng cho tới khi p1 lại tới lượt, các nhóm khác đi cho xong. */
function playUntilP1() {
  while (currentId() !== 'p1') {
    store().answerTrivia(null)
    store().rollDice()
    store().applyMovement()
    store().declineAction()
    store().endTurn()
  }
}

beforeEach(() => {
  newMatch()
})

describe('Khởi tạo ván', () => {
  it('chờ Host bấm bắt đầu trước khi mở câu hỏi và chạy đồng hồ', () => {
    store().resetGame(20250203)
    const result = store().startGame(SETUPS, { randomizeTurnOrder: false })

    expect(result.ok).toBe(true)
    expect(store().phase).toBe('turn-end')
    expect(store().turnCount).toBe(0)
    expect(store().currentQuestion).toBeNull()
    expect(store().isTimerRunning).toBe(false)

    store().resumeTimer()
    expect(store().isTimerRunning).toBe(false)

    expect(store().beginGame().ok).toBe(true)
    expect(store().phase).toBe('trivia')
    expect(store().turnCount).toBe(1)
    expect(store().currentQuestion).not.toBeNull()
    expect(store().isTimerRunning).toBe(true)
    expect(store().beginGame().ok).toBe(false)
  })

  it('mở đúng Vòng Hỏi Đáp với đủ nhóm và tiền khởi điểm', () => {
    const state = store()
    expect(state.phase).toBe('trivia')
    expect(state.players).toHaveLength(3)
    expect(state.turnOrder).toEqual(['p1', 'p2', 'p3'])
    expect(state.currentQuestion).not.toBeNull()
    expect(state.players.every((p) => p.cash === GAME_CONFIG.STARTING_CASH)).toBe(true)
    expect(state.players.every((p) => p.position === GAME_CONFIG.TILE_START)).toBe(true)
  })

  it('từ chối ván có hai nhóm chọn trùng nhân vật', () => {
    store().resetGame(1)
    const result = store().startGame([
      { id: 'p1', name: 'Nhóm 1', characterId: 'kirby' },
      { id: 'p2', name: 'Nhóm 2', characterId: 'kirby' },
    ])
    expect(result.ok).toBe(false)
    expect(store().phase).toBe('lobby')
  })

  it('từ chối ván chỉ có một nhóm', () => {
    store().resetGame(1)
    const result = store().startGame([{ id: 'p1', name: 'Nhóm 1', characterId: 'kirby' }])
    expect(result.ok).toBe(false)
  })

  it('khi xáo trộn thứ tự đi, nhóm tới lượt lấy theo turnOrder chứ không theo mảng players', () => {
    store().resetGame(20250203)
    store().startGame(SETUPS, { randomizeTurnOrder: true })
    store().beginGame()

    const state = store()
    // Hạt giống này cho ra một thứ tự khác với thứ tự khai báo, đủ để lộ lỗi lập chỉ mục.
    expect(state.turnOrder).not.toEqual(['p1', 'p2', 'p3'])
    expect([...state.turnOrder].sort()).toEqual(['p1', 'p2', 'p3'])

    // selectCurrentPlayer phải bám theo turnOrder.
    expect(selectCurrentPlayer(state)?.id).toBe(state.turnOrder[0])

    // Đi hết một vòng thì phải gặp đúng cả ba nhóm theo thứ tự đã bốc.
    const visited: string[] = []
    for (let i = 0; i < 3; i++) {
      visited.push(currentId())
      store().answerTrivia(null)
      store().rollDice()
      store().applyMovement()
      store().declineAction()
      store().endTurn()
    }
    expect(visited).toEqual(state.turnOrder)
  })
})

describe('Luồng một lượt chơi', () => {
  it('đi hết Hỏi Đáp → Chiến thuật → Di chuyển → Hành động → Chốt lượt', () => {
    const question = store().currentQuestion!

    // 1. Vòng Hỏi Đáp
    store().answerTrivia(question.answerIndex)
    expect(store().phase).toBe('pre-roll')
    expect(store().triviaResult).toBe('correct')
    expect(store().players[0].cards).toHaveLength(1)

    // 2. Vòng Di chuyển
    expect(store().rollDice().ok).toBe(true)
    expect(store().phase).toBe('rolling')
    expect(store().dice).not.toBeNull()

    // 3. Vòng Hành động
    store().applyMovement()
    expect(store().phase).toBe('action')

    // 4. Chốt lượt → sang nhóm kế tiếp
    store().declineAction()
    store().endTurn()
    expect(store().phase).toBe('trivia')
    expect(currentId()).toBe('p2')
  })

  it('không cho đổ xúc xắc khi chưa trả lời câu hỏi', () => {
    const result = store().rollDice()
    expect(result.ok).toBe(false)
    expect(store().phase).toBe('trivia')
  })

  it('trả lời sai thì không được rút thẻ', () => {
    const question = store().currentQuestion!
    store().answerTrivia((question.answerIndex + 1) % 4)
    expect(store().triviaResult).toBe('wrong')
    expect(store().players[0].cards).toHaveLength(0)
  })
})

describe('Vòng Hành động — đầu tư và nâng cấp', () => {
  const HANOI = 9

  it('mua đất trống rồi nâng cấp ở lần ghé sau', () => {
    const tile = getPropertyTile(HANOI)

    store().answerTrivia(null)
    landOn(HANOI)

    expect(store().pendingAction.kind).toBe('buy')
    const cashBefore = store().players[0].cash

    expect(store().confirmBuy().ok).toBe(true)
    expect(store().players[0].cash).toBe(cashBefore - tile.price)
    expect(store().properties[HANOI].ownerId).toBe('p1')
    expect(store().properties[HANOI].level).toBe(1)

    // Vòng sau p1 ghé lại chính ô của mình → được mời nâng cấp.
    store().endTurn()
    playUntilP1()

    store().answerTrivia(null)
    landOn(HANOI)
    expect(store().pendingAction.kind).toBe('upgrade')

    expect(store().confirmUpgrade().ok).toBe(true)
    expect(store().properties[HANOI].level).toBe(2)
  })

  it('từ chối đầu tư thì ô đất vẫn trống', () => {
    store().answerTrivia(null)
    landOn(HANOI)

    expect(store().declineAction().ok).toBe(true)
    expect(store().properties[HANOI].ownerId).toBeNull()
    expect(store().pendingAction.kind).toBe('idle')
  })
})

describe('Vòng Hành động — đất đối thủ', () => {
  const HANOI = 9

  function giveHanoiToP2(level: 1 | 2 | 3 | 4, invested: number) {
    useGameStore.setState((s) => {
      s.properties[HANOI] = {
        tileId: HANOI,
        ownerId: 'p2',
        level,
        invested,
        festivalTurnsLeft: 0,
        shielded: false,
      }
    })
  }

  it('tự động tính tiền lưu trú và chuyển cho chủ đất', () => {
    giveHanoiToP2(2, 240)
    store().answerTrivia(null)
    landOn(HANOI)

    const pending = store().pendingAction
    expect(pending.kind).toBe('rent')
    if (pending.kind !== 'rent') return

    const payerBefore = store().players[0].cash
    const ownerBefore = store().players[1].cash

    expect(store().payRent().ok).toBe(true)
    expect(store().players[0].cash).toBe(payerBefore - pending.rent)
    expect(store().players[1].cash).toBe(ownerBefore + pending.rent)
    expect(store().players[1].stats.rentCollected).toBe(pending.rent)
  })

  it('không cho chốt lượt khi chưa thanh toán tiền lưu trú', () => {
    giveHanoiToP2(2, 240)
    store().answerTrivia(null)
    landOn(HANOI)

    expect(store().endTurn().ok).toBe(false)
    expect(store().declineAction().ok).toBe(false)
    expect(store().phase).toBe('action')
  })

  it('cho phép thâu tóm đất đối thủ thay vì nộp tiền', () => {
    giveHanoiToP2(2, 240)
    store().answerTrivia(null)
    landOn(HANOI)

    const pending = store().pendingAction
    expect(pending.kind).toBe('rent')
    if (pending.kind !== 'rent') return
    expect(pending.takeoverCost).toBe(480)

    expect(store().confirmTakeover().ok).toBe(true)
    expect(store().properties[HANOI].ownerId).toBe('p1')
    expect(store().properties[HANOI].level).toBe(2)
  })

  it('chặn thâu tóm Biểu tượng Địa phương', () => {
    giveHanoiToP2(4, 840)
    store().answerTrivia(null)
    landOn(HANOI)

    const pending = store().pendingAction
    expect(pending.kind).toBe('rent')
    if (pending.kind !== 'rent') return

    expect(pending.takeoverCost).toBeNull()
    expect(pending.takeoverBlockedReason).toContain('Biểu tượng Địa phương')
    expect(store().confirmTakeover().ok).toBe(false)
    expect(store().properties[HANOI].ownerId).toBe('p2')
  })
})

describe('Các ô đặc biệt', () => {
  it('ô Kẹt xe giữ nhóm lại và chặn đổ xúc xắc', () => {
    store().answerTrivia(null)
    landOn(GAME_CONFIG.TILE_JAIL)

    expect(store().players[0].status).toBe('jailed')
    expect(store().pendingAction.kind).toBe('jail')

    store().declineAction()
    store().endTurn()
    playUntilP1()

    // Tới lượt p1: bị đưa thẳng vào trạng thái chờ ở ô Kẹt xe.
    store().answerTrivia(null)
    expect(store().phase).toBe('action')
    expect(store().pendingAction.kind).toBe('jailed')
    expect(store().rollDice().ok).toBe(false)
  })

  it('trả phí giải tỏa để thoát ô Kẹt xe ngay trong lượt', () => {
    store().answerTrivia(null)
    landOn(GAME_CONFIG.TILE_JAIL)
    store().declineAction()
    store().endTurn()
    playUntilP1()

    store().answerTrivia(null)
    const cashBefore = store().players[0].cash

    expect(store().payBail().ok).toBe(true)
    expect(store().players[0].status).toBe('active')
    expect(store().players[0].cash).toBe(cashBefore - GAME_CONFIG.JAIL_BAIL)
    expect(store().phase).toBe('pre-roll')
    expect(store().rollDice().ok).toBe(true)
  })

  it('ô Sân bay Quốc tế cho phép bay ở lượt kế tiếp', () => {
    store().answerTrivia(null)
    landOn(GAME_CONFIG.TILE_TRAVEL)

    expect(store().pendingAction.kind).toBe('travel')
    expect(store().players[0].pendingTravel).toBe(true)

    store().declineAction()
    store().endTurn()
    playUntilP1()

    store().answerTrivia(null)
    expect(store().pendingAction.kind).toBe('travel-choose')
    // Chưa chọn điểm đến thì chưa được đổ xúc xắc.
    expect(store().rollDice().ok).toBe(false)

    expect(store().chooseTravelDestination(31).ok).toBe(true)
    expect(store().players[0].position).toBe(31)
    expect(store().phase).toBe('action')
  })

  it('ô Đăng cai Festival nhân đôi tiền thu của địa danh được chọn', () => {
    const HANOI = 9
    useGameStore.setState((s) => {
      s.properties[HANOI] = {
        tileId: HANOI,
        ownerId: 'p1',
        level: 3,
        invested: 440,
        festivalTurnsLeft: 0,
        shielded: false,
      }
    })

    store().answerTrivia(null)
    landOn(GAME_CONFIG.TILE_FESTIVAL)

    const pending = store().pendingAction
    expect(pending.kind).toBe('festival')
    if (pending.kind !== 'festival') return
    expect(pending.eligibleTileIds).toContain(HANOI)

    expect(store().chooseFestivalTile(HANOI).ok).toBe(true)
    expect(store().properties[HANOI].festivalTurnsLeft).toBe(GAME_CONFIG.FESTIVAL_DURATION_TURNS)
  })

  it('ô Thuế bắt buộc nộp cho ngân hàng', () => {
    const TAX_TILE = 12
    store().answerTrivia(null)
    landOn(TAX_TILE)

    const pending = store().pendingAction
    expect(pending.kind).toBe('tax')
    if (pending.kind !== 'tax') return

    const before = store().players[0].cash
    expect(store().payTax().ok).toBe(true)
    expect(store().players[0].cash).toBe(before - pending.amount)
  })

  it('ô Cơ hội cho rút thêm một thẻ', () => {
    const CHANCE_TILE = 4
    store().answerTrivia(null)
    landOn(CHANCE_TILE)

    expect(store().pendingAction.kind).toBe('chance')
    expect(store().drawChanceCard().ok).toBe(true)
    expect(store().players[0].cards).toHaveLength(1)
  })
})

describe('Thẻ Cơ hội', () => {
  it('thẻ Chỉ Đạo Chiến Lược ép đúng tổng điểm xúc xắc', () => {
    useGameStore.setState((s) => {
      s.players[0].cards = [{ instanceId: 'card-test', effect: 'choose-dice' }]
    })

    store().answerTrivia(null)
    expect(store().playCard('card-test', { kind: 'dice', total: 9 }).ok).toBe(true)
    expect(store().players[0].forcedDiceTotal).toBe(9)

    store().rollDice()
    const dice = store().dice!
    expect(dice[0] + dice[1]).toBe(9)
    expect(dice[0]).toBeGreaterThanOrEqual(1)
    expect(dice[1]).toBeLessThanOrEqual(6)
  })

  it('thẻ Giấy Miễn Phí Tham Quan xóa sạch tiền lưu trú', () => {
    const HANOI = 9
    useGameStore.setState((s) => {
      s.properties[HANOI] = {
        tileId: HANOI,
        ownerId: 'p2',
        level: 3,
        invested: 440,
        festivalTurnsLeft: 0,
        shielded: false,
      }
      s.players[0].cards = [{ instanceId: 'card-free', effect: 'free-stay' }]
    })

    store().answerTrivia(null)
    store().playCard('card-free')
    landOn(HANOI)

    const pending = store().pendingAction
    expect(pending.kind).toBe('rent')
    if (pending.kind !== 'rent') return
    expect(pending.rent).toBe(0)

    const before = store().players[0].cash
    store().payRent()
    expect(store().players[0].cash).toBe(before)
  })

  it('thẻ Chuyến Bay Đêm thay luôn lượt di chuyển', () => {
    useGameStore.setState((s) => {
      s.players[0].cards = [{ instanceId: 'card-fly', effect: 'teleport' }]
    })

    store().answerTrivia(null)
    expect(store().playCard('card-fly', { kind: 'tile', tileId: 31 }).ok).toBe(true)
    expect(store().players[0].position).toBe(31)
    expect(store().phase).toBe('action')
    expect(store().pendingAction.kind).toBe('buy')
  })

  it('thẻ Gói Kích Cầu cộng tiền ngay', () => {
    useGameStore.setState((s) => {
      s.players[0].cards = [{ instanceId: 'card-money', effect: 'stimulus' }]
    })

    store().answerTrivia(null)
    const before = store().players[0].cash
    expect(store().playCard('card-money').ok).toBe(true)
    expect(store().players[0].cash).toBe(before + GAME_CONFIG.STIMULUS_AMOUNT)
    expect(store().players[0].cards).toHaveLength(0)
  })

  it('thẻ dùng sai mục tiêu thì không bị tiêu hủy', () => {
    useGameStore.setState((s) => {
      s.players[0].cards = [{ instanceId: 'card-shield', effect: 'heritage-shield' }]
    })

    store().answerTrivia(null)
    // Ô 9 không thuộc sở hữu của p1 → thao tác thất bại.
    const result = store().playCard('card-shield', { kind: 'tile', tileId: 9 })
    expect(result.ok).toBe(false)
    expect(store().players[0].cards).toHaveLength(1)
  })
})

describe('Đồng hồ tổng', () => {
  it('hết giờ thì nhóm hiện tại đi nốt lượt rồi chốt bảng xếp hạng', () => {
    useGameStore.setState((s) => {
      s.timeRemainingMs = 1_000
    })

    store().tick(1_000)
    expect(store().isFinalTurn).toBe(true)
    expect(store().phase).toBe('trivia')

    store().answerTrivia(null)
    store().rollDice()
    store().applyMovement()
    store().declineAction()
    store().endTurn()

    expect(store().phase).toBe('game-over')
    expect(store().standings).toHaveLength(3)
    expect(store().standings![0].rank).toBe(1)
  })

  it('Host có thể kết thúc ván sớm', () => {
    store().finishMatch('Host kết thúc sớm')
    expect(store().phase).toBe('game-over')
    expect(store().standings).not.toBeNull()
  })
})
