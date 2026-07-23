import { Html, RoundedBox } from '@react-three/drei'
import { Shape } from 'three'

import { BOARD, BOARD_3D } from '../core'
import { useGameStore } from '../store/useGameStore'
import { BOARD_EDGE, getRoundedSlabRadius } from './layout'
import { Building } from './Building'
import { Pawn } from './Pawn'
import { PropertyScenery } from './PropertyScenery'
import { Tile } from './Tile'

const CENTER_STAR = createStarShape(5, 0.82, 0.35)

/** Bàn cờ hoàn chỉnh: 32 ô khép kín, mặt bàn ở giữa và quân cờ của các nhóm. */
export function Board() {
  const playerIds = useGameStore((s) => s.turnOrder)

  return (
    <group>
      <BoardBase />

      {BOARD.map((tile) => (
        <Tile key={tile.id} tile={tile} />
      ))}

      {BOARD.filter((tile) => tile.type === 'property').map((tile) => (
        <group key={`property-visual-${tile.id}`}>
          <PropertyScenery tileId={tile.id} />
          <Building tileId={tile.id} />
        </group>
      ))}

      {playerIds.map((playerId) => (
        <Pawn key={playerId} playerId={playerId} />
      ))}
    </group>
  )
}

/** Mặt bàn ở giữa và phần đế nhô ra dưới vành ô cờ. */
function BoardBase() {
  const inner = BOARD_EDGE - BOARD_3D.TILE_DEPTH * 2
  const half = BOARD_EDGE / 2
  const innerHalf = inner / 2

  return (
    <group>
      {/* Mặt sân tròn tạo bóng nền mềm như một bộ board game đặt trên bàn. */}
      <mesh position={[0, -0.43, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[BOARD_EDGE * 0.83, 64]} />
        <meshStandardMaterial color="#b2dae4" roughness={0.92} metalness={0.02} />
      </mesh>

      {/* Bóng/viền tím xám dưới đế cho cảm giác isometric dày và chắc. */}
      <RoundedBox
        args={[BOARD_EDGE + 1, 0.32, BOARD_EDGE + 1]}
        radius={getRoundedSlabRadius(0.32, 0.14)}
        smoothness={3}
        position={[0, -0.26, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#817e91" roughness={0.62} metalness={0.08} />
      </RoundedBox>

      {/* Hai lớp đế kem/trắng tạo bevel mềm kiểu đồ chơi. */}
      <RoundedBox
        args={[BOARD_EDGE + 0.74, 0.2, BOARD_EDGE + 0.74]}
        radius={getRoundedSlabRadius(0.2, 0.085)}
        smoothness={3}
        position={[0, -0.1, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#eee8dc"
          roughness={0.55}
          clearcoat={0.28}
          clearcoatRoughness={0.65}
        />
      </RoundedBox>
      <RoundedBox
        args={[BOARD_EDGE + 0.5, 0.09, BOARD_EDGE + 0.5]}
        radius={getRoundedSlabRadius(0.09, 0.035)}
        smoothness={3}
        position={[0, 0.015, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#ece8e1"
          roughness={0.42}
          clearcoat={0.45}
          clearcoatRoughness={0.52}
        />
      </RoundedBox>

      {/* Mặt giữa lime — cũng là khay hứng xúc xắc. */}
      <RoundedBox
        args={[inner, BOARD_3D.TILE_HEIGHT, inner]}
        radius={getRoundedSlabRadius(BOARD_3D.TILE_HEIGHT, 0.075)}
        smoothness={3}
        position={[0, BOARD_3D.TILE_HEIGHT / 2, 0]}
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#aed26f"
          roughness={0.62}
          clearcoat={0.2}
          clearcoatRoughness={0.72}
        />
      </RoundedBox>

      <CenterFieldGrid size={inner} />

      {/* Viền ngoài xám tím và viền trong trắng làm từng dải ô rõ hơn khi chiếu xa. */}
      <BoardRails half={half} innerHalf={innerHalf} />

      {/* Họa tiết đồng tâm rất nhẹ để vùng xúc xắc bớt trống. */}
      <mesh
        position={[0, BOARD_3D.TILE_HEIGHT + 0.006, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[2.55, 2.59, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.42} />
      </mesh>
      <mesh
        position={[0, BOARD_3D.TILE_HEIGHT + 0.007, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[3.65, 3.68, 64]} />
        <meshBasicMaterial color="#4cae9b" transparent opacity={0.3} />
      </mesh>

      {/* Ngôi sao vàng nhận diện Việt Nam, đặt lệch để không nằm dưới hai viên xúc xắc. */}
      <mesh
        position={[0, BOARD_3D.TILE_HEIGHT + 0.012, 1.85]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <shapeGeometry args={[CENTER_STAR]} />
        <meshPhysicalMaterial
          color="#f5b400"
          emissive="#f5b400"
          emissiveIntensity={0.08}
          roughness={0.42}
          clearcoat={0.5}
        />
      </mesh>

      <CenterBrand />
    </group>
  )
}

function CenterFieldGrid({ size }: { size: number }) {
  const inset = size * 0.43
  const lineColor = '#f3f8d8'

  return (
    <group position={[0, BOARD_3D.TILE_HEIGHT + 0.008, 0]}>
      {[-inset, 0, inset].map((offset) => (
        <mesh key={`grid-x-${offset}`} position={[offset, 0, 0]}>
          <boxGeometry args={[0.025, 0.009, size * 0.86]} />
          <meshBasicMaterial color={lineColor} transparent opacity={0.22} />
        </mesh>
      ))}
      {[-inset, 0, inset].map((offset) => (
        <mesh key={`grid-z-${offset}`} position={[0, 0, offset]}>
          <boxGeometry args={[size * 0.86, 0.009, 0.025]} />
          <meshBasicMaterial color={lineColor} transparent opacity={0.22} />
        </mesh>
      ))}
    </group>
  )
}

function BoardRails({ half, innerHalf }: { half: number; innerHalf: number }) {
  const outerRails = [
    { position: [0, 0.105, half + 0.12] as const, size: [BOARD_EDGE + 0.36, 0.12, 0.12] as const },
    { position: [0, 0.105, -half - 0.12] as const, size: [BOARD_EDGE + 0.36, 0.12, 0.12] as const },
    { position: [half + 0.12, 0.105, 0] as const, size: [0.12, 0.12, BOARD_EDGE + 0.12] as const },
    { position: [-half - 0.12, 0.105, 0] as const, size: [0.12, 0.12, BOARD_EDGE + 0.12] as const },
  ]
  const innerRails = [
    { position: [0, 0.187, innerHalf] as const, size: [innerHalf * 2 + 0.08, 0.025, 0.08] as const },
    { position: [0, 0.187, -innerHalf] as const, size: [innerHalf * 2 + 0.08, 0.025, 0.08] as const },
    { position: [innerHalf, 0.187, 0] as const, size: [0.08, 0.025, innerHalf * 2 - 0.08] as const },
    { position: [-innerHalf, 0.187, 0] as const, size: [0.08, 0.025, innerHalf * 2 - 0.08] as const },
  ]

  return (
    <>
      {outerRails.map((rail, index) => (
        <mesh key={`outer-${index}`} position={rail.position} receiveShadow>
          <boxGeometry args={rail.size} />
          <meshStandardMaterial color="#8a8694" roughness={0.46} />
        </mesh>
      ))}
      {innerRails.map((rail, index) => (
        <mesh key={`inner-${index}`} position={rail.position}>
          <boxGeometry args={rail.size} />
          <meshBasicMaterial color="#fffdf8" />
        </mesh>
      ))}
    </>
  )
}

function CenterBrand() {
  return (
    <Html
      position={[0, BOARD_3D.TILE_HEIGHT + 0.06, -1.78]}
      center
      pointerEvents="none"
      zIndexRange={[4, 0]}
    >
      <div
        style={{
          minWidth: 205,
          border: '3px solid rgba(255,255,255,0.96)',
          borderRadius: 14,
          background: 'linear-gradient(180deg, #ffffff 0%, #f7f1e7 100%)',
          boxShadow: '0 8px 0 rgba(111,108,126,0.28), 0 12px 24px rgba(81,103,132,0.22)',
          color: '#273451',
          padding: '7px 16px 8px',
          textAlign: 'center',
          fontFamily: '"Arial Rounded MT Bold", "Segoe UI", sans-serif',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        <div
          style={{
            color: '#e60066',
            fontSize: 8,
            fontWeight: 900,
            letterSpacing: '0.2em',
            marginBottom: 3,
          }}
        >
          VNR202
        </div>
        <div
          style={{
            color: '#138fc5',
            fontSize: 17,
            fontWeight: 1000,
            letterSpacing: '-0.045em',
            textShadow: '0 2px 0 rgba(20,143,197,0.13)',
          }}
        >
          BUSINESS VOYAGE
        </div>
        <div
          style={{
            color: '#a47700',
            fontSize: 8,
            fontWeight: 900,
            letterSpacing: '0.16em',
            marginTop: 4,
          }}
        >
          VIETNAM EDITION
        </div>
      </div>
    </Html>
  )
}

function createStarShape(points: number, outerRadius: number, innerRadius: number) {
  const shape = new Shape()

  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius
    const angle = -Math.PI / 2 + (index * Math.PI) / points
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }

  shape.closePath()
  return shape
}
