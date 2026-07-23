import { useEffect, useState } from 'react'

/**
 * Kiểm tra xem file .glb đã được đặt vào /public/models chưa.
 *
 * Nhờ vậy Host chỉ cần thả file vào thư mục là quân cờ tự đổi sang model thật,
 * không phải sửa code hay bật cờ cấu hình nào. Chưa có file thì dùng quân cờ tạm.
 */

type Availability = 'checking' | 'available' | 'missing'

const cache = new Map<string, Promise<boolean>>()

function probe(url: string): Promise<boolean> {
  const cached = cache.get(url)
  if (cached) return cached

  const request = fetch(url, { method: 'HEAD' })
    .then((response) => {
      if (!response.ok) return false
      // Dev server hay trả về index.html cho đường dẫn không tồn tại —
      // kiểm tra thêm content-type để không nhận nhầm HTML là model.
      const type = response.headers.get('content-type') ?? ''
      return !type.includes('text/html')
    })
    .catch(() => false)

  cache.set(url, request)
  return request
}

export function useModelAvailability(url: string): Availability {
  const [status, setStatus] = useState<Availability>('checking')

  useEffect(() => {
    let active = true
    setStatus('checking')

    probe(url).then((ok) => {
      if (active) setStatus(ok ? 'available' : 'missing')
    })

    return () => {
      active = false
    }
  }, [url])

  return status
}
