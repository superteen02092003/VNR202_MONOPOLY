import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import type { ActionResult } from '../store/useGameStore'
import { GameIcon } from './GameIcon'
import { NoticeContext } from './useNotice'
import type { NoticeTone } from './useNotice'

interface Notice {
  id: number
  message: string
  tone: NoticeTone
}

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const timerRef = useRef<number | null>(null)
  const idRef = useRef(0)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const dismiss = useCallback(() => {
    clearTimer()
    setNotice(null)
  }, [clearTimer])

  const notify = useCallback(
    (message: string, tone: NoticeTone = 'info') => {
      clearTimer()
      idRef.current += 1
      setNotice({ id: idRef.current, message, tone })
      timerRef.current = window.setTimeout(() => setNotice(null), tone === 'error' ? 5200 : 3600)
    },
    [clearTimer],
  )

  const runAction = useCallback(
    (action: () => ActionResult, successMessage?: string) => {
      const result = action()
      if (!result.ok) {
        notify(result.reason ?? 'Không thể thực hiện thao tác này.', 'error')
        return false
      }
      if (successMessage) notify(successMessage, 'success')
      return true
    },
    [notify],
  )

  const value = useMemo(() => ({ notify, runAction }), [notify, runAction])

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div aria-atomic="true" aria-live="polite" className="notice-viewport">
        {notice && (
          <div className={`notice notice--${notice.tone}`} key={notice.id} role="status">
            <span className="notice__icon">
              <GameIcon name={notice.tone === 'error' ? 'close' : notice.tone === 'success' ? 'check' : 'sparkles'} size={18} />
            </span>
            <span className="notice__message">{notice.message}</span>
            <button aria-label="Đóng thông báo" className="notice__close" onClick={dismiss} type="button">
              <GameIcon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
    </NoticeContext.Provider>
  )
}
