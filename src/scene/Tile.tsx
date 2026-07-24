import { useState } from 'react'
import { Edges, Html, RoundedBox } from '@react-three/drei'

import { BOARD_3D, BUILD_LEVEL_LABEL, REGION_BY_ID, formatMoney } from '../core'
import type { Tile as TileData } from '../core'
import { useGameStore } from '../store/useGameStore'
import { getTileTransform } from './layout'
import { TileArtwork } from './TileArtwork'

/** Ô đặc biệt dùng màu kẹo sáng, gần ngôn ngữ đồ chơi của Business Tour Classic. */
const SPECIAL_STYLE: Record<string, { surface: string; accent: string }> = {
  start: { surface: '#88b813', accent: '#5f8500' },
  jail: { surface: '#ee6b83', accent: '#b83455' },
  festival: { surface: '#e60066', accent: '#a50049' },
  travel: { surface: '#1ea7dd', accent: '#137ba8' },
  chance: { surface: '#f5b400', accent: '#ae7f00' },
  tax: { surface: '#918ca0', accent: '#615d70' },
}

/** Bản đậm của màu vùng, chỉ dùng cho chữ trên nền trắng để giữ tương phản máy chiếu. */
const REGION_LABEL_COLOR: Record<string, string> = {
  'tay-bac': '#6b442b',
  'dong-bac': '#087f9a',
  'dong-bang-song-hong': '#be185d',
  'bac-trung-bo': '#c2410c',
  'duyen-hai-nam-trung-bo': '#c81e1e',
  'tay-nguyen': '#9a6500',
  'tay-nam-bo': '#15803d',
  'dong-nam-bo': '#4338ca',
}

interface TileProps {
  tile: TileData
}

export function Tile({ tile }: TileProps) {
  const [hovered, setHovered] = useState(false)
  const property = useGameStore((s) => s.properties[tile.id])
  const owner = useGameStore((s) =>
    property?.ownerId ? s.players.find((p) => p.id === property.ownerId) : undefined,
  )
  const activeTileId = useGameStore((s) => {
    const currentId = s.turnOrder[s.currentPlayerIndex]
    return s.players.find((player) => player.id === currentId)?.position
  })

  const { position, rotationY, size, isCorner } = getTileTransform(tile.id)
  const [width, depth] = size
  const faceWidth = width * (isCorner ? 0.975 : 0.965)
  const faceDepth = depth * 0.975

  const isProperty = tile.type === 'property'
  const region = isProperty ? REGION_BY_ID[tile.region] : null
  const special = isProperty ? null : SPECIAL_STYLE[tile.type]
  const isActive = activeTileId === tile.id

  const surfaceColor = isProperty ? '#f5f1ea' : (special?.surface ?? '#918ca0')
  // Chữ giá luôn dùng màu vùng để đủ tương phản; màu đội đã có ribbon/outline riêng.
  const accentColor =
    (isProperty ? REGION_LABEL_COLOR[tile.region] : special?.accent) ?? '#696576'
  const edgeColor = isActive
    ? '#ffffff'
    : hovered
      ? '#138fc5'
      : owner?.color ?? (isProperty ? '#9b98a8' : '#ffffff')

  const geometryRotationY = isCorner ? 0 : rotationY
  const artworkRotationY = isCorner ? rotationY : 0
  // Bàn cờ chỉ nhìn từ một phía (máy chiếu). Ô ở cạnh xa và hai góc trên có mặt
  // quay ngược camera nên chữ bị lộn ngược — xoay nội dung texture 180° để đọc xuôi.
  const flipText = Math.cos(rotationY) < -0.01

  return (
    <group
      position={position}
      rotation={[0, geometryRotationY, 0]}
      userData={{ role: 'board-tile', tileId: tile.id }}
    >
      {/* Lớp đáy tím xám tạo chiều dày và bóng mềm dưới từng ô. */}
      <RoundedBox
        args={[width * 0.99, 0.1, depth * 0.99]}
        radius={0.04}
        smoothness={2}
        position={[0, 0.03, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={special?.accent ?? '#8a8694'} roughness={0.58} />
      </RoundedBox>

      {/* Mặt ô kem hoặc màu đặc biệt, bo nhẹ như một khối board-game bằng nhựa. */}
      <RoundedBox
        args={[faceWidth, BOARD_3D.TILE_HEIGHT, faceDepth]}
        radius={0.055}
        smoothness={2}
        position={[0, BOARD_3D.TILE_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        userData={{ role: 'tile-surface', tileId: tile.id, tileType: tile.type }}
      >
        <meshPhysicalMaterial
          color={surfaceColor}
          roughness={isProperty ? 0.57 : 0.49}
          clearcoat={isProperty ? 0.2 : 0.34}
          clearcoatRoughness={0.62}
          emissive={hovered ? '#ffffff' : '#000000'}
          emissiveIntensity={hovered ? 0.12 : 0}
        />
        <Edges threshold={15} color={edgeColor} />
      </RoundedBox>

      {/* Ánh chọn trắng-vàng giúp Host nhận ra ngay ô của đội đang tới lượt. */}
      {isActive && (
        <mesh
          position={[0, BOARD_3D.TILE_HEIGHT + 0.008, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[width * 0.9, depth * 0.9]} />
          <meshBasicMaterial color="#fff8bf" transparent opacity={0.2} />
        </mesh>
      )}

      {/* Dải màu vùng miền, nằm ở mép trong (phía tâm bàn cờ) của ô đất */}
      {region && (
        <RoundedBox
          args={[width * 0.88, 0.035, depth * 0.2]}
          radius={0.012}
          smoothness={2}
          position={[0, BOARD_3D.TILE_HEIGHT + 0.012, -depth / 2 + depth * 0.12]}
          castShadow
        >
          <meshStandardMaterial
            color={region.color}
            roughness={0.4}
            emissive={region.color}
            emissiveIntensity={0.045}
          />
        </RoundedBox>
      )}

      {/* Ribbon màu đội: quyền sở hữu rõ mà không nhuộm kín mặt ô. */}
      {owner && (
        <RoundedBox
          args={[width * 0.82, 0.045, 0.13]}
          radius={0.014}
          smoothness={2}
          position={[0, BOARD_3D.TILE_HEIGHT + 0.02, depth / 2 - 0.12]}
          castShadow
        >
          <meshPhysicalMaterial
            color={owner.color}
            emissive={owner.color}
            emissiveIntensity={0.09}
            roughness={0.36}
            clearcoat={0.42}
          />
        </RoundedBox>
      )}

      <group rotation={[0, artworkRotationY, 0]}>
        <TileArtwork
          accentColor={accentColor}
          depth={depth}
          flipText={flipText}
          isCorner={isCorner}
          tile={tile}
          width={width}
        />
      </group>

      {/* Nhãn chi tiết khi Host rê chuột lên ô */}
      {hovered && (
        <Html position={[0, 1.35, 0]} center pointerEvents="none" zIndexRange={[9, 0]}>
          <div
            style={{
              minWidth: isProperty ? 190 : 220,
              maxWidth: 290,
              background: 'linear-gradient(180deg, #ffffff 0%, #f7f1e8 100%)',
              color: '#273451',
              border: `2px solid ${accentColor}`,
              borderRadius: 12,
              padding: '9px 12px',
              fontSize: 13,
              lineHeight: 1.35,
              whiteSpace: isProperty ? 'nowrap' : 'normal',
              textAlign: 'left',
              boxShadow:
                '0 6px 0 rgba(111,108,126,0.25), 0 12px 28px rgba(73,91,120,0.24)',
              fontFamily: '"Segoe UI", system-ui, sans-serif',
              userSelect: 'none',
            }}
          >
            <div style={{ color: '#18233d', fontWeight: 800 }}>
              {tile.id}. {tile.name}
            </div>
            {isProperty && (
              <div style={{ color: '#596782', marginTop: 2 }}>
                {tile.province} · {formatMoney(tile.price)}
              </div>
            )}
            {property && property.level > 0 && (
              <div style={{ color: accentColor, fontWeight: 700, marginTop: 3 }}>
                {owner?.name} — {BUILD_LEVEL_LABEL[property.level]}
              </div>
            )}
            {!isProperty && (
              <div style={{ color: '#596782', marginTop: 4 }}>{tile.description}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
