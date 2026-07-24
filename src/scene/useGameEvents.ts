import { useEffect, useRef } from 'react'

import { playGameEventSound } from '../core'
import type { GameEvent } from '../core'
import { useGameStore } from '../store/useGameStore'

/**
 * Lắng nghe hàng đợi sự kiện của lõi game để diễn hoạt ảnh / phát âm thanh.
 *
 * Chỉ những sự kiện phát sinh SAU khi component gắn vào mới được xử lý —
 * nhờ mốc `seq` tăng dần, quân cờ không diễn lại toàn bộ lịch sử ván đấu.
 */
export function useGameEvents(handler: (event: GameEvent) => void): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const history = useGameStore.getState().events
    let lastSeq = history.length > 0 ? history[history.length - 1].seq : 0

    return useGameStore.subscribe((state) => {
      for (const event of state.events) {
        if (event.seq <= lastSeq) continue
        lastSeq = event.seq
        playGameEventSound(event)
        handlerRef.current(event)
      }
    })
  }, [])
}

