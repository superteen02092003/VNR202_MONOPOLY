import { describe, expect, it } from 'vitest'

import { GAME_CONFIG } from '../config'
import { getCurrentPlayer, getPlayer } from '../logic/players'
import { movePlayer, sendToJail, teleportPlayer } from '../logic/movement'
import { declareBankruptcy } from '../logic/payments'
import { computeStandings } from '../logic/scoring'
import { advanceToNextPlayer, beginTurn, endTurn, tickTimer } from '../logic/turn'
import { createTestGame, forceOwn } from './helpers'

describe('Di chuyển', () => {
  it('thưởng khi đi ngang qua ô Xuất phát', () => {
    const state = createTestGame()
    const player = getPlayer(state, 'p1')
    player.position = 30
    const before = player.cash

    const move = movePlayer(state, 'p1', 5)

    expect(move.to).toBe(3)
    expect(move.passedStart).toBe(true)
    expect(move.startBonus).toBe(GAME_CONFIG.PASS_START_BONUS)
    expect(player.cash).toBe(before + GAME_CONFIG.PASS_START_BONUS)
    expect(player.stats.lapsCompleted).toBe(1)
  })

  it('thưởng gấp đôi khi dừng đúng ô Xuất phát', () => {
    const state = createTestGame()
    const player = getPlayer(state, 'p1')
    player.position = 30
    const before = player.cash

    const move = movePlayer(state, 'p1', 2)

    expect(move.to).toBe(GAME_CONFIG.TILE_START)
    expect(move.landedOnStart).toBe(true)
    expect(player.cash).toBe(before + GAME_CONFIG.LAND_ON_START_BONUS)
  })

  it('không thưởng khi chưa đi hết vòng', () => {
    const state = createTestGame()
    const player = getPlayer(state, 'p1')
    player.position = 5
    const before = player.cash

    const move = movePlayer(state, 'p1', 6)

    expect(move.to).toBe(11)
    expect(move.passedStart).toBe(false)
    expect(player.cash).toBe(before)
  })

  it('bay thẳng (teleport) không nhận thưởng ô Xuất phát', () => {
    const state = createTestGame()
    const player = getPlayer(state, 'p1')
    player.position = 30
    const before = player.cash

    teleportPlayer(state, 'p1', 3)

    expect(player.position).toBe(3)
    expect(player.cash).toBe(before)
  })
})

describe('Ô Kẹt xe – Cách ly', () => {
  it('giữ nhóm lại đúng 3 lượt', () => {
    const state = createTestGame()
    sendToJail(state, 'p1')

    const player = getPlayer(state, 'p1')
    expect(player.status).toBe('jailed')
    expect(player.position).toBe(GAME_CONFIG.TILE_JAIL)
    expect(player.jailTurnsLeft).toBe(GAME_CONFIG.JAIL_TURNS)

    // Ba lần tới lượt p1 là ba lượt nghỉ.
    for (let i = 0; i < GAME_CONFIG.JAIL_TURNS; i++) {
      state.currentPlayerIndex = 0
      endTurn(state)
    }

    expect(getPlayer(state, 'p1').status).toBe('active')
    expect(getPlayer(state, 'p1').jailTurnsLeft).toBe(0)
  })
})

describe('Xoay tua lượt', () => {
  it('chuyển lần lượt qua từng nhóm rồi quay vòng', () => {
    const state = createTestGame()
    expect(getCurrentPlayer(state)?.id).toBe('p1')

    advanceToNextPlayer(state)
    expect(getCurrentPlayer(state)?.id).toBe('p2')

    advanceToNextPlayer(state)
    expect(getCurrentPlayer(state)?.id).toBe('p3')

    advanceToNextPlayer(state)
    expect(getCurrentPlayer(state)?.id).toBe('p1')
  })

  it('bỏ qua nhóm đã phá sản', () => {
    const state = createTestGame()
    declareBankruptcy(state, 'p2', null)

    advanceToNextPlayer(state)
    expect(getCurrentPlayer(state)?.id).toBe('p3')
  })

  it('mỗi lượt mới đều rút câu hỏi và mở Vòng Hỏi Đáp', () => {
    const state = createTestGame()
    beginTurn(state)

    expect(state.phase).toBe('trivia')
    expect(state.currentQuestion).not.toBeNull()
    expect(state.turnCount).toBeGreaterThan(0)
  })

  it('xóa hiệu ứng tạm thời khi sang lượt mới', () => {
    const state = createTestGame()
    const player = getPlayer(state, 'p1')
    player.rentImmunity = true
    player.forcedDiceTotal = 12

    beginTurn(state)

    expect(player.rentImmunity).toBe(false)
    expect(player.forcedDiceTotal).toBeNull()
  })
})

describe('Đồng hồ tổng & kết thúc ván', () => {
  it('hết giờ thì bật cờ lượt cuối chứ chưa dừng ngay', () => {
    const state = createTestGame({ matchMinutes: 1 })
    state.timeRemainingMs = 5_000

    expect(tickTimer(state, 5_000)).toBe(true)
    expect(state.isFinalTurn).toBe(true)
    expect(state.phase).not.toBe('game-over')
  })

  it('đóng băng bàn cờ sau khi nhóm hiện tại đi nốt lượt cuối', () => {
    const state = createTestGame()
    state.timeRemainingMs = 0
    tickTimer(state, 1_000)

    const finished = endTurn(state)

    expect(finished).toBe(true)
    expect(state.phase).toBe('game-over')
    expect(state.standings).not.toBeNull()
  })

  it('kết thúc sớm khi chỉ còn một nhóm chưa phá sản', () => {
    const state = createTestGame()
    declareBankruptcy(state, 'p2', null)
    declareBankruptcy(state, 'p3', null)

    expect(endTurn(state)).toBe(true)
    expect(state.phase).toBe('game-over')
  })
})

describe('Bảng xếp hạng', () => {
  it('xếp theo tổng tài sản, nhóm phá sản luôn đứng cuối', () => {
    const state = createTestGame()
    getPlayer(state, 'p1').cash = 500
    getPlayer(state, 'p2').cash = 2000
    getPlayer(state, 'p3').cash = 9999

    forceOwn(state, 9, 'p1', 4, 840)
    declareBankruptcy(state, 'p3', null)

    const standings = computeStandings(state)

    expect(standings[0].playerId).toBe('p2') // 2000 tiền mặt
    expect(standings[1].playerId).toBe('p1') // 500 + 840 vốn công trình = 1340
    expect(standings[1].netWorth).toBe(1340)
    // p3 nhiều tiền mặt nhất nhưng đã phá sản → luôn đứng cuối bảng.
    expect(standings[2].playerId).toBe('p3')
    expect(standings[2].status).toBe('bankrupt')
  })

  it('tính đủ số Biểu tượng Địa phương của từng nhóm', () => {
    const state = createTestGame()
    forceOwn(state, 9, 'p1', 4, 840)
    forceOwn(state, 15, 'p1', 4, 900)
    forceOwn(state, 1, 'p1', 2, 110)

    const row = computeStandings(state).find((s) => s.playerId === 'p1')
    expect(row?.landmarks).toBe(2)
    expect(row?.propertiesOwned).toBe(3)
  })
})
