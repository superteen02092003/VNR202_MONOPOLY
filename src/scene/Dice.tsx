import { useEffect, useRef } from 'react'
import { useBox, usePlane } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3, type Mesh } from 'three'

import { BOARD_3D } from '../core'
import { useGameStore } from '../store/useGameStore'

const DIE_SIZE = 0.42
const HALF = DIE_SIZE / 2
const TRAY_Y = BOARD_3D.TILE_HEIGHT
/**
 * Đẩy khu xúc xắc về nửa dưới sân (phía camera). Logo "BUSINESS VOYAGE" nằm ở
 * nửa trên tâm bàn cờ nên nếu xúc xắc rơi ngay giữa sẽ bị thẻ logo che mất.
 */
const DICE_Z = 1.35
const REST_SPEED = 0.12
/** Quá thời gian này mà xúc xắc chưa nằm yên thì chốt kết quả luôn. */
const SETTLE_TIMEOUT_MS = 4200

/**
 * Mặt nào mang số nào.
 * Thứ tự trục theo BoxGeometry: +X, -X, +Y, -Y, +Z, -Z — hai mặt đối nhau cộng lại bằng 7.
 */
const FACE_AXES: { value: number; axis: [number, number, number] }[] = [
  { value: 1, axis: [1, 0, 0] },
  { value: 6, axis: [-1, 0, 0] },
  { value: 2, axis: [0, 1, 0] },
  { value: 5, axis: [0, -1, 0] },
  { value: 3, axis: [0, 0, 1] },
  { value: 4, axis: [0, 0, -1] },
]

/** Góc xoay để mặt mang giá trị `value` ngửa lên trên. */
function quaternionForValue(value: number): Quaternion {
  const q = new Quaternion()
  switch (value) {
    case 1:
      return q.setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2)
    case 6:
      return q.setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2)
    case 2:
      return q
    case 5:
      return q.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI)
    case 3:
      return q.setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2)
    default:
      return q.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
  }
}

/* ------------------------------------------------------------------ */
/* Khay hứng xúc xắc                                                   */
/* ------------------------------------------------------------------ */

/** Mặt sàn và 4 vách vô hình ở giữa bàn cờ để xúc xắc không văng ra ngoài. */
function DiceTray() {
  usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, TRAY_Y, 0] }))

  const walls: { position: [number, number, number]; rotation: [number, number, number] }[] = [
    { position: [0, TRAY_Y, -2.6], rotation: [0, 0, 0] },
    { position: [0, TRAY_Y, 2.6], rotation: [0, Math.PI, 0] },
    { position: [-2.6, TRAY_Y, 0], rotation: [0, Math.PI / 2, 0] },
    { position: [2.6, TRAY_Y, 0], rotation: [0, -Math.PI / 2, 0] },
  ]

  return (
    <>
      {walls.map((wall, index) => (
        <Wall key={index} {...wall} />
      ))}
    </>
  )
}

function Wall(props: { position: [number, number, number]; rotation: [number, number, number] }) {
  usePlane(() => ({ ...props }))
  return null
}

/* ------------------------------------------------------------------ */
/* Một viên xúc xắc                                                    */
/* ------------------------------------------------------------------ */

interface DieProps {
  index: number
  onRest: (index: number) => void
  registerThrow: (index: number, fn: () => void) => void
  registerAlign: (index: number, fn: (value: number) => void) => void
}

function Die({ index, onRest, registerThrow, registerAlign }: DieProps) {
  const startX = index === 0 ? -0.6 : 0.6

  const [ref, api] = useBox<Mesh>(() => ({
    mass: 1,
    args: [DIE_SIZE, DIE_SIZE, DIE_SIZE],
    position: [startX, TRAY_Y + 0.3, DICE_Z],
    angularDamping: 0.22,
    linearDamping: 0.06,
    material: { friction: 0.35, restitution: 0.32 },
  }))

  const speed = useRef(0)
  const spin = useRef(0)
  const moving = useRef(false)
  const restNotified = useRef(true)

  useEffect(() => {
    const unsubVelocity = api.velocity.subscribe((v) => {
      speed.current = Math.hypot(v[0], v[1], v[2])
    })
    const unsubSpin = api.angularVelocity.subscribe((v) => {
      spin.current = Math.hypot(v[0], v[1], v[2])
    })
    return () => {
      unsubVelocity()
      unsubSpin()
    }
  }, [api])

  useEffect(() => {
    registerThrow(index, () => {
      restNotified.current = false
      moving.current = true

      api.wakeUp()
      api.position.set(startX, TRAY_Y + 3.1, DICE_Z + (Math.random() - 0.5) * 0.7)
      api.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6)
      api.velocity.set((Math.random() - 0.5) * 3.4, -5.5, (Math.random() - 0.5) * 3.4)
      api.angularVelocity.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 22,
      )
    })

    registerAlign(index, (value: number) => {
      // Chốt mặt ngửa đúng bằng kết quả lõi game đã quyết định,
      // rồi cho viên xúc xắc ngủ để nó nằm yên tại chỗ.
      const target = quaternionForValue(value)
      api.velocity.set(0, 0, 0)
      api.angularVelocity.set(0, 0, 0)
      api.quaternion.set(target.x, target.y, target.z, target.w)
      api.position.set(startX, TRAY_Y + HALF, DICE_Z + (index === 0 ? -0.25 : 0.25))
      api.sleep()
    })
  }, [api, index, registerAlign, registerThrow, startX])

  useFrame(() => {
    if (!moving.current || restNotified.current) return
    if (speed.current < REST_SPEED && spin.current < REST_SPEED) {
      restNotified.current = true
      moving.current = false
      onRest(index)
    }
  })

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} />
      <meshStandardMaterial color="#fefefe" roughness={0.32} />
      <DiePips />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Chấm trên 6 mặt                                                     */
/* ------------------------------------------------------------------ */

const PIP = 0.082

const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-PIP, PIP],
    [PIP, -PIP],
  ],
  3: [
    [-PIP, PIP],
    [0, 0],
    [PIP, -PIP],
  ],
  4: [
    [-PIP, PIP],
    [PIP, PIP],
    [-PIP, -PIP],
    [PIP, -PIP],
  ],
  5: [
    [-PIP, PIP],
    [PIP, PIP],
    [0, 0],
    [-PIP, -PIP],
    [PIP, -PIP],
  ],
  6: [
    [-PIP, PIP],
    [PIP, PIP],
    [-PIP, 0],
    [PIP, 0],
    [-PIP, -PIP],
    [PIP, -PIP],
  ],
}

/** Xoay mặt phẳng pháp tuyến +Z về đúng từng mặt của khối lập phương. */
const FACE_ROTATION: Record<number, [number, number, number]> = {
  1: [0, Math.PI / 2, 0],
  6: [0, -Math.PI / 2, 0],
  2: [-Math.PI / 2, 0, 0],
  5: [Math.PI / 2, 0, 0],
  3: [0, 0, 0],
  4: [0, Math.PI, 0],
}

function DiePips() {
  return (
    <>
      {FACE_AXES.map(({ value }) => (
        <group key={value} rotation={FACE_ROTATION[value]}>
          {PIP_LAYOUT[value].map(([x, y], i) => (
            <mesh key={i} position={[x, y, HALF + 0.004]}>
              <circleGeometry args={[0.036, 14]} />
              <meshStandardMaterial color="#0b1220" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Điều phối cú đổ                                                     */
/* ------------------------------------------------------------------ */

/**
 * Hai viên xúc xắc vật lý.
 *
 * Lõi game vẫn là bên quyết định kết quả (để thẻ "Chỉ Đạo Chiến Lược" ép được
 * tổng điểm); phần vật lý lo phần kịch tính, và khi hai viên nằm yên thì được
 * xoay đúng về mặt mà lõi đã chọn — số hiện trên bàn luôn khớp số dùng để đi.
 */
export function Dice() {
  const dice = useGameStore((s) => s.dice)
  const phase = useGameStore((s) => s.phase)

  const throwFns = useRef<Record<number, () => void>>({})
  const alignFns = useRef<Record<number, (value: number) => void>>({})
  const rested = useRef<Set<number>>(new Set())
  const activeRoll = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const registerThrow = (index: number, fn: () => void) => {
    throwFns.current[index] = fn
  }
  const registerAlign = (index: number, fn: (value: number) => void) => {
    alignFns.current[index] = fn
  }

  const clearPendingTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  const finishRoll = () => {
    // Dọn cờ trước tiên: Host có thể đã bấm "Bỏ qua hoạt ảnh" khiến ván
    // rời khỏi bước đổ xúc xắc, nhưng cú đổ SAU vẫn phải tung được.
    clearPendingTimeout()
    activeRoll.current = null

    const current = useGameStore.getState()
    if (!current.dice || current.phase !== 'rolling') return

    alignFns.current[0]?.(current.dice[0])
    alignFns.current[1]?.(current.dice[1])

    // Chờ một nhịp cho người xem kịp đọc số rồi mới cho quân cờ chạy.
    setTimeout(() => useGameStore.getState().markMoving(), 620)
  }

  const handleRest = (index: number) => {
    rested.current.add(index)
    if (rested.current.size >= 2) finishRoll()
  }

  // Mỗi lần lõi game chốt một cú đổ mới thì tung hai viên xúc xắc.
  useEffect(() => {
    if (phase !== 'rolling' || !dice) {
      // Rời khỏi bước đổ xúc xắc: trả mọi cờ về mặc định để lượt sau đổ lại được.
      clearPendingTimeout()
      activeRoll.current = null
      rested.current.clear()
      return
    }

    if (activeRoll.current) return
    activeRoll.current = `${dice[0]}-${dice[1]}`

    rested.current.clear()
    throwFns.current[0]?.()
    throwFns.current[1]?.()

    // Lưới an toàn: xúc xắc kẹt ở đâu đó thì vẫn chốt kết quả đúng hạn.
    timeoutRef.current = setTimeout(finishRoll, SETTLE_TIMEOUT_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, dice])

  return (
    <>
      <DiceTray />
      <Die index={0} onRest={handleRest} registerThrow={registerThrow} registerAlign={registerAlign} />
      <Die index={1} onRest={handleRest} registerThrow={registerThrow} registerAlign={registerAlign} />
    </>
  )
}
