import { describe, expect, it } from 'vitest'

import { resolveClipName } from './clips'

/** Tên clip thật hay gặp khi tải model từ Sketchfab / Mixamo. */
const MIXAMO = ['mixamo.com|Breathing Idle', 'mixamo.com|Jumping', 'mixamo.com|Victory']
const SKETCHFAB = ['Armature|Idle', 'Armature|Run', 'Armature|Dance']
const CRYPTIC = ['Take 001', 'Take 002']

describe('Dò tên clip animation', () => {
  it('khớp được tên kiểu Mixamo', () => {
    expect(resolveClipName(MIXAMO, 'idle')).toBe('mixamo.com|Breathing Idle')
    expect(resolveClipName(MIXAMO, 'jump')).toBe('mixamo.com|Jumping')
    expect(resolveClipName(MIXAMO, 'celebrate')).toBe('mixamo.com|Victory')
  })

  it('khớp được tên kiểu Sketchfab, nhận Run làm hoạt ảnh nhảy', () => {
    expect(resolveClipName(SKETCHFAB, 'idle')).toBe('Armature|Idle')
    expect(resolveClipName(SKETCHFAB, 'jump')).toBe('Armature|Run')
    expect(resolveClipName(SKETCHFAB, 'celebrate')).toBe('Armature|Dance')
  })

  it('thiếu clip Celebrate thì lùi về Jump rồi mới tới Idle', () => {
    const noCelebrate = ['Idle', 'Jumping']
    expect(resolveClipName(noCelebrate, 'celebrate')).toBe('Jumping')

    const onlyIdle = ['Breathing Idle']
    expect(resolveClipName(onlyIdle, 'celebrate')).toBe('Breathing Idle')
    expect(resolveClipName(onlyIdle, 'jump')).toBe('Breathing Idle')
  })

  it('tên vô nghĩa thì vẫn chạy clip đầu tiên thay vì đứng im', () => {
    expect(resolveClipName(CRYPTIC, 'idle')).toBe('Take 001')
    expect(resolveClipName(CRYPTIC, 'celebrate')).toBe('Take 001')
  })

  it('model không có animation nào thì trả về null', () => {
    expect(resolveClipName([], 'idle')).toBeNull()
  })

  it('chỉ định tay luôn được ưu tiên hơn bộ dò tự động', () => {
    const overrides = { idle: 'Take 002' }
    expect(resolveClipName(CRYPTIC, 'idle', overrides)).toBe('Take 002')
    // Chỉ định tay trỏ tới clip không tồn tại thì bỏ qua, quay về dò tự động.
    expect(resolveClipName(CRYPTIC, 'idle', { idle: 'Không có' })).toBe('Take 001')
  })

  it('chỉ định tay cho Idle cũng được dùng khi thiếu Celebrate', () => {
    const names = ['Take 001', 'Take 002']
    expect(resolveClipName(names, 'celebrate', { idle: 'Take 002' })).toBe('Take 002')
  })
})
