import { describe, it, expect } from 'vitest'
import { BehaviorSubject } from './observable'

describe('BehaviorSubject', () => {
  it('emits the current value to new subscribers and on next()', () => {
    const subject = new BehaviorSubject(false)
    const seen: boolean[] = []
    const unsub = subject.subscribe((v) => seen.push(v))
    expect(seen).toEqual([false]) // immediate current value
    subject.next(true)
    expect(seen).toEqual([false, true])
    expect(subject.getValue()).toBe(true)
    unsub()
    subject.next(false)
    expect(seen).toEqual([false, true]) // no longer notified after unsubscribe
  })
})
