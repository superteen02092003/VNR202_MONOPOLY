import { describe, expect, it } from 'vitest'

import { QUESTIONS, QUESTIONS_BY_TOPIC } from '../data/questions'
import { createTestGame } from './helpers'
import { drawQuestion, resolveTrivia } from '../logic/trivia'
import { getPlayer } from '../logic/players'

describe('Ngân hàng câu hỏi VNR202', () => {
  it('mọi câu hỏi đều hợp lệ về cấu trúc', () => {
    for (const q of QUESTIONS) {
      expect(q.options).toHaveLength(4)
      expect(q.answerIndex).toBeGreaterThanOrEqual(0)
      expect(q.answerIndex).toBeLessThanOrEqual(3)
      expect(q.prompt.trim().length).toBeGreaterThan(0)
      expect(q.explanation.trim().length).toBeGreaterThan(0)
      // Bốn phương án phải khác nhau, tránh trường hợp có 2 đáp án đúng.
      expect(new Set(q.options).size).toBe(4)
    }
  })

  it('không có id trùng lặp', () => {
    const ids = QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toàn bộ 62 câu đều thuộc Chương 3', () => {
    expect(QUESTIONS).toHaveLength(62)
    expect(QUESTIONS.every((q) => q.topic === 'doi-moi')).toBe(true)
    expect(QUESTIONS_BY_TOPIC['doi-moi']).toHaveLength(62)
    expect(QUESTIONS_BY_TOPIC['thanh-lap-dang']).toHaveLength(0)
    expect(QUESTIONS_BY_TOPIC['khang-chien']).toHaveLength(0)
  })

  it('đáp án đúng không dồn hết vào một vị trí', () => {
    const counts = [0, 0, 0, 0]
    for (const q of QUESTIONS) counts[q.answerIndex] += 1
    // Cả 4 vị trí đều phải từng là đáp án đúng.
    expect(counts.every((c) => c > 0)).toBe(true)
  })
})

describe('Vòng Hỏi Đáp', () => {
  it('không hỏi lặp câu trong cùng một ván cho tới khi dùng hết ngân hàng', () => {
    const state = createTestGame()
    state.askedQuestionIds = []

    const seen = new Set<string>()
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = drawQuestion(state)
      expect(q).not.toBeNull()
      expect(seen.has(q!.id)).toBe(false)
      seen.add(q!.id)
    }
    expect(seen.size).toBe(QUESTIONS.length)
  })

  it('trả lời đúng thì được rút thẻ, sai thì không', () => {
    const state = createTestGame()

    state.currentQuestion = QUESTIONS[0]
    const correct = resolveTrivia(state, QUESTIONS[0].answerIndex)
    expect(correct?.correct).toBe(true)
    expect(correct?.cardDrawn).toBe(true)
    expect(correct?.cardSaved || correct?.cardUsedImmediately).toBe(true)
    expect(getPlayer(state, 'p1').cards.every((card) => card.effect === 'escape-jail')).toBe(true)
    expect(getPlayer(state, 'p1').stats.correctAnswers).toBe(1)

    state.currentQuestion = QUESTIONS[1]
    const wrongIndex = (QUESTIONS[1].answerIndex + 1) % 4
    const wrong = resolveTrivia(state, wrongIndex)
    expect(wrong?.correct).toBe(false)
    expect(getPlayer(state, 'p1').cards.every((card) => card.effect === 'escape-jail')).toBe(true)
    expect(getPlayer(state, 'p1').stats.wrongAnswers).toBe(1)
  })

  it('hết giờ (không chọn đáp án) tính là sai', () => {
    const state = createTestGame()
    state.currentQuestion = QUESTIONS[0]

    const outcome = resolveTrivia(state, null)
    expect(outcome?.correct).toBe(false)
    expect(state.triviaResult).toBe('timeout')
  })

  it('túi đồ chỉ chứa tối đa 3 thẻ', () => {
    const state = createTestGame()

    for (let i = 0; i < 6; i++) {
      state.currentQuestion = QUESTIONS[i]
      resolveTrivia(state, QUESTIONS[i].answerIndex)
    }
    expect(getPlayer(state, 'p1').cards.every((card) => card.effect === 'escape-jail')).toBe(true)
  })
})
