import type { Character, CharacterId } from '../types'

/**
 * 10 nhân vật 3D cho 5 nhóm lựa chọn.
 * File .glb đặt trong /public/models — xem public/models/README.md (Giai đoạn 2).
 */
export const CHARACTERS: Character[] = [
  { id: 'hello-kitty', name: 'Hello Kitty', modelUrl: '/models/hello-kitty.glb', color: '#ff6b9d' },
  { id: 'masha', name: 'Masha', modelUrl: '/models/masha.glb', color: '#f472b6' },
  { id: 'pikachu', name: 'Pikachu', modelUrl: '/models/pikachu.glb', color: '#facc15' },
  { id: 'doraemon', name: 'Doraemon', modelUrl: '/models/doraemon.glb', color: '#38bdf8' },
  { id: 'minion', name: 'Minion', modelUrl: '/models/minion.glb', color: '#fde047' },
  { id: 'kirby', name: 'Kirby', modelUrl: '/models/kirby.glb', color: '#f9a8d4' },
  { id: 'baymax', name: 'Baymax', modelUrl: '/models/baymax.glb', color: '#e2e8f0' },
  { id: 'totoro', name: 'Totoro', modelUrl: '/models/totoro.glb', color: '#94a3b8' },
  { id: 'snoopy', name: 'Snoopy', modelUrl: '/models/snoopy.glb', color: '#f8fafc' },
  { id: 'among-us', name: 'Phi hành gia Among Us', modelUrl: '/models/among-us.glb', color: '#ef4444' },
]

export const CHARACTER_BY_ID: Record<CharacterId, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
) as Record<CharacterId, Character>

export function getCharacter(id: CharacterId): Character {
  const character = CHARACTER_BY_ID[id]
  if (!character) throw new Error(`Không tìm thấy nhân vật: ${id}`)
  return character
}
