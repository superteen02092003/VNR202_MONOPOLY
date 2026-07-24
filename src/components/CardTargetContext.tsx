import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import type { CardTarget, CardTargetKind, PlayerId } from '../core'

export interface ActiveCardTargeting {
  cardId: string
  playerId: PlayerId
  kind: CardTargetKind
  /** Các mục tiêu hợp lệ hiện tại, dùng để đánh dấu đúng ô/quân trên bàn cờ. */
  targetValues?: string[]
}

interface CardTargetContextValue {
  active: ActiveCardTargeting | null
  begin: (selection: ActiveCardTargeting, onTarget: (target: CardTarget) => void) => void
  clear: () => void
  select: (target: CardTarget) => void
}

const CardTargetContext = createContext<CardTargetContextValue | null>(null)

export function CardTargetProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveCardTargeting | null>(null)
  const handlerRef = useRef<((target: CardTarget) => void) | null>(null)

  const begin = useCallback(
    (selection: ActiveCardTargeting, onTarget: (target: CardTarget) => void) => {
      handlerRef.current = onTarget
      setActive(selection)
    },
    [],
  )

  const clear = useCallback(() => {
    handlerRef.current = null
    setActive(null)
  }, [])

  const select = useCallback((target: CardTarget) => {
    handlerRef.current?.(target)
  }, [])

  const value = useMemo(() => ({ active, begin, clear, select }), [active, begin, clear, select])

  return <CardTargetContext.Provider value={value}>{children}</CardTargetContext.Provider>
}

export function useCardTargeting() {
  const value = useContext(CardTargetContext)
  // Scene components cũng được render độc lập trong một số test/Storybook.
  // Khi đó click chọn thẻ chỉ đơn giản là không hoạt động, không làm hỏng Canvas.
  return value ?? {
    active: null,
    begin: () => undefined,
    clear: () => undefined,
    select: () => undefined,
  }
}
