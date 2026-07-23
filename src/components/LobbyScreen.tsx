import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'

import { CHARACTERS, GAME_CONFIG } from '../core'
import type { CharacterId } from '../core'
import type { PlayerSetup } from '../core/logic/setup'
import { useGameStore } from '../store/useGameStore'
import { BrandLogo } from './BrandLogo'
import { CharacterMark } from './CharacterMark'
import { GameIcon } from './GameIcon'
import { useNotice } from './useNotice'

const DEFAULT_TEAM_NAMES = ['Sao Vàng', 'Tiên Phong', 'Đổi Mới', 'Thống Nhất', 'Khát Vọng']

export function LobbyScreen() {
  const startGame = useGameStore((state) => state.startGame)
  const settings = useGameStore((state) => state.settings)
  const updateSettings = useGameStore((state) => state.updateSettings)
  const { notify } = useNotice()

  const [count, setCount] = useState<number>(GAME_CONFIG.MAX_PLAYERS)
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
      <div className="lobby-shell__aurora lobby-shell__aurora--one" />
      <div className="lobby-shell__aurora lobby-shell__aurora--two" />
      <div className="lobby-shell__grid" />

      <header className="lobby-header">
        <BrandLogo />
        <div className="lobby-header__meta">
          <span className="live-dot" />
          <span>Host Console</span>
          <span className="lobby-header__divider" />
          <span>Dành cho lớp học VNR202</span>
        </div>
      </header>

      <div className="lobby-layout">
        <section className="lobby-hero">
          <div className="lobby-hero__badge">
            <GameIcon name="sparkles" size={16} />
            Board game kiến thức · 3D local multiplayer
          </div>
          <h1>
            Khởi động hành trình
            <span> kiến tạo Việt Nam</span>
          </h1>
          <p>
            Chọn đội hình, chốt thời lượng và sẵn sàng chinh phục 32 địa danh trên
            bản đồ kinh doanh Việt Nam.
          </p>

          <div className="lobby-highlights">
            <div>
              <strong>32</strong>
              <span>ô hành trình</span>
            </div>
            <div>
              <strong>5</strong>
              <span>đội tranh tài</span>
            </div>
            <div>
              <strong>62</strong>
              <span>câu hỏi VNR202</span>
            </div>
          </div>

          <BoardPreview />
        </section>

        <form className="setup-card" onSubmit={submit}>
          <div className="setup-card__header">
            <div>
              <span className="section-kicker">PHÒNG CHỜ</span>
              <h2>Thiết lập ván đấu</h2>
            </div>
            <div className="setup-card__step">01 / 01</div>
          </div>

          <div className="setup-settings">
            <fieldset className="setup-fieldset">
              <legend>
                <GameIcon name="users" size={16} />
                Số đội chơi
              </legend>
              <div className="segmented-control" role="group" aria-label="Số đội chơi">
                {Array.from(
                  { length: GAME_CONFIG.MAX_PLAYERS - GAME_CONFIG.MIN_PLAYERS + 1 },
                  (_, index) => GAME_CONFIG.MIN_PLAYERS + index,
                ).map((value) => (
                  <button
                    aria-pressed={count === value}
                    className={count === value ? 'is-active' : ''}
                    key={value}
                    onClick={() => setCount(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="setup-fieldset setup-fieldset--wide">
              <legend>
                <GameIcon name="clock" size={16} />
                Thời lượng
              </legend>
              <div className="duration-control" role="group" aria-label="Thời lượng ván đấu">
                {GAME_CONFIG.MATCH_MINUTE_OPTIONS.map((minutes) => (
                  <button
                    aria-pressed={settings.matchMinutes === minutes}
                    className={settings.matchMinutes === minutes ? 'is-active' : ''}
                    key={minutes}
                    onClick={() => updateSettings({ matchMinutes: minutes })}
                    type="button"
                  >
                    {minutes}
                    <small>phút</small>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="team-section-heading">
            <div>
              <span className="section-kicker">ĐỘI HÌNH</span>
              <p>Đặt tên và chọn đại diện cho từng đội</p>
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
                          <option
                            disabled={picks
                              .slice(0, count)
                              .some((pick, itemIndex) => itemIndex !== index && pick === option.id)}
                            key={option.id}
                            value={option.id}
                          >
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

          <div className="setup-options">
            <label className="setup-toggle">
              <input
                checked={settings.allowTakeover}
                onChange={(event) => updateSettings({ allowTakeover: event.target.checked })}
                type="checkbox"
              />
              <span className="setup-toggle__control" />
              <span>
                <strong>Cho phép thâu tóm</strong>
                <small>Đội có thể mua lại đất đối thủ</small>
              </span>
            </label>
            <label className="setup-toggle">
              <input
                checked={settings.requireRegionForLandmark}
                onChange={(event) =>
                  updateSettings({ requireRegionForLandmark: event.target.checked })
                }
                type="checkbox"
              />
              <span className="setup-toggle__control" />
              <span>
                <strong>Chế độ chiến lược</strong>
                <small>Cần trọn vùng để xây biểu tượng</small>
              </span>
            </label>
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
        <span>Business Voyage · Vietnam Edition · Prototype 2026</span>
      </footer>
    </main>
  )
}

function BoardPreview() {
  return (
    <div className="board-preview" aria-hidden="true">
      <div className="board-preview__halo" />
      <div className="board-preview__board">
        <div className="board-preview__side board-preview__side--top">
          {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
        </div>
        <div className="board-preview__side board-preview__side--right">
          {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
        </div>
        <div className="board-preview__side board-preview__side--bottom">
          {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
        </div>
        <div className="board-preview__side board-preview__side--left">
          {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
        </div>
        <span className="board-preview__corner board-preview__corner--one">
          <GameIcon name="flag" size={18} />
        </span>
        <span className="board-preview__corner board-preview__corner--two">
          <GameIcon name="sparkles" size={18} />
        </span>
        <span className="board-preview__corner board-preview__corner--three">
          <GameIcon name="plane" size={18} />
        </span>
        <span className="board-preview__corner board-preview__corner--four">
          <GameIcon name="cards" size={18} />
        </span>
        <div className="board-preview__center">
          <span>VNR</span>
          <strong>202</strong>
          <small>BUSINESS VOYAGE</small>
        </div>
        <span className="board-preview__pawn board-preview__pawn--one" />
        <span className="board-preview__pawn board-preview__pawn--two" />
        <span className="board-preview__pawn board-preview__pawn--three" />
      </div>
      <div className="board-preview__caption">
        <span><GameIcon name="map" size={16} /> 8 vùng kinh tế</span>
        <span><GameIcon name="trophy" size={16} /> 1 ngôi vô địch</span>
      </div>
    </div>
  )
}
