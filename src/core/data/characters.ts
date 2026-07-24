import type { Character, CharacterId } from '../types'

/**
 * Các nhân vật 3D cho 5 nhóm lựa chọn.
 * Chỉ giữ những nhân vật đã có sẵn file .glb trong /public/models —
 * xem public/models/README.md (Giai đoạn 2).
 */
// Tỉ lệ mỗi model được CharacterModel tự chuẩn hoá về cùng chiều cao, nên ở đây
// chỉ cần khai báo clip animation (nếu tên không tự dò được) và tinh chỉnh khi cần.
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
  },
  {
    id: 'masha',
    name: 'Masha',
    modelUrl: '/models/masha.glb',
    color: '#f472b6',
    // Model có bộ clip phong phú (Idle, RunWithBall, WinLoop...) nhưng tên không
    // khớp từ khóa jump/celebrate nên chỉ định tay.
    clips: { idle: 'Idle', jump: 'RunWithBall', celebrate: 'WinLoop' },
  },
  {
    id: 'pikachu',
    name: 'Pikachu',
    modelUrl: '/models/pikachu.glb',
    color: '#facc15',
    // Clip đặt tên chuẩn (Idle / Jump / Dance) — bộ dò tự khớp.
  },
  {
    // Model tĩnh (không có animation) — quân cờ vẫn hiện nhưng đứng im.
    id: 'doraemon',
    name: 'Doraemon',
    modelUrl: '/models/doraemon.glb',
    color: '#38bdf8',
  },
  {
    // Model diorama tĩnh (nhiều totoro + bãi cỏ), không có animation.
    id: 'totoro',
    name: 'Totoro',
    modelUrl: '/models/totoro.glb',
    color: '#94a3b8',
  },
  {
    // Model tĩnh (không có animation) — quân cờ đứng im.
    id: 'conan',
    name: 'Conan',
    modelUrl: '/models/conan.glb',
    color: '#3b82f6',
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
