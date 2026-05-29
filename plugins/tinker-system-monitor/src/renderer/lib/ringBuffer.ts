export class RingBuffer<T> {
  private buffer: T[]
  private head = 0
  private size = 0

  constructor(private cap: number) {
    this.cap = Math.max(10, cap)
    this.buffer = new Array<T>(this.cap)
  }

  get length(): number {
    return this.size
  }

  push(item: T): void {
    this.buffer[(this.head + this.size) % this.cap] = item
    if (this.size < this.cap) {
      this.size++
    } else {
      this.head = (this.head + 1) % this.cap
    }
  }

  toArray(): T[] {
    const result: T[] = []
    for (let i = 0; i < this.size; i++) {
      result.push(this.buffer[(this.head + i) % this.cap])
    }
    return result
  }
}
