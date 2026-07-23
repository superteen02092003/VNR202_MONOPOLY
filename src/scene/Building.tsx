import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { Group } from 'three'
import { useFrame } from '@react-three/fiber'

import { GAME_CONFIG } from '../core'
import type { BuildLevel } from '../core'
import { useGameStore } from '../store/useGameStore'
import { getBuildingSlot } from './layout'

interface BuildingProps {
  tileId: number
}

/**
 * Công trình 3D trên một ô đất, dựng theo 4 cấp của GDD.
 * Mỗi lần lên cấp, công trình "rớt" từ trên xuống bằng anime.js.
 */
export function Building({ tileId }: BuildingProps) {
  const level = useGameStore((s) => s.properties[tileId]?.level ?? 0)
  const ownerColor = useGameStore((s) => {
    const ownerId = s.properties[tileId]?.ownerId
    return ownerId ? s.players.find((p) => p.id === ownerId)?.color : undefined
  })
  const hasFestival = useGameStore((s) => {
    const left = s.properties[tileId]?.festivalTurnsLeft
    return left === null || (left ?? 0) > 0
  })

  const groupRef = useRef<Group>(null)
  const previousLevel = useRef(level)

  const { position, rotationY } = getBuildingSlot(tileId)

  // Hoạt ảnh "nhà rớt xuống" mỗi khi công trình được xây hoặc nâng cấp.
  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    const grew = level > previousLevel.current
    previousLevel.current = level
    if (!grew || level === 0) return

    group.position.y = 3.2
    group.scale.setScalar(0.6)

    animate(group.position, { y: 0, duration: 620, ease: 'outBounce' })
    animate(group.scale, { x: 1, y: 1, z: 1, duration: 420, ease: 'outBack' })
  }, [level])

  if (level === 0) return null

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group ref={groupRef}>
        <Structure level={level} color={ownerColor ?? '#94a3b8'} />
        {hasFestival && <FestivalBanner />}
      </group>
    </group>
  )
}

function Structure({ level, color }: { level: BuildLevel; color: string }) {
  switch (level) {
    /* Cấp 1 — Đất trống: mới cắm mốc, chưa xây gì */
    case 1:
      return (
        <group>
          <mesh position={[0, 0.025, 0]} receiveShadow>
            <cylinderGeometry args={[0.31, 0.35, 0.05, 10]} />
            <meshStandardMaterial color="#d6d0c5" roughness={0.82} />
          </mesh>
          <mesh position={[-0.05, 0.16, 0]} castShadow>
            <boxGeometry args={[0.42, 0.26, 0.36]} />
            <meshStandardMaterial color="#fff7e8" roughness={0.64} />
          </mesh>
          <mesh position={[-0.05, 0.37, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[0.34, 0.18, 4]} />
            <meshStandardMaterial color={color} roughness={0.48} />
          </mesh>
          <mesh position={[-0.05, 0.17, 0.185]}>
            <boxGeometry args={[0.17, 0.12, 0.014]} />
            <meshStandardMaterial color="#5cc3e7" emissive="#5cc3e7" emissiveIntensity={0.16} />
          </mesh>
          <mesh position={[0.27, 0.23, 0.02]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.42, 7]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0.34, 0.38, 0.02]} castShadow>
            <boxGeometry args={[0.14, 0.1, 0.014]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )

    /* Cấp 2 — Trạm dừng chân: nhà nhỏ mái dốc */
    case 2:
      return (
        <group>
          <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.5, 0.32, 0.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.42, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.42, 0.26, 4]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        </group>
      )

    /* Cấp 3 — Khách sạn / Khu nghỉ dưỡng: cao tầng */
    case 3:
      return (
        <group>
          <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.56, 0.56, 0.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[0.44, 0.16, 0.4]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {/* Dãy cửa sổ */}
          {[0.16, 0.34, 0.5].map((y) => (
            <mesh key={y} position={[0, y, 0.26]}>
              <boxGeometry args={[0.44, 0.07, 0.01]} />
              <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.4} />
            </mesh>
          ))}
        </group>
      )

    /* Cấp 4 — Biểu tượng Địa phương: đài tưởng niệm dát vàng, bất khả xâm phạm */
    default:
      return <Landmark color={color} />
  }
}

function Landmark({ color }: { color: string }) {
  const starRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (starRef.current) starRef.current.rotation.y += delta * 1.2
  })

  return (
    <group>
      {/* Bệ đá */}
      <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.42, 0.14, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      {/* Thân tháp */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 0.62, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.75} roughness={0.25} />
      </mesh>
      {/* Vành màu đội */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 8]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Ngôi sao vàng xoay */}
      <group ref={starRef} position={[0, 0.95, 0]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial
            color="#ffcd00"
            emissive="#ffcd00"
            emissiveIntensity={0.85}
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>
      </group>
      <pointLight position={[0, 1, 0]} intensity={1.4} distance={2.4} color="#ffcd00" />
    </group>
  )
}

/** Cờ đuôi nheo báo hiệu ô đang đăng cai Festival (tiền lưu trú x2). */
function FestivalBanner() {
  const ref = useRef<Group>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.35
    }
  })

  return (
    <group ref={ref} position={[0.3, 0.75, 0.3]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.34, 6]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0.1, 0.12, 0]} castShadow>
        <boxGeometry args={[0.18, 0.11, 0.008]} />
        <meshStandardMaterial
          color="#f472b6"
          emissive="#f472b6"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  )
}

/** Cấp tối đa, dùng lại từ config để tránh lệch khi đổi luật. */
export const MAX_LEVEL = GAME_CONFIG.MAX_BUILD_LEVEL
