import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import { GAME_CONFIG, formatMoney, getTile, playSound, soundManager } from '../core'
import type { Player } from '../core'
import { selectIsEndgameWarning, useGameStore } from '../store/useGameStore'
import { CharacterMark } from './CharacterMark'
import { GameIcon } from './GameIcon'

const PLAYER_POSITIONS = ['top-left', 'top-right', 'left', 'right', 'bottom-center'] as const

export function GameHud() {
  const tick = useGameStore((state) => state.tick)
  const isTimerRunning = useGameStore((state) => state.isTimerRunning)

  useEffect(() => {
    if (!isTimerRunning) return

    let lastTickAt = Date.now()
    const syncTimer = () => {
      const now = Date.now()
      const elapsedMs = now - lastTickAt
      lastTickAt = now
      if (elapsedMs > 0) tick(elapsedMs)
    }

    const interval = window.setInterval(syncTimer, 1000)
    window.addEventListener('focus', syncTimer)
    document.addEventListener('visibilitychange', syncTimer)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', syncTimer)
      document.removeEventListener('visibilitychange', syncTimer)
    }
  }, [isTimerRunning, tick])

  return (
    <div className="game-hud">
      <AccessibilityControls />
      <CenterClock />
      <PlayerOrbit />
    </div>
  )
}

function AccessibilityControls() {
  const phase = useGameStore((state) => state.phase)
  const turnCount = useGameStore((state) => state.turnCount)
  const isTimerRunning = useGameStore((state) => state.isTimerRunning)
  const pauseTimer = useGameStore((state) => state.pauseTimer)
  const resumeTimer = useGameStore((state) => state.resumeTimer)
  const resetGame = useGameStore((state) => state.resetGame)
  const awaitingStart = phase === 'turn-end' && turnCount === 0
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted())

  const toggleSound = () => {
    const muted = soundManager.toggleMute()
    setIsMuted(muted)
  }

  const requestReset = () => {
    if (window.confirm('Chơi lại từ đầu? Toàn bộ tiến trình ván hiện tại sẽ bị xóa và quay về phòng chờ.')) {
      resetGame()
    }
  }

  return (
    <div className="game-access-controls" aria-label="Điều khiển ván đấu">
      <button
        aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        className={`game-access-button ${isMuted ? 'is-active' : ''}`}
        onClick={toggleSound}
        title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        type="button"
      >
        <GameIcon name={isMuted ? 'mute' : 'volume'} size={17} />
      </button>
      <button
        aria-label={isTimerRunning ? 'Tạm dừng đồng hồ' : 'Tiếp tục đồng hồ'}
        className={`game-access-button ${!isTimerRunning ? 'is-paused' : ''}`}
        disabled={awaitingStart}
        onClick={() => { playSound('click'); isTimerRunning ? pauseTimer() : resumeTimer() }}
        title={isTimerRunning ? 'Tạm dừng' : 'Tiếp tục'}
        type="button"
      >
        <GameIcon name={isTimerRunning ? 'pause' : 'play'} size={17} />
      </button>
      <button
        aria-label="Chơi lại từ đầu"
        className="game-access-button game-access-button--reset"
        onClick={() => { playSound('click'); requestReset() }}
        title="Chơi lại từ đầu"
        type="button"
      >
        <GameIcon name="restart" size={17} />
      </button>
    </div>
  )
}

function CenterClock() {
  const phase = useGameStore((state) => state.phase)
  const turnCount = useGameStore((state) => state.turnCount)
  const timeRemainingMs = useGameStore((state) => state.timeRemainingMs)
  const isTimerRunning = useGameStore((state) => state.isTimerRunning)
  const isFinalTurn = useGameStore((state) => state.isFinalTurn)
  const warning = useGameStore(selectIsEndgameWarning)

  const totalSeconds = Math.ceil(timeRemainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const awaitingStart = phase === 'turn-end' && turnCount === 0
  const label = awaitingStart
    ? 'SẴN SÀNG'
    : isFinalTurn
      ? 'LƯỢT CUỐI'
      : isTimerRunning
        ? 'THỜI GIAN CÒN LẠI'
        : 'ĐANG TẠM DỪNG'

  return (
    <div className={`game-center-clock ${warning ? 'is-warning' : ''} ${!isTimerRunning ? 'is-paused' : ''}`}>
      <span className="game-center-clock__label">{label}</span>
      <strong>
        {String(minutes).padStart(2, '0')}
        <i>:</i>
        {String(seconds).padStart(2, '0')}
      </strong>
    </div>
  )
}

function PlayerOrbit() {
  const players = useGameStore((state) => state.players)
  const currentId = useGameStore((state) => state.turnOrder[state.currentPlayerIndex])
  const properties = useGameStore((state) => state.properties)

  return (
    <section className="player-orbit" aria-label="Thông tin 5 đội chơi">
      {players.map((player, index) => {
        const owned = Object.values(properties).filter((property) => property.ownerId === player.id).length
        const position = PLAYER_POSITIONS[index] ?? PLAYER_POSITIONS[PLAYER_POSITIONS.length - 1]

        return (
          <PlayerCard
            active={player.id === currentId}
            index={index}
            key={player.id}
            owned={owned}
            player={player}
            position={position}
          />
        )
      })}
    </section>
  )
}

function PlayerCard({
  active,
  index,
  owned,
  player,
  position,
}: {
  active: boolean
  index: number
  owned: number
  player: Player
  position: (typeof PLAYER_POSITIONS)[number]
}) {
  const tile = getTile(player.position)
  const location = tile.type === 'property' ? tile.province : tile.name
  const statusLabel =
    player.status === 'jailed'
      ? `Kẹt xe · còn ${player.jailTurnsLeft} lượt`
      : player.status === 'bankrupt'
        ? 'Đã phá sản'
        : location

  return (
    <article
      className={`player-card player-orbit__card player-orbit__card--${position} ${active ? 'player-card--active' : ''} ${player.status === 'bankrupt' ? 'player-card--bankrupt' : ''}`}
      style={{ '--player-color': player.color } as CSSProperties}
    >
      <div className="player-card__glow" />
      <div className="player-card__position">{String(index + 1).padStart(2, '0')}</div>
      <div className="player-card__avatar">
        <CharacterMark characterId={player.characterId} />
        {active && <i />}
      </div>
      <div className="player-card__main">
        <div className="player-card__name-row">
          <strong>{player.name}</strong>
          {active && <span>ĐANG ĐI</span>}
        </div>
        <div className="player-card__cash">
          <img
            alt=""
            aria-hidden="true"
            className="player-card__cash-art"
            src="/money-stack-green.png"
          />
          <span>{formatMoney(player.cash)}</span>
        </div>
        <div className="player-card__meta">
          <span title={statusLabel}>
            <GameIcon name={player.status === 'jailed' ? 'lock' : 'map'} size={12} />
            {statusLabel}
          </span>
          <span>{owned} địa danh</span>
        </div>
      </div>
      <div className="player-card__inventory" title={`${player.cards.length}/${GAME_CONFIG.MAX_CARDS} Thẻ Cơ hội`}>
        {Array.from({ length: GAME_CONFIG.MAX_CARDS }, (_, cardIndex) => (
          <i className={cardIndex < player.cards.length ? 'is-filled' : ''} key={cardIndex} />
        ))}
      </div>
    </article>
  )
}
