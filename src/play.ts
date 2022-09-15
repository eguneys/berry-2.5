import { ticks } from './shared'
import { ti, completed, read, update, tween } from './anim'
import { Line, Vec2, Rectangle, Circle } from './vec2'
import { generate, psfx } from './audio'

import { appr, lerp, lerp_dt } from './lerp'
import { make_rigid, rigid_update } from './rigid'
import { __f_attack, __f_back_dash, __f_dash, __f_back_walk, __f_walk, __f_idle, __f_turn } from './animstate'
import { AnimState2 } from './animstate'

console.log(__f_walk)


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
    this.z = 0
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

  get _x() {
    return this._floor_x.x
  }

  _init() {

    let { x } = this.data.v_pos


    this._floor_y = make_rigid(0, {
      mass: 100,
      air_friction: 0.9,
      max_speed: 50,
      max_force: 10
    })

    this._floor_x = make_rigid(x, {
      mass: 100,
      air_friction: 0.6,
      max_speed: 28,
      max_force: 4
    })

    this.z = this.data.z

    this._facing = 1

    this._a = new AnimState2(__f_idle)
  }

  _attack() {
    this._a = new AnimState2(__f_attack)
  }

  _horizontal(on, off) {

    if (off !== 0) {
      this._t_off = this.life * off
    }
    if (on !== 0) {
      let { _t_off } = this
      this._t_off = undefined
      if (!!_t_off && on === Math.sign(_t_off)) {
        let d = this.life - Math.abs(_t_off)

        if (d < ticks.sixth) {
          if (Math.sign(_t_off) === this._facing) {
            this._a = new AnimState2(__f_dash)
          } else {
            this._a = new AnimState2(__f_back_dash)
          }
          return
        }

      }
    }

    if(this._a._f === __f_back_walk) {
      if (off === this._facing * -1) {
        this._a = new AnimState2(__f_idle)
      }
      if (this._facing === on) {
        this._a = new AnimState2(__f_walk)
      } else if (this._facing === -on) {
        this._a = new AnimState2(__f_back_walk)
      }

    } else if (this._a._f === __f_walk) {
      if (off === this._facing) {
        this._a = new AnimState2(__f_idle)
      }
      if (this._facing === on) {
        this._a = new AnimState2(__f_walk)
      } else if (this._facing === -on) {
        this._a = new AnimState2(__f_back_walk)
      }

    } else if (this._a._f === __f_idle) {
      if (this._facing === on) {
        this._a = new AnimState2(__f_walk)
      } else if (this._facing === -on) {
        this._a = new AnimState2(__f_back_walk)
      }
    }
  }

  _update(dt: number, dt0: number) {


    this._floor_x.force = 0

    if (this.data.tag === 'user') {
      user_update(this)
    }

    this._a.update(dt, dt0)


    let { res, res0 } = this._a

    if (this._a._f === __f_attack) {
      if (res && res0) {
        let { i } = this._a
        if (res[0].match('att2')) {
          this._floor_x.force = this._floor_x.opts.max_force * this._facing * 1 * (0.8 - i) * (0.8 - i)
        }
      }
      if (!res) {
        this._a = new AnimState2(__f_idle)
      }
    }
    if (this._a._f === __f_dash) {
      if (res && res0) {
        let { i } = this._a
        this._floor_x.force = this._floor_x.opts.max_force * this._facing * 1.2 * (1 - i * i)
      }

      if (!res) {
        this._a = new AnimState2(__f_idle)
      }
    } else if (this._a._f === __f_back_dash) {
      if (res && res0) {
        let { i } = this._a
        this._floor_x.force = this._floor_x.opts.max_force * -1 * this._facing * 1 * (1 - i * i)
      }

      if (!res) {
        this._a = new AnimState2(__f_idle)
      }
    }
    if (this._a._f === __f_back_walk) {
      if (res && res0) {
        let { i } = this._a
        this._floor_x.force = this._floor_x.opts.max_force * -1 * this._facing * 0.6 * (1 - i)
      }
    }
    if (this._a._f === __f_walk) {
      if (res && res0) {
        let { i } = this._a
        this._floor_x.force = this._floor_x.opts.max_force * this._facing * (1 - i)
      }
    }




    rigid_update(this._floor_x, dt, dt0)


    if (this._x < -800) {
      this._floor_x.x = -800
      this._floor_x.x0 = -800
    }
    if (this._x > 800) {
      this._floor_x.x = 800
      this._floor_x.x0 = 800
    }
  }

  _draw() {
    
    let { z } = this.data
    let { _x } = this
    let _y = 0

    let [name, x, y, w, h] = this._a.res

    let i = Math.abs(Math.cos(this.life * 0.001)) * 5
    this.g.texture(0xff0000, 0, 0, 0, 
                   _x, _y + 60, -100 + z, 
                   w * 2, h * 2, x, y, w, h, 1024, 1024)
  }
}



class Cinema extends WithPlays {

  get x1() {
    return this._p1._x
  }

  get x2() {
    return this._p2._x
  }

  get m() {
    return (this.x1 + this.x2) / 2
  }

  get d() {
    return Math.abs(this.x1 - this.x2)
  }

  _init() {
    this._p1 = this.plays.tag(PlayerFloor, 'user')
    this._p2 = this.plays.tag(PlayerFloor, 'ai')

    this.c.o.z = -500
  }


  _update(dt: number, dt0: number) {

    let a = Math.sin(this.life * 0.001) * 500


    this.c.o.x = lerp_dt(0.1, dt, this.c.o.x, this.m)
    this.c.l.x = lerp_dt(0.1, dt, this.c.l.x, this.m)

    let dz = this.d > 800 ? -500 + (this.d / 1600) * -360 : -500

    this.c.o.z = lerp_dt(0.9, dt/ticks.one, this.c.o.z, dz)

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

const ai_update = (_p: PlayerFloor, dt: number, dt0: number) => {


}

const user_update = (_p: PlayerFloor) => {

  let _left_on = _p.i.just_ons.find(_ => _ === 'ArrowLeft'),
    _right_on = _p.i.just_ons.find(_ => _ === 'ArrowRight')

  let _left_off = _p.i.just_offs.find(_ => _ === 'ArrowLeft'),
    _right_off = _p.i.just_offs.find(_ => _ === 'ArrowRight')

  let _f_on = _p.i.just_ons.find(_ => _ === 'f')

  let h_on = _left_on ? -1 : _right_on ? 1 : 0
  let h_off = _left_off ? -1 : _right_off ? 1 : 0


  _p._horizontal(h_on, h_off)
  if (_f_on) { _p._attack() }
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


  get z_objects() {
    return this.objects.sort((a, b) => b.z - a.z)

  }

  _init() {

    this.objects = []
    this.ui = []

    this.make(PlayerFloor, {
      tag: 'user',
      v_pos: Vec2.make(-300, 0),
      z: -1
    })

    this.make(PlayerFloor, {
      tag: 'ai',
      v_pos: Vec2.make(300, 0),
      z: 0
    })


    this.make(Cinema)
  }

  _update(dt: number, dt0: number) {
    this.objects.forEach(_ => _.update(dt, dt0))
  }
  _draw() {

    let a_pi = Math.sin(this.life * 0.001) * Math.PI
    /*
    this.g.texture(0x0000ff, 0, 0, 0,    0, 0, 0,  320, 320, 0, 0, 16, 16, 512, 512)
    this.g.texture(0x00ffff, 0, a_pi, 0,       0,-400, 0,  320, 320, 0, 0, 16, 16, 512, 512)
    this.g.texture(0xff00ff, 0, 0, a_pi,       0,   0, 0,  320, 320, 0, 0, 16, 16, 512, 512)
   */


    /*
    this.g.texture(0x0000ff, half_pi * 0.8, 0, 0, 0, 200, 0, 1920, 300, 0, 0, 40, 40, 512, 512)
    this.g.texture(0x0000ff, half_pi * 0.9, 0, 0, 0, 300, 0, 1920, 800, 0, 0, 40, 40, 512, 512)
    this.g.texture(0xff0000, half_pi*0.2, 0, 0, 0, -100, 0, 1920, 540, 0, 0, 40, 40, 512, 512)
     */



    //this.g.texture(0xcccccc, 0, a_pi, 0, 0, 0, 0, 112 * 10, 32 * 50, 0, 0, 112, 32, 1024, 1024)
    //this.g.texture(0xcccccc, a_pi, 0, 0, 0, 0, 50, 112 * 10, 32 * 50, 0, 0, 112, 32, 1024, 1024)

    /*
    this.g.texture(0xcccccc, 0, 0, 0, 0, 0, 0, 200, 4, 0, 0, 10, 10, 1024, 1024)
    this.g.texture(0xcccccc, 0, 0, 0, 0, 0, 0, 4, 200, 0, 0, 10, 10, 1024, 1024)
    this.g.texture(0xcccccc, 0, half_pi, 0, 0, 0, 0, 200, 4, 0, 0, 10, 10, 1024, 1024)
   */

    this.g.texture(0xcccccc, half_pi, 0, 0, 0, 200, -100, 2000, 2000, 0, 120, 512, 120, 1024, 1024)
    this.g.texture(0xcccccc, 0, 0, 0, 0, 0, 100, 2000, 2000, 0, 0, 256, 120, 1024, 1024)

    this.z_objects.forEach(_ => _.draw())
  }
}
