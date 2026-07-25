import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import {
  BOARD,
  BUILD_LEVEL_LABEL,
  GAME_CONFIG,
  formatMoney,
  formatPropertyPrice,
  getCardDefinition,
  getPropertyTile,
  getTile,
  playSound,
} from '../core'
import type {
  CardTarget,
  CardTargetKind,
  CardEffect,
  CardDefinition,
  PlayerId,
  Player,
  Question,
  Standing,
  TileId,
} from '../core'
import { selectCurrentPlayer, useGameStore } from '../store/useGameStore'
import type { ActionResult } from '../store/useGameStore'
import { CharacterMark } from './CharacterMark'
import { useCardTargeting } from './CardTargetContext'
import { GameIcon } from './GameIcon'
import type { GameIconName } from './GameIcon'
import { useNotice } from './useNotice'

interface TriviaReviewState {
  answerIndex: number | null
  earnedCard: boolean
  cardUsedImmediately: boolean
  cardEffect: CardEffect | null
  question: Question
}
interface AutoActor {
  characterId: Player['characterId']
  color: string
  name: string
}
type AutoOverlay =
  | {
      kind: 'money'
      actor: AutoActor
      amount: number
      receiver: { amount: number; name: string } | null
      title: string
    }
  | {
      kind: 'card'
      actor: AutoActor
      card: CardDefinition | null
      saved: boolean
      usedImmediately: boolean
    }
  | { kind: 'turn'; actor: AutoActor }

const CARD_ICON_BY_EFFECT: Record<CardEffect, GameIconName> = {
  'choose-dice': 'target',
  demolish: 'construction',
  'escape-jail': 'ticket',
  'free-stay': 'shield',
  'heritage-shield': 'shield',
  'instant-festival': 'festival',
  stimulus: 'banknote',
  'swap-position': 'swap',
  teleport: 'plane',
}

const ACTION_NOTICE_READ_SECONDS = 6
const CARD_READ_SECONDS = 6
/** Thời gian giữ thẻ thông báo tự động để người chơi kịp đọc (ms). */
const MONEY_READ_MS = 3200
const TURN_READ_MS = 2400

export function ActionDock() {
  const phase = useGameStore((state) => state.phase)
  const pending = useGameStore((state) => state.pendingAction)
  const currentQuestion = useGameStore((state) => state.currentQuestion)
  const answerTrivia = useGameStore((state) => state.answerTrivia)
  const triviaSeconds = useGameStore((state) => state.settings.triviaSeconds)
  const current = useGameStore(selectCurrentPlayer)
  const payRent = useGameStore((state) => state.payRent)
  const payTax = useGameStore((state) => state.payTax)
  const drawChanceCard = useGameStore((state) => state.drawChanceCard)
  const endTurn = useGameStore((state) => state.endTurn)
  const [review, setReview] = useState<TriviaReviewState | null>(null)
  const [autoOverlay, setAutoOverlay] = useState<AutoOverlay | null>(null)
  const autoHandledKeyRef = useRef<string | null>(null)
  const autoInFlightRef = useRef(false)
  const autoFinishTimerRef = useRef<number | null>(null)
  const { notify, runAction } = useNotice()

  const finishAutoOverlay = useCallback(() => {
    if (autoFinishTimerRef.current !== null) {
      window.clearTimeout(autoFinishTimerRef.current)
      autoFinishTimerRef.current = null
    }
    setAutoOverlay(null)
    autoInFlightRef.current = false
    autoHandledKeyRef.current = null
    const nextState = useGameStore.getState()
    if (nextState.pendingAction.kind === 'idle') nextState.endTurn()
  }, [])

  const automaticActionKey = useMemo(() => {
    if (phase !== 'action' || !current) return null
    switch (pending.kind) {
      case 'rent':
        // Có thể thâu tóm → dừng lại cho đội chọn Trả thuê / Mua lại; còn lại tự trả.
        return pending.takeoverCost !== null
          ? null
          : `rent:${current.id}:${pending.tileId}:${pending.rent}`
      case 'tax':
        return `tax:${current.id}:${pending.tileId}:${pending.amount}`
      case 'chance':
        return `chance:${current.id}`
      case 'idle':
        return `end-turn:${current.id}:${useGameStore.getState().turnCount}`
      default:
        return null
    }
  }, [current, pending, phase])

  useEffect(() => {
    return () => {
      if (autoFinishTimerRef.current !== null) window.clearTimeout(autoFinishTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (
      !automaticActionKey ||
      !current ||
      autoInFlightRef.current ||
      autoHandledKeyRef.current === automaticActionKey
    ) {
      return
    }

    autoHandledKeyRef.current = automaticActionKey
    const actionKind = pending.kind
    const timer = window.setTimeout(() => {
      autoInFlightRef.current = true
      const beforeState = useGameStore.getState()
      const actorBefore = beforeState.players.find((player) => player.id === current.id)
      const ownerBefore =
        actionKind === 'rent'
          ? beforeState.players.find((player) => player.id === pending.ownerId)
          : undefined
      const actor = actorBefore
        ? { characterId: actorBefore.characterId, color: actorBefore.color, name: actorBefore.name }
        : { characterId: current.characterId, color: current.color, name: current.name }

      const result =
        actionKind === 'rent'
          ? payRent()
          : actionKind === 'tax'
            ? payTax()
            : actionKind === 'chance'
              ? drawChanceCard()
              : endTurn()

      if (!result.ok) {
        notify(result.reason ?? 'Không thể tự động xử lý tác vụ này.', 'error')
        autoInFlightRef.current = false
        return
      }

      const afterState = useGameStore.getState()
      const actorAfter = afterState.players.find((player) => player.id === current.id)
      const ownerAfter =
        actionKind === 'rent'
          ? afterState.players.find((player) => player.id === pending.ownerId)
          : undefined

      if (actionKind === 'chance') {
        setAutoOverlay({
          kind: 'card',
          actor,
          card: result.cardEffect ? getCardDefinition(result.cardEffect) : null,
          saved: result.cardSaved === true,
          usedImmediately: result.cardUsedImmediately === true,
        })
        autoFinishTimerRef.current = window.setTimeout(() => {
          finishAutoOverlay()
        }, CARD_READ_SECONDS * 1000)
        return
      }

      if (actionKind === 'rent' || actionKind === 'tax') {
        const actorDelta = (actorAfter?.cash ?? 0) - (actorBefore?.cash ?? 0)
        const ownerDelta = ownerAfter && ownerBefore ? ownerAfter.cash - ownerBefore.cash : 0
        setAutoOverlay({
          kind: 'money',
          actor,
          amount: actorDelta,
          receiver:
            ownerAfter && ownerBefore
              ? { amount: ownerDelta, name: ownerAfter.name }
              : null,
          title: actionKind === 'rent' ? 'Đã tự động trả phí lưu trú' : 'Đã tự động nộp thuế',
        })
        autoFinishTimerRef.current = window.setTimeout(() => {
          setAutoOverlay(null)
          autoInFlightRef.current = false
          autoHandledKeyRef.current = null
          useGameStore.getState().endTurn()
        }, MONEY_READ_MS)
        return
      }

      setAutoOverlay({ kind: 'turn', actor })
      autoFinishTimerRef.current = window.setTimeout(() => {
        setAutoOverlay(null)
        autoInFlightRef.current = false
        autoHandledKeyRef.current = null
      }, TURN_READ_MS)
    }, 430)

    return () => window.clearTimeout(timer)
  }, [
    automaticActionKey,
    current,
    drawChanceCard,
    endTurn,
    finishAutoOverlay,
    notify,
    payRent,
    payTax,
    pending,
  ])

  const answer = useCallback(
    (answerIndex: number | null) => {
      if (!currentQuestion) return
      const snapshot = {
        answerIndex,
        earnedCard: false,
        cardUsedImmediately: false,
        cardEffect: null as CardEffect | null,
        question: currentQuestion,
      }
      let answerResult: ActionResult = { ok: false, reason: null }
      if (runAction(() => {
        answerResult = answerTrivia(answerIndex)
        return answerResult
      })) {
        snapshot.earnedCard = answerResult.cardSaved === true
        snapshot.cardUsedImmediately = answerResult.cardUsedImmediately === true
        snapshot.cardEffect = answerResult.cardEffect ?? null
        setReview(snapshot)
      }
    },
    [answerTrivia, currentQuestion, runAction],
  )

  if (review) {
    return <TriviaReview review={review} onContinue={() => setReview(null)} />
  }

  if (autoOverlay) {
    return (
      <div className="action-dock-wrap action-dock-wrap--modal">
        <AutomaticOverlay overlay={autoOverlay} onSkip={finishAutoOverlay} />
      </div>
    )
  }

  if (phase === 'game-over') return <ResultOverlay />

  if (phase === 'trivia' && currentQuestion) {
    return (
      <TriviaPanel
        current={current}
        onAnswer={answer}
        question={currentQuestion}
        seconds={triviaSeconds}
      />
    )
  }

  // Thẻ chọn-trực-tiếp-trên-bàn-cờ (Đăng cai lễ hội / bay) KHÔNG che mờ nền,
  // vì backdrop che sẽ chặn click lên ô đang sáng trên bàn cờ.
  const isBoardPicker = pending.kind === 'festival' || pending.kind === 'travel-choose'
  const hasActionModal = !isBoardPicker && phase === 'action'

  return (
    <div className={`action-dock-wrap${hasActionModal ? ' action-dock-wrap--modal' : ''}`}>
      {phase === 'pre-roll' && <PreRollDock current={current} />}
      {(phase === 'rolling' || phase === 'moving') && <MovementDock />}
      {phase === 'action' && <ActionPrompt />}
    </div>
  )
}
function TriviaPanel({
  current,
  onAnswer,
  question,
  seconds,
}: {
  current: Player | undefined
  onAnswer: (answerIndex: number | null) => void
  question: Question
  seconds: number
}) {
  const [remaining, setRemaining] = useState(seconds)
  const firedRef = useRef(false)
  const isTimerRunning = useGameStore((state) => state.isTimerRunning)
  const pauseTimer = useGameStore((state) => state.pauseTimer)
  const resumeTimer = useGameStore((state) => state.resumeTimer)

  useEffect(() => {
    firedRef.current = false
    setRemaining(seconds)
  }, [question.id, seconds])

  useEffect(() => {
    if (!isTimerRunning) return
    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [isTimerRunning, question.id])

  useEffect(() => {
    if (remaining <= 5 && remaining > 0 && isTimerRunning) {
      playSound('tick-warning')
    }
    if (remaining !== 0 || firedRef.current) return
    firedRef.current = true
    onAnswer(null)
  }, [onAnswer, remaining, isTimerRunning])

  const progress = Math.max(0, Math.min(1, remaining / seconds))

  return (
    <div className="modal-layer modal-layer--trivia">
      <div className="modal-backdrop" />
      <section className="paper-modal trivia-modal" aria-labelledby="trivia-title" role="dialog">
        <div className="paper-modal__sheet paper-modal__sheet--one" />
        <div className="paper-modal__sheet paper-modal__sheet--two" />
        <div className="trivia-ribbon">
          <span className="trivia-ribbon__icon">
            <GameIcon name="help" size={24} />
          </span>
          <div>
            <strong id="trivia-title">Thử thách kiến thức</strong>
          </div>
          {current && (
            <div className="trivia-ribbon__player" style={{ '--player-color': current.color } as CSSProperties}>
              <CharacterMark characterId={current.characterId} />
              <div>
                <small>ĐỘI ĐANG TRẢ LỜI</small>
                <strong>{current.name}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="trivia-modal__content">
          <div className="trivia-meta">
            <div className="trivia-timer-controls">
              <button
                aria-label={isTimerRunning ? 'Tạm dừng câu hỏi' : 'Tiếp tục câu hỏi'}
                className="trivia-timer-toggle"
                onClick={isTimerRunning ? pauseTimer : resumeTimer}
                type="button"
              >
                <GameIcon name={isTimerRunning ? 'pause' : 'play'} size={16} />
              </button>
              <div
                className={`question-clock ${remaining <= 8 ? 'question-clock--urgent' : ''} ${!isTimerRunning ? 'question-clock--paused' : ''}`}
                style={{ '--progress': progress } as CSSProperties}
              >
                <svg viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" />
                  <circle className="question-clock__progress" cx="22" cy="22" r="18" />
                </svg>
                <strong>{remaining}</strong>
              </div>
            </div>
          </div>

          <h2 className="trivia-question">{question.prompt}</h2>

          <div className="trivia-options">
            {question.options.map((option, index) => (
              <button
                className="trivia-option"
                key={option}
                onClick={() => { playSound('click'); onAnswer(index) }}
                type="button"
              >
                <span>{String.fromCharCode(65 + index)}</span>
                <strong>{option}</strong>
                <GameIcon name="chevron-right" size={18} />
              </button>
            ))}
          </div>

          <div className="trivia-modal__footer">
            <span>
              <GameIcon name="cards" size={17} />
              Trả lời đúng sẽ kích hoạt ngay 1 Thẻ Cơ hội
            </span>
            <button onClick={() => onAnswer(null)} type="button">
              Bỏ qua câu hỏi
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function TriviaReview({
  onContinue,
  review,
}: {
  onContinue: () => void
  review: TriviaReviewState
}) {
  const correct = review.answerIndex === review.question.answerIndex
  const timeout = review.answerIndex === null
  const selected =
    review.answerIndex === null ? null : review.question.options[review.answerIndex]
  const correctAnswer = review.question.options[review.question.answerIndex]
  const rewardCard = review.cardEffect ? getCardDefinition(review.cardEffect) : null

  return (
    <div className="modal-layer modal-layer--review">
      <div className="modal-backdrop" />
      <section
        className={`paper-modal review-modal ${correct ? 'review-modal--correct' : 'review-modal--wrong'}`}
        aria-labelledby="review-title"
        role="dialog"
      >
        <div className="review-modal__seal">
          <GameIcon name={correct ? 'check' : 'close'} size={40} />
        </div>
        <span className="section-kicker">
          {correct ? 'CHÍNH XÁC' : timeout ? 'HẾT THỜI GIAN' : 'CHƯA CHÍNH XÁC'}
        </span>
        <h2 id="review-title">
          {correct ? 'Xuất sắc! Đội đã ghi điểm.' : 'Đáp án đúng đã được hé lộ'}
        </h2>

        {!correct && selected && (
          <div className="review-answer review-answer--selected">
            <small>ĐỘI ĐÃ CHỌN</small>
            <span>{selected}</span>
          </div>
        )}
        <div className="review-answer review-answer--correct">
          <small>ĐÁP ÁN ĐÚNG</small>
          <span>
            {String.fromCharCode(65 + review.question.answerIndex)}. {correctAnswer}
          </span>
        </div>

        <div className="review-explanation">
          <span>GỢI NHỚ LỊCH SỬ</span>
          <p>{review.question.explanation}</p>
        </div>

        {correct && rewardCard && (
          <div className={`review-reward ${review.earnedCard ? '' : 'review-reward--full'}`}>
            <div className="review-reward__card">
              <GameIcon name="card-spark" size={29} style={{ opacity: 1 }} />
            </div>
            <div className="review-reward__copy">
              <small>{review.earnedCard ? 'THẺ ĐÃ VÀO TÚI ĐỒ' : 'THẺ ĐÃ KÍCH HOẠT'}</small>
              <strong>{rewardCard.name}</strong>
              <p>{rewardCard.description}</p>
              {review.earnedCard && (
                <p className="review-reward__hint">
                  Dùng ở Vòng Chiến thuật: bấm thẻ trong túi rồi chọn mục tiêu ngay trên bàn cờ.
                </p>
              )}
            </div>
          </div>
        )}

        <button className="primary-game-button" onClick={onContinue} type="button">
          Tiếp tục vòng chiến thuật
          <GameIcon name="chevron-right" size={20} />
        </button>
      </section>
    </div>
  )
}

function PreRollDock({ current }: { current: Player | undefined }) {
  const pending = useGameStore((state) => state.pendingAction)
  const chooseTravelDestination = useGameStore((state) => state.chooseTravelDestination)
  const skipTravel = useGameStore((state) => state.skipTravel)

  if (!current) return null

  if (pending.kind === 'travel-choose') {
    return (
      <TilePickerCard
        icon="airport"
        label="ĐẶC QUYỀN SÂN BAY"
        onCancel={skipTravel}
        onPick={chooseTravelDestination}
        directOnBoard
        playerId={current.id}
        subtitle="Chọn một điểm đến bất kỳ hoặc tiếp tục đổ xúc xắc như thường."
        tileIds={BOARD.map((tile) => tile.id)}
        title="Bay thẳng đến địa danh"
      />
    )
  }

  return (
    <section className="action-dock strategy-dock">
      <div className="action-dock__accent" style={{ background: current.color }} />
      <div className="strategy-dock__intro">
        <span className="section-kicker">VÒNG 02 · CHIẾN THUẬT</span>
        <h2>Chuẩn bị nước đi</h2>
        <p>Dùng Thẻ Cơ hội trước khi tung xúc xắc, hoặc tiếp tục ngay.</p>
      </div>
      <CardInventory player={current} />
    </section>
  )
}

function CardInventory({ player }: { player: Player }) {
  const playCard = useGameStore((state) => state.playCard)
  const players = useGameStore((state) => state.players)
  const properties = useGameStore((state) => state.properties)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [targetValue, setTargetValue] = useState('')
  const { runAction } = useNotice()

  const card = player.cards.find((item) => item.instanceId === activeId)
  const definition = card ? getCardDefinition(card.effect) : null
  const targetOptions = useMemo(
    () =>
      definition
        ? getTargetOptions(definition.effect, definition.targetKind, player, players, properties)
        : [],
    [definition, player, players, properties],
  )

  useEffect(() => {
    setTargetValue(targetOptions[0]?.value ?? '')
  }, [activeId, targetOptions])

  const useCard = () => {
    if (!card || !definition) return
    const target = createCardTarget(definition.targetKind, targetValue)
    const succeeded = runAction(
      () => playCard(card.instanceId, target),
      `Đã dùng thẻ "${definition.name}".`,
    )
    if (succeeded) {
      playSound('card-use')
      setActiveId(null)
    }
  }

  return (
    <div className="card-inventory">
      <div className="card-inventory__header">
        <span>
          <GameIcon name="cards" size={16} />
          Túi Thẻ Cơ hội
        </span>
        <small>{player.cards.length}/{GAME_CONFIG.MAX_CARDS}</small>
      </div>

      <div className="card-inventory__slots">
        {Array.from({ length: GAME_CONFIG.MAX_CARDS }, (_, index) => {
          const item = player.cards[index]
          if (!item) {
            return (
              <div className="chance-card chance-card--empty" key={`empty-${index}`}>
                <span><GameIcon name="plus" size={14} /></span>
                <small>Trống</small>
              </div>
            )
          }
          const itemDefinition = getCardDefinition(item.effect)
          const unavailable = item.effect === 'escape-jail' && player.status !== 'jailed'
          return (
            <button
              aria-pressed={activeId === item.instanceId}
              className={`chance-card ${activeId === item.instanceId ? 'is-active' : ''}`}
              disabled={unavailable}
              key={item.instanceId}
              onClick={() => setActiveId((current) => current === item.instanceId ? null : item.instanceId)}
              title={
                unavailable
                  ? 'Thẻ này chỉ dùng được khi đội đang ở ô Kẹt xe.'
                  : itemDefinition.description
              }
              type="button"
            >
              <span><GameIcon name={CARD_ICON_BY_EFFECT[item.effect]} size={18} /></span>
              <strong>{itemDefinition.name}</strong>
            </button>
          )
        })}
      </div>

      {card && definition && (
        <div className="card-use-panel">
          <div>
            <strong>{definition.name}</strong>
            <p>{definition.description}</p>
          </div>
          {definition.targetKind !== 'none' && targetOptions.length > 0 && (
            <label>
              <span className="sr-only">Mục tiêu của thẻ</span>
              <select
                aria-label="Mục tiêu của thẻ"
                onChange={(event) => setTargetValue(event.target.value)}
                value={targetValue}
              >
                {targetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {definition.targetKind !== 'none' && targetOptions.length === 0 && (
            <span className="card-no-target">Chưa có mục tiêu hợp lệ</span>
          )}
          <button
            disabled={definition.targetKind !== 'none' && !targetValue}
            onClick={useCard}
            type="button"
          >
            Dùng thẻ
          </button>
        </div>
      )}
    </div>
  )
}

function MovementDock() {
  const phase = useGameStore((state) => state.phase)
  const dice = useGameStore((state) => state.dice)
  const applyMovement = useGameStore((state) => state.applyMovement)
  const current = useGameStore(selectCurrentPlayer)

  if (!dice || !current) return null

  return (
    <section className="action-dock movement-dock">
      <div className="movement-dock__player" style={{ '--player-color': current.color } as CSSProperties}>
        <CharacterMark characterId={current.characterId} />
        <div>
          <small>{phase === 'rolling' ? 'XÚC XẮC ĐANG LĂN' : 'ĐANG DI CHUYỂN'}</small>
          <strong>{current.name}</strong>
        </div>
      </div>
      <div className="dice-result">
        <span>{dice[0]}</span>
        <i>+</i>
        <span>{dice[1]}</span>
        <i>=</i>
        <strong>{dice[0] + dice[1]}</strong>
      </div>
      <div className="movement-dock__status">
        <div className="motion-bars"><i /><i /><i /></div>
        <span>{phase === 'rolling' ? 'Chờ xúc xắc dừng…' : `Đang đi ${dice[0] + dice[1]} bước…`}</span>
      </div>
      <ActionButton
        action={applyMovement}
        className="skip-motion-button"
        icon="chevron-right"
        label="Bỏ qua hoạt ảnh"
        variant="ghost"
      />
    </section>
  )
}

function ActionPrompt() {
  const pending = useGameStore((state) => state.pendingAction)
  const current = useGameStore(selectCurrentPlayer)
  const players = useGameStore((state) => state.players)
  const confirmBuy = useGameStore((state) => state.confirmBuy)
  const confirmUpgrade = useGameStore((state) => state.confirmUpgrade)
  const chooseFestivalTile = useGameStore((state) => state.chooseFestivalTile)
  const payRent = useGameStore((state) => state.payRent)
  const confirmTakeover = useGameStore((state) => state.confirmTakeover)
  const payBail = useGameStore((state) => state.payBail)
  const declineAction = useGameStore((state) => state.declineAction)

  if (!current) return null

  switch (pending.kind) {
    case 'buy':
      return (
        <DecisionCard
          current={current}
          eyebrow="CƠ HỘI ĐẦU TƯ"
          icon="map"
          title={getTile(pending.tileId).name}
        >
          <div className="decision-metrics">
            <Metric label="Giá mua" value={formatPropertyPrice(pending.price)} />
            <Metric label="Tiền sau mua" value={formatMoney(current.cash - pending.price)} />
            <Metric label="Giá thuê" value={formatMoney(getPropertyTile(pending.tileId).baseRent)} />
          </div>
          {!pending.affordable && <InlineWarning>Đội không đủ tiền mặt cho thương vụ này.</InlineWarning>}
          <DecisionActions>
            <ActionButton action={declineAction} label="Bỏ qua" variant="secondary" />
            <ActionButton
              action={confirmBuy}
              disabled={!pending.affordable}
              icon="check"
              label={`Đầu tư ${formatPropertyPrice(pending.price)}`}
              successMessage="Đầu tư thành công!"
              variant="primary"
            />
          </DecisionActions>
        </DecisionCard>
      )

    case 'upgrade':
      return (
        <DecisionCard
          current={current}
          eyebrow="NÂNG CẤP CÔNG TRÌNH"
          icon="sparkles"
          title={getTile(pending.tileId).name}
        >
          <div className="upgrade-track">
            {([1, 2, 3, 4] as const).map((level) => (
              <div className={level < pending.nextLevel ? 'is-done' : level === pending.nextLevel ? 'is-next' : ''} key={level}>
                <span>{level < pending.nextLevel ? <GameIcon name="check" size={11} /> : level}</span>
                <small>{BUILD_LEVEL_LABEL[level].split('/')[0]}</small>
              </div>
            ))}
          </div>
          <div className="decision-metrics">
            <Metric label="Cấp tiếp theo" value={BUILD_LEVEL_LABEL[pending.nextLevel]} />
            <Metric label="Chi phí" value={formatMoney(pending.cost)} />
            <Metric label="Tiền còn lại" value={formatMoney(current.cash - pending.cost)} />
          </div>
          {!pending.affordable && <InlineWarning>Đội chưa đủ tiền để nâng cấp.</InlineWarning>}
          <DecisionActions>
            <ActionButton action={declineAction} label="Để sau" variant="secondary" />
            <ActionButton
              action={confirmUpgrade}
              disabled={!pending.affordable}
              icon="sparkles"
              label="Xác nhận nâng cấp"
              successMessage="Công trình đã được nâng cấp!"
              variant="primary"
            />
          </DecisionActions>
        </DecisionCard>
      )

    case 'rent': {
      // Không thâu tóm được (Biểu tượng Địa phương / được bảo hộ / tắt thâu tóm)
      // → trả tiền thuê tự động như cũ.
      if (pending.takeoverCost === null) {
        return <AutoActionPending label="Đang tự động xử lý phí lưu trú…" />
      }

      const ownerName = players.find((player) => player.id === pending.ownerId)?.name ?? 'đối thủ'
      const affordTakeover = current.cash >= pending.takeoverCost

      return (
        <DecisionCard
          current={current}
          eyebrow="ĐẤT ĐỐI THỦ"
          icon="landmark"
          title={getTile(pending.tileId).name}
        >
          <div className="takeover-summary">
            <div className="takeover-summary__cash">
              <Metric label="Tiền của bạn" value={formatMoney(current.cash)} />
            </div>
            <div className="takeover-summary__details">
              <Metric label="Tiền thuê" value={formatMoney(pending.rent)} />
              <Metric label="Giá mua lại" value={formatMoney(pending.takeoverCost)} />
              <Metric label="Chủ sở hữu" value={ownerName} />
            </div>
          </div>
          {!affordTakeover && (
            <InlineWarning>Không đủ tiền để mua lại — đội có thể trả tiền thuê.</InlineWarning>
          )}
          <DecisionActions>
            <ActionButton
              action={confirmTakeover}
              disabled={!affordTakeover}
              icon="swap"
              label={`Mua lại ${formatMoney(pending.takeoverCost)}`}
              successMessage="Đã mua lại bất động sản của đối thủ!"
              variant="secondary"
            />
            <ActionButton
              action={payRent}
              icon="banknote"
              label={`Trả thuê ${formatMoney(pending.rent)}`}
              successMessage="Đã trả tiền thuê."
              variant="primary"
            />
          </DecisionActions>
        </DecisionCard>
      )
    }

    case 'tax':
      return <AutoActionPending label="Đang tự động nộp thuế…" />

    case 'festival':
      return (
        <TilePickerCard
          directOnBoard
          icon="festival"
          label="ĐĂNG CAI LỄ HỘI"
          onCancel={declineAction}
          onPick={chooseFestivalTile}
          playerId={current.id}
          subtitle="Chọn trực tiếp một địa danh của đội đang sáng trên bàn cờ để đăng cai — tiền lưu trú sẽ nhân đôi."
          tileIds={pending.eligibleTileIds}
          title="Chọn địa danh tỏa sáng"
        />
      )

    case 'chance':
      return <AutoActionPending label="Đang rút Thẻ Cơ hội…" />

    case 'jail':
      return (
        <SimpleActionCard
          action={declineAction}
          buttonLabel="Đã rõ"
          current={current}
          icon="lock"
          message={`Đội sẽ nghỉ ${pending.turns} lượt. Có thể dùng Vé Thông Hành hoặc trả phí để thoát sớm.`}
          title="Kẹt xe · Tạm dừng hành trình"
        >
          <ContextCardAction effect="escape-jail" player={current} />
        </SimpleActionCard>
      )

    case 'jailed':
      return (
        <DecisionCard current={current} eyebrow="KẸT XE" icon="lock" title={`Còn ${pending.turnsLeft} lượt chờ`}>
          <p className="decision-copy">
            Trả phí giải tỏa để tiếp tục hành trình ngay, hoặc chấp nhận nghỉ lượt này.
          </p>
          <ContextCardAction effect="escape-jail" player={current} />
          <DecisionActions>
            <ActionButton action={declineAction} label="Chấp nhận nghỉ lượt" variant="secondary" />
            <ActionButton
              action={payBail}
              disabled={current.cash < pending.bail}
              icon="play"
              label={`Trả ${formatMoney(pending.bail)} để đi tiếp`}
              successMessage="Đội đã được giải tỏa!"
              variant="primary"
            />
          </DecisionActions>
        </DecisionCard>
      )

    case 'travel':
      return (
        <SimpleActionCard
          action={declineAction}
          buttonLabel="Đã rõ"
          current={current}
          icon="airport"
          message="Ở lượt kế tiếp, đội được bay thẳng đến bất kỳ ô nào trên bàn cờ."
          title="Đặc quyền Sân bay"
        />
      )

    default:
      return <AutoActionPending label="Đang tự động chuyển lượt…" />
  }
}

function AutomaticOverlay({ onSkip, overlay }: { onSkip?: () => void; overlay: AutoOverlay }) {
  const [secondsLeft, setSecondsLeft] = useState(CARD_READ_SECONDS)

  useEffect(() => {
    if (overlay.kind !== 'card') return
    setSecondsLeft(CARD_READ_SECONDS)
    const interval = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [overlay.kind])

  if (overlay.kind === 'card') {
    return (
      <section className="action-dock auto-action-card auto-card-reveal" style={{ '--player-color': overlay.actor.color } as CSSProperties}>
        <div className="auto-action-card__avatar">
          <CharacterMark characterId={overlay.actor.characterId} />
        </div>
        <div className="auto-action-card__copy">
          <span className="section-kicker">THẺ CƠ HỘI</span>
          <h2>{overlay.card ? overlay.card.name : 'Chưa có thẻ phù hợp'}</h2>
          <p>{overlay.card?.description ?? 'Lượt chơi tiếp tục tự động.'}</p>
          <div className="auto-card-reveal__reading">
            {overlay.saved
              ? '✓ Đã lưu vào Túi Thẻ Cơ hội — tới Vòng Chiến thuật, bấm thẻ rồi chọn mục tiêu ngay trên bàn cờ.'
              : overlay.usedImmediately
                ? 'Thẻ đã được kích hoạt ngay khi rút.'
                : 'Không có mục tiêu phù hợp — thẻ được bỏ qua.'}
          </div>
        </div>
        <div className="auto-card-reveal__footer">
          <div className="reading-timer reading-timer--card">
            <div className="reading-timer__track">
              <span style={{ width: `${(secondsLeft / CARD_READ_SECONDS) * 100}%` }} />
            </div>
            <small>Tự động tiếp tục sau {secondsLeft}s</small>
          </div>
          <button className="auto-card-reveal__skip" onClick={onSkip} type="button">
            Bỏ qua
            <GameIcon name="chevron-right" size={16} />
          </button>
        </div>
      </section>
    )
  }

  if (overlay.kind === 'money') {
    const isGain = overlay.amount > 0
    return (
      <section className={`action-dock auto-action-card auto-money-feedback ${isGain ? 'is-gain' : 'is-payment'}`} style={{ '--player-color': overlay.actor.color } as CSSProperties}>
        <div className="auto-action-card__avatar">
          <CharacterMark characterId={overlay.actor.characterId} />
        </div>
        <div className="auto-action-card__copy">
          <span className="section-kicker">GIAO DỊCH TỰ ĐỘNG</span>
          <h2>{overlay.title}</h2>
          <p>{overlay.actor.name} {isGain ? 'được cộng' : 'bị trừ'} tiền trong lượt này.</p>
          {overlay.receiver && overlay.receiver.amount > 0 && (
            <small>{overlay.receiver.name} được cộng {formatMoney(overlay.receiver.amount)}.</small>
          )}
        </div>
        <strong className="auto-money-feedback__amount">
          {overlay.amount > 0 ? '+' : '−'} {formatMoney(Math.abs(overlay.amount))}
        </strong>
      </section>
    )
  }

  return (
    <section className="action-dock auto-action-card auto-turn-feedback" style={{ '--player-color': overlay.actor.color } as CSSProperties}>
      <div className="auto-action-card__avatar">
        <CharacterMark characterId={overlay.actor.characterId} />
      </div>
      <div className="auto-action-card__copy">
        <span className="section-kicker">VÒNG 04 · HOÀN TẤT</span>
        <h2>Đã tự động chốt lượt</h2>
        <p>Quyền chơi đang được chuyển cho đội tiếp theo.</p>
      </div>
      <GameIcon name="check" size={28} />
    </section>
  )
}

function AutoActionPending({ label }: { label: string }) {
  return (
    <section className="action-dock auto-action-pending">
      <span className="auto-action-pending__spinner" />
      <strong>{label}</strong>
    </section>
  )
}

function DecisionCard({
  children,
  current,
  eyebrow,
  icon,
  title,
}: {
  children: ReactNode
  current: Player
  eyebrow: string
  icon: GameIconName
  title: string
}) {
  return (
    <section className="action-dock decision-card" style={{ '--player-color': current.color } as CSSProperties}>
      <div className="decision-card__icon">
        <GameIcon name={icon} size={25} />
      </div>
      <div className="decision-card__heading">
        <span className="section-kicker">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="decision-card__body">{children}</div>
    </section>
  )
}

function DecisionActions({ children }: { children: ReactNode }) {
  return <div className="decision-actions">{children}</div>
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="decision-metric">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function InlineWarning({ children }: { children: ReactNode }) {
  return (
    <div className="inline-warning">
      <span>!</span>
      {children}
    </div>
  )
}

function SimpleActionCard({
  action,
  buttonLabel,
  children,
  current,
  icon,
  message,
  title,
}: {
  action: () => ActionResult
  buttonLabel: string
  children?: ReactNode
  current: Player
  icon: GameIconName
  message: string
  title: string
}) {
  const { runAction } = useNotice()
  const handledRef = useRef(false)
  const [secondsLeft, setSecondsLeft] = useState(ACTION_NOTICE_READ_SECONDS)
  const guardedAction = useCallback(() => {
    if (handledRef.current) return { ok: false, reason: 'Modal đã được xử lý.' }
    handledRef.current = true
    return action()
  }, [action])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!handledRef.current) runAction(guardedAction)
    }, ACTION_NOTICE_READ_SECONDS * 1000)
    const interval = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1))
    }, 1000)

    return () => {
      window.clearTimeout(timer)
      window.clearInterval(interval)
    }
  }, [guardedAction, runAction])

  return (
    <DecisionCard current={current} eyebrow="Ô ĐẶC BIỆT" icon={icon} title={title}>
      <p className="decision-copy">{message}</p>
      {children}
      <div className="reading-timer" aria-label={`Tự đóng sau ${secondsLeft} giây`}>
        <div className="reading-timer__track">
          <span style={{ width: `${(secondsLeft / ACTION_NOTICE_READ_SECONDS) * 100}%` }} />
        </div>
        <small>Đang đọc · tự đóng sau {secondsLeft}s</small>
      </div>
      <DecisionActions>
        <ActionButton action={guardedAction} icon="check" label={buttonLabel} variant="primary" />
      </DecisionActions>
    </DecisionCard>
  )
}

function ContextCardAction({
  effect,
  player,
}: {
  effect: 'escape-jail'
  player: Player
}) {
  const playCard = useGameStore((state) => state.playCard)
  const { runAction } = useNotice()
  const card = player.cards.find((item) => item.effect === effect)
  if (!card) return null

  const definition = getCardDefinition(card.effect)
  return (
    <div className="context-card-action">
      <span><GameIcon name={CARD_ICON_BY_EFFECT[card.effect]} size={18} /></span>
      <div>
        <small>THẺ PHÙ HỢP ĐANG CÓ</small>
        <strong>{definition.name}</strong>
      </div>
      <button
        onClick={() =>
          runAction(
            () => playCard(card.instanceId, { kind: 'none' }),
            `Đã dùng thẻ “${definition.name}”.`,
          )
        }
        type="button"
      >
        Dùng thẻ
      </button>
    </div>
  )
}

function TilePickerCard({
  directOnBoard = false,
  icon,
  label,
  onCancel,
  onPick,
  playerId,
  subtitle,
  tileIds,
  title,
}: {
  directOnBoard?: boolean
  icon: GameIconName
  label: string
  onCancel: () => ActionResult
  onPick: (tileId: TileId) => ActionResult
  playerId?: PlayerId
  subtitle: string
  tileIds: TileId[]
  title: string
}) {
  const [selected, setSelected] = useState(() => String(tileIds[0] ?? ''))
  const { begin, clear } = useCardTargeting()
  const { runAction } = useNotice()
  const tileIdsKey = tileIds.join(',')
  const targetValues = useMemo(() => (tileIdsKey ? tileIdsKey.split(',') : []), [tileIdsKey])

  useEffect(() => setSelected(targetValues[0] ?? ''), [targetValues])

  useEffect(() => {
    if (!directOnBoard || !playerId || tileIds.length === 0) {
      if (directOnBoard) clear()
      return
    }

    begin(
      {
        cardId: 'travel-destination',
        kind: 'any-tile',
        playerId,
        targetValues,
      },
      (target) => {
        if (target.kind !== 'tile') return
        const succeeded = runAction(
          () => onPick(target.tileId),
          `Đã chọn ô ${target.tileId} làm điểm đến.`,
        )
        if (succeeded) clear()
      },
    )

    return clear
  }, [begin, clear, directOnBoard, onPick, playerId, runAction, targetValues, tileIds.length])

  return (
    <section className={`action-dock tile-picker-card ${directOnBoard ? 'tile-picker-card--direct' : ''}`}>
      <div className="tile-picker-card__icon"><GameIcon name={icon} size={27} /></div>
      <div className="tile-picker-card__copy">
        <span className="section-kicker">{label}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {directOnBoard && tileIds.length > 0 ? (
        <div className="tile-picker-map-hint">
          <GameIcon name="target" size={18} />
          <span>Chọn trực tiếp một ô đang sáng trên bàn cờ</span>
        </div>
      ) : tileIds.length > 0 ? (
        <label className="tile-select">
          <GameIcon name="map" size={18} />
          <select
            aria-label="Chọn địa danh"
            onChange={(event) => setSelected(event.target.value)}
            value={selected}
          >
            {tileIds.map((id) => (
              <option key={id} value={id}>
                Ô {id} · {getTile(id).name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <InlineWarning>Đội chưa sở hữu địa danh đủ điều kiện.</InlineWarning>
      )}
      <div className="tile-picker-card__actions">
        <ActionButton action={onCancel} label="Bỏ qua" variant="secondary" />
        {!directOnBoard && tileIds.length > 0 && (
          <ActionButton
            action={() => onPick(Number(selected))}
            icon="check"
            label="Xác nhận điểm đến"
            variant="primary"
          />
        )}
      </div>
    </section>
  )
}

function ActionButton({
  action,
  className = '',
  disabled = false,
  icon,
  label,
  sublabel,
  successMessage,
  variant,
}: {
  action: () => ActionResult
  className?: string
  disabled?: boolean
  icon?: GameIconName
  label: string
  sublabel?: string
  successMessage?: string
  variant: 'accent' | 'ghost' | 'primary' | 'secondary'
}) {
  const { runAction } = useNotice()
  return (
    <button
      className={`game-action-button game-action-button--${variant} ${className}`}
      disabled={disabled}
      onClick={() => runAction(action, successMessage)}
      type="button"
    >
      {icon && <span className="game-action-button__icon"><GameIcon name={icon} size={20} /></span>}
      <span>
        <strong>{label}</strong>
        {sublabel && <small>{sublabel}</small>}
      </span>
      {variant === 'primary' && <GameIcon className="game-action-button__arrow" name="chevron-right" size={18} />}
    </button>
  )
}

function ResultOverlay() {
  const standings = useGameStore((state) => state.standings)
  const resetGame = useGameStore((state) => state.resetGame)

  useEffect(() => {
    playSound('fanfare')
  }, [])

  if (!standings?.length) return null

  const winner = standings[0]
  return (
    <div className="result-layer">
      <div className="result-confetti" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <i key={index} style={{ '--i': index } as CSSProperties} />
        ))}
      </div>
      <section className="result-card" aria-labelledby="result-title">
        <div className="result-card__ribbon">
          <GameIcon name="trophy" size={26} />
          <span>CHUNG CUỘC</span>
        </div>
        <div className="winner-block" style={{ '--player-color': winner.color } as CSSProperties}>
          <span className="winner-block__crown"><GameIcon name="crown" size={27} /></span>
          <div className="winner-block__avatar">
            <CharacterMark characterId={winner.characterId} />
          </div>
          <span className="section-kicker">NHÀ VÔ ĐỊCH VNR202 BUSINESS VOYAGE</span>
          <h1 id="result-title">{winner.name}</h1>
          <strong>{formatMoney(winner.netWorth)}</strong>
          <p>Tổng tài sản sau hành trình kiến tạo Việt Nam</p>
        </div>

        <div className="result-table">
          <div className="result-table__header">
            <span>Hạng</span>
            <span>Đội chơi</span>
            <span>Tiền mặt</span>
            <span>Địa danh</span>
            <span>Biểu tượng</span>
            <span>Tổng tài sản</span>
          </div>
          {standings.map((standing) => <StandingRow key={standing.playerId} standing={standing} />)}
        </div>

        <div className="result-card__actions">
          <div>
            <span><GameIcon name="map" size={16} /> {winner.propertiesOwned} địa danh</span>
            <span><GameIcon name="check" size={16} /> {winner.stats.correctAnswers} câu đúng</span>
            <span><GameIcon name="trophy" size={16} /> {winner.landmarks} biểu tượng</span>
          </div>
          <button className="primary-game-button" onClick={() => resetGame()} type="button">
            Tạo ván đấu mới
            <GameIcon name="chevron-right" size={20} />
          </button>
        </div>
      </section>
    </div>
  )
}

function StandingRow({ standing }: { standing: Standing }) {
  return (
    <div
      className={`result-table__row ${standing.rank === 1 ? 'is-winner' : ''} ${standing.status === 'bankrupt' ? 'is-bankrupt' : ''}`}
      style={{ '--player-color': standing.color } as CSSProperties}
    >
      <span className="standing-rank">{standing.rank}</span>
      <span className="standing-team">
        <i><CharacterMark characterId={standing.characterId} /></i>
        <strong>{standing.name}</strong>
      </span>
      <span>{formatMoney(standing.cash)}</span>
      <span>{standing.propertiesOwned}</span>
      <span>{standing.landmarks}</span>
      <strong>{formatMoney(standing.netWorth)}</strong>
    </div>
  )
}

interface TargetOption {
  label: string
  value: string
}

function getTargetOptions(
  effect: CardEffect,
  kind: CardTargetKind,
  player: Player,
  players: Player[],
  properties: ReturnType<typeof useGameStore.getState>['properties'],
): TargetOption[] {
  if (kind === 'dice') {
    return Array.from({ length: 11 }, (_, index) => ({
      label: `Tổng ${index + 2}`,
      value: String(index + 2),
    }))
  }
  if (kind === 'player') {
    return players
      .filter(
        (item) =>
          item.id !== player.id &&
          item.status !== 'bankrupt' &&
          (effect !== 'swap-position' || item.status !== 'jailed'),
      )
      .map((item) => ({ label: item.name, value: item.id }))
  }
  if (kind === 'own-tile' || kind === 'opponent-tile') {
    return BOARD.flatMap((tile) => {
      if (tile.type !== 'property') return []
      const property = properties[tile.id]
      const ownerId = property?.ownerId
      const matches =
        kind === 'own-tile' ? ownerId === player.id : Boolean(ownerId && ownerId !== player.id)
      if (!matches) return []
      if (
        effect === 'demolish' &&
        (!property || property.level < 2 || property.level >= GAME_CONFIG.MAX_BUILD_LEVEL)
      ) {
        return []
      }
      if (
        effect === 'instant-festival' &&
        (!property || property.festivalTurnsLeft === null || property.festivalTurnsLeft > 0)
      ) {
        return []
      }
      if (effect === 'heritage-shield' && property?.shielded) return []
      return [{ label: `${tile.province} · ${tile.name}`, value: String(tile.id) }]
    })
  }
  if (kind === 'any-tile') {
    return BOARD.map((tile) => ({ label: `Ô ${tile.id} · ${tile.name}`, value: String(tile.id) }))
  }
  return []
}

function createCardTarget(kind: CardTargetKind, value: string): CardTarget {
  if (kind === 'dice') return { kind: 'dice', total: Number(value) }
  if (kind === 'player') return { kind: 'player', playerId: value }
  if (kind === 'own-tile' || kind === 'opponent-tile' || kind === 'any-tile') {
    return { kind: 'tile', tileId: Number(value) }
  }
  return { kind: 'none' }
}
