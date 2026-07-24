import { Component, Suspense } from 'react'
import type { ReactNode } from 'react'

import { getCharacter } from '../core'
import type { PlayerId } from '../core'
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
        Không gắn nhãn tên nổi trên đầu quân cờ nữa: khi quân ở mép trên/dưới bàn cờ,
        nhãn chiếu đè lên bảng đội và khu xúc xắc. Nhận diện đội đã có nhờ chính model
        3D, vòng sáng màu đội khi tới lượt, và avatar ở bảng đội phía trên.
      */}
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
