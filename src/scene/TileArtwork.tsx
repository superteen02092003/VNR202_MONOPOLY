import { useEffect, useMemo } from 'react'
import {
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  SRGBColorSpace,
} from 'three'

import { BOARD_3D, formatPropertyPrice } from '../core'
import type { Tile } from '../core'

interface TileArtworkProps {
  accentColor: string
  depth: number
  isCorner: boolean
  tile: Tile
  width: number
}

/**
 * Canvas ô ĐỊA DANH: dạng ĐỨNG, tỉ lệ khớp mặt ô (rộng 1.5 : sâu 2.4) để nhãn
 * lấp gần kín ô. Nhờ vậy tên + giá được vẽ thật to. Ô ở cạnh trái/phải sẽ được
 * `Tile.tsx` xoay theo ô nên chữ chạy dọc theo cạnh như bàn Business Tour.
 */
const PROP_W = 440
const PROP_H = 700
const PROP_ASPECT = PROP_W / PROP_H

/** Canvas ô ĐẶC BIỆT / GÓC: vuông, chữ luôn thẳng đứng. */
const SPECIAL_SIZE = 512

const LABEL_FONT = '"Arial Rounded MT Bold", "Segoe UI", system-ui, sans-serif'

// Hai dãy phía trên bàn cờ cần giữ giá ở phần dưới của thẻ khi nhìn vào layout tổng thể.
const PRICE_BELOW_TILE_IDS = new Set([
  9, 10, 11, 12, 13, 14, 15,
  17, 18, 19, 20, 21, 22, 23,
])

/**
 * Nhãn ô cờ được vẽ vào CanvasTexture rồi đặt trực tiếp lên mặt bàn.
 *
 * Khác với drei <Html>, texture này thuộc cùng không gian WebGL với quân cờ:
 * nó giữ nguyên hướng của ô, nhận depth-test và không thể nổi đè lên nhân vật.
 */
export function TileArtwork({
  accentColor,
  isCorner,
  tile,
  width,
}: TileArtworkProps) {
  const texture = useMemo(
    () => createTileTexture(tile, accentColor, isCorner),
    [accentColor, isCorner, tile],
  )

  useEffect(() => () => texture?.dispose(), [texture])

  if (!texture) return null

  const isProperty = tile.type === 'property'
  // Ô địa danh: nhãn lấp gần kín ô (rộng theo cạnh, sâu theo tỉ lệ canvas đứng).
  // Ô đặc biệt/góc: nhãn vuông, căn giữa.
  const aspect = isProperty ? PROP_ASPECT : 1
  const artworkWidth = isProperty ? width * 0.95 : isCorner ? width * 0.8 : width * 0.95
  const artworkDepth = artworkWidth / aspect

  return (
    <mesh
      position={[0, BOARD_3D.TILE_HEIGHT + 0.05, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={2}
      userData={{ role: 'tile-artwork', tileId: tile.id }}
    >
      <planeGeometry args={[artworkWidth, artworkDepth]} />
      <meshBasicMaterial
        alphaTest={0.025}
        depthTest
        depthWrite
        map={texture}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
        side={DoubleSide}
        toneMapped={false}
        transparent
      />
    </mesh>
  )
}

function createTileTexture(tile: Tile, accentColor: string, isCorner: boolean) {
  if (typeof document === 'undefined') return null

  const isProperty = tile.type === 'property'
  const w = isProperty ? PROP_W : SPECIAL_SIZE
  const h = isProperty ? PROP_H : SPECIAL_SIZE

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const context = canvas.getContext('2d')
  if (!context) return null

  context.clearRect(0, 0, w, h)
  drawCard(context, w, h, isCorner)

  if (tile.type === 'property') {
    // Cạnh TRÁI (1) và TRÊN (2) có nhãn bị lật so với hướng canvas → vẽ nội dung
    // từ đáy canvas lên để GIÁ (dải màu) vẫn nằm ở mép trong (phía sân) mọi cạnh.
    const side = Math.floor(tile.id / 8)
    const flip = side === 1 || side === 2
    drawPropertyLabel(
      context,
      w,
      h,
      tile.province,
      formatTilePrice(tile.price),
      accentColor,
      flip,
      PRICE_BELOW_TILE_IDS.has(tile.id),
    )
  } else {
    drawSpecialLabel(context, w, tile.type, tile.name, accentColor, isCorner)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  texture.generateMipmaps = false
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

/** "140" → "140K" theo phong cách bảng Business Tour, dễ đọc từ xa. */
function formatTilePrice(price: number): string {
  return formatPropertyPrice(price)
}

const CARD_INSET = 16

function drawCard(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  isCorner: boolean,
) {
  const radius = isCorner ? 46 : 36
  const cardHeight = height - CARD_INSET * 2

  context.save()
  context.shadowColor = 'rgba(56, 68, 92, 0.20)'
  context.shadowBlur = 18
  context.shadowOffsetY = 10
  roundedRect(context, CARD_INSET, CARD_INSET, width - CARD_INSET * 2, cardHeight, radius)
  context.fillStyle = '#fffdf8'
  context.fill()
  context.restore()

  roundedRect(context, CARD_INSET, CARD_INSET, width - CARD_INSET * 2, cardHeight, radius)
  context.fillStyle = '#fffdf8'
  context.fill()
  context.lineWidth = 9
  context.strokeStyle = 'rgba(255, 255, 255, 0.98)'
  context.stroke()
  context.lineWidth = 3
  context.strokeStyle = 'rgba(91, 100, 123, 0.14)'
  context.stroke()
}

/**
 * Nhãn ô đất trên canvas ĐỨNG: vùng trống cho công trình ở phía trong,
 * tên địa danh ở giữa và giá lớn ở mép ngoài. `flip` = true thì đảo đầu (cho cạnh trên).
 */
/**
 * Bố cục thẻ ô đất (tính từ phía trong bàn cờ ra mép ngoài):
 *  1. Phần phía trong để trống cho công trình 3D.
 *  2. TÊN địa danh (to, đậm) ở giữa.
 *  3. Dải màu vùng miền mang GIÁ ở mép ngoài.
 * `flip` = true thì vẽ ngược từ đáy canvas lên (cho cạnh trái & cạnh trên đã xoay).
 */
function drawPropertyLabel(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  province: string,
  price: string,
  accentColor: string,
  flip: boolean,
  priceBelow: boolean,
) {
  const radius = 36
  const cardWidth = width - CARD_INSET * 2
  const cardHeight = height - CARD_INSET * 2

  context.textAlign = 'center'
  context.textBaseline = 'middle'

  // Đổi khoảng cách d (tính từ mép trong) sang toạ độ y trên canvas.
  const yAt = (d: number) => (flip ? height - CARD_INSET - d : CARD_INSET + d)

  const nameLines = splitLabel(context, province.toLocaleUpperCase('vi-VN'), cardWidth - 36, 60)
  const twoLines = nameLines.length > 1

  // (1) Dải màu vùng miền ở mép ngoài, mang GIÁ tiền.
  const stripDepth = 126
  const canvasPriceStart = priceBelow || !flip ? cardHeight - stripDepth : 0
  const stripStart = flip
    ? cardHeight - canvasPriceStart - stripDepth
    : canvasPriceStart
  const stripTop = Math.min(yAt(stripStart), yAt(stripStart + stripDepth))
  context.save()
  roundedRect(context, CARD_INSET, CARD_INSET, cardWidth, cardHeight, radius)
  context.clip()
  context.fillStyle = accentColor
  context.fillRect(CARD_INSET, stripTop, cardWidth, stripDepth)
  context.restore()

  context.fillStyle = '#ffffff'
  context.font = `900 96px ${LABEL_FONT}`
  fitText(context, price, width / 2, yAt(stripStart + stripDepth / 2), cardWidth - 32, 96)

  // (2) TÊN địa danh — to, đậm, nằm giữa vùng trống và dải giá.
  context.fillStyle = '#1f2b45'
  const nameFont = twoLines ? 84 : 106
  const lineGap = nameFont + 12
  const nameCenter = 366
  const orderedNameLines = flip ? [...nameLines].reverse() : nameLines
  orderedNameLines.forEach((line, index) => {
    const d = nameCenter + (index - (nameLines.length - 1) / 2) * lineGap
    context.font = `900 ${nameFont}px ${LABEL_FONT}`
    fitText(context, line, width / 2, yAt(d), cardWidth - 30, nameFont)
  })

  // (3) Nửa ngoài để trống — dành cho công trình 3D.
}

function drawSpecialLabel(
  context: CanvasRenderingContext2D,
  width: number,
  type: Tile['type'],
  name: string,
  accentColor: string,
  isCorner: boolean,
) {
  const iconY = isCorner ? 196 : 186
  const iconSize = isCorner ? 116 : 104
  drawSpecialIcon(context, type, width / 2, iconY, iconSize, accentColor)

  context.fillStyle = accentColor
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const nameLines = splitLabel(context, name.toLocaleUpperCase('vi-VN'), width - 84, 66)
  const nameFont = nameLines.length > 1 ? 60 : 72
  const lineGap = nameFont + 12
  const baseY = isCorner ? 372 : 366
  nameLines.forEach((line, index) => {
    const cy = baseY + (index - (nameLines.length - 1) / 2) * lineGap
    context.font = `900 ${nameFont}px ${LABEL_FONT}`
    fitText(context, line, width / 2, cy, width - 72, nameFont)
  })
}

function drawSpecialIcon(
  context: CanvasRenderingContext2D,
  type: Tile['type'],
  x: number,
  y: number,
  size: number,
  color: string,
) {
  context.save()
  context.translate(x, y)
  context.scale(size / 100, size / 100)
  context.strokeStyle = color
  context.fillStyle = color
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = 9

  switch (type) {
    case 'start':
      context.beginPath()
      context.moveTo(-34, 39)
      context.lineTo(-34, -40)
      context.moveTo(-30, -34)
      context.lineTo(34, -34)
      context.lineTo(19, -8)
      context.lineTo(34, 18)
      context.lineTo(-30, 18)
      context.stroke()
      break
    case 'jail':
      roundedRect(context, -41, -18, 82, 58, 10)
      context.stroke()
      context.beginPath()
      context.moveTo(-25, -18)
      context.lineTo(-25, -35)
      context.quadraticCurveTo(-25, -50, -10, -50)
      context.lineTo(10, -50)
      context.quadraticCurveTo(25, -50, 25, -35)
      context.lineTo(25, -18)
      context.moveTo(0, 4)
      context.lineTo(0, 21)
      context.stroke()
      break
    case 'festival':
      drawSpark(context, -18, -6, 34)
      drawSpark(context, 25, -27, 21)
      drawSpark(context, 29, 25, 16)
      break
    case 'travel':
      context.beginPath()
      context.moveTo(-48, 4)
      context.lineTo(-4, 16)
      context.lineTo(-1, 44)
      context.lineTo(11, 48)
      context.lineTo(24, 20)
      context.lineTo(50, 27)
      context.lineTo(58, 18)
      context.lineTo(26, -2)
      context.lineTo(57, -23)
      context.lineTo(48, -32)
      context.lineTo(10, -13)
      context.lineTo(-4, -42)
      context.lineTo(-16, -38)
      context.lineTo(-14, -9)
      context.lineTo(-48, -4)
      context.closePath()
      context.stroke()
      break
    case 'chance':
      roundedRect(context, -45, -36, 63, 76, 9)
      context.stroke()
      roundedRect(context, -18, -23, 63, 76, 9)
      context.stroke()
      drawSpark(context, 14, 8, 22)
      break
    case 'tax':
      roundedRect(context, -43, -42, 86, 84, 12)
      context.stroke()
      context.beginPath()
      context.moveTo(-25, -18)
      context.lineTo(25, -18)
      context.moveTo(-25, 1)
      context.lineTo(15, 1)
      context.moveTo(-25, 20)
      context.lineTo(5, 20)
      context.stroke()
      break
    default:
      drawSpark(context, 0, 0, 40)
  }

  context.restore()
}

function drawSpark(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.beginPath()
  context.moveTo(x, y - radius)
  context.quadraticCurveTo(x + radius * 0.16, y - radius * 0.16, x + radius, y)
  context.quadraticCurveTo(x + radius * 0.16, y + radius * 0.16, x, y + radius)
  context.quadraticCurveTo(x - radius * 0.16, y + radius * 0.16, x - radius, y)
  context.quadraticCurveTo(x - radius * 0.16, y - radius * 0.16, x, y - radius)
  context.stroke()
}

/**
 * Chia nhãn thành 1 hoặc 2 dòng cân đối.
 * Nếu vừa một dòng ở cỡ chữ gốc thì giữ nguyên; nếu không và có nhiều từ,
 * tách hai dòng sao cho dòng dài nhất hẹp nhất có thể (ưu tiên đọc rõ).
 */
function splitLabel(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  baseFont: number,
): string[] {
  context.font = `900 ${baseFont}px ${LABEL_FONT}`
  if (context.measureText(text).width <= maxWidth) return [text]

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length < 2) return [text]

  let best: [string, string] | null = null
  let bestScore = Infinity
  for (let i = 1; i < words.length; i += 1) {
    const first = words.slice(0, i).join(' ')
    const second = words.slice(i).join(' ')
    const score = Math.max(context.measureText(first).width, context.measureText(second).width)
    if (score < bestScore) {
      bestScore = score
      best = [first, second]
    }
  }
  return best ?? [text]
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  initialSize: number,
) {
  let fontSize = initialSize
  while (fontSize > 26 && context.measureText(text).width > maxWidth) {
    fontSize -= 2
    context.font = context.font.replace(/\d+px/, `${fontSize}px`)
  }
  context.fillText(text, x, y)
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}
