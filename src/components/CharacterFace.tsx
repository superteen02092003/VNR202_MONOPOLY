import type { ReactNode } from 'react'

import type { CharacterId } from '../core'

interface CharacterFaceProps {
  characterId: CharacterId
}

/**
 * Avatar mặt nhân vật vẽ bằng SVG nội tuyến.
 *
 * Cố ý không dùng ảnh ngoài / emoji: SVG tự chứa nên hiển thị y hệt trên
 * Windows, macOS và máy chiếu, đồng thời không vi phạm CSP khi build/deploy.
 * Mỗi mặt lấp đầy khung avatar (100% × 100%) do khung cha định kích thước.
 */
export function CharacterFace({ characterId }: CharacterFaceProps) {
  const Face = FACES[characterId]
  return (
    <svg className="character-face" viewBox="0 0 40 40" role="img" aria-hidden="true">
      {Face}
    </svg>
  )
}

const FACES: Record<CharacterId, ReactNode> = {
  'hello-kitty': (
    <>
      <path d="M6 16 L10 3 L18 12 Z" fill="#ffffff" stroke="#3a3a3a" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M34 16 L30 3 L22 12 Z" fill="#ffffff" stroke="#3a3a3a" strokeWidth="1.2" strokeLinejoin="round" />
      <ellipse cx="20" cy="23" rx="15" ry="12.5" fill="#ffffff" stroke="#3a3a3a" strokeWidth="1.2" />
      <g stroke="#8a8a8a" strokeWidth="1" strokeLinecap="round">
        <line x1="4" y1="22.5" x2="11" y2="22" />
        <line x1="4" y1="26.5" x2="11" y2="25.5" />
        <line x1="36" y1="22.5" x2="29" y2="22" />
        <line x1="36" y1="26.5" x2="29" y2="25.5" />
      </g>
      <ellipse cx="14.5" cy="24" rx="1.7" ry="2.4" fill="#2b2b2b" />
      <ellipse cx="25.5" cy="24" rx="1.7" ry="2.4" fill="#2b2b2b" />
      <ellipse cx="20" cy="27.5" rx="2" ry="1.5" fill="#f7c948" />
      <path d="M29 10 l6 -4 l0 8 z" fill="#ff5f9e" />
      <path d="M29 10 l-5 -4 l0 8 z" fill="#ff5f9e" />
      <circle cx="29" cy="10" r="1.9" fill="#ffd1e3" />
    </>
  ),
  masha: (
    <>
      <path d="M20 3 C31 3 34 13 33 22 L7 22 C6 13 9 3 20 3 Z" fill="#e05fa8" />
      <ellipse cx="20" cy="22" rx="10.5" ry="11" fill="#ffdcbd" />
      <path d="M9.5 16 C12 9 28 9 30.5 16 C26 12.5 14 12.5 9.5 16 Z" fill="#f27ec0" />
      <path d="M9 20 q-4 4 -2.5 9 l4.5 -2.5 z" fill="#e05fa8" />
      <path d="M31 20 q4 4 2.5 9 l-4.5 -2.5 z" fill="#e05fa8" />
      <circle cx="16" cy="21" r="1.7" fill="#3a2a1a" />
      <circle cx="24" cy="21" r="1.7" fill="#3a2a1a" />
      <path d="M20 23 v2" stroke="#d9a37a" strokeWidth="1" strokeLinecap="round" />
      <path d="M16.5 27 q3.5 3 7 0" fill="none" stroke="#c0575a" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="13.4" cy="24.6" r="1.6" fill="#ffb3ce" opacity="0.7" />
      <circle cx="26.6" cy="24.6" r="1.6" fill="#ffb3ce" opacity="0.7" />
    </>
  ),
  pikachu: (
    <>
      <path d="M9 18 L4 2 L15 12 Z" fill="#f6c915" stroke="#c98f00" strokeWidth="1" strokeLinejoin="round" />
      <path d="M31 18 L36 2 L25 12 Z" fill="#f6c915" stroke="#c98f00" strokeWidth="1" strokeLinejoin="round" />
      <path d="M4 2 L9.2 10 L6 4 Z" fill="#33290f" />
      <path d="M36 2 L30.8 10 L34 4 Z" fill="#33290f" />
      <circle cx="20" cy="22" r="14" fill="#f6c915" stroke="#c98f00" strokeWidth="1" />
      <circle cx="12" cy="26" r="3" fill="#e2483a" />
      <circle cx="28" cy="26" r="3" fill="#e2483a" />
      <circle cx="15" cy="20" r="2.6" fill="#20160a" />
      <circle cx="25" cy="20" r="2.6" fill="#20160a" />
      <circle cx="15.9" cy="19.1" r="0.9" fill="#ffffff" />
      <circle cx="25.9" cy="19.1" r="0.9" fill="#ffffff" />
      <path d="M18.6 24 h2.8" stroke="#20160a" strokeWidth="1" strokeLinecap="round" />
      <path d="M17 25.5 q3 3 6 0" fill="none" stroke="#20160a" strokeWidth="1.1" strokeLinecap="round" />
    </>
  ),
  doraemon: (
    <>
      <circle cx="20" cy="20" r="16" fill="#22a7e6" stroke="#1481b8" strokeWidth="1" />
      <ellipse cx="20" cy="24" rx="12.5" ry="11" fill="#ffffff" />
      <g stroke="#333333" strokeWidth="0.8" strokeLinecap="round">
        <line x1="6" y1="20" x2="13" y2="21" />
        <line x1="6" y1="24" x2="13" y2="24" />
        <line x1="34" y1="20" x2="27" y2="21" />
        <line x1="34" y1="24" x2="27" y2="24" />
      </g>
      <ellipse cx="16.6" cy="14.5" rx="3.2" ry="4" fill="#ffffff" stroke="#333333" strokeWidth="0.8" />
      <ellipse cx="23.4" cy="14.5" rx="3.2" ry="4" fill="#ffffff" stroke="#333333" strokeWidth="0.8" />
      <circle cx="18.2" cy="16" r="1.3" fill="#222222" />
      <circle cx="21.8" cy="16" r="1.3" fill="#222222" />
      <circle cx="20" cy="19.6" r="2.3" fill="#e2483a" />
      <circle cx="19.3" cy="18.9" r="0.7" fill="#ffffff" />
      <line x1="20" y1="21.6" x2="20" y2="30" stroke="#333333" strokeWidth="0.9" />
      <path d="M12 25 q8 8 16 0" fill="none" stroke="#333333" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M9 33 q11 6 22 0" fill="none" stroke="#e2483a" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  totoro: (
    <>
      <path d="M12 8 L9 1 L16.5 6 Z" fill="#8a97a8" />
      <path d="M28 8 L31 1 L23.5 6 Z" fill="#8a97a8" />
      <ellipse cx="20" cy="22" rx="14" ry="16" fill="#8a97a8" stroke="#5f6b7a" strokeWidth="1" />
      <ellipse cx="20" cy="26" rx="9" ry="10.5" fill="#efeade" />
      <g stroke="#9aa6b6" strokeWidth="1.1" fill="none" strokeLinecap="round">
        <path d="M16 23.5 l2 2 l2 -2" />
        <path d="M16 28.5 l2 2 l2 -2" />
      </g>
      <g stroke="#5f6b7a" strokeWidth="0.7" strokeLinecap="round">
        <line x1="4" y1="17.5" x2="11" y2="18" />
        <line x1="36" y1="17.5" x2="29" y2="18" />
      </g>
      <circle cx="15" cy="16" r="2.3" fill="#ffffff" stroke="#333333" strokeWidth="0.7" />
      <circle cx="25" cy="16" r="2.3" fill="#ffffff" stroke="#333333" strokeWidth="0.7" />
      <circle cx="15" cy="16" r="1" fill="#222222" />
      <circle cx="25" cy="16" r="1" fill="#222222" />
      <path d="M18.8 19 h2.4" stroke="#333333" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  conan: (
    <>
      <path d="M7 40 Q8 31 14 28.5 H26 Q32 31 33 40 Z" fill="#3978cf" stroke="#1d4f9c" strokeWidth="0.8" />
      <path d="M14 29 L20 35 L26 29 L23 27.5 H17 Z" fill="#e8f1ff" />
      <path d="M18 33 L20 36 L22 33 L20 30.5 Z" fill="#2c63b5" />
      <ellipse cx="20" cy="22" rx="10.8" ry="12.2" fill="#ffdcbd" stroke="#d79e83" strokeWidth="0.6" />
      <path d="M8.2 19 C8 12 11.2 6.5 16 5.5 L18 1.8 L20 5 L23.5 2.8 L24.5 6 L29 4.2 L28.7 8.3 L32 7.5 L31.2 18.8 C28.5 13.5 25.5 10.5 20 10.3 C14.5 10.5 11.3 13.5 8.2 19 Z" fill="#1e2b46" />
      <path d="M8.5 17.5 L12.5 8.5 L14.5 13.5 L17.5 6.5 L19.5 12.3 L22.8 6.8 L24.5 13 L28.8 8.8 L31.2 17.5" fill="#1e2b46" />
      <path d="M9 17 q-1.2 6 0.4 10.2 l2.3 -2 q-1.5 -4 -0.8 -7.2 Z" fill="#1e2b46" />
      <path d="M31 17 q1.2 6 -0.4 10.2 l-2.3 -2 q1.5 -4 0.8 -7.2 Z" fill="#1e2b46" />
      <g fill="none" stroke="#111827" strokeWidth="1.55">
        <circle cx="15" cy="21.5" r="4.5" />
        <circle cx="25" cy="21.5" r="4.5" />
        <line x1="19.4" y1="21.5" x2="20.6" y2="21.5" />
      </g>
      <circle cx="15" cy="21.5" r="1.35" fill="#172235" />
      <circle cx="25" cy="21.5" r="1.35" fill="#172235" />
      <circle cx="15.5" cy="21" r="0.45" fill="#ffffff" />
      <circle cx="25.5" cy="21" r="0.45" fill="#ffffff" />
      <path d="M20 23.2 l-1 2.8 h2" fill="none" stroke="#bd806c" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.2 28 q2.8 1.8 5.6 0" fill="none" stroke="#a94f59" strokeWidth="1.05" strokeLinecap="round" />
    </>
  ),
}
