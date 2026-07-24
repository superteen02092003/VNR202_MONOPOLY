import { lazy, Suspense } from 'react'

import { ActionDock } from './components/ActionDock'
import { GameHud } from './components/GameHud'
import { GameStartOverlay } from './components/GameStartOverlay'
import { LobbyScreen } from './components/LobbyScreen'
import { NoticeProvider } from './components/NoticeCenter'
import { playGameEventSound } from './core'
import { useGameEvents } from './scene/useGameEvents'
import { useGameStore } from './store/useGameStore'

const GameCanvas = lazy(() =>
  import('./scene/GameCanvas').then((module) => ({ default: module.GameCanvas })),
)

export default function App() {
  return (
    <NoticeProvider>
      <AppView />
    </NoticeProvider>
  )
}

function AppView() {
  const phase = useGameStore((state) => state.phase)
  if (phase === 'lobby') return <LobbyScreen />
  return <GameScreen />
}

function GameScreen() {
  const phase = useGameStore((state) => state.phase)
  const turnCount = useGameStore((state) => state.turnCount)
  const awaitingStart = phase === 'turn-end' && turnCount === 0

  // Phát âm thanh cho game event — chỉ 1 instance duy nhất cho toàn game
  useGameEvents((event) => {
    playGameEventSound(event)
  })

  return (
    <main className="game-shell">
      <div className="game-scene">
        <Suspense fallback={<SceneFallback />}>
          <GameCanvas />
        </Suspense>
      </div>
      <div className="game-scene__vignette" />
      <div className="game-scene__pattern" />
      <GameHud />
      {awaitingStart ? <GameStartOverlay /> : <ActionDock />}
    </main>
  )
}

function SceneFallback() {
  return (
    <div className="scene-fallback">
      <div className="scene-fallback__mark">
        <span>VNR</span>
        <strong>202</strong>
      </div>
      <div className="scene-fallback__bar"><i /></div>
      <p>Đang dựng bàn cờ Việt Nam…</p>
    </div>
  )
}
