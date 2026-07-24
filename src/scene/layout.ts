/**
 * Hình học bàn cờ 3D: quy đổi chỉ số ô (0..31) thành tọa độ thế giới.
 *
 * Bàn cờ nằm trên mặt phẳng XZ, trục Y hướng lên. Ô 0 (Xuất phát) ở góc (+X, +Z),
 * các ô chạy theo chiều kim đồng hồ khi nhìn từ trên xuống:
 * cạnh dưới (+Z) → cạnh trái (-X) → cạnh trên (-Z) → cạnh phải (+X).
 *
 * QUY ƯỚC XOAY: `rotationY` được chọn sao cho trục +Z cục bộ của ô
 * luôn chỉ RA NGOÀI bàn cờ. Nhờ vậy mọi thứ cần đẩy ra mép ngoài
 * (công trình, nhãn địa danh) chỉ cần dùng `getOutwardVector`.
 */

import { BOARD_3D, GAME_CONFIG } from '../core/config'

const { CORNER_SIZE, TILE_WIDTH, TILE_DEPTH, TILE_HEIGHT, TILES_PER_SIDE, PAWN_SPREAD } = BOARD_3D

/** Chiều dài một cạnh bàn cờ = 2 ô góc + 7 ô thường. */
export const BOARD_EDGE = CORNER_SIZE * 2 + TILE_WIDTH * TILES_PER_SIDE

/** Khoảng cách từ tâm bàn cờ ra mép ngoài. */
export const BOARD_HALF = BOARD_EDGE / 2

/** Khe nhỏ giúp chân quân cờ và vòng sáng không xuyên vào mặt ô khi bob/nhảy. */
export const PAWN_SURFACE_CLEARANCE = 0.015

// Hai dãy ô cần đặt công trình ở vùng phía trên tên địa danh để không chồng lên giá.
const BUILDING_ABOVE_NAME_TILE_IDS = new Set([
  9, 10, 11, 12, 13, 14, 15,
  17, 18, 19, 20, 21, 22, 23,
])

/** Khoảng hở tối thiểu để bevel của RoundedBox không chạm hoặc vượt quá nửa độ dày. */
const ROUNDED_SLAB_RADIUS_CLEARANCE = 0.001

/**
 * Giới hạn bán kính bo của một slab mỏng.
 *
 * `RoundedBox` bị biến dạng nếu radius bằng hoặc lớn hơn nửa kích thước nhỏ nhất;
 * với các lớp đế bàn, kích thước nhỏ nhất luôn là chiều cao.
 */
export function getRoundedSlabRadius(height: number, requestedRadius: number): number {
  const maximumRadius = Math.max(0, height / 2 - ROUNDED_SLAB_RADIUS_CLEARANCE)
  return Math.min(Math.max(0, requestedRadius), maximumRadius)
}

/** Tâm của ô góc. */
const CORNER_CENTER = BOARD_HALF - CORNER_SIZE / 2

/** Mép trong của ô góc — nơi dãy ô thường bắt đầu. */
const SIDE_START = BOARD_HALF - CORNER_SIZE

export interface TileTransform {
  /** Tọa độ tâm mặt ô. */
  position: [number, number, number]
  /** Góc xoay quanh Y; trục +Z cục bộ chỉ ra ngoài bàn cờ. */
  rotationY: number
  /** Kích thước mặt ô [rộng dọc theo cạnh, sâu hướng vào tâm]. */
  size: [number, number]
  isCorner: boolean
}

/**
 * Bốn ô góc. Góc quay chéo 45° để hướng ra ngoài theo đường chéo:
 * (+X,+Z) → π/4 · (-X,+Z) → -π/4 · (-X,-Z) → -3π/4 · (+X,-Z) → 3π/4
 */
const CORNERS: Record<number, { x: number; z: number; rotationY: number }> = {
  [GAME_CONFIG.TILE_START]: { x: CORNER_CENTER, z: CORNER_CENTER, rotationY: Math.PI / 4 },
  [GAME_CONFIG.TILE_JAIL]: { x: -CORNER_CENTER, z: CORNER_CENTER, rotationY: -Math.PI / 4 },
  [GAME_CONFIG.TILE_FESTIVAL]: {
    x: -CORNER_CENTER,
    z: -CORNER_CENTER,
    rotationY: (-3 * Math.PI) / 4,
  },
  [GAME_CONFIG.TILE_TRAVEL]: { x: CORNER_CENTER, z: -CORNER_CENTER, rotationY: (3 * Math.PI) / 4 },
}

/** Góc xoay của 4 cạnh, chọn sao cho +Z cục bộ chỉ ra ngoài. */
const SIDE_ROTATION = [
  0, //  cạnh dưới, mép ngoài ở +Z
  -Math.PI / 2, // cạnh trái,  mép ngoài ở -X
  Math.PI, //     cạnh trên,  mép ngoài ở -Z
  Math.PI / 2, //  cạnh phải,  mép ngoài ở +X
]

export function normalizeTile(tileId: number): number {
  const size = GAME_CONFIG.BOARD_SIZE
  return ((tileId % size) + size) % size
}

export function isCornerTile(tileId: number): boolean {
  return normalizeTile(tileId) in CORNERS
}

/** Vector đơn vị chỉ ra ngoài bàn cờ, suy từ góc xoay của ô. */
export function getOutwardVector(rotationY: number): [number, number] {
  return [Math.sin(rotationY), Math.cos(rotationY)]
}

/** Vị trí và hướng của một ô cờ. */
export function getTileTransform(tileId: number): TileTransform {
  const id = normalizeTile(tileId)

  const corner = CORNERS[id]
  if (corner) {
    return {
      position: [corner.x, 0, corner.z],
      rotationY: corner.rotationY,
      size: [CORNER_SIZE, CORNER_SIZE],
      isCorner: true,
    }
  }

  // Cạnh nào (0..3) và ô thứ mấy trên cạnh đó (1..7).
  const side = Math.floor(id / 8)
  const indexOnSide = id % 8

  // Trượt dần từ ô góc đầu cạnh về phía ô góc cuối cạnh.
  const offset = SIDE_START - (indexOnSide - 0.5) * TILE_WIDTH

  const position: [number, number, number] =
    side === 0
      ? [offset, 0, CORNER_CENTER] //  cạnh dưới: phải → trái
      : side === 1
        ? [-CORNER_CENTER, 0, offset] // cạnh trái: dưới → trên
        : side === 2
          ? [-offset, 0, -CORNER_CENTER] // cạnh trên: trái → phải
          : [CORNER_CENTER, 0, -offset] // cạnh phải: trên → dưới

  return {
    position,
    rotationY: SIDE_ROTATION[side],
    size: [TILE_WIDTH, TILE_DEPTH],
    isCorner: false,
  }
}

/** Tâm mặt ô, đã cộng độ dày mặt bàn — nơi quân cờ và công trình đứng lên. */
export function getTileSurface(tileId: number): [number, number, number] {
  const { position } = getTileTransform(tileId)
  return [position[0], TILE_HEIGHT + PAWN_SURFACE_CLEARANCE, position[2]]
}

/**
 * Chỗ đứng của một quân cờ trên ô.
 *
 * Nhiều nhóm có thể cùng dừng một ô nên các quân được xếp thành vòng tròn nhỏ
 * quanh tâm ô để không chồng lên nhau.
 */
export function getPawnSlot(
  tileId: number,
  slotIndex: number,
  slotCount: number,
): [number, number, number] {
  const [x, y, z] = getTileSurface(tileId)
  if (slotCount <= 1) return [x, y, z]

  const angle = (slotIndex / slotCount) * Math.PI * 2
  return [x + Math.cos(angle) * PAWN_SPREAD, y, z + Math.sin(angle) * PAWN_SPREAD]
}

/** Công trình đặt lệch vào phía trong của ô để nằm trên vùng đất trống, không đè tên/giá. */
export function getBuildingSlot(tileId: number): {
  position: [number, number, number]
  rotationY: number
} {
  const { position, rotationY, isCorner } = getTileTransform(tileId)
  if (isCorner) {
    return { position: [position[0], TILE_HEIGHT, position[2]], rotationY }
  }

  const [outX, outZ] = getOutwardVector(rotationY)
  const buildingAboveName = BUILDING_ABOVE_NAME_TILE_IDS.has(tileId)
  const distance = TILE_DEPTH * (buildingAboveName ? 0.34 : 0.26)
  const direction = buildingAboveName ? 1 : -1

  return {
    position: [position[0] + outX * distance * direction, TILE_HEIGHT, position[2] + outZ * distance * direction],
    rotationY,
  }
}

/**
 * Đường đi qua từng ô khi nhân vật nhảy `steps` bước.
 * Trả về danh sách ô sẽ chạm chân, KHÔNG gồm ô xuất phát.
 */
export function getHopPath(from: number, steps: number): number[] {
  const path: number[] = []
  for (let i = 1; i <= steps; i++) path.push(normalizeTile(from + i))
  return path
}
