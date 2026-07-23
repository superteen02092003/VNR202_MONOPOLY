import { QUESTIONS } from '../data/questions'
import { drawCard } from './cards'
import { pushEvent, pushLog } from './log'
import { getPlayer } from './players'
import { pickOne } from './random'
import type { GameCore, Question } from '../types'

/**
 * Rút một câu hỏi VNR202 chưa dùng trong ván này.
 * Khi đã hỏi hết ngân hàng thì bắt đầu lại từ đầu.
 */
export function drawQuestion(state: GameCore): Question | null {
  let pool = QUESTIONS.filter((q) => !state.askedQuestionIds.includes(q.id))

  if (pool.length === 0) {
    state.askedQuestionIds = []
    pool = QUESTIONS
    pushLog(state, 'info', 'Đã dùng hết ngân hàng câu hỏi — bắt đầu vòng câu hỏi mới.')
  }

  const question = pickOne(state, pool) ?? null
  if (question) state.askedQuestionIds.push(question.id)
  return question
}

export interface TriviaOutcome {
  correct: boolean
  question: Question
  /** Nhóm có nhận được Thẻ Cơ hội không (trả lời đúng nhưng túi đầy thì không). */
  cardDrawn: boolean
}

/**
 * Chốt đáp án của Vòng Hỏi Đáp.
 * @param answerIndex Đáp án nhóm chọn; null nghĩa là hết giờ / bỏ qua.
 */
export function resolveTrivia(state: GameCore, answerIndex: number | null): TriviaOutcome | null {
  const question = state.currentQuestion
  const playerId = state.turnOrder[state.currentPlayerIndex]
  if (!question || !playerId) return null

  const player = getPlayer(state, playerId)
  const correct = answerIndex !== null && answerIndex === question.answerIndex

  if (correct) {
    player.stats.correctAnswers += 1
    state.triviaResult = 'correct'
    pushLog(state, 'trivia', `${player.name} trả lời ĐÚNG — được rút 1 Thẻ Cơ hội.`, playerId)
  } else {
    player.stats.wrongAnswers += 1
    state.triviaResult = answerIndex === null ? 'timeout' : 'wrong'
    const detail = answerIndex === null ? 'hết giờ' : 'trả lời SAI'
    pushLog(
      state,
      'trivia',
      `${player.name} ${detail}. Đáp án đúng: ${question.options[question.answerIndex]}.`,
      playerId,
    )
  }

  pushEvent(state, correct ? 'trivia-correct' : 'trivia-wrong', playerId)

  const cardDrawn = correct ? drawCard(state, playerId).card !== null : false
  return { correct, question, cardDrawn }
}
