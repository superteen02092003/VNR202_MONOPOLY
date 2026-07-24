import { Html } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'

import { BOARD_3D } from '../core'
import { useGameStore } from '../store/useGameStore'
import { GameIcon } from '../components/GameIcon'

const ROLL_DURATION_MS = 1200
const ROLL_TICK_MS = 140

const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
}

type DiceValue = number | null

/** Xúc xắc 2D ở giữa bàn cờ, đổi mặt nhanh khi lắc rồi dừng đúng kết quả game tính. */
export function Dice() {
  const dice = useGameStore((state) => state.dice)
  const phase = useGameStore((state) => state.phase)
  const rollDice = useGameStore((state) => state.rollDice)
  const [displayDice, setDisplayDice] = useState<[DiceValue, DiceValue]>([null, null])
  const [isRolling, setIsRolling] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    timeoutRef.current = null
    intervalRef.current = null

    if (phase !== 'rolling' || !dice) {
      setIsRolling(false)
      if (dice) setDisplayDice(dice)
      return
    }

    setIsRolling(true)
    setDisplayDice(randomDice())
    intervalRef.current = setInterval(() => setDisplayDice(randomDice()), ROLL_TICK_MS)
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      setDisplayDice(dice)
      setIsRolling(false)
      useGameStore.getState().markMoving()
    }, ROLL_DURATION_MS)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      timeoutRef.current = null
      intervalRef.current = null
    }
  }, [dice, phase])

  const total = displayDice[0] !== null && displayDice[1] !== null
    ? displayDice[0] + displayDice[1]
    : null

  return (
        <Html
          center
          pointerEvents="auto"
          position={[0, BOARD_3D.TILE_HEIGHT + 0.18, 0]}
          zIndexRange={[20, 0]}
        >
          <div className={`board-dice-stage${isRolling ? ' is-rolling' : ''}`} aria-live="polite">
        <div className="board-dice-stage__pair">
          <DieCard index={0} rolling={isRolling} value={displayDice[0]} />
          <span className="board-dice-stage__plus">+</span>
          <DieCard index={1} rolling={isRolling} value={displayDice[1]} />
        </div>
            <div className="board-dice-stage__result">
              {isRolling ? 'Đang lắc xúc xắc…' : total === null ? 'Sẵn sàng đổ xúc xắc' : `Kết quả: ${total}`}
            </div>
            {phase === 'pre-roll' && (
              <button
                className="board-dice-stage__roll-button"
                disabled={isRolling}
                onClick={() => rollDice()}
                type="button"
              >
                <GameIcon name="dice" size={15} />
                <span>Lắc xúc xắc</span>
              </button>
            )}
          </div>
        </Html>
  )
}

function DieCard({ index, rolling, value }: { index: number; rolling: boolean; value: DiceValue }) {
  const pips = value === null ? [] : PIP_LAYOUT[value]

  return (
        <div
          className={`board-die-2d${rolling ? ' is-rolling' : ''}`}
          style={{
            '--die-delay': `${index * 70}ms`,
            '--die-rest-rotation': index === 0 ? '-4deg' : '5deg',
          } as React.CSSProperties}
        >
      {value === null ? (
        <span className="board-die-2d__unknown">?</span>
      ) : (
        pips.map(([left, top], pipIndex) => (
          <i
            className="board-die-2d__pip"
            key={pipIndex}
            style={{ left: `${left}%`, top: `${top}%` }}
          />
        ))
      )}
    </div>
  )
}

function randomDice(): [number, number] {
  return [randomFace(), randomFace()]
}

function randomFace(): number {
  return Math.floor(Math.random() * 6) + 1
}
