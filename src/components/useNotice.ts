import { createContext, useContext } from 'react'

import type { ActionResult } from '../store/useGameStore'

export type NoticeTone = 'error' | 'info' | 'success'

export interface NoticeContextValue {
  notify: (message: string, tone?: NoticeTone) => void
  runAction: (action: () => ActionResult, successMessage?: string) => boolean
}

export const NoticeContext = createContext<NoticeContextValue | null>(null)

export function useNotice() {
  const context = useContext(NoticeContext)
  if (!context) throw new Error('useNotice phải được dùng bên trong NoticeProvider.')
  return context
}
