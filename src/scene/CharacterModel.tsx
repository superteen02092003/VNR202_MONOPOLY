import { useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { Box3, LoopRepeat, Vector3, type Group } from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

import type { Character, CharacterAnimation } from '../core'
import { resolveClipName } from './clips'

interface CharacterModelProps {
  character: Character
  animation: CharacterAnimation
}

/** Chiều cao mục tiêu (đơn vị bàn cờ) để mọi quân cờ 3D cao xấp xỉ bằng nhau. */
const TARGET_HEIGHT = 0.95

/**
 * Nhân vật 3D nạp từ file .glb, chạy hoạt ảnh bằng hook useAnimations của drei.
 *
 * Tên clip trong file mỗi nơi một kiểu nên được dò bằng `resolveClipName`;
 * muốn chỉ định tay thì khai báo `clips` trong src/core/data/characters.ts.
 */
export function CharacterModel({ character, animation }: CharacterModelProps) {
  const groupRef = useRef<Group>(null)
  const { scene, animations } = useGLTF(character.modelUrl)

  // Clone theo bộ xương để nhiều quân cờ dùng chung một file không đè lên nhau.
  // Đồng thời tự chuẩn hoá tỉ lệ: đo hộp bao THẬT (đã gồm mọi phép biến đổi node
  // của Sketchfab) rồi co model về TARGET_HEIGHT. Nhờ vậy không phải đoán scale
  // cho từng file — model to như Doraemon hay cao 76 đơn vị như Masha đều tự vừa.
  const { autoScale, groundOffset, model } = useMemo(() => {
    const clonedModel = cloneSkeleton(scene)
    clonedModel.updateMatrixWorld(true)
    const bounds = new Box3().setFromObject(clonedModel)
    const size = bounds.getSize(new Vector3())
    const height = size.y
    const auto = Number.isFinite(height) && height > 1e-4 ? TARGET_HEIGHT / height : 1
    return {
      model: clonedModel,
      autoScale: auto,
      groundOffset: Number.isFinite(bounds.min.y) ? -bounds.min.y : 0,
    }
  }, [scene])
  const { actions, names } = useAnimations(animations, groupRef)

  useEffect(() => {
    const clipName = resolveClipName(names, animation, character.clips)
    if (!clipName) return

    const action = actions[clipName]
    if (!action) return

    action.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.22).play()
    return () => {
      action.fadeOut(0.22)
    }
  }, [actions, names, animation, character.clips])

  // transform.scale giờ chỉ là hệ số tinh chỉnh (mặc định 1) trên nền scale tự động.
  const scale = autoScale * (character.transform?.scale ?? 1)
  const rotationY = character.transform?.rotationY ?? 0
  const yOffset = character.transform?.yOffset ?? 0

  return (
    <group ref={groupRef}>
      <primitive
        object={model}
        position={[0, yOffset + groundOffset * scale, 0]}
        rotation={[0, rotationY, 0]}
        scale={scale}
      />
    </group>
  )
}
