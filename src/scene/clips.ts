import type { CharacterAnimation } from '../core'

/**
 * Dò tên clip animation trong file .glb.
 *
 * Mỗi model trên Sketchfab / Mixamo đặt tên một kiểu ("Take 001",
 * "Armature|Idle", "mixamo.com"...), nên ta khớp mờ theo từ khóa thay vì
 * ép Host phải sửa file. Muốn chỉ định tay thì khai báo `clips` trong
 * `src/core/data/characters.ts`.
 */

const PATTERNS: Record<CharacterAnimation, RegExp[]> = {
  idle: [/idle/i, /breath/i, /stand/i, /rest/i],
  jump: [/jump/i, /hop/i, /run/i, /walk/i, /move/i],
  celebrate: [/celebrat/i, /victory/i, /cheer/i, /danc/i, /clap/i, /\bwin\b/i, /happy/i, /wave/i],
}

/** Khi không tìm được clip mong muốn thì lùi dần sang loại gần nhất. */
const FALLBACK_ORDER: Record<CharacterAnimation, CharacterAnimation[]> = {
  idle: ['idle'],
  jump: ['jump', 'idle'],
  celebrate: ['celebrate', 'jump', 'idle'],
}

function matchByPattern(names: string[], kind: CharacterAnimation): string | null {
  for (const pattern of PATTERNS[kind]) {
    const found = names.find((name) => pattern.test(name))
    if (found) return found
  }
  return null
}

/**
 * Trả về tên clip nên chạy cho một trạng thái hoạt ảnh.
 *
 * Thứ tự ưu tiên: chỉ định tay → khớp từ khóa → loại gần nhất → clip đầu tiên.
 * Model không có clip nào thì trả về null, quân cờ sẽ tự dùng hoạt ảnh thủ tục.
 */
export function resolveClipName(
  names: string[],
  kind: CharacterAnimation,
  overrides?: Partial<Record<CharacterAnimation, string>>,
): string | null {
  if (names.length === 0) return null

  const manual = overrides?.[kind]
  if (manual && names.includes(manual)) return manual

  for (const candidate of FALLBACK_ORDER[kind]) {
    const manualFallback = overrides?.[candidate]
    if (manualFallback && names.includes(manualFallback)) return manualFallback

    const matched = matchByPattern(names, candidate)
    if (matched) return matched
  }

  // Model có animation nhưng tên không đoán được — cứ chạy clip đầu tiên
  // còn hơn để nhân vật đứng chết trân.
  return names[0]
}
