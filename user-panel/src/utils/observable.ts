// Minimal RxJS-free BehaviorSubject: holds a current value and notifies
// subscribers. New subscribers immediately receive the current value — matching the
// Angular `needReload` BehaviorSubject semantics exactly.
export class BehaviorSubject<T> {
  private current: T
  private readonly subscribers = new Set<(value: T) => void>()

  constructor(initial: T) {
    this.current = initial
  }

  getValue(): T {
    return this.current
  }

  next(value: T): void {
    this.current = value
    this.subscribers.forEach((s) => s(value))
  }

  subscribe(cb: (value: T) => void): () => void {
    this.subscribers.add(cb)
    cb(this.current)
    return () => {
      this.subscribers.delete(cb)
    }
  }
}
