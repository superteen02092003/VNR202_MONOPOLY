import { BUILD_LEVEL_LABEL, GAME_CONFIG } from '../config'
import { REGION_BY_ID } from '../data/board'
import {
  getPropertyState,
  getPropertyTile,
  getOwnedTileIds,
  ownsWholeRegion,
} from './board'
import { formatMoney, formatPropertyPrice } from './money'
import { pushEvent, pushLog } from './log'
import { getPlayer } from './players'
import type { BuildLevel, GameCore, PlayerId, TileId } from '../types'

/* ------------------------------------------------------------------ */
/* Truy vấn chi phí                                                    */
/* ------------------------------------------------------------------ */

/** Chi phí nâng cấp một bậc. Trả về null nếu ô đã đạt cấp tối đa hoặc chưa có chủ. */
export function getUpgradeCost(state: GameCore, tileId: TileId): number | null {
  const property = getPropertyState(state, tileId)
  if (!property.ownerId || property.level === 0) return null
  if (property.level >= GAME_CONFIG.MAX_BUILD_LEVEL) return null

  const nextLevel = (property.level + 1) as BuildLevel
  const region = REGION_BY_ID[getPropertyTile(tileId).region]
  return region.upgradeCost * GAME_CONFIG.UPGRADE_COST_MULTIPLIER[nextLevel]
}

export function getNextLevel(state: GameCore, tileId: TileId): BuildLevel | null {
  const property = getPropertyState(state, tileId)
  if (property.level === 0 || property.level >= GAME_CONFIG.MAX_BUILD_LEVEL) return null
  return (property.level + 1) as BuildLevel
}

/** Số tiền thu về khi hạ một bậc công trình (hoặc bán đất ở cấp 1). */
export function getLiquidationValue(state: GameCore, tileId: TileId): number {
  const property = getPropertyState(state, tileId)
  if (!property.ownerId || property.level === 0) return 0

  const tile = getPropertyTile(tileId)
  const region = REGION_BY_ID[tile.region]

  const refundBase =
    property.level === 1
      ? tile.price
      : region.upgradeCost * GAME_CONFIG.UPGRADE_COST_MULTIPLIER[property.level]

  return Math.round(refundBase * GAME_CONFIG.LIQUIDATION_RATE)
}

/** Tổng tiền có thể thu nếu thanh lý lần lượt toàn bộ công trình và ô đất. */
export function getTotalLiquidationValue(state: GameCore, tileId: TileId): number {
  const property = getPropertyState(state, tileId)
  if (!property.ownerId || property.level === 0) return 0

  const tile = getPropertyTile(tileId)
  const region = REGION_BY_ID[tile.region]
  let total = Math.round(tile.price * GAME_CONFIG.LIQUIDATION_RATE)

  for (let level = 2; level <= property.level; level += 1) {
    const upgradeCost =
      region.upgradeCost *
      GAME_CONFIG.UPGRADE_COST_MULTIPLIER[level as BuildLevel]
    total += Math.round(upgradeCost * GAME_CONFIG.LIQUIDATION_RATE)
  }

  return total
}

/* ------------------------------------------------------------------ */
/* Mua đất                                                             */
/* ------------------------------------------------------------------ */

export interface ActionCheck {
  ok: boolean
  reason: string | null
}

const OK: ActionCheck = { ok: true, reason: null }
const fail = (reason: string): ActionCheck => ({ ok: false, reason })

export function canBuy(state: GameCore, playerId: PlayerId, tileId: TileId): ActionCheck {
  const property = getPropertyState(state, tileId)
  const player = getPlayer(state, playerId)

  if (property.ownerId) return fail('Ô đất này đã có chủ.')
  if (player.status === 'bankrupt') return fail('Nhóm đã phá sản.')
  if (player.cash < getPropertyTile(tileId).price) return fail('Nhóm không đủ tiền mặt để đầu tư.')
  return OK
}

/** Mua đất trống. Trả về true nếu giao dịch thành công. */
export function buyProperty(state: GameCore, playerId: PlayerId, tileId: TileId): boolean {
  if (!canBuy(state, playerId, tileId).ok) return false

  const tile = getPropertyTile(tileId)
  const property = getPropertyState(state, tileId)
  const player = getPlayer(state, playerId)

  player.cash -= tile.price
  player.stats.propertiesBought += 1

  property.ownerId = playerId
  property.level = 1
  property.invested = tile.price

  pushLog(
    state,
    'property',
    `${player.name} đầu tư ${tile.province} – ${tile.name} với giá ${formatPropertyPrice(tile.price)}.`,
    playerId,
  )
  pushEvent(state, 'property-bought', playerId, { tileId, amount: tile.price })
  return true
}

/* ------------------------------------------------------------------ */
/* Nâng cấp công trình                                                 */
/* ------------------------------------------------------------------ */

export function canUpgrade(state: GameCore, playerId: PlayerId, tileId: TileId): ActionCheck {
  const property = getPropertyState(state, tileId)
  const player = getPlayer(state, playerId)

  if (property.ownerId !== playerId) return fail('Ô đất không thuộc sở hữu của nhóm.')
  if (property.level >= GAME_CONFIG.MAX_BUILD_LEVEL) {
    return fail('Ô đất đã đạt cấp Biểu tượng Địa phương — không thể nâng thêm.')
  }

  const nextLevel = getNextLevel(state, tileId)
  if (nextLevel === null) return fail('Không còn cấp nâng cấp nào.')

  if (
    nextLevel === GAME_CONFIG.MAX_BUILD_LEVEL &&
    state.settings.requireRegionForLandmark &&
    !ownsWholeRegion(state, playerId, tileId)
  ) {
    return fail('Phải sở hữu trọn cả vùng miền mới được xây Biểu tượng Địa phương.')
  }

  const cost = getUpgradeCost(state, tileId)
  if (cost === null) return fail('Không xác định được chi phí nâng cấp.')
  if (player.cash < cost) return fail('Nhóm không đủ tiền mặt để nâng cấp.')

  return OK
}

/** Nâng cấp một bậc. Trả về true nếu thành công. */
export function upgradeProperty(state: GameCore, playerId: PlayerId, tileId: TileId): boolean {
  if (!canUpgrade(state, playerId, tileId).ok) return false

  const cost = getUpgradeCost(state, tileId)
  const nextLevel = getNextLevel(state, tileId)
  if (cost === null || nextLevel === null) return false

  const player = getPlayer(state, playerId)
  const property = getPropertyState(state, tileId)
  const tile = getPropertyTile(tileId)

  player.cash -= cost
  property.level = nextLevel
  property.invested += cost

  player.stats.upgradesBuilt += 1
  if (nextLevel === GAME_CONFIG.MAX_BUILD_LEVEL) player.stats.landmarksBuilt += 1

  pushLog(
    state,
    'property',
    `${player.name} nâng cấp ${tile.province} lên ${BUILD_LEVEL_LABEL[nextLevel]} (${formatMoney(cost)}).`,
    playerId,
  )

  if (nextLevel === GAME_CONFIG.MAX_BUILD_LEVEL) {
    pushLog(
      state,
      'success',
      `${tile.name} trở thành Biểu tượng Địa phương — không thể bị thâu tóm!`,
      playerId,
    )
    // Tín hiệu cho lớp 3D chạy hoạt ảnh Celebrate của nhân vật.
    pushEvent(state, 'landmark-built', playerId, { tileId })
  } else {
    pushEvent(state, 'property-upgraded', playerId, { tileId, amount: cost })
  }
  return true
}

/* ------------------------------------------------------------------ */
/* Thâu tóm (Takeover)                                                 */
/* ------------------------------------------------------------------ */

/** Giá thâu tóm = tổng vốn chủ đất đã rót × hệ số. Null nếu ô không thể bị thâu tóm. */
export function getTakeoverCost(state: GameCore, tileId: TileId): number | null {
  const property = getPropertyState(state, tileId)
  if (!property.ownerId || property.level === 0) return null
  if (property.level >= GAME_CONFIG.MAX_BUILD_LEVEL) return null
  return Math.round(property.invested * GAME_CONFIG.TAKEOVER_MULTIPLIER)
}

export function canTakeover(state: GameCore, playerId: PlayerId, tileId: TileId): ActionCheck {
  if (!state.settings.allowTakeover) return fail('Ván đấu đã tắt cơ chế thâu tóm.')

  const property = getPropertyState(state, tileId)
  const player = getPlayer(state, playerId)

  if (!property.ownerId) return fail('Ô đất chưa có chủ — hãy mua trực tiếp.')
  if (property.ownerId === playerId) return fail('Không thể thâu tóm đất của chính mình.')
  if (property.level >= GAME_CONFIG.MAX_BUILD_LEVEL) {
    return fail('Đây là Biểu tượng Địa phương — bất khả xâm phạm.')
  }
  const cost = getTakeoverCost(state, tileId)
  if (cost === null) return fail('Không xác định được giá thâu tóm.')
  if (player.cash < cost) return fail('Nhóm không đủ tiền mặt để thâu tóm.')

  return OK
}

/**
 * Thâu tóm đất đối thủ: trả tiền cho chủ cũ, giữ nguyên cấp công trình.
 * Nếu ô đang được Bảo Hộ Di Sản, lá chắn bị phá và giao dịch KHÔNG diễn ra.
 */
export function takeoverProperty(state: GameCore, playerId: PlayerId, tileId: TileId): boolean {
  const property = getPropertyState(state, tileId)

  // Kiểm tra đầy đủ điều kiện trước để đội thiếu tiền không thể phá lá chắn miễn phí.
  if (!canTakeover(state, playerId, tileId).ok) return false

  // Lá chắn hấp thụ đúng một lần thâu tóm rồi tan.
  if (property.shielded && property.ownerId) {
    property.shielded = false
    const attacker = getPlayer(state, playerId)
    const owner = getPlayer(state, property.ownerId)
    pushLog(
      state,
      'warning',
      `${owner.name} dùng Bảo Hộ Di Sản chặn đứng thương vụ thâu tóm của ${attacker.name}.`,
      owner.id,
    )
    return false
  }

  const cost = getTakeoverCost(state, tileId)
  if (cost === null || !property.ownerId) return false

  const buyer = getPlayer(state, playerId)
  const seller = getPlayer(state, property.ownerId)
  const tile = getPropertyTile(tileId)

  buyer.cash -= cost
  seller.cash += cost

  property.ownerId = playerId
  // Người mua đã trả `cost` nên đó là vốn thực tế của họ trên ô này.
  property.invested = cost
  // Festival gắn với địa danh chứ không gắn với chủ, nên giữ nguyên.

  buyer.stats.takeoversMade += 1
  seller.stats.takeoversSuffered += 1

  pushLog(
    state,
    'property',
    `${buyer.name} thâu tóm ${tile.province} – ${tile.name} từ ${seller.name} với giá ${formatPropertyPrice(cost)}.`,
    playerId,
  )
  pushEvent(state, 'property-takeover', playerId, { tileId, amount: cost })
  return true
}

/* ------------------------------------------------------------------ */
/* Phá công trình & thanh lý                                           */
/* ------------------------------------------------------------------ */

export function canDemolish(state: GameCore, playerId: PlayerId, tileId: TileId): ActionCheck {
  const property = getPropertyState(state, tileId)

  if (!property.ownerId) return fail('Ô đất chưa có chủ.')
  if (property.ownerId === playerId) return fail('Không thể tự phá công trình của mình.')
  if (property.level >= GAME_CONFIG.MAX_BUILD_LEVEL) {
    return fail('Biểu tượng Địa phương không thể bị phá bỏ.')
  }
  if (property.level < 2) return fail('Ô đất chưa có công trình để phá.')

  return OK
}

/** Hạ 1 cấp công trình của đối thủ (thẻ Giải Tỏa Mặt Bằng). Chủ đất không được đền bù. */
export function demolishProperty(state: GameCore, playerId: PlayerId, tileId: TileId): boolean {
  if (!canDemolish(state, playerId, tileId).ok) return false

  const property = getPropertyState(state, tileId)
  if (!property.ownerId) return false

  const region = REGION_BY_ID[getPropertyTile(tileId).region]
  const lostValue = region.upgradeCost * GAME_CONFIG.UPGRADE_COST_MULTIPLIER[property.level]

  property.level = (property.level - 1) as BuildLevel
  property.invested = Math.max(0, property.invested - lostValue)

  const tile = getPropertyTile(tileId)
  const owner = getPlayer(state, property.ownerId)
  const actor = getPlayer(state, playerId)

  pushLog(
    state,
    'warning',
    `${actor.name} giải tỏa công trình của ${owner.name} tại ${tile.province} — còn lại ${BUILD_LEVEL_LABEL[property.level]}.`,
    playerId,
  )
  pushEvent(state, 'property-demolished', playerId, { tileId })
  return true
}

/**
 * Hạ một bậc công trình để lấy tiền mặt (dùng khi phải trả nợ).
 * Ở cấp Đất trống thì bán luôn ô đất và trả về ngân hàng.
 * Trả về số tiền thu được.
 */
export function liquidateOneStep(state: GameCore, tileId: TileId): number {
  const property = getPropertyState(state, tileId)
  if (!property.ownerId || property.level === 0) return 0

  const owner = getPlayer(state, property.ownerId)
  const refund = getLiquidationValue(state, tileId)
  const tile = getPropertyTile(tileId)

  if (property.level === 1) {
    resetProperty(state, tileId)
    owner.cash += refund
    pushLog(
      state,
      'money',
      `${owner.name} bán lại ${tile.province} cho ngân hàng, thu ${formatMoney(refund)}.`,
      owner.id,
    )
    return refund
  }

  const region = REGION_BY_ID[tile.region]
  const removedCost = region.upgradeCost * GAME_CONFIG.UPGRADE_COST_MULTIPLIER[property.level]

  property.level = (property.level - 1) as BuildLevel
  property.invested = Math.max(0, property.invested - removedCost)
  owner.cash += refund

  pushLog(
    state,
    'money',
    `${owner.name} thanh lý bớt công trình tại ${tile.province}, thu ${formatMoney(refund)} (còn ${BUILD_LEVEL_LABEL[property.level]}).`,
    owner.id,
  )
  return refund
}

/** Đưa một ô đất về trạng thái chưa ai sở hữu. */
export function resetProperty(state: GameCore, tileId: TileId): void {
  const property = getPropertyState(state, tileId)
  property.ownerId = null
  property.level = 0
  property.invested = 0
  property.festivalTurnsLeft = 0
  property.shielded = false
}

/** Sang tên toàn bộ bất động sản của một nhóm cho nhóm khác (dùng khi phá sản). */
export function transferAllProperties(state: GameCore, fromId: PlayerId, toId: PlayerId): TileId[] {
  const tileIds = getOwnedTileIds(state, fromId)
  for (const tileId of tileIds) {
    const property = getPropertyState(state, tileId)
    property.ownerId = toId
    property.shielded = false
  }
  return tileIds
}

/** Trả toàn bộ bất động sản của một nhóm về ngân hàng. */
export function releaseAllProperties(state: GameCore, playerId: PlayerId): TileId[] {
  const tileIds = getOwnedTileIds(state, playerId)
  for (const tileId of tileIds) resetProperty(state, tileId)
  return tileIds
}

/** Tổng vốn đang nằm trong bất động sản của một nhóm. */
export function getPortfolioValue(state: GameCore, playerId: PlayerId): number {
  return getOwnedTileIds(state, playerId).reduce(
    (sum, tileId) => sum + getPropertyState(state, tileId).invested,
    0,
  )
}

/** Tài sản ròng = tiền mặt + tổng vốn bất động sản. Dùng để xếp hạng cuối ván. */
export function getNetWorth(state: GameCore, playerId: PlayerId): number {
  return getPlayer(state, playerId).cash + getPortfolioValue(state, playerId)
}
