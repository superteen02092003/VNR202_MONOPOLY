import { useEffect, useMemo } from 'react'
import {
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  SRGBColorSpace,
} from 'three'

import { BOARD_3D, formatMoney } from '../core'
import type { Tile } from '../core'

interface TileArtworkProps {
  accentColor: string
  depth: number
  /** Ô quay ngược camera thì vẽ chữ xoay 180° để không bị lộn ngược. */
  flipText: boolean
  isCorner: boolean
  tile: Tile
  width: number
}

/**
 * Nhãn ô cờ được vẽ vào CanvasTexture rồi đặt trực tiếp lên mặt bàn.
 *
 * Khác với drei <Html>, texture này thuộc cùng không gian WebGL với quân cờ:
 * nó giữ nguyên hướng của ô, nhận depth-test và không thể nổi đè lên nhân vật.
 */
export function TileArtwork({
  accentColor,
  depth,
  flipText,
  isCorner,
  tile,
  width,
}: TileArtworkProps) {
  const texture = useMemo(
    () => createTileTexture(tile, accentColor, isCorner, flipText),
    [accentColor, flipText, isCorner, tile],
  )

  useEffect(() => () => texture?.dispose(), [texture])

  if (!texture) return null

  const isProperty = tile.type === 'property'
  const artworkWidth = isProperty ? width * 0.88 : isCorner ? width * 0.75 : width * 0.84
  const artworkDepth = isProperty
    ? depth * 0.44
    : isCorner
      ? depth * 0.58
      : depth * 0.58

  return (
    <mesh
      position={[0, BOARD_3D.TILE_HEIGHT + 0.05, isProperty ? -depth * 0.085 : 0]}
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

function createTileTexture(
  tile: Tile,
  accentColor: string,
  isCorner: boolean,
  flipText: boolean,
) {
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 320
  const context = canvas.getContext('2d')
  if (!context) return null

  context.clearRect(0, 0, canvas.width, canvas.height)
  // Ô quay ngược camera: xoay hệ tọa độ 180° quanh tâm canvas trước khi vẽ,
  // nhờ vậy chữ và icon đọc xuôi mà vị trí nhãn trên mặt ô vẫn giữ nguyên.
  if (flipText) {
    context.translate(canvas.width, canvas.height)
    context.rotate(Math.PI)
  }
  drawCard(context, canvas.width, canvas.height, isCorner)

  if (tile.type === 'property') {
    drawPropertyLabel(context, tile.province, formatMoney(tile.price), accentColor)
  } else {
    drawSpecialLabel(context, tile.type, tile.name, accentColor, isCorner)
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

function drawCard(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  isCorner: boolean,
) {
  const inset = 14
  const radius = isCorner ? 44 : 34

  context.save()
  context.shadowColor = 'rgba(56, 68, 92, 0.25)'
  context.shadowBlur = 18
  context.shadowOffsetY = 12
  roundedRect(context, inset, inset, width - inset * 2, height - inset * 2 - 10, radius)
  context.fillStyle = '#fffdf8'
  context.fill()
  context.restore()

  roundedRect(context, inset, inset, width - inset * 2, height - inset * 2 - 10, radius)
  context.fillStyle = '#fffdf8'
  context.fill()
  context.lineWidth = 10
  context.strokeStyle = 'rgba(255, 255, 255, 0.98)'
  context.stroke()

  roundedRect(context, inset + 7, inset + 7, width - (inset + 7) * 2, height - inset * 2 - 24, radius - 8)
  context.lineWidth = 3
  context.strokeStyle = 'rgba(91, 100, 123, 0.17)'
  context.stroke()
}

function drawPropertyLabel(
  context: CanvasRenderingContext2D,
  province: string,
  price: string,
  accentColor: string,
) {
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  context.fillStyle = '#44506a'
  context.font = '900 52px "Arial Rounded MT Bold", "Segoe UI", sans-serif'
  fitText(context, province.toLocaleUpperCase('vi-VN'), 256, 112, 420, 52)

  context.fillStyle = accentColor
  context.font = '900 66px "Arial Rounded MT Bold", "Segoe UI", sans-serif'
  fitText(context, price, 256, 216, 390, 66)

  context.fillStyle = accentColor
  roundedRect(context, 142, 270, 228, 8, 4)
  context.fill()
}

function drawSpecialLabel(
  context: CanvasRenderingContext2D,
  type: Tile['type'],
  name: string,
  accentColor: string,
  isCorner: boolean,
) {
  drawSpecialIcon(context, type, 256, isCorner ? 112 : 105, isCorner ? 62 : 55, accentColor)

  context.fillStyle = accentColor
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = '900 46px "Arial Rounded MT Bold", "Segoe UI", sans-serif'
  fitText(context, name.toLocaleUpperCase('vi-VN'), 256, isCorner ? 232 : 226, 420, 46)
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
