import { useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { Box3, LoopRepeat, type Group } from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

import type { Character, CharacterAnimation } from '../core'
import { resolveClipName } from './clips'

interface CharacterModelProps {
  character: Character
  animation: CharacterAnimation
}

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
  const { groundOffset, model } = useMemo(() => {
    const clonedModel = cloneSkeleton(scene)
    clonedModel.updateMatrixWorld(true)
    const bounds = new Box3().setFromObject(clonedModel)
    return {
      model: clonedModel,
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

  const scale = character.transform?.scale ?? 1
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
