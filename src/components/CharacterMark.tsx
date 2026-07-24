import type { CSSProperties } from 'react'

import { getCharacter } from '../core'
import type { CharacterId } from '../core'
import { CharacterFace } from './CharacterFace'

interface CharacterMarkProps {
  characterId: CharacterId
  className?: string
}

/**
 * Avatar nhân vật dùng chung cho mọi bảng tên (sảnh chờ, bảng đội, top bar...).
 *
 * Hiển thị mặt nhân vật vẽ bằng SVG ([[CharacterFace]]) trong khung màu đội.
 * Khung cha quyết định kích thước; mặt tự lấp đầy khung.
 */
export function CharacterMark({ characterId, className = '' }: CharacterMarkProps) {
  const character = getCharacter(characterId)

  return (
    <span
      aria-hidden="true"
      className={`character-mark ${className}`.trim()}
      style={{ '--character-color': character.color } as CSSProperties}
      title={character.name}
    >
      <CharacterFace characterId={characterId} />
    </span>
  )
}
