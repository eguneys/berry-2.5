import { ticks } from './shared'

export class Spring {

  static make = (x, k, d) => new Spring(x, k, d)

  constructor(x, readonly k = 100, readonly d = 10) {
    this.x = x
    this.target_x = x
    this.v = 0
  }


  update(dt: number) {
    dt /= ticks.seconds
    let a = -this.k*(this.x - this.target_x) - this.d * this.v

    this.v = this.v + a * dt
    this.x = this.x + this.v * dt
  }

  pull(f, k = this.k, d = this.d) {

    this.k = k
    this.d = d
    this.x = this.x + f
  }

  animate(x, k = this.k, d = this.d) {
    this.k = k
    this.d = d
    this.target_x = x
  }
}
