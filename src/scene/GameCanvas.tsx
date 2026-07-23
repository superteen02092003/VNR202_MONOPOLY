import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace } from 'three'

import { Board } from './Board'
import { Dice } from './Dice'
import { BOARD_EDGE } from './layout'

/**
 * Sân khấu 3D của ván đấu.
 *
 * Camera trực giao (orthographic) đặt chéo 45° cho góc nhìn isometric quen thuộc
 * của thể loại board game; Host vẫn xoay/zoom được bằng chuột khi cần soi kỹ một ô.
 */
export function GameCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      // preserveDrawingBuffer cho phép chụp lại bàn cờ (ảnh kỷ niệm cuối ván,
      // và tiện kiểm tra hình ảnh khi phát triển).
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = SRGBColorSpace
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.shadowMap.type = PCFShadowMap
      }}
      style={{ background: 'transparent' }}
    >
      <fog attach="fog" args={['#cbeaf3', 27, 46]} />

      {/* Góc 45° quanh trục Y, nâng cao để nhìn bao quát cả bàn cờ */}
      <OrthographicCamera makeDefault position={[16, 16.5, 16]} zoom={39} near={-100} far={200} />
      <OrbitControls
        target={[0, 0, 0]}
        enablePan={false}
        enableRotate={false}
        minZoom={22}
        maxZoom={110}
        maxPolarAngle={Math.PI / 2.35}
        minPolarAngle={Math.PI / 8}
      />

      <Lighting />

      <Suspense fallback={null}>
        <Physics gravity={[0, -19.6, 0]} allowSleep>
          <Board />
          <Dice />
        </Physics>
      </Suspense>
    </Canvas>
  )
}

function Lighting() {
  const reach = BOARD_EDGE

  return (
    <>
      <ambientLight intensity={0.72} />
      <hemisphereLight args={['#fffdf7', '#82b8c9', 0.95]} />

      {/* Ánh nắng ấm làm nổi khối đồ chơi và giữ mặt ô màu kem không bị xám. */}
      <directionalLight
        position={[10, 18, 9]}
        intensity={2.25}
        color="#fff4dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-reach}
        shadow-camera-right={reach}
        shadow-camera-top={reach}
        shadow-camera-bottom={-reach}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-bias={-0.00045}
        shadow-normalBias={0.025}
      />

      {/* Fill cyan và rim tím nhẹ giữ đúng chất Business Tour mà không biến scene thành sci-fi. */}
      <directionalLight position={[-10, 9, -8]} intensity={0.68} color="#a6dcf4" />
      <pointLight position={[-7, 5, 8]} intensity={1.5} distance={22} decay={2} color="#44c7ed" />
      <pointLight position={[7, 5, -8]} intensity={1.15} distance={20} decay={2} color="#d49ae8" />
    </>
  )
}
