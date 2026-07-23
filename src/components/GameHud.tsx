import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import {
  GAME_CONFIG,
  getTile,
  PHASE_LABEL,
  formatMoney,
} from '../core'
import type { GamePhase, LogKind, Player } from '../core'
import {
  selectCurrentPlayer,
  selectIsEndgameWarning,
  useGameStore,
} from '../store/useGameStore'
import { BrandLogo } from './BrandLogo'
import { CharacterMark } from './CharacterMark'
import { GameIcon } from './GameIcon'
import type { GameIconName } from './GameIcon'

const FLOW_STEPS: { key: 'trivia' | 'pre-roll' | 'movement' | 'action'; label: string; short: string }[] = [
  { key: 'trivia', label: 'Hỏi đáp', short: '01' },
  { key: 'pre-roll', label: 'Chiến thuật', short: '02' },
  { key: 'movement', label: 'Di chuyển', short: '03' },
  { key: 'action', label: 'Hành động', short: '04' },
]

export function GameHud() {
  const [showActivity, setShowActivity] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1181px)').matches,
  )
  const tick = useGameStore((state) => state.tick)
  const isTimerRunning = useGameStore((state) => state.isTimerRunning)

  useEffect(() => {
    if (!isTimerRunning) return
    const interval = window.setInterval(() => tick(1000), 1000)
    return () => window.clearInterval(interval)
  }, [isTimerRunning, tick])

  return (
    <div className="game-hud">
      <TopBar showActivity={showActivity} toggleActivity={() => setShowActivity((value) => !value)} />
      <PlayerRail />
      <ActivityPanel open={showActivity} onClose={() => setShowActivity(false)} />
    </div>
  )
}

function TopBar({
  showActivity,
  toggleActivity,
}: {
  showActivity: boolean
  toggleActivity: () => void
}) {
  const phase = useGameStore((state) => state.phase)
  const turnCount = useGameStore((state) => state.turnCount)
  const timeRemainingMs = useGameStore((state) => state.timeRemainingMs)
  const isFinalTurn = useGameStore((state) => state.isFinalTurn)
  const isTimerRunning = useGameStore((state) => state.isTimerRunning)
  const pauseTimer = useGameStore((state) => state.pauseTimer)
  const resumeTimer = useGameStore((state) => state.resumeTimer)
  const warning = useGameStore(selectIsEndgameWarning)
  const current = useGameStore(selectCurrentPlayer)
  const awaitingStart = phase === 'turn-end' && turnCount === 0

  const minutes = Math.floor(timeRemainingMs / 60_000)
  const seconds = Math.floor((timeRemainingMs % 60_000) / 1000)

  return (
    <header className="game-topbar">
      <BrandLogo compact />

      <div className="turn-summary">
        <span className="turn-summary__label">
          {awaitingStart ? 'ĐỘI MỞ MÀN' : `LƯỢT ${String(turnCount).padStart(2, '0')}`}
        </span>
        {current && (
          <span className="turn-summary__player" style={{ '--player-color': current.color } as CSSProperties}>
            <CharacterMark characterId={current.characterId} />
            <strong>{current.name}</strong>
          </span>
        )}
      </div>

      <PhaseStepper awaitingStart={awaitingStart} phase={phase} />

      <div className="topbar-actions">
        <div
          className={`match-clock ${warning ? 'match-clock--warning' : ''} ${!isTimerRunning ? 'match-clock--paused' : ''} ${awaitingStart ? 'match-clock--ready' : ''}`}
          title={
            awaitingStart
              ? 'Đồng hồ sẽ chạy sau khi Host bắt đầu ván đấu'
              : isTimerRunning
                ? 'Đồng hồ ván đấu đang chạy'
                : 'Đồng hồ đang tạm dừng'
          }
        >
          <span className="match-clock__icon">
            <GameIcon name="clock" size={18} />
          </span>
          <span className="match-clock__copy">
            <small>
              {awaitingStart
                ? 'CHƯA BẮT ĐẦU'
                : isFinalTurn
                  ? 'LƯỢT CUỐI'
                  : isTimerRunning
                    ? 'THỜI GIAN CÒN LẠI'
                    : 'ĐANG TẠM DỪNG'}
            </small>
            <strong>
              {String(minutes).padStart(2, '0')}
              <i>:</i>
              {String(seconds).padStart(2, '0')}
            </strong>
          </span>
          {!awaitingStart && !isFinalTurn && (
            <button
              aria-label={isTimerRunning ? 'Tạm dừng đồng hồ' : 'Tiếp tục đồng hồ'}
              onClick={isTimerRunning ? pauseTimer : resumeTimer}
              type="button"
            >
              <GameIcon name={isTimerRunning ? 'pause' : 'play'} size={18} />
            </button>
          )}
        </div>

        <button
          aria-label={showActivity ? 'Ẩn nhật ký ván đấu' : 'Hiện nhật ký ván đấu'}
          aria-pressed={showActivity}
          className={`topbar-icon-button ${showActivity ? 'is-active' : ''}`}
          onClick={toggleActivity}
          title="Nhật ký ván đấu"
          type="button"
        >
          <GameIcon name="history" size={20} />
        </button>
      </div>
    </header>
  )
}

function PhaseStepper({
  awaitingStart,
  phase,
}: {
  awaitingStart: boolean
  phase: GamePhase
}) {
  const activeIndex = awaitingStart ? -1 : getActiveStep(phase)

  return (
    <div
      aria-label={`Tiến trình lượt: ${awaitingStart ? 'Chưa bắt đầu' : PHASE_LABEL[phase]}`}
      className="phase-stepper"
    >
      {FLOW_STEPS.map((step, index) => {
        const state = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'upcoming'
        return (
          <div className={`phase-step phase-step--${state}`} key={step.key}>
            <span className="phase-step__dot">
              {state === 'done' ? <GameIcon name="check" size={12} /> : step.short}
            </span>
            <span className="phase-step__label">{step.label}</span>
            {index < FLOW_STEPS.length - 1 && <i className="phase-step__line" />}
          </div>
        )
      })}
    </div>
  )
}

function PlayerRail() {
  const players = useGameStore((state) => state.players)
  const currentId = useGameStore((state) => state.turnOrder[state.currentPlayerIndex])
  const properties = useGameStore((state) => state.properties)

  return (
    <aside className="player-rail" aria-label="Danh sách đội chơi">
      <div className="player-rail__heading">
        <span>ĐỘI ĐUA</span>
        <strong>{players.filter((player) => player.status !== 'bankrupt').length}/{players.length}</strong>
      </div>
      <div className="player-rail__list">
        {players.map((player, index) => {
          const owned = Object.values(properties).filter(
            (property) => property.ownerId === player.id,
          ).length
          return (
            <PlayerCard
              active={player.id === currentId}
              index={index}
              key={player.id}
              owned={owned}
              player={player}
            />
          )
        })}
      </div>
    </aside>
  )
}

function PlayerCard({
  active,
  index,
  owned,
  player,
}: {
  active: boolean
  index: number
  owned: number
  player: Player
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
      className={`player-card ${active ? 'player-card--active' : ''} ${player.status === 'bankrupt' ? 'player-card--bankrupt' : ''}`}
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
          <GameIcon name="coin" size={14} />
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

function ActivityPanel({ onClose, open }: { onClose: () => void; open: boolean }) {
  const log = useGameStore((state) => state.log)
  const recent = [...log].reverse().slice(0, 7)

  return (
    <aside aria-hidden={!open} className={`activity-panel ${open ? 'activity-panel--open' : ''}`}>
      <div className="activity-panel__header">
        <div>
          <span className="section-kicker">TRỰC TIẾP</span>
          <h2>Diễn biến ván đấu</h2>
        </div>
        <button aria-label="Đóng nhật ký" onClick={onClose} tabIndex={open ? 0 : -1} type="button">
          <GameIcon name="close" size={18} />
        </button>
      </div>
      <div className="activity-panel__feed">
        {recent.length === 0 ? (
          <div className="activity-empty">
            <GameIcon name="history" size={22} />
            <p>Diễn biến mới sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          recent.map((entry) => (
            <div className={`activity-item activity-item--${entry.kind}`} key={entry.id}>
              <span className="activity-item__icon">
                <GameIcon name={logIcon(entry.kind)} size={13} />
              </span>
              <div>
                <span>Lượt {entry.turn || 1}</span>
                <p>{entry.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="activity-panel__footer">
        <span className="live-dot" />
        Tự động cập nhật
      </div>
    </aside>
  )
}

function getActiveStep(phase: GamePhase) {
  if (phase === 'trivia') return 0
  if (phase === 'pre-roll') return 1
  if (phase === 'rolling' || phase === 'moving') return 2
  return 3
}

function logIcon(kind: LogKind): GameIconName {
  const icons: Record<LogKind, GameIconName> = {
    card: 'card-spark',
    info: 'info',
    money: 'banknote',
    property: 'landmark',
    success: 'check',
    trivia: 'help',
    warning: 'alert',
  }
  return icons[kind]
}
