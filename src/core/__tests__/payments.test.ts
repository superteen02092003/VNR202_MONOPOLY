import { describe, expect, it } from 'vitest'

import { getOwnedTileIds, getPropertyState } from '../logic/board'
import { credit, declareBankruptcy, settleDebt } from '../logic/payments'
import { getPlayer } from '../logic/players'
import { createTestGame, forceOwn } from './helpers'

const HANOI = 9
const DIEN_BIEN = 1
const HUE = 15

describe('Giao dịch tiền', () => {
  it('cộng tiền thưởng', () => {
    const state = createTestGame()
    const before = getPlayer(state, 'p1').cash
    credit(state, 'p1', 200, 'đi qua ô Xuất phát')
    expect(getPlayer(state, 'p1').cash).toBe(before + 200)
  })

  it('chuyển tiền lưu trú từ khách sang chủ đất', () => {
    const state = createTestGame()
    const payerBefore = getPlayer(state, 'p1').cash
    const ownerBefore = getPlayer(state, 'p2').cash

    const result = settleDebt(state, 'p1', 300, 'p2', 'tiền tham quan')

    expect(result.bankrupted).toBe(false)
    expect(result.paid).toBe(300)
    expect(getPlayer(state, 'p1').cash).toBe(payerBefore - 300)
    expect(getPlayer(state, 'p2').cash).toBe(ownerBefore + 300)
  })

  it('nộp thuế cho ngân hàng thì tiền biến mất khỏi ván', () => {
    const state = createTestGame()
    const totalBefore = state.players.reduce((sum, p) => sum + p.cash, 0)

    settleDebt(state, 'p1', 200, null, 'thuế thu nhập doanh nghiệp')

    expect(state.players.reduce((sum, p) => sum + p.cash, 0)).toBe(totalBefore - 200)
  })
})

describe('Thiếu tiền mặt', () => {
  it('tự động thanh lý công trình để gom đủ tiền trả nợ', () => {
    const state = createTestGame()
    getPlayer(state, 'p1').cash = 50
    // Khách sạn ở Hà Nội: hạ 1 cấp thu về 50% của 200 = 100.
    forceOwn(state, HANOI, 'p1', 3, 440)

    const result = settleDebt(state, 'p1', 120, 'p2', 'tiền tham quan')

    expect(result.bankrupted).toBe(false)
    expect(result.liquidations).toBe(1)
    expect(result.paid).toBe(120)
    expect(getPropertyState(state, HANOI).level).toBe(2)
    expect(getPlayer(state, 'p1').cash).toBe(50 + 100 - 120)
  })

  it('ưu tiên hạ cấp công trình trước khi bán đứt đất trống', () => {
    const state = createTestGame()
    getPlayer(state, 'p1').cash = 0
    forceOwn(state, HANOI, 'p1', 2, 240)
    forceOwn(state, DIEN_BIEN, 'p1', 1, 60)

    settleDebt(state, 'p1', 50, 'p2', 'tiền tham quan')

    // Hạ Hà Nội xuống Đất trống là đủ, nên Điện Biên vẫn còn nguyên.
    expect(getPropertyState(state, HANOI).level).toBe(1)
    expect(getPropertyState(state, DIEN_BIEN).ownerId).toBe('p1')
  })

  it('phá sản mà không bán sạch đất nếu tổng tài sản vẫn không đủ trả nợ', () => {
    const state = createTestGame()
    getPlayer(state, 'p1').cash = 100
    forceOwn(state, DIEN_BIEN, 'p1', 1, 60)

    const result = settleDebt(state, 'p1', 5000, 'p2', 'tiền lưu trú khách sạn')

    expect(result.bankrupted).toBe(true)
    expect(result.shortfall).toBeGreaterThan(0)
    expect(result.liquidations).toBe(0)
    expect(getPlayer(state, 'p1').status).toBe('bankrupt')
    expect(getPlayer(state, 'p1').cash).toBe(0)
    expect(getPlayer(state, 'p1').cards).toHaveLength(0)
    expect(getPropertyState(state, DIEN_BIEN).ownerId).toBe('p2')
  })

  it('settleDebt bàn giao nguyên cấp công trình cho chủ nợ khi phá sản', () => {
    const state = createTestGame()
    getPlayer(state, 'p1').cash = 100
    forceOwn(state, HANOI, 'p1', 3, 440)

    const result = settleDebt(state, 'p1', 5000, 'p2', 'tiền lưu trú khách sạn')

    expect(result.bankrupted).toBe(true)
    expect(result.liquidations).toBe(0)
    expect(getPropertyState(state, HANOI).ownerId).toBe('p2')
    expect(getPropertyState(state, HANOI).level).toBe(3)
  })

  it('chủ nợ nhận toàn bộ bất động sản của nhóm phá sản', () => {
    const state = createTestGame()
    getPlayer(state, 'p1').cash = 0
    forceOwn(state, HANOI, 'p1', 4, 840) // Biểu tượng: không hạ cấp được nhưng vẫn thanh lý được
    forceOwn(state, HUE, 'p1', 1, 200)

    declareBankruptcy(state, 'p1', 'p2')

    expect(getPlayer(state, 'p1').status).toBe('bankrupt')
    expect(getOwnedTileIds(state, 'p1')).toHaveLength(0)
    expect(getOwnedTileIds(state, 'p2')).toEqual([HANOI, HUE])
    // Cấp công trình được giữ nguyên khi sang tên.
    expect(getPropertyState(state, HANOI).level).toBe(4)
  })

  it('phá sản với ngân hàng thì đất được trả về trạng thái chưa ai sở hữu', () => {
    const state = createTestGame()
    forceOwn(state, HANOI, 'p1', 3, 440)

    declareBankruptcy(state, 'p1', null)

    expect(getPropertyState(state, HANOI).ownerId).toBeNull()
    expect(getPropertyState(state, HANOI).level).toBe(0)
    expect(getPropertyState(state, HANOI).invested).toBe(0)
  })
})
