import type { GameEvent } from './types'

export type SoundName =
  | 'bankrupt'
  | 'build'
  | 'card-draw'
  | 'card-use'
  | 'cash'
  | 'click'
  | 'correct'
  | 'demolish'
  | 'dice-land'
  | 'dice-roll'
  | 'escape-jail'
  | 'fanfare'
  | 'festival'
  | 'hop'
  | 'jail'
  | 'landmark-built'
  | 'pass-start'
  | 'rent-pay'
  | 'shield-activate'
  | 'takeover'
  | 'teleport'
  | 'tick-warning'
  | 'upgrade'
  | 'wrong'

const SOUND_FILES: Record<SoundName, string> = {
  bankrupt: 'sounds/bankrupt.mp3',
  build: 'sounds/build.mp3',
  'card-draw': 'sounds/card-draw.mp3',
  'card-use': 'sounds/card-use.mp3',
  cash: 'sounds/cash.mp3',
  click: 'sounds/click.mp3',
  correct: 'sounds/correct.mp3',
  demolish: 'sounds/demolish.mp3',
  'dice-land': 'sounds/dice-land.mp3',
  'dice-roll': 'sounds/dice-roll.mp3',
  'escape-jail': 'sounds/escape-jail.mp3',
  fanfare: 'sounds/fanfare.mp3',
  festival: 'sounds/festival.mp3',
  hop: 'sounds/hop.mp3',
  jail: 'sounds/jail.mp3',
  'landmark-built': 'sounds/landmark-built.mp3',
  'pass-start': 'sounds/pass-start.mp3',
  'rent-pay': 'sounds/rent-pay.mp3',
  'shield-activate': 'sounds/shield-activate.mp3',
  takeover: 'sounds/takeover.mp3',
  teleport: 'sounds/teleport.mp3',
  'tick-warning': 'sounds/tick-warning.mp3',
  upgrade: 'sounds/upgrade.mp3',
  wrong: 'sounds/wrong.mp3',
}

class SoundManager {
  private muted: boolean = false
  private volume: number = 0.7
  private cache: Map<SoundName, HTMLAudioElement[]> = new Map()
  private isUnlocked: boolean = false
  private bgmAudio: HTMLAudioElement | null = null
  private bgmVolume: number = 0.35

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('vnr202_sound_muted')
      if (savedMute !== null) {
        this.muted = savedMute === 'true'
      }

      // Unlock Audio Context & BGM khi người dùng tương tác lần đầu
      const unlock = () => {
        if (!this.isUnlocked) {
          this.isUnlocked = true
          try {
            const silentAudio = new Audio(
              'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
            )
            silentAudio.volume = 0.01
            silentAudio.play().catch(() => {})
          } catch {
            // Bỏ qua lỗi
          }
        }
        this.playBgm()
        window.removeEventListener('pointerdown', unlock)
        window.removeEventListener('keydown', unlock)
      }
      window.addEventListener('pointerdown', unlock, { capture: true })
      window.addEventListener('keydown', unlock, { capture: true })

      // Thử phát BGM ngay lập tức (nếu trình duyệt cho phép)
      this.playBgm()
    }
  }

  public isMuted(): boolean {
    return this.muted
  }

  public setMuted(muted: boolean): void {
    this.muted = muted
    if (typeof window !== 'undefined') {
      localStorage.setItem('vnr202_sound_muted', String(muted))
    }
    if (muted) {
      this.pauseBgm()
    } else {
      this.playBgm()
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted)
    return this.muted
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
  }

  public getVolume(): number {
    return this.volume
  }

  public setBgmVolume(vol: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, vol))
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume
    }
  }

  public getBgmVolume(): number {
    return this.bgmVolume
  }

  public playBgm(): void {
    if (this.muted || typeof window === 'undefined') return

    if (!this.bgmAudio) {
      const rawBase = import.meta.env.BASE_URL || '/'
      const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
      this.bgmAudio = new Audio(`${base}sounds/02.%20Smooth.mp3`)
      this.bgmAudio.loop = true
      this.bgmAudio.volume = this.bgmVolume
    }

    if (this.bgmAudio.paused) {
      const promise = this.bgmAudio.play()
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('[SoundManager] Không thể phát nhạc nền BGM (chờ tương tác):', err)
        })
      }
    }
  }

  public pauseBgm(): void {
    if (this.bgmAudio && !this.bgmAudio.paused) {
      this.bgmAudio.pause()
    }
  }

  public preloadAll(): void {
    if (typeof window === 'undefined') return
    Object.keys(SOUND_FILES).forEach((name) => {
      this.getAudioInstance(name as SoundName)
    })
  }

  private getSoundUrl(name: SoundName): string {
    const rawBase = import.meta.env.BASE_URL || '/'
    const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
    return `${base}${SOUND_FILES[name]}`
  }

  private getAudioInstance(name: SoundName): HTMLAudioElement {
    let pool = this.cache.get(name)
    if (!pool) {
      pool = []
      this.cache.set(name, pool)
    }

    // Tìm audio element rảnh trong pool
    for (const audio of pool) {
      if (audio.paused || audio.ended) {
        try {
          audio.currentTime = 0
        } catch {
          // Bỏ qua nếu chưa sẵn sàng
        }
        audio.volume = this.volume
        return audio
      }
    }

    // Tạo mới nếu tất cả audio trong pool đều đang phát
    const url = this.getSoundUrl(name)
    const newAudio = new Audio(url)
    newAudio.volume = this.volume
    pool.push(newAudio)
    return newAudio
  }

  public play(name: SoundName): void {
    if (this.muted || typeof window === 'undefined') return

    try {
      const audio = this.getAudioInstance(name)
      try {
        audio.currentTime = 0
      } catch {
        // Bỏ qua lỗi thiết lập currentTime
      }
      audio.volume = this.volume
      const promise = audio.play()
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn(`[SoundManager] Không thể phát âm thanh "${name}":`, err)
        })
      }
    } catch (err) {
      console.warn(`[SoundManager] Lỗi khi mở âm thanh "${name}":`, err)
    }
  }
}

export const soundManager = new SoundManager()

export function playSound(name: SoundName): void {
  soundManager.play(name)
}

export function playGameEventSound(event: GameEvent): void {
  switch (event.type) {
    case 'property-bought':
      playSound('build')
      break
    case 'property-upgraded':
      playSound('upgrade')
      break
    case 'landmark-built':
      playSound('landmark-built')
      break
    case 'property-takeover':
      playSound('takeover')
      break
    case 'property-demolished':
      playSound('demolish')
      break
    case 'festival-started':
      playSound('festival')
      break
    case 'rent-paid':
      playSound('rent-pay')
      break
    case 'player-jailed':
      playSound('jail')
      break
    case 'player-bankrupt':
      playSound('bankrupt')
      break
    case 'trivia-correct':
      playSound('correct')
      break
    case 'trivia-wrong':
      playSound('wrong')
      break
    case 'card-drawn':
      playSound('card-draw')
      break
    case 'pass-start':
      playSound('pass-start')
      break
    case 'escape-jail':
      playSound('escape-jail')
      break
    case 'teleport':
      playSound('teleport')
      break
    case 'shield-activate':
      playSound('shield-activate')
      break
    case 'cash-gained':
      playSound('cash')
      break
    case 'player-moved':
      break
  }
}
