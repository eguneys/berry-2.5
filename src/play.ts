import { w, h, colors, ticks } from './shared'
import { ti, completed, read, update, tween } from './anim'
import { Line, Vec2, Rectangle, Circle } from './vec2'
import { generate, psfx } from './audio'
import { steer_behaviours,
  b_arrive_steer,
  b_avoid_circle_steer

} from './rigid'

import { arr_shuffle } from './util'

import { appr, lerp } from './lerp'


const quick_burst = (radius: number, start: number = 0.8, end: number = 0.2) => 
tween([start, start, 1, end].map(_ => _ * radius), [ticks.five + ticks.three, ticks.three * 2, ticks.three * 2])

const rect_orig = (rect: Rectangle, o: Vec2) => {
  return rect.x1 <= o.x && o.x <= rect.x2 && rect.y1 <= o.y && o.y <= rect.y2
}

const circ_orig = (c: Circle, v: Vec2) => {
  return c.o.distance(v) <= c.r
}

/* https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript */
const make_random = (seed = 1) => {
  return () => {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
}
const random = make_random()

let v_screen = Vec2.make(1920, 1080)
let r_screen = Rectangle.make(0, 0, 1920, 1080)

function rnd_angle(rng: RNG = random) {
  return rng() * Math.PI * 2
}

function rnd_vec_h(rng: RNG = random) {
  return Vec2.make(rnd_h(rng), rnd_h(rng))
}

function rnd_vec(mv: Vec2 = Vec2.unit, rng: RNG = random) {
  return Vec2.make(rng(), rng()).mul(mv)
}

function rnd_h(rng: RNG = random) {
  return rng() * 2 - 1
}

function rnd_int_h(max: number, rng: RNG = random) {
  return rnd_h(rng) * max
}

function rnd_int(max: number, rng: RNG = random) {
  return Math.floor(rng() * max)
}

function arr_rnd(arr: Array<A>) {
  return arr[rnd_int(arr.length)]
}

function arr_remove(arr: Array<A>, a: A) {
  arr.splice(arr.indexOf(a), 1)
}

function arr_replace(arr: Array<A>, r: Array<A>) {
  arr.length = 0
  arr.push(...r)
}


const slow_burst = (radius: number, rng: RNG = random) => 
tween([0.1, 0.1, 0.5, 1].map(_ => _ * radius), arr_shuffle([ticks.five + ticks.three, ticks.three * 2, ticks.five * 2, ticks.five, ticks.three * 2], rng))



const on_interval = (t, life, life0) => {
  return Math.floor(life0 / t) !== Math.floor(life / t)
}

const on_interval_lee = (t, life, life0, lee: Array<number>) => {
  //return lee.some(_ => on_interval(t, life - _, life0 - _) || on_interval(t, life + _, life0 + _))
  return lee.some(_ => (life + _) % t === 0 || (life - _) % t === 0)
}

abstract class Play {

  get c() { return this.ctx.c }
  get g() { return this.ctx.g }
  get m() { return this.ctx.m }
  get i() { return this.ctx.i }

  data: any

  life: number
  life0: number

  constructor(readonly ctx: Context) {}

  _set_data(data: any): this { 
    this.data = data 
    return this
  }

  init(): this { 
    this.life = 0
    this.life0 = 0
    this._init()
    return this 
  }

  update(dt: number, dt0: number) {
    this.life0 = this.life
    this.life += dt
    this._update(dt, dt0)
  }

  draw() {
    this._draw()
  }

  /* https://github.com/eguneys/monocle-engine/blob/master/Monocle/Scene.cs#L122 */
  on_interval(t: number) {
    return on_interval(t, this.life, this.life0)
  }

  /* https://github.com/eguneys/monocle-engine/blob/master/Monocle/Util/Calc.cs#L944 */
  between_interval(i: number) {
    return this.life % (i * 2) > i
  }

  abstract _init(): void;
  abstract _update(dt: number, dt0: number): void;
  abstract _draw(): void;
}

abstract class PlayMakes extends Play {

  make(Ctor: any, data: any = {}, delay: number = 0, repeat: number = 1) {
    this.makes.push([Ctor, data, delay, repeat, 0, 0])
  }


  init() {
    this.makes = []
    return super.init()
  }

  update(dt: number, dt0: number) {
    let { makes } = this
    this.makes = []

    this.makes = this.makes.concat(makes.filter(_ => {

      _[4] += dt

      let [Ctor, f_data, _delay, _s_repeat, _t, _i_repeat] = _

      let _at_once = _s_repeat < 0
      let _repeat = Math.abs(_s_repeat)

      if (_t >= _delay) {
        
        do {
          new Ctor(this)._set_data({
            group: this.objects,
            ...f_data.apply?.(
              _[5],
              _[4],
              _repeat,
              _delay,
            ) || f_data
          }).init()
        } while(++_[5] < _repeat && _at_once)

        _[4] = 0

        if (_repeat === 0 || _[5] < _repeat) {
          return true
        }
      } else {
        return true
      }
    }))

    super.update(dt, dt0)
  }


  _init() {}
  _update() {}
  _draw() {}
}

abstract class WithPlays extends PlayMakes {

  make(...args) {
    this.plays.make(...args)
  }

  get camera() {
    return this.plays.camera
  }

  shake(radius) {
    this.plays.shake(radius)
  }

  constructor(readonly plays: AllPlays) {
    super(plays.ctx)
    this.on_dispose = []
  }

  init() {
    let { group } = this.data

    if (group) {
      group.push(this)
    }
    return super.init()
  }


  dispose(reason: any) {
    let { group } = this.data
    if (group) {
      arr_remove(group, this)
    }
    this.on_dispose.forEach(_ => _(this, reason))
    this._dispose(reason)
  }


  _dispose(_: string) {}
}

abstract class WithRigidPlays extends WithPlays {

  readonly v_target = Vec2.unit

  readonly r_opts: RigidOptions = {
    mass: 1000,
    air_friction: 0.9,
    max_speed: 100,
    max_force: 3
  };
  readonly r_bs: Array<Behaviour> = [];

  r_wh!: Vec2;

  get angle() {
    return this.side.angle
  }

  get vel() {
    return this._bh._body.velocity
  }

  get side() {
    return this._bh._body.side
  }

  get vs() {
    return this._bh._body.vs
  }

  get x() {
    return this.vs.x
  }

  get y() {
    return this.vs.y
  }

  get w() {
    return this.r_wh.x
  }

  get h() {
    return this.r_wh.y
  }

  get radius() {
    let { r_wh } = this
    return Math.max(r_wh.x, r_wh.y)
  }

  get rect() {
    let { vs, r_wh } = this
    return Rectangle.make(vs.x, vs.y, r_wh.x, r_wh.y)
  }

  get circle() {
    return Circle.make(this.v_target.x, this.v_target.y, this.radius)
  }

  init() {

    let { v_pos, wh, radius } = this.data
    this.v_target.set_in(v_pos.x, v_pos.y)
    this.r_wh = wh || (radius && Vec2.make(radius, radius)) || this.r_wh
    this._bh = steer_behaviours(this.v_target, this.r_opts, this.r_bs)

    return super.init()
  }


  update(dt: number, dt0: number) {
    this._bh.update(dt, dt0)
    super.update(dt, dt0)
  }
}

class Trail extends WithPlays {

  _update(dt: number, dt0: number) {
    if (this.on_interval(ticks.half)) {
      this.dispose()
    }
  }


  _draw() {

    let w = 40,
      h = 40
    let { v_pos: { x, y } } = this.data
    this.g.texture(0xff0033, 0, 0, 0, x, y + h/2, 100, w, h, 0, 0, 100, 100, 100, 100)
    this.g.texture(0x330033, Math.PI*0.5, 0, 0, x, y + 1, 100, w * 2, h, 0, 0, 100, 100, 100, 100)
  }
}


class Player extends WithRigidPlays {

  v_target_j = Vec2.unit

  readonly r_opts_j: RigidOptions = {
    mass: 1000,
    air_friction: 0.9,
    max_speed: 500,
    max_force:10 
  };

  readonly r_bs_j = []

  get vs_j() {
    return this._bh_j._body.vs
  }

  get y() {
    return this.vs_j.y
  }

  _init() {

    let { v_pos, wh, radius } = this.data
    this.v_target_j.set_in(v_pos.x, v_pos.y)
    this._bh_j = steer_behaviours(this.v_target_j, this.r_opts_j, this.r_bs_j)

    this.j_circle = Circle.unit
    this.j_circle.r = 0

    this.v_horiz_target = Vec2.zero
    arr_replace(this.r_bs, [
      [b_arrive_steer(this.v_horiz_target), 1]
    ])
    arr_replace(this.r_bs_j, [
      [b_avoid_circle_steer(this.circle.normalize, Math.PI / 2), 0.1],
      [b_avoid_circle_steer(this.j_circle, Math.PI / 2), 0.2],
      [b_arrive_steer(Vec2.zero), 0.6],
    ])

  }

  get save() {
    return [
      this.vel.x,
      this.x
    ]
  }

  _update(dt: number, dt0: number) {

    let { just_ons, been_ons } = this.i

    this._bh_j.update(dt, dt0)

    let left = been_ons.find(_ => _[0] === 'ArrowLeft')?.[1],
      right = been_ons.find(_ => _[0] === 'ArrowRight')?.[1]

    let f = just_ons.find(_ => _[0] === 'f')

    if (f) {
      this.j_circle.o = this.circle.o
      this.j_circle.r = this.circle.r * 8
    }

    if (this.on_interval(ticks.one)) {
      this.j_circle.r = appr(this.j_circle.r, 0, 8)
    }

    if (left > 0) {
      this.v_horiz_target.x = this.x - (left / ticks.one) * 100
    }
    if (left === -1 || right === -1) {
      this.v_horiz_target.x = this.x
    }
    if (right > 0) {
      this.v_horiz_target.x = this.x + (right / ticks.one) * 100
    }


    let { save } = this
    if (this.on_interval(ticks.half)) {
      let { save0 } = this

      if (save0) {
        if (Math.abs(save0[1] - save[1]) > 100) {
          this.make(Trail, { v_pos: this.vs.sub(this.vel.scale(4)) })
        }
      }

      this.save0 = save
    }

    let target_x = this.x - this.c.o.x
    let x= 0

    let scroll_x = 0

    let dx1 = -40
    let dx2 = 40

    if (target_x < 0) {
      let d = target_x + 40
      if (d < 0) scroll_x = d
    }
    if (target_x > 2 * x) {
      let d = target_x - 40
      if (d > 0) scroll_x = d
    }

    this.c.o.x = lerp(this.c.o.x, this.c.o.x + scroll_x, 0.4)
    this.c.l.x = lerp(this.c.l.x, this.c.l.x + scroll_x, 0.4)
  }

  _draw() {
    let { w, h, x, y } = this
    this.g.texture(0xff0000, 0, 0, 0, x, y + h/2, 100, w, h, 0, 0, 100, 100, 100, 100)
    this.g.texture(0x000033, Math.PI*0.5, 0, 0, x, y + 1, 100, w * 2, h, 0, 0, 100, 100, 100, 100)
  }

}

export default class AllPlays extends PlayMakes {

  all(Ctor: any) {
    return this.objects.filter(_ => _ instanceof Ctor)
  }

  one(Ctor: any, o = this.objects) {
    return o.findLast(_ => _ instanceof Ctor)
  }

  _init() {

    this.objects = []
    this.ui = []

    this.make(Player, {
      v_pos: Vec2.zero,
      wh: Vec2.make(30, 40)
    })

  }

  _update(dt: number, dt0: number) {
    //this.c.o.y = 80 - Math.sin(this.life * 0.0001) * 80
    //this.c.l.y = 80 - Math.sin(this.life * 0.0001) * 80
    this.objects.forEach(_ => _.update(dt, dt0))
  }
  _draw() {


    let x = -1920 + 100,
      y = -1080 + 100,
      z = 0

    this.g.texture(0xffffff, 0, 0, Math.sin(this.life*0.001) * Math.PI * 2, -x, y, -z, 1920, 1080, 0, 0, 100, 100, 100, 100)

    this.g.texture(0xffffff, 0, 0, Math.sin(this.life * 0.0001) * Math.PI * 2, -100, 0, -50, 500, 20, 0, 0, 100, 100, 100, 100)
    this.g.texture(0x00ffff, 0, 0, 0, 0, 0, 0, -20, 500, 0, 0, 100, 100, 100, 100)
    this.g.texture(0xffff00, 0, 0, 0, 100, 0, -100, 20, 500, 0, 0, 100, 100, 100, 100)
    this.g.texture(0x0000ff, 0, 0, 0, -20, 0, 190, 20, 500, 0, 0, 100, 100, 100, 100)
    this.g.texture(0xff00ff, 0, 0, 0, 0, 0, -199, 200, 100, 0, 0, 100, 100, 100, 100)


    this.g.texture(0xffff00, Math.PI*0.5, 0, 0, 0, 0, 0, 1200, 200, 0, 0, 100, 100, 100, 100)
    this.g.texture(0xfffff0, Math.PI*0.5, 0, 0, 0, 0, 200, 1200, 200, 0, 0, 100, 100, 100, 100)

    /*
    this.g.texture(0xff0000, 0, 0, 0, 0, 20, -100, 20, 50, 0, 0, 100, 100, 100, 100)
    this.g.texture(0x000033, Math.PI*0.5, 0, 0, 0, 1, -100, 50, 50, 0, 0, 100, 100, 100, 100)
   */

    this.objects.forEach(_ => _.draw())
  }
}
