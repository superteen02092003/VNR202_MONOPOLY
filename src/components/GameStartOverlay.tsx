import type { CSSProperties } from 'react'

import { selectCurrentPlayer, useGameStore } from '../store/useGameStore'
import { BrandLogo } from './BrandLogo'
import { CharacterMark } from './CharacterMark'
import { GameIcon } from './GameIcon'
import { useNotice } from './useNotice'

export function GameStartOverlay() {
  const beginGame = useGameStore((state) => state.beginGame)
  const players = useGameStore((state) => state.players)
  const current = useGameStore(selectCurrentPlayer)
  const matchMinutes = useGameStore((state) => state.settings.matchMinutes)
  const { runAction } = useNotice()

  return (
    <div className="match-start-layer">
      <div className="match-start-layer__backdrop" />
      <section
        aria-labelledby="match-start-title"
        aria-modal="true"
        className="match-start-card"
        role="dialog"
      >
        <div className="match-start-card__topline">
          <BrandLogo compact />
          <span>
            <i />
            PHÒNG ĐẤU ĐÃ SẴN SÀNG
          </span>
        </div>

        <div className="match-start-card__hero">
          <span className="match-start-card__eyebrow">
            <GameIcon name="sparkles" size={16} />
            HÀNH TRÌNH KIẾN TẠO VIỆT NAM
          </span>
          <div className="match-start-card__playmark" aria-hidden="true">
            <GameIcon name="play" size={34} />
          </div>
          <h1 id="match-start-title">Tất cả đã sẵn sàng!</h1>
          <p>
            Kiểm tra đội hình lần cuối. Đồng hồ và câu hỏi đầu tiên chỉ bắt đầu
            khi Host nhấn nút bên dưới.
          </p>
        </div>

        <div className="match-start-card__teams" aria-label={`${players.length} đội tham gia`}>
          {players.map((player, index) => (
            <div
              className={player.id === current?.id ? 'is-first' : ''}
              key={player.id}
              style={{ '--player-color': player.color } as CSSProperties}
              title={`${player.name}${player.id === current?.id ? ' · Đi đầu tiên' : ''}`}
            >
              <CharacterMark characterId={player.characterId} />
              <strong>{index + 1}</strong>
            </div>
          ))}
        </div>

        <div className="match-start-card__summary">
          <span>
            <GameIcon name="users" size={18} />
            <small>ĐỘI THAM GIA</small>
            <strong>{players.length} đội</strong>
          </span>
          <i />
          <span>
            <GameIcon name="clock" size={18} />
            <small>THỜI LƯỢNG</small>
            <strong>{matchMinutes} phút</strong>
          </span>
          <i />
          <span>
            <GameIcon name="flag" size={18} />
            <small>ĐI ĐẦU TIÊN</small>
            <strong>{current?.name ?? 'Đang xác định'}</strong>
          </span>
        </div>

        <button
          autoFocus
          className="match-start-button"
          onClick={() => runAction(beginGame)}
          type="button"
        >
          <span className="match-start-button__icon">
            <GameIcon name="play" size={24} />
          </span>
          <span>
            <small>MỞ CÂU HỎI ĐẦU TIÊN</small>
            <strong>Bắt đầu ván đấu</strong>
          </span>
          <GameIcon className="match-start-button__arrow" name="chevron-right" size={22} />
        </button>

        <p className="match-start-card__hint">
          <span />
          Đồng hồ đang tạm dừng để mọi đội cùng chuẩn bị
        </p>
      </section>
    </div>
  )
}
