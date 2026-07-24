import { REGION_BY_ID, getPropertyTile } from '../core'
import { useGameStore } from '../store/useGameStore'
import { getBuildingSlot } from './layout'

interface PropertySceneryProps {
  tileId: number
}

/**
 * Cụm kiến trúc mini có sẵn trên các địa danh chưa được đầu tư.
 *
 * Đây là lớp "city art" giúp vành bàn cờ sống động như board game thương mại;
 * khi người chơi mua đất, cụm này nhường chỗ cho công trình theo cấp thật.
 */
export function PropertyScenery({ tileId }: PropertySceneryProps) {
  const ownerId = useGameStore((state) => state.properties[tileId]?.ownerId)
  const level = useGameStore((state) => state.properties[tileId]?.level ?? 0)
  // Ô đất chưa có chủ chỉ hiển thị tên/giá; công trình xuất hiện sau khi mua.
  if (!ownerId || level > 0) return null

  const tile = getPropertyTile(tileId)
  const accent = REGION_BY_ID[tile.region].color
  const { position, rotationY } = getBuildingSlot(tileId)

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      scale={1.05}
      userData={{ role: 'property-scenery', tileId }}
    >
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <cylinderGeometry args={[0.34, 0.38, 0.05, 12]} />
        <meshStandardMaterial color="#ded9cf" roughness={0.78} />
      </mesh>
      <CityVariant accent={accent} variant={tileId % 4} />
    </group>
  )
}

function CityVariant({ accent, variant }: { accent: string; variant: number }) {
  if (variant === 0) {
    return (
      <group>
        <ToyBlock accent={accent} height={0.38} position={[-0.12, 0, -0.02]} width={0.25} />
        <ToyBlock accent={accent} height={0.24} position={[0.16, 0, 0.05]} width={0.29} />
        <mesh position={[0.16, 0.34, 0.05]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.23, 0.18, 4]} />
          <meshStandardMaterial color={accent} roughness={0.48} />
        </mesh>
      </group>
    )
  }

  if (variant === 1) {
    return (
      <group>
        <mesh position={[0, 0.19, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.19, 0.3, 8]} />
          <meshStandardMaterial color="#fff7e8" roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.38, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.31, 0.14, 4]} />
          <meshStandardMaterial color={accent} roughness={0.46} />
        </mesh>
        <mesh position={[0, 0.49, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.1, 0.14, 8]} />
          <meshStandardMaterial color="#fff7e8" roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.59, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.2, 0.1, 4]} />
          <meshStandardMaterial color={accent} roughness={0.46} />
        </mesh>
      </group>
    )
  }

  if (variant === 2) {
    return (
      <group>
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[x, 0.22, 0]} castShadow>
            <boxGeometry args={[0.14, 0.38, 0.2]} />
            <meshStandardMaterial color="#fff6e5" roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 0.39, 0]} castShadow>
          <boxGeometry args={[0.48, 0.12, 0.22]} />
          <meshStandardMaterial color={accent} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.34, 0.12, 4]} />
          <meshStandardMaterial color="#f5b51b" roughness={0.5} />
        </mesh>
      </group>
    )
  }

  return (
    <group>
      <ToyBlock accent={accent} height={0.26} position={[-0.2, 0, 0.03]} width={0.19} />
      <ToyBlock accent={accent} height={0.5} position={[0, 0, -0.03]} width={0.22} />
      <ToyBlock accent={accent} height={0.34} position={[0.21, 0, 0.04]} width={0.18} />
      <mesh position={[0, 0.58, -0.03]} castShadow>
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshStandardMaterial
          color="#f5b51b"
          emissive="#f5b51b"
          emissiveIntensity={0.12}
          roughness={0.42}
        />
      </mesh>
    </group>
  )
}

function ToyBlock({
  accent,
  height,
  position,
  width,
}: {
  accent: string
  height: number
  position: [number, number, number]
  width: number
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06 + height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, width * 0.86]} />
        <meshStandardMaterial color="#fff7e8" roughness={0.64} />
      </mesh>
      <mesh position={[0, 0.08 + height, 0]} castShadow>
        <boxGeometry args={[width * 1.08, 0.08, width * 0.94]} />
        <meshStandardMaterial color={accent} roughness={0.46} />
      </mesh>
      <mesh position={[0, 0.08 + height * 0.58, width * 0.44]}>
        <boxGeometry args={[width * 0.48, 0.07, 0.012]} />
        <meshStandardMaterial color="#5cc3e7" emissive="#5cc3e7" emissiveIntensity={0.16} />
      </mesh>
    </group>
  )
}
