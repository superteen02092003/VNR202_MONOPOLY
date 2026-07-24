import { describe, expect, it } from 'vitest'

import { GAME_CONFIG } from '../config'
import { getPropertyState, getPropertyTile } from '../logic/board'
import { getPlayer } from '../logic/players'
import {
  buyProperty,
  canTakeover,
  canUpgrade,
  demolishProperty,
  getNetWorth,
  getTakeoverCost,
  getUpgradeCost,
  takeoverProperty,
  upgradeProperty,
} from '../logic/property'
import { computeRent, computeRentBreakdown } from '../logic/rent'
import { startFestival } from '../logic/festival'
import { createTestGame, forceOwn } from './helpers'

/** Ô Hà Nội – Quảng trường Ba Đình: giá 140, tiền cơ sở 12, vùng ĐBSH (nâng cấp 100). */
const HANOI = 9
/** Hai ô còn lại cùng vùng Đồng bằng sông Hồng. */
const HAI_PHONG = 10
const NINH_BINH = 11
/** Ô Điện Biên, vùng Tây Bắc: giá 60, tiền cơ sở 4, nâng cấp 50. */
const DIEN_BIEN = 1

describe('Mua đất', () => {
  it('trừ đúng tiền và đặt ô về cấp Đất trống', () => {
    const state = createTestGame()
    const tile = getPropertyTile(HANOI)
    const before = getPlayer(state, 'p1').cash

    expect(buyProperty(state, 'p1', HANOI)).toBe(true)
    expect(getPlayer(state, 'p1').cash).toBe(before - tile.price)

    const property = getPropertyState(state, HANOI)
    expect(property.ownerId).toBe('p1')
    expect(property.level).toBe(1)
    expect(property.invested).toBe(tile.price)
  })

  it('không cho mua ô đã có chủ', () => {
    const state = createTestGame()
    buyProperty(state, 'p1', HANOI)
    expect(buyProperty(state, 'p2', HANOI)).toBe(false)
    expect(getPropertyState(state, HANOI).ownerId).toBe('p1')
  })

  it('không cho mua khi không đủ tiền mặt', () => {
    const state = createTestGame()
    getPlayer(state, 'p1').cash = 10
    expect(buyProperty(state, 'p1', HANOI)).toBe(false)
    expect(getPropertyState(state, HANOI).ownerId).toBeNull()
  })
})

describe('Nâng cấp công trình', () => {
  it('đi đủ 4 cấp với chi phí tăng dần', () => {
    const state = createTestGame()
    getPlayer(state, 'p1').cash = 5000
    buyProperty(state, 'p1', HANOI)

    // Vùng ĐBSH có upgradeCost = 100 → 100 / 200 / 400.
    expect(getUpgradeCost(state, HANOI)).toBe(100)
    expect(upgradeProperty(state, 'p1', HANOI)).toBe(true)
    expect(getPropertyState(state, HANOI).level).toBe(2)

    expect(getUpgradeCost(state, HANOI)).toBe(200)
    expect(upgradeProperty(state, 'p1', HANOI)).toBe(true)
    expect(getPropertyState(state, HANOI).level).toBe(3)

    expect(getUpgradeCost(state, HANOI)).toBe(400)
    expect(upgradeProperty(state, 'p1', HANOI)).toBe(true)
    expect(getPropertyState(state, HANOI).level).toBe(GAME_CONFIG.MAX_BUILD_LEVEL)

    // Tổng vốn = 140 + 100 + 200 + 400
    expect(getPropertyState(state, HANOI).invested).toBe(840)
  })

  it('không nâng được quá cấp Biểu tượng Địa phương', () => {
    const state = createTestGame()
    getPlayer(state, 'p1').cash = 5000
    forceOwn(state, HANOI, 'p1', 4, 840)

    expect(getUpgradeCost(state, HANOI)).toBeNull()
    expect(canUpgrade(state, 'p1', HANOI).ok).toBe(false)
    expect(upgradeProperty(state, 'p1', HANOI)).toBe(false)
  })

  it('không cho nâng cấp đất của đối thủ', () => {
    const state = createTestGame()
    forceOwn(state, HANOI, 'p2', 1, 140)
    expect(canUpgrade(state, 'p1', HANOI).ok).toBe(false)
  })

  it('tùy chọn requireRegionForLandmark bắt buộc sở hữu trọn vùng miền', () => {
    const state = createTestGame({ requireRegionForLandmark: true })
    getPlayer(state, 'p1').cash = 5000

    forceOwn(state, HANOI, 'p1', 3, 440)
    expect(canUpgrade(state, 'p1', HANOI).ok).toBe(false)

    forceOwn(state, HAI_PHONG, 'p1', 1, 140)
    forceOwn(state, NINH_BINH, 'p1', 1, 160)
    expect(canUpgrade(state, 'p1', HANOI).ok).toBe(true)
  })
})

describe('Tiền tham quan / lưu trú', () => {
  it('nhân theo hệ số của từng cấp công trình', () => {
    const state = createTestGame()
    const baseRent = getPropertyTile(HANOI).baseRent // 12

    forceOwn(state, HANOI, 'p1', 1)
    expect(computeRent(state, HANOI)).toBe(baseRent * 1)

    forceOwn(state, HANOI, 'p1', 2)
    expect(computeRent(state, HANOI)).toBe(baseRent * 5)

    forceOwn(state, HANOI, 'p1', 3)
    expect(computeRent(state, HANOI)).toBe(baseRent * 15)

    forceOwn(state, HANOI, 'p1', 4)
    expect(computeRent(state, HANOI)).toBe(baseRent * 40)
  })

  it('nhân đôi khi chủ đất sở hữu trọn vùng miền (ở cấp Đất trống)', () => {
    const state = createTestGame()
    forceOwn(state, HANOI, 'p1', 1)
    expect(computeRentBreakdown(state, HANOI).regionMonopoly).toBe(false)

    forceOwn(state, HAI_PHONG, 'p1', 1)
    forceOwn(state, NINH_BINH, 'p1', 1)

    const breakdown = computeRentBreakdown(state, HANOI)
    expect(breakdown.regionMonopoly).toBe(true)
    expect(breakdown.total).toBe(getPropertyTile(HANOI).baseRent * 2)
  })

  it('nhân đôi khi ô đang đăng cai Festival', () => {
    const state = createTestGame()
    forceOwn(state, HANOI, 'p1', 3)
    const normal = computeRent(state, HANOI)

    expect(startFestival(state, 'p1', HANOI)).toBe(true)
    expect(computeRent(state, HANOI)).toBe(normal * GAME_CONFIG.FESTIVAL_MULTIPLIER)
  })

  it('ô chưa có chủ thì không thu tiền', () => {
    const state = createTestGame()
    expect(computeRent(state, HANOI)).toBe(0)
  })
})

describe('Thâu tóm (Takeover)', () => {
  it('mua đứt đất đối thủ với giá gấp đôi vốn đã rót', () => {
    const state = createTestGame()
    forceOwn(state, HANOI, 'p2', 2, 240)
    getPlayer(state, 'p1').cash = 2000
    const sellerBefore = getPlayer(state, 'p2').cash

    expect(getTakeoverCost(state, HANOI)).toBe(480)
    expect(takeoverProperty(state, 'p1', HANOI)).toBe(true)

    expect(getPropertyState(state, HANOI).ownerId).toBe('p1')
    // Cấp công trình được giữ nguyên khi đổi chủ.
    expect(getPropertyState(state, HANOI).level).toBe(2)
    expect(getPlayer(state, 'p1').cash).toBe(2000 - 480)
    expect(getPlayer(state, 'p2').cash).toBe(sellerBefore + 480)
    expect(getPlayer(state, 'p1').stats.takeoversMade).toBe(1)
    expect(getPlayer(state, 'p2').stats.takeoversSuffered).toBe(1)
  })

  it('KHÔNG thể thâu tóm Biểu tượng Địa phương — đặc quyền theo GDD', () => {
    const state = createTestGame()
    forceOwn(state, HANOI, 'p2', 4, 840)
    getPlayer(state, 'p1').cash = 999_999

    expect(getTakeoverCost(state, HANOI)).toBeNull()
    expect(canTakeover(state, 'p1', HANOI).ok).toBe(false)
    expect(takeoverProperty(state, 'p1', HANOI)).toBe(false)
    expect(getPropertyState(state, HANOI).ownerId).toBe('p2')
  })

  it('thẻ Bảo Hộ Di Sản chặn đúng một lần thâu tóm', () => {
    const state = createTestGame()
    forceOwn(state, HANOI, 'p2', 2, 240)
    getPropertyState(state, HANOI).shielded = true
    getPlayer(state, 'p1').cash = 2000

    expect(canTakeover(state, 'p1', HANOI).ok).toBe(true)

    // Lần 1: lá chắn hấp thụ, đất vẫn của p2.
    expect(takeoverProperty(state, 'p1', HANOI)).toBe(false)
    expect(getPropertyState(state, HANOI).ownerId).toBe('p2')
    expect(getPropertyState(state, HANOI).shielded).toBe(false)

    // Lần 2: không còn lá chắn, thương vụ thành công.
    expect(takeoverProperty(state, 'p1', HANOI)).toBe(true)
    expect(getPropertyState(state, HANOI).ownerId).toBe('p1')
  })

  it('không cho đội thiếu tiền phá lá chắn miễn phí', () => {
    const state = createTestGame()
    forceOwn(state, HANOI, 'p2', 2, 240)
    getPropertyState(state, HANOI).shielded = true
    getPlayer(state, 'p1').cash = 100

    expect(takeoverProperty(state, 'p1', HANOI)).toBe(false)
    expect(getPropertyState(state, HANOI).shielded).toBe(true)
  })

  it('không thâu tóm được khi thiếu tiền mặt', () => {
    const state = createTestGame()
    forceOwn(state, HANOI, 'p2', 2, 240)
    getPlayer(state, 'p1').cash = 100

    expect(canTakeover(state, 'p1', HANOI).ok).toBe(false)
    expect(takeoverProperty(state, 'p1', HANOI)).toBe(false)
  })
})

describe('Giải tỏa mặt bằng (thẻ Phá nhà)', () => {
  it('hạ đúng một cấp và giảm vốn tương ứng', () => {
    const state = createTestGame()
    forceOwn(state, DIEN_BIEN, 'p2', 3, 210) // 60 + 50 + 100

    expect(demolishProperty(state, 'p1', DIEN_BIEN)).toBe(true)
    expect(getPropertyState(state, DIEN_BIEN).level).toBe(2)
    // Tây Bắc upgradeCost 50, hệ số cấp 3 là x2 → mất 100.
    expect(getPropertyState(state, DIEN_BIEN).invested).toBe(110)
  })

  it('không phá được Biểu tượng Địa phương', () => {
    const state = createTestGame()
    forceOwn(state, DIEN_BIEN, 'p2', 4, 410)
    expect(demolishProperty(state, 'p1', DIEN_BIEN)).toBe(false)
    expect(getPropertyState(state, DIEN_BIEN).level).toBe(4)
  })

  it('không phá được đất trống chưa có công trình', () => {
    const state = createTestGame()
    forceOwn(state, DIEN_BIEN, 'p2', 1, 60)
    expect(demolishProperty(state, 'p1', DIEN_BIEN)).toBe(false)
  })
})

describe('Tài sản ròng', () => {
  it('bằng tiền mặt cộng tổng vốn bất động sản', () => {
    const state = createTestGame()
    getPlayer(state, 'p1').cash = 1000
    forceOwn(state, HANOI, 'p1', 2, 240)
    forceOwn(state, DIEN_BIEN, 'p1', 1, 60)

    expect(getNetWorth(state, 'p1')).toBe(1000 + 240 + 60)
  })
})
