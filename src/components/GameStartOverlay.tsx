import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { playSound } from '../core'
import { useGameStore } from '../store/useGameStore'
import { BrandLogo } from './BrandLogo'
import { CharacterMark } from './CharacterMark'
import { GameIcon } from './GameIcon'
import { useNotice } from './useNotice'

type SpinPhase = 'ready' | 'spinning' | 'revealed'

const SPIN_DURATION_MS = 2600
const SPIN_INITIAL_DELAY_MS = 55
const SPIN_FINAL_DELAY_MS = 190

export function GameStartOverlay() {
  const beginGame = useGameStore((state) => state.beginGame)
  const players = useGameStore((state) => state.players)
  const turnOrder = useGameStore((state) => state.turnOrder)
  const matchMinutes = useGameStore((state) => state.settings.matchMinutes)
  const { runAction } = useNotice()
  const [spinPhase, setSpinPhase] = useState<SpinPhase>('ready')
  const [displayOrder, setDisplayOrder] = useState<string[]>(() => players.map((player) => player.id))
  const spinStepTimeoutRef = useRef<number | null>(null)
  const spinTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (spinStepTimeoutRef.current !== null) window.clearTimeout(spinStepTimeoutRef.current)
      if (spinTimeoutRef.current !== null) window.clearTimeout(spinTimeoutRef.current)
    }
  }, [])

  const stopSpin = () => {
    if (spinStepTimeoutRef.current !== null) {
      window.clearTimeout(spinStepTimeoutRef.current)
      spinStepTimeoutRef.current = null
    }
    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current)
      spinTimeoutRef.current = null
    }
  }

  const handleStartClick = () => {
    if (spinPhase === 'spinning') return

    if (spinPhase === 'ready') {
      playSound('click')
      setSpinPhase('spinning')
      const startedAt = performance.now()
      const advanceSpin = () => {
        setDisplayOrder((currentOrder) => {
          if (currentOrder.length < 2) return currentOrder
          return [...currentOrder.slice(1), currentOrder[0]]
        })
        const progress = Math.min((performance.now() - startedAt) / SPIN_DURATION_MS, 1)
        if (progress < 0.96) {
          const delay = Math.round(
            SPIN_INITIAL_DELAY_MS +
              (SPIN_FINAL_DELAY_MS - SPIN_INITIAL_DELAY_MS) * progress,
          )
          spinStepTimeoutRef.current = window.setTimeout(advanceSpin, delay)
        }
      }
      advanceSpin()
      spinTimeoutRef.current = window.setTimeout(() => {
        stopSpin()
        setDisplayOrder(turnOrder.length > 0 ? turnOrder : players.map((player) => player.id))
        setSpinPhase('revealed')
      }, SPIN_DURATION_MS)
      return
    }

    playSound('click')
    runAction(beginGame)
  }

  const orderedPlayers = displayOrder.flatMap((playerId) => {
    const player = players.find((candidate) => candidate.id === playerId)
    return player ? [player] : []
  })
  const firstPlayer = orderedPlayers[0]
  const isRevealed = spinPhase === 'revealed'
  const cardClassName = `match-start-card match-start-card--${spinPhase}`
  const teamsClassName = `match-start-card__teams${spinPhase === 'spinning' ? ' is-spinning' : ''}`
  const buttonEyebrow =
    spinPhase === 'spinning'
      ? 'ĐANG QUAY THỨ TỰ'
      : spinPhase === 'revealed'
        ? 'MỞ CÂU HỎI ĐẦU TIÊN'
        : 'XÁC ĐỊNH THỨ TỰ ĐI'
  const buttonLabel =
    spinPhase === 'spinning'
      ? 'Đang quay thứ tự...'
      : spinPhase === 'revealed'
        ? 'Bắt đầu ván đấu'
        : 'Quay thứ tự đội'

  return (
    <div className="match-start-layer">
      <div className="match-start-layer__backdrop" />
      <section
        aria-label="Bắt đầu ván đấu"
        aria-modal="true"
        className={cardClassName}
        role="dialog"
      >
        <div className="match-start-card__topline">
          <BrandLogo compact />
          <span>
            <i />
            PHÒNG ĐẤU ĐÃ SẴN SÀNG
          </span>
        </div>

        <div
          aria-label={`${players.length} đội tham gia`}
          className={teamsClassName}
          aria-live="polite"
        >
          {orderedPlayers.map((player, index) => (
            <div
              className={isRevealed && index === 0 ? 'is-first' : ''}
              key={player.id}
              style={{ '--player-color': player.color } as CSSProperties}
              title={`${player.name}${isRevealed && index === 0 ? ' · Đi đầu tiên' : ''}`}
            >
              <CharacterMark characterId={player.characterId} />
              <strong>{index + 1}</strong>
            </div>
          ))}
        </div>

        <div className="match-start-card__summary">
          <span>
            <GameIcon name="users" size={18} />
            <small>ĐỘI THAM GIA</small>
            <strong>{players.length} đội</strong>
          </span>
          <i />
          <span>
            <GameIcon name="clock" size={18} />
            <small>THỜI LƯỢNG</small>
            <strong>{matchMinutes} phút</strong>
          </span>
          <i />
          <span>
            <GameIcon name="flag" size={18} />
            <small>ĐI ĐẦU TIÊN</small>
            <strong>{isRevealed ? firstPlayer?.name ?? 'Đang xác định' : 'Chưa xác định'}</strong>
          </span>
        </div>

        <button
          autoFocus
          aria-busy={spinPhase === 'spinning'}
          className="match-start-button"
          disabled={spinPhase === 'spinning'}
          onClick={handleStartClick}
          type="button"
        >
          <span className="match-start-button__icon">
            <GameIcon name="play" size={24} />
          </span>
          <span>
            <small>{buttonEyebrow}</small>
            <strong>{buttonLabel}</strong>
          </span>
          <GameIcon className="match-start-button__arrow" name="chevron-right" size={22} />
        </button>
      </section>
    </div>
  )
}
