import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import {
  BOARD,
  BUILD_LEVEL_LABEL,
  CHARACTERS,
  GAME_CONFIG,
  PHASE_LABEL,
  formatMoney,
  getCardDefinition,
  getTile,
} from './core'
import type { CardTarget, CharacterId } from './core'
import type { PlayerSetup } from './core/logic/setup'
import { selectCurrentPlayer, selectIsEndgameWarning, useGameStore } from './store/useGameStore'
import type { ActionResult } from './store/useGameStore'

/**
 * BẢNG THỬ CỦA GIAI ĐOẠN 1.
 *
 * Đây KHÔNG phải giao diện thật của game — chỉ là màn hình kỹ thuật để chạy thử
 * toàn bộ lõi logic khi chưa có bàn cờ 3D. Giai đoạn 2 dựng Scene React Three Fiber,
 * Giai đoạn 3 thay hoàn toàn màn hình này bằng Host Dashboard viết bằng TailwindCSS.
 */
export default function App() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="min-h-full p-4 text-sm">
      <header className="mb-4 flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-bold text-vnr-gold">VNR202 BUSINESS TOUR — Vietnam Edition</h1>
        <span className="rounded bg-vnr-red/20 px-2 py-0.5 text-xs text-vnr-red">
          Giai đoạn 1 · Bảng thử lõi logic
        </span>
      </header>

      {phase === 'lobby' ? <Lobby /> : <GameConsole />}
    </div>
  )
}

/* ================================================================== */
/* Sảnh chờ                                                            */
/* ================================================================== */

function Lobby() {
  const startGame = useGameStore((s) => s.startGame)
  const updateSettings = useGameStore((s) => s.updateSettings)
  const matchMinutes = useGameStore((s) => s.settings.matchMinutes)

  const [count, setCount] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [names, setNames] = useState(() =>
    Array.from({ length: GAME_CONFIG.MAX_PLAYERS }, (_, i) => `Nhóm ${i + 1}`),
  )
  const [picks, setPicks] = useState<CharacterId[]>(() =>
    CHARACTERS.slice(0, GAME_CONFIG.MAX_PLAYERS).map((c) => c.id),
  )

  const handleStart = () => {
    const setups: PlayerSetup[] = Array.from({ length: count }, (_, i) => ({
      id: `p${i + 1}`,
      name: names[i],
      characterId: picks[i],
    }))
    setError(startGame(setups).reason)
  }

  const playerCounts = Array.from(
    { length: GAME_CONFIG.MAX_PLAYERS - GAME_CONFIG.MIN_PLAYERS + 1 },
    (_, i) => GAME_CONFIG.MIN_PLAYERS + i,
  )

  return (
    <section className="max-w-2xl space-y-4 rounded-lg bg-vnr-panel p-4">
      <h2 className="font-semibold text-vnr-gold">Thiết lập ván đấu</h2>

      <label className="flex items-center gap-2">
        <span className="w-36">Số nhóm chơi</span>
        <select
          className="rounded bg-black/30 px-2 py-1"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        >
          {playerCounts.map((n) => (
            <option key={n} value={n}>
              {n} nhóm
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="w-36">Thời lượng ván</span>
        <select
          className="rounded bg-black/30 px-2 py-1"
          value={matchMinutes}
          onChange={(e) => updateSettings({ matchMinutes: Number(e.target.value) })}
        >
          {GAME_CONFIG.MATCH_MINUTE_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} phút
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="w-48 rounded bg-black/30 px-2 py-1"
              value={names[i]}
              onChange={(e) =>
                setNames((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
              }
            />
            <select
              className="rounded bg-black/30 px-2 py-1"
              value={picks[i]}
              onChange={(e) =>
                setPicks((prev) =>
                  prev.map((v, j) => (j === i ? (e.target.value as CharacterId) : v)),
                )
              }
            >
              {CHARACTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {error && <p className="text-vnr-red">{error}</p>}

      <button
        className="rounded bg-vnr-red px-4 py-2 font-semibold text-white hover:brightness-110"
        onClick={handleStart}
      >
        Bắt đầu ván đấu
      </button>
    </section>
  )
}

/* ================================================================== */
/* Bảng điều khiển khi đang chơi                                       */
/* ================================================================== */

function GameConsole() {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_320px]">
      <PlayersPanel />
      <div className="space-y-4">
        <StatusBar />
        <ActionPanel />
        <BoardOverview />
      </div>
      <LogPanel />
    </div>
  )
}

function StatusBar() {
  const phase = useGameStore((s) => s.phase)
  const turnCount = useGameStore((s) => s.turnCount)
  const timeRemainingMs = useGameStore((s) => s.timeRemainingMs)
  const isFinalTurn = useGameStore((s) => s.isFinalTurn)
  const isTimerRunning = useGameStore((s) => s.isTimerRunning)
  const warning = useGameStore(selectIsEndgameWarning)
  const tick = useGameStore((s) => s.tick)
  // currentPlayerIndex trỏ vào turnOrder (đã xáo trộn), không phải mảng players.
  const current = useGameStore(selectCurrentPlayer)

  useEffect(() => {
    if (!isTimerRunning) return
    const id = setInterval(() => tick(1000), 1000)
    return () => clearInterval(id)
  }, [isTimerRunning, tick])

  const minutes = Math.floor(timeRemainingMs / 60_000)
  const seconds = Math.floor((timeRemainingMs % 60_000) / 1000)

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg bg-vnr-panel p-3">
      <div className={`text-2xl font-bold ${warning ? 'animate-pulse text-vnr-red' : ''}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div>
        Lượt {turnCount} · <span className="text-vnr-gold">{PHASE_LABEL[phase]}</span>
      </div>
      {current && (
        <div className="font-semibold" style={{ color: current.color }}>
          ▶ {current.name}
        </div>
      )}
      {isFinalTurn && <span className="text-vnr-red">⏰ LƯỢT CUỐI</span>}
    </div>
  )
}

function PlayersPanel() {
  const players = useGameStore((s) => s.players)
  const currentId = useGameStore((s) => s.turnOrder[s.currentPlayerIndex])
  const playCard = useGameStore((s) => s.playCard)
  const [targets, setTargets] = useState<Record<string, string>>({})

  const play = (instanceId: string, targetKind: string) => {
    const raw = targets[instanceId] ?? ''
    let target: CardTarget = { kind: 'none' }
    if (targetKind === 'dice') target = { kind: 'dice', total: Number(raw) }
    else if (targetKind === 'player') target = { kind: 'player', playerId: raw }
    else if (targetKind !== 'none') target = { kind: 'tile', tileId: Number(raw) }

    const result = playCard(instanceId, target)
    if (!result.ok && result.reason) alert(result.reason)
  }

  return (
    <aside className="space-y-2 rounded-lg bg-vnr-panel p-3">
      <h2 className="font-semibold text-vnr-gold">Các nhóm</h2>
      {players.map((p) => (
        <div
          key={p.id}
          className={`rounded p-2 ${p.id === currentId ? 'bg-white/10' : 'bg-black/20'} ${
            p.status === 'bankrupt' ? 'opacity-40' : ''
          }`}
        >
          <div className="font-semibold" style={{ color: p.color }}>
            {p.name}
            {p.status === 'jailed' && ' 🚧'}
            {p.status === 'bankrupt' && ' 💥'}
          </div>
          <div className="text-xs text-slate-300">
            {formatMoney(p.cash)} · ô {p.position} — {getTile(p.position).name}
          </div>

          {p.cards.map((card) => {
            const def = getCardDefinition(card.effect)
            return (
              <div key={card.instanceId} className="mt-1 flex items-center gap-1 text-xs">
                <span title={def.description}>
                  {def.emoji} {def.name}
                </span>
                {def.targetKind !== 'none' && (
                  <input
                    className="w-14 rounded bg-black/40 px-1"
                    placeholder={def.targetKind === 'dice' ? '2-12' : 'ô/nhóm'}
                    value={targets[card.instanceId] ?? ''}
                    onChange={(e) =>
                      setTargets((prev) => ({ ...prev, [card.instanceId]: e.target.value }))
                    }
                  />
                )}
                {p.id === currentId && (
                  <button
                    className="rounded bg-vnr-gold/80 px-1 text-black"
                    onClick={() => play(card.instanceId, def.targetKind)}
                  >
                    Dùng
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </aside>
  )
}

/** Nút bấm của bảng điều khiển — tự hiện lý do khi thao tác bị lõi game từ chối. */
function Btn({
  onClick,
  children,
  tone = 'default',
}: {
  onClick: () => ActionResult
  children: ReactNode
  tone?: 'default' | 'primary' | 'danger'
}) {
  const palette = {
    default: 'bg-slate-600',
    primary: 'bg-vnr-red',
    danger: 'bg-amber-600',
  }[tone]

  return (
    <button
      className={`rounded ${palette} px-3 py-1.5 text-left font-semibold text-white hover:brightness-110`}
      onClick={() => {
        const result = onClick()
        if (!result.ok && result.reason) alert(result.reason)
      }}
    >
      {children}
    </button>
  )
}

function ActionPanel() {
  const store = useGameStore()
  const { phase, pendingAction, currentQuestion, dice } = store

  if (phase === 'game-over') return <Standings />

  return (
    <section className="space-y-3 rounded-lg bg-vnr-panel p-3">
      {phase === 'trivia' && currentQuestion && (
        <div className="space-y-2">
          <p className="font-semibold text-vnr-gold">{currentQuestion.prompt}</p>
          <div className="grid gap-1 md:grid-cols-2">
            {currentQuestion.options.map((option, index) => (
              <Btn key={option} onClick={() => store.answerTrivia(index)}>
                {String.fromCharCode(65 + index)}. {option}
              </Btn>
            ))}
          </div>
          <Btn tone="danger" onClick={() => store.answerTrivia(null)}>
            Hết giờ — bỏ qua
          </Btn>
        </div>
      )}

      {phase === 'pre-roll' &&
        (pendingAction.kind === 'travel-choose' ? (
          <TilePicker
            label="✈️ Sân bay Quốc tế — chọn ô để bay tới"
            tileIds={BOARD.map((t) => t.id)}
            onPick={(id) => store.chooseTravelDestination(id)}
            extra={<Btn onClick={() => store.skipTravel()}>Bỏ qua quyền bay</Btn>}
          />
        ) : (
          <Btn tone="primary" onClick={() => store.rollDice()}>
            🎲 Lắc xúc xắc
          </Btn>
        ))}

      {(phase === 'rolling' || phase === 'moving') && dice && (
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            🎲 {dice[0]} + {dice[1]} = {dice[0] + dice[1]}
          </span>
          <Btn tone="primary" onClick={() => store.applyMovement()}>
            Di chuyển quân cờ
          </Btn>
        </div>
      )}

      {phase === 'action' && <PendingActionControls />}

      {phase === 'action' && pendingAction.kind === 'idle' && (
        <Btn tone="primary" onClick={() => store.endTurn()}>
          Chốt lượt ▶
        </Btn>
      )}
    </section>
  )
}

function PendingActionControls() {
  const store = useGameStore()
  const pending = store.pendingAction

  switch (pending.kind) {
    case 'buy':
      return (
        <div className="space-y-2">
          <p>
            Đầu tư <b className="text-vnr-gold">{getTile(pending.tileId).name}</b> với giá{' '}
            {formatMoney(pending.price)}?
            {!pending.affordable && <span className="text-vnr-red"> (không đủ tiền mặt)</span>}
          </p>
          <div className="flex gap-2">
            <Btn tone="primary" onClick={() => store.confirmBuy()}>
              Mua
            </Btn>
            <Btn onClick={() => store.declineAction()}>Bỏ qua</Btn>
          </div>
        </div>
      )

    case 'upgrade':
      return (
        <div className="space-y-2">
          <p>
            Nâng cấp <b className="text-vnr-gold">{getTile(pending.tileId).name}</b> lên{' '}
            {BUILD_LEVEL_LABEL[pending.nextLevel]} — {formatMoney(pending.cost)}?
          </p>
          <div className="flex gap-2">
            <Btn tone="primary" onClick={() => store.confirmUpgrade()}>
              Nâng cấp
            </Btn>
            <Btn onClick={() => store.declineAction()}>Để sau</Btn>
          </div>
        </div>
      )

    case 'rent':
      return (
        <div className="space-y-2">
          <p>
            Dừng tại <b className="text-vnr-gold">{getTile(pending.tileId).name}</b> của{' '}
            {store.players.find((p) => p.id === pending.ownerId)?.name} — phải nộp{' '}
            <b>{formatMoney(pending.rent)}</b>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Btn tone="primary" onClick={() => store.payRent()}>
              Nộp tiền lưu trú
            </Btn>
            {pending.takeoverCost !== null ? (
              <Btn tone="danger" onClick={() => store.confirmTakeover()}>
                ⚔️ Thâu tóm ({formatMoney(pending.takeoverCost)})
              </Btn>
            ) : (
              <span className="self-center text-xs text-slate-400">
                🛡️ {pending.takeoverBlockedReason}
              </span>
            )}
          </div>
        </div>
      )

    case 'tax':
      return (
        <div className="space-y-2">
          <p>
            {getTile(pending.tileId).name} — nộp <b>{formatMoney(pending.amount)}</b>.
          </p>
          <Btn tone="primary" onClick={() => store.payTax()}>
            Nộp
          </Btn>
        </div>
      )

    case 'festival':
      return (
        <TilePicker
          label="🎊 Chọn địa danh để đăng cai Festival (nhân đôi tiền thu)"
          tileIds={pending.eligibleTileIds}
          onPick={(id) => store.chooseFestivalTile(id)}
          extra={<Btn onClick={() => store.declineAction()}>Không tổ chức</Btn>}
        />
      )

    case 'chance':
      return (
        <Btn tone="primary" onClick={() => store.drawChanceCard()}>
          🎴 Bốc Thẻ Cơ hội
        </Btn>
      )

    case 'jail':
      return (
        <div className="space-y-2">
          <p className="text-vnr-red">🚧 Kẹt xe — nghỉ {pending.turns} lượt.</p>
          <Btn onClick={() => store.declineAction()}>Đã rõ</Btn>
        </div>
      )

    case 'jailed':
      return (
        <div className="space-y-2">
          <p className="text-vnr-red">
            🚧 Đang cách ly, còn {pending.turnsLeft} lượt. Có thể trả phí giải tỏa hoặc dùng thẻ Vé
            Thông Hành.
          </p>
          <div className="flex gap-2">
            <Btn tone="primary" onClick={() => store.payBail()}>
              Trả {formatMoney(pending.bail)} để thoát
            </Btn>
            <Btn onClick={() => store.declineAction()}>Chấp nhận nghỉ lượt</Btn>
          </div>
        </div>
      )

    case 'travel':
      return (
        <div className="space-y-2">
          <p className="text-vnr-gold">✈️ Lượt sau được bay thẳng tới ô bất kỳ.</p>
          <Btn onClick={() => store.declineAction()}>Đã rõ</Btn>
        </div>
      )

    default:
      return null
  }
}

function TilePicker({
  label,
  tileIds,
  onPick,
  extra,
}: {
  label: string
  tileIds: number[]
  onPick: (tileId: number) => ActionResult
  extra?: ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="font-semibold text-vnr-gold">{label}</p>
      <div className="flex flex-wrap gap-1">
        {tileIds.map((id) => (
          <Btn key={id} onClick={() => onPick(id)}>
            {id}. {getTile(id).name}
          </Btn>
        ))}
      </div>
      {extra}
    </div>
  )
}

function BoardOverview() {
  const properties = useGameStore((s) => s.properties)
  const players = useGameStore((s) => s.players)

  const owned = Object.values(properties).filter((p) => p.ownerId)
  if (owned.length === 0) return null

  return (
    <section className="rounded-lg bg-vnr-panel p-3">
      <h2 className="mb-2 font-semibold text-vnr-gold">Bất động sản đã có chủ</h2>
      <div className="grid gap-1 text-xs md:grid-cols-2">
        {owned.map((p) => (
          <div key={p.tileId} className="flex justify-between rounded bg-black/20 px-2 py-1">
            <span>
              {p.tileId}. {getTile(p.tileId).name}
            </span>
            <span style={{ color: players.find((pl) => pl.id === p.ownerId)?.color }}>
              {BUILD_LEVEL_LABEL[p.level]}
              {p.festivalTurnsLeft !== 0 && ' 🎊'}
              {p.shielded && ' 🛡️'}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function LogPanel() {
  const log = useGameStore((s) => s.log)

  return (
    <aside className="max-h-[80vh] space-y-1 overflow-y-auto rounded-lg bg-vnr-panel p-3 text-xs">
      <h2 className="font-semibold text-vnr-gold">Nhật ký ván đấu</h2>
      {[...log]
        .reverse()
        .slice(0, 40)
        .map((entry) => (
          <div key={entry.id} className="rounded bg-black/20 px-2 py-1">
            {entry.message}
          </div>
        ))}
    </aside>
  )
}

function Standings() {
  const standings = useGameStore((s) => s.standings)
  const resetGame = useGameStore((s) => s.resetGame)
  if (!standings) return null

  return (
    <section className="space-y-2 rounded-lg bg-vnr-panel p-3">
      <h2 className="text-lg font-bold text-vnr-gold">🏆 Bảng xếp hạng chung cuộc</h2>
      {standings.map((row) => (
        <div key={row.playerId} className="flex flex-wrap justify-between gap-2 rounded bg-black/20 px-3 py-2">
          <span style={{ color: row.color }}>
            #{row.rank} {row.name} {row.status === 'bankrupt' && '💥'}
          </span>
          <span className="text-xs">
            {formatMoney(row.netWorth)} · {row.propertiesOwned} địa danh · {row.landmarks} biểu
            tượng · {row.stats.correctAnswers} câu đúng
          </span>
        </div>
      ))}
      <button
        className="rounded bg-vnr-red px-4 py-2 font-semibold text-white"
        onClick={() => resetGame()}
      >
        Ván mới
      </button>
    </section>
  )
}
