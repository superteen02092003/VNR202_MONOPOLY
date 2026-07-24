import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import {
  PHASE_LABEL,
  formatMoney,
  playSound,
  soundManager,
} from '../core'
import type { GamePhase } from '../core'
import {
  selectCurrentPlayer,
  selectIsEndgameWarning,
  useGameStore,
} from '../store/useGameStore'
import { BrandLogo } from './BrandLogo'
import { CharacterMark } from './CharacterMark'
import { GameIcon } from './GameIcon'

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
  const finishMatch = useGameStore((state) => state.finishMatch)
  const resetGame = useGameStore((state) => state.resetGame)
  const warning = useGameStore(selectIsEndgameWarning)
  const current = useGameStore(selectCurrentPlayer)
  const awaitingStart = phase === 'turn-end' && turnCount === 0
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted())
  const toggleSound = () => {
    playSound('click')
    const next = soundManager.toggleMute()
    setIsMuted(next)
  }

  const totalSeconds = Math.ceil(timeRemainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const requestEarlyFinish = () => {
    playSound('click')
    if (window.confirm('Kết thúc ván ngay và chốt bảng xếp hạng hiện tại?')) {
      finishMatch()
    }
  }
  const requestReset = () => {
    playSound('click')
    if (
      window.confirm(
        'Chơi lại từ đầu? Toàn bộ tiến trình ván hiện tại sẽ bị xóa và quay về phòng chờ.',
      )
    ) {
      resetGame()
    }
  }

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
                    : 'ĐANG TẠM DƯNG'}
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
              onClick={() => {
                playSound('click')
                if (isTimerRunning) pauseTimer()
                else resumeTimer()
              }}
              type="button"
            >
              <GameIcon name={isTimerRunning ? 'pause' : 'play'} size={18} />
            </button>
          )}
        </div>

        <button
          aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          aria-pressed={!isMuted}
          className={`topbar-icon-button ${!isMuted ? 'is-active' : ''}`}
          onClick={toggleSound}
          title={isMuted ? 'Bật âm thanh SFX' : 'Tắt âm thanh SFX'}
          type="button"
        >
          <GameIcon name={isMuted ? 'volume-off' : 'volume'} size={20} />
        </button>

        {!awaitingStart && (
          <button
            aria-label="Kết thúc ván sớm"
            className="topbar-icon-button topbar-icon-button--danger"
            onClick={requestEarlyFinish}
            title="Kết thúc ván sớm"
            type="button"
          >
            <GameIcon name="flag" size={20} />
          </button>
        )}

        <button
          aria-label="Chơi lại từ đầu"
          className="topbar-icon-button"
          onClick={requestReset}
          title="Chơi lại từ đầu (xóa tiến trình, về phòng chờ)"
          type="button"
        >
          <GameIcon name="restart" size={20} />
        </button>

        <button
          aria-label={showActivity ? 'Ẩn nhật ký ván đấu' : 'Hiện nhật ký ván đấu'}
          aria-pressed={showActivity}
          className={`topbar-icon-button ${showActivity ? 'is-active' : ''}`}
          onClick={() => {
            playSound('click')
            toggleActivity()
          }}
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

function getActiveStep(phase: GamePhase): number {
  switch (phase) {
    case 'trivia':
      return 0
    case 'pre-roll':
      return 1
    case 'rolling':
    case 'moving':
      return 2
    case 'action':
    case 'turn-end':
      return 3
    default:
      return 0
  }
}

function PlayerRail() {
  const players = useGameStore((state) => state.players)
  const current = useGameStore(selectCurrentPlayer)

  return (
    <div className="player-rail" role="region" aria-label="Danh sách nhóm chơi">
      {players.map((player) => {
        const isCurrent = player.id === current?.id
        const isBankrupt = player.status === 'bankrupt'
        const isJailed = player.status === 'jailed'

        return (
          <div
            key={player.id}
            className={`player-badge ${isCurrent ? 'is-current' : ''} ${isBankrupt ? 'is-bankrupt' : ''} ${isJailed ? 'is-jailed' : ''}`}
            style={{ '--player-color': player.color } as CSSProperties}
          >
            <CharacterMark characterId={player.characterId} />
            <div className="player-badge__info">
              <strong>{player.name}</strong>
              <span>{isBankrupt ? 'Phá sản' : formatMoney(player.cash)}</span>
            </div>
            {isJailed && (
              <span className="player-badge__status-icon" title="Đang bị kẹt xe">
                <GameIcon name="lock" size={13} />
              </span>
            )}
            {player.cards.length > 0 && !isBankrupt && (
              <span className="player-badge__card-count" title={`Có ${player.cards.length} thẻ cơ hội`}>
                <GameIcon name="cards" size={12} />
                {player.cards.length}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ActivityPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const log = useGameStore((state) => state.log)

  return (
    <aside className={`activity-panel ${open ? 'is-open' : ''}`} aria-label="Nhật ký ván đấu">
      <div className="activity-panel__header">
        <div>
          <GameIcon name="history" size={18} />
          <strong>Nhật ký ván đấu</strong>
        </div>
        <button
          aria-label="Ẩn nhật ký"
          className="activity-panel__close"
          onClick={() => {
            playSound('click')
            onClose()
          }}
          type="button"
        >
          <GameIcon name="close" size={16} />
        </button>
      </div>

      <div className="activity-panel__body">
        {log.length === 0 ? (
          <p className="activity-panel__empty">Chưa có hoạt động nào phát sinh.</p>
        ) : (
          log
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id} className={`activity-item activity-item--${entry.kind}`}>
                <span className="activity-item__turn">L{entry.turn}</span>
                <span className="activity-item__msg">{entry.message}</span>
              </div>
            ))
        )}
      </div>
    </aside>
  )
}
