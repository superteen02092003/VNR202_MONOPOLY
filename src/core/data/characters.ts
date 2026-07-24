import type { Character, CharacterId } from '../types'

/**
 * Các nhân vật 3D cho 5 nhóm lựa chọn.
 * Chỉ giữ những nhân vật đã có sẵn file .glb trong /public/models —
 * xem public/models/README.md (Giai đoạn 2).
 */
export const CHARACTERS: Character[] = [
  {
    id: 'hello-kitty',
    name: 'Hello Kitty',
    modelUrl: '/models/hello-kitty.glb',
    color: '#ff6b9d',
    // Model gốc chỉ có 2 clip đặt tên chung chung "Kitty" / "Kitty.001" nên bộ dò
    // theo từ khóa không nhận ra — chỉ định tay: Kitty.001 (morph nhẹ) cho Idle,
    // Kitty (tay/chân đung đưa) cho Jump; Celebrate mượn lại Jump vì không có clip riêng.
    clips: { idle: 'Kitty.001', jump: 'Kitty', celebrate: 'Kitty' },
    // Model cao ~4.5 đơn vị trong file gốc, quy về ~1 đơn vị cho khớp bàn cờ.
    transform: { scale: 0.22 },
  },
  {
    id: 'masha',
    name: 'Masha',
    modelUrl: '/models/masha.glb',
    color: '#f472b6',
    // Model có bộ clip phong phú (Idle, RunWithBall, WinLoop...) nhưng tên không
    // khớp từ khóa jump/celebrate nên chỉ định tay. Cao ~77 đơn vị → thu rất nhỏ.
    clips: { idle: 'Idle', jump: 'RunWithBall', celebrate: 'WinLoop' },
    transform: { scale: 0.013 },
  },
  {
    id: 'pikachu',
    name: 'Pikachu',
    modelUrl: '/models/pikachu.glb',
    color: '#facc15',
    // Clip đặt tên chuẩn (Idle / Jump / Dance) — bộ dò tự khớp, chỉ cần chỉnh tỉ lệ.
    transform: { scale: 0.75 },
  },
  {
    id: 'doraemon',
    name: 'Doraemon',
    modelUrl: '/models/doraemon.glb',
    color: '#38bdf8',
    // Model tĩnh (không có animation) — quân cờ vẫn hiện nhưng đứng im.
    transform: { scale: 0.47 },
  },
  {
    id: 'totoro',
    name: 'Totoro',
    modelUrl: '/models/totoro.glb',
    color: '#94a3b8',
    // Model diorama tĩnh (nhiều totoro + bãi cỏ), không có animation.
    transform: { scale: 0.35 },
  },
  {
    id: 'conan',
    name: 'Conan',
    modelUrl: '/models/conan.glb',
    color: '#3b82f6',
    // Model tĩnh (không có animation) — quân cờ đứng im. Cao ~30 đơn vị nên thu nhỏ mạnh.
    transform: { scale: 0.032 },
  },
]

export const CHARACTER_BY_ID: Record<CharacterId, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
) as Record<CharacterId, Character>

export function getCharacter(id: CharacterId): Character {
  const character = CHARACTER_BY_ID[id]
  if (!character) throw new Error(`Không tìm thấy nhân vật: ${id}`)
  return character
}
