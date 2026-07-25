import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'

import { CHARACTERS, formatMoney, GAME_CONFIG } from '../core'
import type { CharacterId } from '../core'
import type { PlayerSetup } from '../core/logic/setup'
import { useGameStore } from '../store/useGameStore'
import { BrandLogo } from './BrandLogo'
import { CharacterMark } from './CharacterMark'
import { GameIcon } from './GameIcon'
import { useNotice } from './useNotice'

const DEFAULT_TEAM_NAMES = ['Nhóm 1', 'Nhóm 2', 'Nhóm 3', 'Nhóm 4', 'Nhóm 5']

export function LobbyScreen() {
  const startGame = useGameStore((state) => state.startGame)
  const { notify } = useNotice()

  const count = GAME_CONFIG.MAX_PLAYERS
  const [names, setNames] = useState(() => [...DEFAULT_TEAM_NAMES])
  const [picks, setPicks] = useState<CharacterId[]>(() =>
    CHARACTERS.slice(0, GAME_CONFIG.MAX_PLAYERS).map((character) => character.id),
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const activeNames = names.slice(0, count).map((name) => name.trim())

    if (activeNames.some((name) => !name)) {
      notify('Mỗi đội cần có một tên trước khi bắt đầu.', 'error')
      return
    }

    if (new Set(activeNames.map((name) => name.toLocaleLowerCase('vi'))).size !== count) {
      notify('Tên các đội cần khác nhau để Host dễ theo dõi.', 'error')
      return
    }

    const setups: PlayerSetup[] = Array.from({ length: count }, (_, index) => ({
      id: `p${index + 1}`,
      name: activeNames[index],
      characterId: picks[index],
    }))

    const result = startGame(setups, { randomizeTurnOrder: true })
    if (!result.ok) notify(result.reason ?? 'Chưa thể bắt đầu ván đấu.', 'error')
  }

  return (
    <main className="lobby-shell">
      <header className="lobby-header">
        <BrandLogo />
      </header>

      <div className="lobby-layout">
        <div className="lobby-layout__title" aria-label="Tên hành trình">
          <h1>HÀNH TRÌNH KIẾN TẠO VIỆT NAM</h1>
        </div>
        <form className="setup-card" onSubmit={submit}>
          <div className="setup-card__header">
            <div>
              <span className="section-kicker">PHÒNG CHỜ</span>
            </div>
            <div className="setup-card__step">01 / 01</div>
          </div>

          <div className="setup-summary" aria-label="Cấu hình mặc định">
            <span><strong>{count}</strong><small>đội</small></span>
            <span><strong>{GAME_CONFIG.DEFAULT_MATCH_MINUTES}</strong><small>phút</small></span>
            <span className="setup-summary__money">
              <strong>
                <img alt="" aria-hidden="true" src="/money-stack-green.png" />
                {formatMoney(GAME_CONFIG.STARTING_CASH)}
              </strong>
              <small>vốn / đội</small>
            </span>
            <span><strong>{GAME_CONFIG.DEFAULT_TRIVIA_SECONDS}</strong><small>giây / câu</small></span>
          </div>

          <div className="team-section-heading">
            <div>
              <span className="section-kicker">ĐỘI HÌNH</span>
            </div>
            <span>{count} / {GAME_CONFIG.MAX_PLAYERS} đội</span>
          </div>

          <div className="team-grid">
            {Array.from({ length: count }, (_, index) => {
              const character = CHARACTERS.find((item) => item.id === picks[index]) ?? CHARACTERS[0]
              return (
                <div className="team-setup" key={index} style={{ '--team-color': character.color } as CSSProperties}>
                  <div className="team-setup__index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="character-avatar" aria-hidden="true">
                    <CharacterMark characterId={character.id} />
                  </div>
                  <div className="team-setup__fields">
                    <label>
                      <span className="sr-only">Tên đội {index + 1}</span>
                      <input
                        aria-label={`Tên đội ${index + 1}`}
                        maxLength={24}
                        onChange={(event) =>
                          setNames((current) =>
                            current.map((name, itemIndex) =>
                              itemIndex === index ? event.target.value : name,
                            ),
                          )
                        }
                        value={names[index]}
                      />
                    </label>
                    <label>
                      <span className="sr-only">Nhân vật đội {index + 1}</span>
                      <select
                        aria-label={`Nhân vật đội ${index + 1}`}
                        onChange={(event) =>
                          setPicks((current) =>
                            current.map((pick, itemIndex) =>
                              itemIndex === index ? (event.target.value as CharacterId) : pick,
                            ),
                          )
                        }
                        value={picks[index]}
                      >
                        {CHARACTERS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>

          <button className="start-match-button" type="submit">
            <span className="start-match-button__icon">
              <GameIcon name="play" size={21} />
            </span>
            <span>
              <small>MỌI ĐỘI ĐÃ SẴN SÀNG</small>
              Bắt đầu hành trình
            </span>
            <GameIcon name="chevron-right" size={22} />
          </button>
        </form>
      </div>

      <footer className="lobby-footer">
        <span>VNR202 · Lịch sử Đảng Cộng sản Việt Nam</span>
        <span>Business Voyage · Prototype 2026</span>
      </footer>
    </main>
  )
}
