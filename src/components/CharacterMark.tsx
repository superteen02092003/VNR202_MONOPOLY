import type { CSSProperties } from 'react'

import { getCharacter } from '../core'
import type { CharacterId } from '../core'

interface CharacterMarkProps {
  characterId: CharacterId
  className?: string
}

/**
 * Monogram tạm thời cho nhân vật trước khi có portrait/model chính thức.
 * Cố ý không dùng emoji để giao diện đồng nhất trên Windows, macOS và máy chiếu.
 */
export function CharacterMark({ characterId, className = '' }: CharacterMarkProps) {
  const character = getCharacter(characterId)
  const parts = character.id.split('-')
  const monogram =
    parts.length > 1
      ? parts.map((part) => part[0]).join('').slice(0, 2)
      : character.name.replace(/\s+/g, '').slice(0, 2)

  return (
    <span
      aria-hidden="true"
      className={`character-mark ${className}`.trim()}
      style={{ '--character-color': character.color } as CSSProperties}
      title={character.name}
    >
      {monogram.toLocaleUpperCase('vi-VN')}
    </span>
  )
}
