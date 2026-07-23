import { Component, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Html } from '@react-three/drei'

import { getCharacter } from '../core'
import type { PlayerId } from '../core'
import { CharacterMark } from '../components/CharacterMark'
import { GameIcon } from '../components/GameIcon'
import { useGameStore } from '../store/useGameStore'
import { CharacterModel } from './CharacterModel'
import { PlaceholderPawn } from './PlaceholderPawn'
import { useModelAvailability } from './useModelAvailability'
import { usePawnMotion } from './usePawnMotion'

interface PawnProps {
  playerId: PlayerId
}

/**
 * Quân cờ của một nhóm.
 *
 * Có file .glb trong /public/models thì dùng model thật kèm useAnimations;
 * chưa có thì tự động dùng quân cờ tạm với hoạt ảnh thủ tục. Host chỉ cần
 * thả file vào thư mục, không phải sửa code.
 */
export function Pawn({ playerId }: PawnProps) {
  const player = useGameStore((s) => s.players.find((p) => p.id === playerId))
  const isCurrent = useGameStore((s) => s.turnOrder[s.currentPlayerIndex] === playerId)
  const { groupRef, animation } = usePawnMotion(playerId)

  const character = player ? getCharacter(player.characterId) : null
  const availability = useModelAvailability(character?.modelUrl ?? '')

  if (!player || !character) return null

  const bankrupt = player.status === 'bankrupt'

  return (
    <group ref={groupRef}>
      {/* Vòng sáng đánh dấu nhóm đang tới lượt */}
      {isCurrent && !bankrupt && (
        <>
          <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.23, 0.33, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.94} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.34, 0.39, 32]} />
            <meshBasicMaterial
              color={player.color}
              transparent
              opacity={0.92}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {availability === 'available' ? (
        <ModelBoundary
          fallback={
            <PlaceholderPawn color={player.color} animation={animation} dimmed={bankrupt} />
          }
        >
          <Suspense
            fallback={
              <PlaceholderPawn color={player.color} animation={animation} dimmed={bankrupt} />
            }
          >
            <CharacterModel character={character} animation={animation} />
          </Suspense>
        </ModelBoundary>
      ) : (
        <PlaceholderPawn color={player.color} animation={animation} dimmed={bankrupt} />
      )}

      {/*
        Tên nhóm nổi trên đầu quân cờ.
        KHÔNG dùng distanceFactor: với camera trực giao, drei lấy camera.zoom làm
        hệ số nên nhãn bị phóng to gấp hàng chục lần. Giữ kích thước cố định theo
        pixel màn hình vừa đúng vừa dễ đọc khi chiếu máy chiếu.
      */}
      <Html position={[0, 0.82, 0]} center pointerEvents="none" zIndexRange={[8, 0]}>
        <div
          style={{
            background: bankrupt
              ? 'rgba(235,232,226,0.93)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,242,233,0.97))',
            color: bankrupt ? '#777583' : '#26334f',
            border: `2px solid ${bankrupt ? '#9d99a7' : player.color}`,
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            boxShadow: isCurrent
              ? `0 3px 0 rgba(99,96,112,0.28), 0 0 0 3px rgba(255,255,255,0.72), 0 7px 16px ${player.color}55`
              : '0 3px 0 rgba(99,96,112,0.24), 0 6px 12px rgba(66,82,110,0.2)',
            fontFamily: '"Arial Rounded MT Bold", "Segoe UI", system-ui, sans-serif',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <CharacterMark characterId={player.characterId} />
          <span>{player.name}</span>
          {player.status === 'jailed' && <GameIcon name="lock" size={12} />}
          {bankrupt && <GameIcon name="close" size={12} />}
        </div>
      </Html>
    </group>
  )
}

/**
 * File .glb hỏng hoặc thiếu texture sẽ ném lỗi khi nạp — bắt lại ở đây
 * để tụt về quân cờ tạm thay vì làm sập cả Canvas giữa buổi chiếu.
 */
class ModelBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[VNR202] Không nạp được model nhân vật, dùng quân cờ tạm.', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
