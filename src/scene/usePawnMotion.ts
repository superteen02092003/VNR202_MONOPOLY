import { useCallback, useRef, useState } from 'react'
import { animate } from 'animejs'
import { Vector3 } from 'three'
import type { Group } from 'three'
import { useFrame } from '@react-three/fiber'

import { BOARD_3D } from '../core'
import type { CharacterAnimation, GameCore, PlayerId } from '../core'
import { useGameStore } from '../store/useGameStore'
import { getHopPath, getPawnSlot, getTileSurface } from './layout'
import { useGameEvents } from './useGameEvents'

/** Thời gian giữ hoạt ảnh ăn mừng khi xây được Biểu tượng Địa phương. */
const CELEBRATE_MS = 2600

/**
 * Chỗ đứng của quân cờ: nhiều nhóm cùng một ô thì chia đều thành vòng tròn nhỏ.
 * Nhóm phá sản bị loại khỏi vòng để không chiếm chỗ.
 */
function computeSlot(state: GameCore, playerId: PlayerId): [number, number, number] {
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return [0, 0, 0]

  const sameTile = state.players.filter(
    (p) => p.status !== 'bankrupt' && p.position === player.position,
  )
  const index = Math.max(0, sameTile.findIndex((p) => p.id === playerId))
  return getPawnSlot(player.position, index, sameTile.length)
}

export interface PawnMotion {
  groupRef: React.RefObject<Group | null>
  animation: CharacterAnimation
}

/**
 * Điều khiển chuyển động của một quân cờ.
 *
 * - anime.js nội suy tọa độ X/Z, trục Y vẽ parabol để nhân vật "nhảy" qua từng ô.
 * - Trạng thái hoạt ảnh (Idle / Jump / Celebrate) được trả ra ngoài cho model 3D
 *   hoặc quân cờ tạm tự diễn.
 *
 * Toàn bộ vòng lặp chạy trong useFrame chứ không dùng useEffect, nên StrictMode
 * của React không kích hoạt cú nhảy hai lần.
 */
export function usePawnMotion(playerId: PlayerId): PawnMotion {
  const groupRef = useRef<Group>(null)
  const positionRef = useRef(new Vector3())
  const scratch = useRef(new Vector3())
  const placed = useRef(false)
  const hopping = useRef(false)

  const [animation, setAnimation] = useState<CharacterAnimation>('idle')

  const startHop = useCallback(
    (fromTile: number, steps: number) => {
      hopping.current = true
      setAnimation('jump')

      const path = getHopPath(fromTile, steps)
      const origin = getTileSurface(fromTile)
      const progress = { t: 0 }

      animate(progress, {
        t: path.length,
        duration: path.length * BOARD_3D.HOP_DURATION,
        ease: 'linear',
        onUpdate: () => {
          const t = Math.min(progress.t, path.length)
          const segment = Math.min(Math.floor(t), path.length - 1)
          const local = t - segment

          const from = segment === 0 ? origin : getTileSurface(path[segment - 1])
          const to = getTileSurface(path[segment])

          positionRef.current.set(
            from[0] + (to[0] - from[0]) * local,
            from[1] + Math.sin(Math.PI * local) * BOARD_3D.HOP_HEIGHT,
            from[2] + (to[2] - from[2]) * local,
          )
        },
        onComplete: () => {
          hopping.current = false
          setAnimation('idle')
          // Animation kết thúc mới cập nhật vị trí logic và mở Vòng Hành động.
          useGameStore.getState().applyMovement()
        },
      })
    },
    [],
  )

  // Ăn mừng khi nhóm này vừa xây xong Biểu tượng Địa phương.
  useGameEvents((event) => {
    if (event.playerId !== playerId || event.type !== 'landmark-built') return
    setAnimation('celebrate')
    setTimeout(() => {
      setAnimation((current) => (current === 'celebrate' ? 'idle' : current))
    }, CELEBRATE_MS)
  })

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    const state = useGameStore.getState()
    const player = state.players.find((p) => p.id === playerId)
    if (!player) return

    // Tới lượt và lõi game đã chuyển sang bước di chuyển → bắt đầu nhảy.
    if (
      !hopping.current &&
      state.phase === 'moving' &&
      state.dice &&
      state.turnOrder[state.currentPlayerIndex] === playerId
    ) {
      startHop(player.position, state.dice[0] + state.dice[1])
    }

    // Ngoài lúc nhảy thì bám mượt theo vị trí logic (bay, hoán đổi, vào ô Kẹt xe...).
    if (!hopping.current) {
      const [x, y, z] = computeSlot(state, playerId)
      scratch.current.set(x, y, z)

      if (placed.current) {
        positionRef.current.lerp(scratch.current, Math.min(1, delta * 9))
      } else {
        positionRef.current.copy(scratch.current)
        placed.current = true
      }
    }

    group.position.copy(positionRef.current)
  })

  return { groupRef, animation }
}
