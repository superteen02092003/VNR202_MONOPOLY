import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'

import type { CharacterAnimation } from '../core'

interface PlaceholderPawnProps {
  color: string
  animation: CharacterAnimation
  dimmed?: boolean
}

/**
 * Quân cờ tạm dùng khi chưa có file .glb trong /public/models.
 *
 * Hoạt ảnh ở đây là thủ tục (procedural) chứ không đọc từ file, nên vẫn đủ ba
 * trạng thái Idle / Jump / Celebrate theo GDD. Cách này cũng hợp với các nhân vật
 * tròn trịa (Kirby, Totoro, Among Us) vốn không auto-rig được bằng Mixamo.
 */
export function PlaceholderPawn({ color, animation, dimmed = false }: PlaceholderPawnProps) {
  const visualRef = useRef<Group>(null)
  const headRef = useRef<Mesh>(null)

  useFrame((state, delta) => {
    const visual = visualRef.current
    if (!visual) return

    const t = state.clock.elapsedTime

    switch (animation) {
      case 'jump': {
        // Kéo dãn theo phương thẳng đứng cho cảm giác bật nhảy.
        visual.scale.set(0.9, 1.15, 0.9)
        visual.rotation.y += delta * 6
        visual.position.y = 0.08
        break
      }
      case 'celebrate': {
        visual.scale.setScalar(1 + Math.sin(t * 14) * 0.12)
        visual.rotation.y += delta * 7
        visual.position.y = 0.08 + Math.abs(Math.sin(t * 7)) * 0.22
        break
      }
      default: {
        // Idle: thở nhẹ và nhún nhẹ tại chỗ.
        const breathe = 1 + Math.sin(t * 2) * 0.035
        visual.scale.set(1, breathe, 1)
        visual.rotation.y += delta * 0.35
        visual.position.y = 0.08 + Math.sin(t * 2) * 0.02
      }
    }

    if (headRef.current) {
      headRef.current.position.y = 0.48 + Math.sin(t * 2 + 0.6) * 0.012
    }
  })

  const opacity = dimmed ? 0.35 : 1

  return (
    <group>
      <group ref={visualRef} position={[0, 0.08, 0]}>
      {/* Thân */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.2, 6, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.45}
          transparent={dimmed}
          opacity={opacity}
        />
      </mesh>

      {/* Đầu */}
      <mesh ref={headRef} position={[0, 0.48, 0]} castShadow>
        <sphereGeometry args={[0.19, 20, 20]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          transparent={dimmed}
          opacity={opacity}
        />
      </mesh>

      {/* Mắt */}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.52, 0.165]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color="#0b1220" />
        </mesh>
      ))}

      {/* Hai tay */}
      {[-0.19, 0.19].map((x) => (
        <mesh key={x} position={[x, 0.24, 0]} castShadow>
          <sphereGeometry args={[0.065, 12, 12]} />
          <meshStandardMaterial
            color={color}
            roughness={0.45}
            transparent={dimmed}
            opacity={opacity}
          />
        </mesh>
      ))}

      </group>

      {/* Bóng đổ giả dưới chân cho quân cờ bám mặt bàn */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>
    </group>
  )
}
