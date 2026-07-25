import { describe, expect, it, vi } from 'vitest'

import { playGameEventSound, soundManager } from '../sound'
import type { GameEvent } from '../types'

describe('Sound System', () => {
  it('triggers the correct sound for each game event', () => {
    const playSpy = vi.spyOn(soundManager, 'play').mockImplementation(() => {})

    const testCases: { type: GameEvent['type']; expectedSound: string }[] = [
      { type: 'property-bought', expectedSound: 'build' },
      { type: 'property-upgraded', expectedSound: 'upgrade' },
      { type: 'landmark-built', expectedSound: 'landmark-built' },
      { type: 'property-takeover', expectedSound: 'takeover' },
      { type: 'property-demolished', expectedSound: 'demolish' },
      { type: 'festival-started', expectedSound: 'festival' },
      { type: 'rent-paid', expectedSound: 'rent-pay' },
      { type: 'player-jailed', expectedSound: 'jail' },
      { type: 'player-bankrupt', expectedSound: 'bankrupt' },
      { type: 'trivia-correct', expectedSound: 'correct' },
      { type: 'trivia-wrong', expectedSound: 'wrong' },
      { type: 'card-drawn', expectedSound: 'card-draw' },
      { type: 'pass-start', expectedSound: 'pass-start' },
      { type: 'escape-jail', expectedSound: 'escape-jail' },
      { type: 'teleport', expectedSound: 'teleport' },
      { type: 'shield-activate', expectedSound: 'shield-activate' },
      { type: 'cash-gained', expectedSound: 'cash' },
    ]

    testCases.forEach(({ type, expectedSound }) => {
      playSpy.mockClear()
      playGameEventSound({
        id: 'evt-1',
        seq: 1,
        type,
        playerId: 'p1',
        tileId: null,
        amount: null,
        turn: 1,
      })
      expect(playSpy).toHaveBeenCalledWith(expectedSound)
    })

    playSpy.mockRestore()
  })
})
