/**
 * Bộ sinh số ngẫu nhiên có hạt giống (mulberry32).
 *
 * Trạng thái RNG nằm trong GameCore chứ không phải biến toàn cục, nhờ đó:
 *  - test chạy lại cho kết quả giống hệt nhau;
 *  - có thể lưu / khôi phục nguyên vẹn một ván đang chơi dở.
 */

export interface RngHolder {
  rngState: number
}

/** Trả về số thực trong [0, 1) và đẩy trạng thái RNG tiến một bước. */
export function nextRandom(holder: RngHolder): number {
  holder.rngState = (holder.rngState + 0x6d2b79f5) | 0
  let t = holder.rngState
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Số nguyên ngẫu nhiên trong [min, max] (bao gồm hai đầu). */
export function nextInt(holder: RngHolder, min: number, max: number): number {
  return min + Math.floor(nextRandom(holder) * (max - min + 1))
}

/** Chọn ngẫu nhiên một phần tử. Trả về undefined nếu mảng rỗng. */
export function pickOne<T>(holder: RngHolder, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[nextInt(holder, 0, items.length - 1)]
}

/** Chọn ngẫu nhiên một phần tử theo trọng số. */
export function pickWeighted<T>(
  holder: RngHolder,
  items: readonly T[],
  getWeight: (item: T) => number,
): T | undefined {
  if (items.length === 0) return undefined
  const total = items.reduce((sum, item) => sum + Math.max(0, getWeight(item)), 0)
  if (total <= 0) return pickOne(holder, items)

  let threshold = nextRandom(holder) * total
  for (const item of items) {
    threshold -= Math.max(0, getWeight(item))
    if (threshold < 0) return item
  }
  return items[items.length - 1]
}

/** Trả về bản sao đã xáo trộn (Fisher-Yates), không đụng vào mảng gốc. */
export function shuffle<T>(holder: RngHolder, items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = nextInt(holder, 0, i)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Hạt giống mặc định lấy theo thời gian hệ thống. */
export function createSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) | 0
}
