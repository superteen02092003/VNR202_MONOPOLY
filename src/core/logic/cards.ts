import { GAME_CONFIG } from '../config'
import { CARD_DEFINITIONS, getCardDefinition } from '../data/cards'
import { BOARD } from '../data/board'
import { getPropertyState, getPropertyTile, getTile } from './board'
import { getFestivalEligibleTiles, startFestival } from './festival'
import { pushEvent, pushLog, nextId } from './log'
import { clampDiceTotal, releaseFromJail, teleportPlayer } from './movement'
import { credit } from './payments'
import { findPlayer, getPlayer } from './players'
import { demolishProperty } from './property'
import { pickWeighted } from './random'
import type { CardEffect, CardInstance, CardTarget, GameCore, PlayerId } from '../types'

/* ------------------------------------------------------------------ */
/* Bốc thẻ                                                             */
/* ------------------------------------------------------------------ */

export interface DrawResult {
  card: CardInstance | null
  /** Giữ lại để tương thích với UI/store cũ; hệ thống mới không giới hạn túi thẻ. */
  bagFull: boolean
  saved: boolean
  usedImmediately: boolean
  movedPlayer: boolean
}

export interface DrawOptions {
  immediate?: boolean
}

/**
 * Bốc 1 Thẻ Cơ hội theo trọng số.
 * Mọi thẻ được kích hoạt ngay; chỉ Vé Thông Hành được lưu để dùng khi Kẹt xe.
 */
export function drawCard(
  state: GameCore,
  playerId: PlayerId,
  options: DrawOptions = {},
): DrawResult {
  const player = getPlayer(state, playerId)
  void options
  const definition = pickWeighted(state, CARD_DEFINITIONS, (c) => c.weight)

  if (!definition) return { card: null, bagFull: false, saved: false, usedImmediately: false, movedPlayer: false }

  const shouldSave = definition.effect === 'escape-jail'

  const card: CardInstance = { instanceId: nextId(state, 'card'), effect: definition.effect }
  if (shouldSave) {
    player.cards.push(card)
    pushLog(state, 'card', `${player.name} rút được thẻ ${definition.name}.`, playerId)
    pushEvent(state, 'card-drawn', playerId)
    return { card, bagFull: false, saved: true, usedImmediately: false, movedPlayer: false }
  }

  const outcome = applyCardEffect(
    state,
    playerId,
    card.effect,
    getImmediateCardTarget(state, playerId, card.effect),
  )
  if (outcome.ok) {
    player.stats.cardsPlayed += 1
    pushLog(state, 'card', `${player.name} rút được thẻ ${definition.name} và dùng ngay.`, playerId)
  } else {
    pushLog(
      state,
      'warning',
      `${player.name} rút được thẻ ${definition.name} nhưng không có mục tiêu phù hợp, thẻ đã bị bỏ qua.`,
      playerId,
    )
  }
  pushEvent(state, 'card-drawn', playerId)
  return {
    card,
    bagFull: false,
    saved: false,
    usedImmediately: outcome.ok,
    movedPlayer: outcome.movedPlayer,
  }
}

function getImmediateCardTarget(state: GameCore, playerId: PlayerId, effect: CardEffect): CardTarget {
  const player = getPlayer(state, playerId)

  switch (effect) {
    case 'choose-dice':
      return { kind: 'dice', total: 7 }
    case 'demolish': {
      const tile = BOARD.find((candidate) => {
        if (candidate.type !== 'property') return false
        const property = getPropertyState(state, candidate.id)
        return property.ownerId !== null && property.ownerId !== playerId && property.level >= 2 && property.level < 4
      })
      return tile ? { kind: 'tile', tileId: tile.id } : { kind: 'none' }
    }
    case 'teleport': {
      const tile = BOARD.find((candidate) => {
        if (candidate.type !== 'property' || candidate.id === player.position) return false
        const property = getPropertyState(state, candidate.id)
        return property.ownerId === null || property.ownerId === playerId
      })
      return { kind: 'tile', tileId: tile?.id ?? player.position }
    }
    case 'swap-position': {
      const other = state.players.find(
        (candidate) => candidate.id !== playerId && candidate.status !== 'bankrupt' && candidate.status !== 'jailed',
      )
      return other ? { kind: 'player', playerId: other.id } : { kind: 'none' }
    }
    case 'instant-festival': {
      const tileId = getFestivalEligibleTiles(state, playerId)[0]
      return tileId === undefined ? { kind: 'none' } : { kind: 'tile', tileId }
    }
    case 'heritage-shield': {
      const property = Object.values(state.properties).find(
        (candidate) => candidate.ownerId === playerId && !candidate.shielded,
      )
      return property ? { kind: 'tile', tileId: property.tileId } : { kind: 'none' }
    }
    default:
      return { kind: 'none' }
  }
}

/* ------------------------------------------------------------------ */
/* Kích hoạt thẻ                                                       */
/* ------------------------------------------------------------------ */

export interface CardPlayResult {
  ok: boolean
  reason: string | null
  effect: CardEffect | null
  /**
   * Thẻ đã thay thế luôn lượt di chuyển (Chuyến Bay Đêm):
   * store bỏ qua bước đổ xúc xắc và giải quyết ngay ô vừa đáp xuống.
   */
  movedPlayer: boolean
}

const failed = (reason: string): CardPlayResult => ({
  ok: false,
  reason,
  effect: null,
  movedPlayer: false,
})

/**
 * Host kích hoạt một lá thẻ trong túi đồ của nhóm.
 * Thẻ chỉ bị tiêu hủy khi hiệu ứng thực sự phát huy tác dụng.
 */
export function playCard(
  state: GameCore,
  playerId: PlayerId,
  instanceId: string,
  target: CardTarget = { kind: 'none' },
): CardPlayResult {
  const player = getPlayer(state, playerId)
  if (player.status === 'bankrupt') return failed('Nhóm đã phá sản.')

  const index = player.cards.findIndex((c) => c.instanceId === instanceId)
  if (index === -1) return failed('Không tìm thấy lá thẻ này trong túi đồ.')

  const card = player.cards[index]
  const definition = getCardDefinition(card.effect)

  const outcome = applyCardEffect(state, playerId, card.effect, target)
  if (!outcome.ok) return outcome

  player.cards.splice(index, 1)
  player.stats.cardsPlayed += 1

  pushLog(
    state,
    'card',
    `${player.name} sử dụng thẻ ${definition.name}.`,
    playerId,
  )
  return outcome
}

function applyCardEffect(
  state: GameCore,
  playerId: PlayerId,
  effect: CardEffect,
  target: CardTarget,
): CardPlayResult {
  const player = getPlayer(state, playerId)
  const done = (movedPlayer = false): CardPlayResult => ({
    ok: true,
    reason: null,
    effect,
    movedPlayer,
  })

  switch (effect) {
    case 'choose-dice': {
      if (target.kind !== 'dice') return failed('Cần chọn tổng điểm xúc xắc (2 đến 12).')
      player.forcedDiceTotal = clampDiceTotal(target.total)
      pushLog(
        state,
        'card',
        `${player.name} chốt trước tổng điểm xúc xắc: ${player.forcedDiceTotal}.`,
        playerId,
      )
      return done()
    }

    case 'demolish': {
      if (target.kind !== 'tile') return failed('Cần chọn một ô đất của đối thủ.')
      if (!demolishProperty(state, playerId, target.tileId)) {
        return failed('Không thể giải tỏa ô đất này.')
      }
      return done()
    }

    case 'free-stay': {
      player.rentImmunity = true
      pushLog(state, 'card', `${player.name} được miễn phí lưu trú trong lượt này.`, playerId)
      return done()
    }

    case 'escape-jail': {
      if (player.status !== 'jailed') return failed('Nhóm không ở trong ô Kẹt xe.')
      releaseFromJail(state, playerId, 'dùng thẻ Vé Thông Hành')
      return done()
    }

    case 'teleport': {
      if (target.kind !== 'tile') return failed('Cần chọn ô đích để bay tới.')
      if (player.status === 'jailed') return failed('Đang kẹt xe, chưa thể bay.')
      teleportPlayer(state, playerId, target.tileId)
      pushLog(
        state,
        'card',
        `${player.name} bay thẳng tới ${getPropertyOrTileName(target.tileId)}.`,
        playerId,
      )
      return done(true)
    }

    case 'stimulus': {
      credit(state, playerId, GAME_CONFIG.STIMULUS_AMOUNT, 'gói kích cầu từ ngân sách')
      return done()
    }

    case 'swap-position': {
      if (target.kind !== 'player') return failed('Cần chọn nhóm muốn hoán đổi vị trí.')
      if (target.playerId === playerId) return failed('Không thể hoán đổi với chính mình.')

      const other = findPlayer(state, target.playerId)
      if (!other) return failed('Không tìm thấy nhóm được chọn.')
      if (other.status === 'bankrupt') return failed('Nhóm được chọn đã phá sản.')
      if (other.status === 'jailed' || player.status === 'jailed') {
        return failed('Không thể hoán đổi khi một trong hai nhóm đang kẹt xe.')
      }

      const myPosition = player.position
      player.position = other.position
      other.position = myPosition

      pushLog(
        state,
        'card',
        `${player.name} hoán đổi vị trí với ${other.name}.`,
        playerId,
      )
      // Hoán đổi chỉ đổi chỗ đứng, nhóm vẫn được đổ xúc xắc như thường.
      return done(false)
    }

    case 'instant-festival': {
      if (target.kind !== 'tile') return failed('Cần chọn một địa danh đang sở hữu.')
      if (!startFestival(state, playerId, target.tileId)) {
        return failed('Ô đất không hợp lệ hoặc đã có lễ hội đang diễn ra.')
      }
      return done()
    }

    case 'heritage-shield': {
      if (target.kind !== 'tile') return failed('Cần chọn một địa danh đang sở hữu.')

      const property = getPropertyState(state, target.tileId)
      if (property.ownerId !== playerId) return failed('Ô đất không thuộc sở hữu của nhóm.')
      if (property.shielded) return failed('Ô đất đã được bảo hộ.')

      property.shielded = true
      pushLog(
        state,
        'card',
        `${getPropertyTile(target.tileId).name} được bảo hộ, chặn được một lần thâu tóm.`,
        playerId,
      )
      return done()
    }

    default:
      return failed('Hiệu ứng thẻ chưa được hỗ trợ.')
  }
}

function getPropertyOrTileName(tileId: number): string {
  const tile = getTile(tileId)
  return tile.type === 'property' ? `${tile.province} – ${tile.name}` : tile.name
}
