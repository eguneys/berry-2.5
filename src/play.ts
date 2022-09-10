import { w, h, colors, ticks } from './shared'
import { ti, completed, read, update, tween } from './anim'
import { Line, Vec2, Rectangle, Circle } from './vec2'
import { generate, psfx } from './audio'
import { arr_shuffle } from './util'

import { appr, lerp } from './lerp'
import { make_rigid, rigid_update } from './rigid'


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

function arr_scale(arr: Array<A>, n: number) {
  return arr.map(_ => _ * n)
}


export const pi = Math.PI;
export const half_pi = pi / 2;
export const third_pi = pi / 3;
export const tau = pi * 2;
export const thirdtau = tau/ 3;

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


  get alive() {
    return this._alive
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
      this._alive = true
    }

    return super.init()
  }


  dispose(reason: any) {
    let { group } = this.data
    if (group) {
      arr_remove(group, this)
    this._alive = false
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
    //this._bh = steer_behaviours(this.v_target, this.r_opts, this.r_bs)

    return super.init()
  }


  update(dt: number, dt0: number) {
    //this._bh.update(dt, dt0)
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


class PlayerFloor extends WithPlays {

  get x() {
    return this._floor_x.x
  }

  get y() {
    return this._floor_y.x
  }

  _init() {

    let { x } = this.data.v_pos


    this._floor_y = make_rigid(0, {
      mass: 100,
      air_friction: 0.9,
      max_speed: 100,
      max_force: 10
    })

    this._floor_x = make_rigid(x, {
      mass: 100,
      air_friction: 0.9,
      max_speed: 100,
      max_force: 10
    })
  }

  _update(dt: number, dt0: number) {


    this._floor_x.force = 0
    this._floor_y.force = 0

    user_update(this)

    if (this._floor_y.x > 0 && this._floor_y.vx < 0.1) {

      let m_s = this._floor_y.opts.max_speed,
        m_f = this._floor_y.opts.max_force
      let d = this._floor_y.x

      let r_s = m_s * (d / 100)
      let c_s = Math.min(r_s, m_s)
      let d_v = c_s

      this._floor_y.force = -c_s / m_s * m_f
    }

    rigid_update(this._floor_x, dt, dt0)
    rigid_update(this._floor_y, dt, dt0)

    if (this._floor_y.x < 0) {
      this._floor_y.x = 0
      this._floor_y.x0 = 0
    }

  }

  _draw() {
    
    let { x, y } = this

    let w = 40,
      h = 60



  }
}


class Cinema extends WithPlays {


  _init() {
  }


  _update(dt: number, dt0: number) {

    let a = -500 + Math.sin(this.life * 0.001) * 500
    a = -500
    this.c.o.y = 0
    this.c.o.z = a


    let d = 0.3;
    let rate = 1
    let i = Math.abs(Math.sin(this.life * 0.0001 * rate)) * d
    let i2 = Math.abs(Math.sin(this.life * 0.0002 * rate)) * d
    let i3 = Math.abs(Math.sin(this.life * 0.0004 * rate)) * d
    this.g.u_blend = [0.13 + i * 0.05, 2.24 + i3*0.1, 0.54 + i3*0.1, 0.55 + i2*0.1]
    /*
    if (this.on_interval(ticks.half)) {
      console.log(this.g.u_blend)
    }
    */
  }
}


const user_update = (_p: PlayerFloor, dt: number, dt0: number) => {
  let left = _p.i.been_ons.find(_ => _[0] === 'ArrowLeft')?.[1],
    right = _p.i.been_ons.find(_ => _[0] === 'ArrowRight')?.[1]

  let f = _p.i.just_ons.find(_ => _ === 'f')

  if (f) {
    _p._floor_y.force = 1
  }

  if (left) {
    _p._floor_x.force = -1
  }
  if (right) {
    _p._floor_x.force = 1
  }

}

export default class AllPlays extends PlayMakes {

  all(Ctor: any) {
    return this.objects.filter(_ => _ instanceof Ctor)
  }

  one(Ctor: any, o = this.objects) {
    return o.findLast(_ => _ instanceof Ctor)
  }

  tag(Ctor: any, tag: string, o = this.objects) {
    return o.find(_ => _ instanceof Ctor && _.data.tag === tag)
  }

  _init() {

    this.objects = []
    this.ui = []

    this.make(Cinema)
    this.make(PlayerFloor, {
      tag: 'user',
      v_pos: Vec2.zero
    })
  }

  _update(dt: number, dt0: number) {
    this.objects.forEach(_ => _.update(dt, dt0))
  }
  _draw() {

    let a_pi = Math.abs(Math.sin(this.life * 0.001)) * Math.PI * 0.5
    /*
    this.g.texture(0x0000ff, 0, 0, 0,    0, 0, 0,  320, 320, 0, 0, 16, 16, 512, 512)
    this.g.texture(0x00ffff, 0, a_pi, 0,       0,-400, 0,  320, 320, 0, 0, 16, 16, 512, 512)
    this.g.texture(0xff00ff, 0, 0, a_pi,       0,   0, 0,  320, 320, 0, 0, 16, 16, 512, 512)
   */


    this.g.texture(0x0000ff, half_pi * 0.8, 0, 0, 0, 200, 0, 1920, 300, 0, 0, 40, 40, 512, 512)
    this.g.texture(0x0000ff, half_pi * 0.9, 0, 0, 0, 300, 0, 1920, 800, 0, 0, 40, 40, 512, 512)
    this.g.texture(0xff0000, half_pi*0.2, 0, 0, 0, -100, 0, 1920, 540, 0, 0, 40, 40, 512, 512)


  let i = Math.sin(this.life * 0.001)
    this.g.texture(0xff0000, 0, 0, 0, 
                   i*100, 40, -10, 
                   278*1, 500*1, 0, 0, 278, 500, 512, 512)



  
    this.objects.forEach(_ => _.draw())
  }
}
