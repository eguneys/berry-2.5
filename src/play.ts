import { ticks } from './shared'
import { ti, completed, read, update, tween } from './anim'
import { Line, Vec2, Rectangle, Circle } from './vec2'
import { generate, psfx } from './audio'

import { appr, lerp, lerp_dt } from './lerp'
import { make_rigid, rigid_update } from './rigid'
import { __f_blo, __f_one_hit, __f_lie, __f_vic, __f_ko, __f_ko_hit, __f_dam, __f_attack, __f_back_dash, __f_dash, __f_back_walk, __f_walk, __f_idle, __f_turn } from './animstate'
import { AnimState2, hurtboxes } from './animstate'


import { Spring  }from './spring'


const quick_burst = (radius: number, start: number = 0.8, end: number = 0.2) => 
tween([start, start, 1, end].map(_ => _ * radius), [ticks.five + ticks.three, ticks.three * 2, ticks.three * 2])

const rect_rect = (a: Rectangle, b: Rectangle) => {
  return !!a.vertices.find(_ => rect_orig(b, _)) || rect_orig(b, a.center)
}

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

  set _x(v: number) {
    this._floor_x.x = v
    this._floor_x.x0 = v
  }

  get hurtboxes() {
    let { res } = this._a

    if (res) {
      let _ = hurtboxes.get(res[0])?.[0]
      if (_) {
        let __ = [
          _[0] + this._x,
          _[1] + 60,
          _[2] * 2,
          _[3] * 2]
        return Rectangle.make(...__)
      }
    }
  }


  get hitboxes() {
    let { res } = this._a

    if (res) {
      let _ = hurtboxes.hit(res[0])?.[0]
      if (_) {
        let __ = [
          this._facing * _[0] + this._x,
          _[1] + 60,
          _[2] * 2,
          _[3] * 2]
        return Rectangle.make(...__)
      }
    }
  }

  _reset() {

    this._x = this.data.v_pos.x

    this._t_hitstop = 0
    this._t_victory = ticks.seconds * 100

    this._a = new AnimState2(__f_idle)

  }

  _init() {

    this._t_victory = ticks.seconds * 100

    this.lock = true
    let { x } = this.data.v_pos

    this._t_hitstop = 0

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
    if (this.lock) {
      return 
    }

    if (this._p2) {
      if (this._p2._allow_ko > 0) {
        //this._t_hitstop = 0
        this._a = new AnimState2(__f_ko_hit)
        this._p2._allow_ko = -ticks.half
        this.lock = true
        this._p2.lock = true
        return
      }
    }

    if (this._a._f === __f_attack) {
    } else {
      this._a = new AnimState2(__f_attack)
    }
  }

  _horizontal(on, off, been_on) {
    if (this.lock) {
      return
    }

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
      if (this._facing === on || this._facing === been_on) {
        this._a = new AnimState2(__f_walk)
      } else if (this._facing === -on || this._facing === -been_on) {
        this._a = new AnimState2(__f_back_walk)
      }
    }
  }

  _update(dt: number, dt0: number) {
    this._t_victory = appr(this._t_victory, 0, dt)
    this._t_hitstop = appr(this._t_hitstop, -ticks.seconds, dt)
    this._allow_ko = appr(this._allow_ko, 0, dt)


    if (this.data.tag === 'user') {
      user_update(this)
    } else {
      if (this.between_interval(ticks.seconds * 2)) {
        attacker_update(this)
      } else {
        (this.data.update || ai_update)(this)
      }
    }

    if (this._t_hitstop > 0) {
      return
    }

    if (this._t_victory === 0) {
      
      let c = this.plays.one(Counter)
      c.vic(this.data.tag)
      this._t_victory = -ticks.seconds * 1000
    }

    if (!this._p2) {
      let op_tag = this.data.tag === 'user' ? 'ai' : 'user'
      this._p2 = this.plays.tag(PlayerFloor, op_tag)
    }

    this._floor_x.force = 0

    this._a.update(dt, dt0)

    let { res, res0 } = this._a


    if (this._allow_ko < 0) {
      this._allow_ko = 0
      this._a = new AnimState2(__f_ko)
    }


    if (this._a._f === __f_blo) {
      if (res && res0) {
        let { i } = this._a

        this._floor_x.force = this._floor_x.opts.max_force * this._facing * 1 * (0.4 - i)
      }
      if (!res) {



        this._a = new AnimState2(__f_idle)
      }
    }

    if (this._a._f === __f_ko) {
      if (res && res0) {
        let { i } = this._a
        if (i < ticks.one * 2 / ticks.seconds) {
          this.make(HungaMunga, {
            x: this._x,
            text: 'ko'
          })
        }
      }
      if (!res) {
        this._a = new AnimState2(__f_lie)
      }
    }

    if (this._a._f === __f_ko_hit) {
      if (!res) {
        this._a = new AnimState2(__f_vic)
        this._t_victory = ticks.seconds * 2
      }
    }

    if (this._a._f === __f_turn) {
      if (!res) {
        this._facing *= -1
        this._a = new AnimState2(__f_idle)
      }
    }

    if (this._a._f === __f_attack) {

      if (res && res0) {

        if (res[0] !== res0[0]) {
          this.plays.audio._buff.push(0)
				}


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

    if (this._a._f === __f_dam) {
      if (res && res0) {

        let { i } = this._a

        if (i < ticks.one * 2 / ticks.seconds) {
          this._allow_ko = ticks.lengths
          this.plays.audio._buff.push(1)
        }

        this._floor_x.force = this._floor_x.opts.max_force * -this._facing * (1 - i)
      }
      if (!res) {
        this._a = new AnimState2(__f_idle)
      }
    }


    if (this._p2) {


      let _d = this._p2._x - this._x

      if (Math.sign(_d) !== this._facing) {
        if (this._a._f !== __f_turn) {
          this._a = new AnimState2(__f_turn)
        }
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
                   this._facing * w * 2, h * 2, x, y, w, h, 1024, 1024)


                   return
    let { hurtboxes, hitboxes } = this


    if (hitboxes) {
      let [__x, __y, _w, _h] = hitboxes.vs
      this.g.texture(0xcccccc, 0, 0, 0,
                     __x, __y, -100 + z + -1,
                     _w, _h, 
                     1008, 2, 2, 2, 1024, 1024)

    }

    if (hurtboxes) {
      let [__x, __y, _w, _h] = hurtboxes.vs 
      this.g.texture(0xcccccc, 0, 0, 0,
                     __x, __y, -100 + z + -1,
                     _w, _h, 
                     1008, 0, 2, 2, 1024, 1024)
    }
  }
}


class Hitstop extends WithPlays {

  _init() {
    this._p1 = this.plays.tag(PlayerFloor, 'user')
    this._p2 = this.plays.tag(PlayerFloor, 'ai')
  }


  _update(dt: number, dt0: number) {

    let { res } = this._p2._a
    if (this._p2._a._f === __f_dam || this._p1._a._f === __f_dam) {
      if (this._p1._t_hitstop <= -ticks.half) {
        this._p1._t_hitstop = ticks.thirds
        this._p2._t_hitstop = ticks.thirds
        this.make(HungaMunga, {
          text: 'attack',
          x: this._p1._x
        })
      }
    }

    if (this._p1._a._f === __f_ko || this._p2._a._f === __f_ko) {
      if (this._p2._t_hitstop <= -ticks.half) {
        this._p1._t_hitstop = ticks.half
        this._p2._t_hitstop = ticks.half
      }
    }


  }
}

class Collision extends WithPlays {

  get p1_hit() {
    return this._p1.hitboxes
  }

  get p1_hurt() {
    return this._p1.hurtboxes
  }

  get p2_hit() {
    return this._p2.hitboxes
  }

  get p2_hurt() {
    return this._p2.hurtboxes
  }

  _init() {
    this._p1 = this.plays.tag(PlayerFloor, 'user')
    this._p2 = this.plays.tag(PlayerFloor, 'ai')
  }


  _update(dt: number, dt0: number) {

    let { p1_hit, p2_hurt } = this

    let { p2_hit, p1_hurt } = this

    if (p2_hit && p1_hurt) {
      if (rect_rect(p2_hit, p1_hurt)) {
        console.log(this._p1._a._f)
        if (this._p1._a._f === __f_back_walk || this._p1._a._f === __f_back_dash) {
          this._p1._a = new AnimState2(__f_blo)
        } else {
          this._p1._a = new AnimState2(__f_dam)
        }
      }
    }



    if (p1_hit && p2_hurt) {
      if (rect_rect(p1_hit, p2_hurt)) {
        if (this._p2._a._f === __f_back_walk || this._p2._a._f === __f_back_dash) {
          this._p2._a = new AnimState2(__f_blo)
        } else {
          this._p2._a = new AnimState2(__f_dam)
        }
      }
    }

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


    if (this._p1._t_hitstop > 0 || this._p2._t_hitstop > 0) {
      dz += (this._p1._t_hitstop* (ticks.one / ticks.seconds)) * 30
    }


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

const attacker_update = (_p: PlayerFloor, dt: number, dt0: number) => {

  if (!_p.attacker)  {
    _p.attacker = {}
  }



  if (!_p._p2) {
    return
  }

  let _d = Math.abs(_p._x - _p._p2._x)


  if (_d > 200 && _p.attacker.on === _p._facing && (_p.on_interval(ticks.half) && !_p.on_interval(ticks.half + ticks.thirds))) {
    _p.attacker.on = _p._facing * -1
    _p._horizontal(_p.attacker.on, _p._facing)
    return
  }

  if (_d > 300 && _p.attacker.on === 0 && _p.on_interval(ticks.thirds)) {
    _p.attacker.on = _p._facing
    _p._horizontal(_p.attacker.on, 0)
  }

  if (_d < 300 || _p.on_interval(ticks.half)) {
    _p._horizontal(0, _p.attacker.on)
    _p.attacker.on = 0
  }

  if (_p._p2 && _p._p2._allow_ko > 0) {
    _p._attack()
    return
  }
 

    if (_d < 260 && (_p._p2._a.res[0] === 'att_2' || _p.on_interval(ticks.sixth))) {
      _p._attack()
    }



}

const blocker_update = (_p: PlayerFloor, dt: number, dt0: number) => {

  if (!_p._p2) {
    return
  }

  let _d = Math.abs(_p._x - _p._p2._x)

  if (!_p.blocker)  {
    _p.blocker = {}
  }


  if (_p._p2 && _p._p2._allow_ko > 0) {
    _p._attack()
    return
  }
  // TODO whiplash
  if (_p._p2._a._f === __f_attack) {

    if (_d < 160) {
      _p.blocker.on = _p._facing * -1
      _p._horizontal(_p.blocker.on, 0)
    }

    if (_d < 160 && _p._p2._a.res[0] === 'att_2') {
      _p._attack()
    }
    return
  }

  if (_d < 100) {
    _p.blocker.on = _p._facing * -1
    _p._horizontal(_p.blocker.on, 0)
  }


  if (!!_p.blocker.on && _d > 100) {
    _p._horizontal(0, _p.blocker.on)
    _p.blocker.on = 0
  }




}

const ai_update = (_p: PlayerFloor, dt: number, dt0: number) => {

  //let h_on = rnd_int_h(1)
  //let h_off = rnd_int_h(1)

  //_p._horizontal(h_on, h_off)

  if (_p._p2 && _p._p2._allow_ko > 0) {
    _p._attack()
  }
  if (_p.on_interval(ticks.half)) {
    _p._attack()
  }

}

const user_update = (_p: PlayerFloor) => {

  let _left_been_on = _p.i.been_ons.find(_ => _[0] === 'ArrowLeft'),
    _right_been_on = _p.i.been_ons.find(_ => _[0] === 'ArrowRight')

  let _left_on = _p.i.just_ons.find(_ => _ === 'ArrowLeft'),
    _right_on = _p.i.just_ons.find(_ => _ === 'ArrowRight')

  let _left_off = _p.i.just_offs.find(_ => _ === 'ArrowLeft'),
    _right_off = _p.i.just_offs.find(_ => _ === 'ArrowRight')

  let _f_on = _p.i.just_ons.find(_ => _ === 'f')

  let h_on = _left_on ? -1 : _right_on ? 1 : 0
  let h_off = _left_off ? -1 : _right_off ? 1 : 0

  let _h_been = _left_been_on ? -1 : _right_been_on ? 1 : 0

  _p._horizontal(h_on, h_off, _h_been)
  if (_f_on) { _p._attack() }
}


class Audio extends WithPlays {


  _init() {
		this._buff = []
  }

  _update(dt: number, dt0: number) {



    if (!this._gen && this.i._ready) {
      this._gen = true
      generate(() => {
        this._ready = true
      })
    }


    if (this._ready) {
			let _ = this._buff.pop()
			if (_ !== undefined) {
				psfx(_)
			}
    }

  }
}

class Countdown extends WithPlays {
  _init() {

    this.make(HungaMunga, {
      text: '3'
    }, ticks.half)
    this.make(HungaMunga, {
      text: '2'
    }, ticks.half + ticks.seconds * 1)
    this.make(HungaMunga, {
      text: '1'
    }, ticks.half + ticks.seconds * 2)
    this.make(HungaMunga, {
      text: 'hunga'
    }, ticks.half + ticks.seconds * 3)


    this._p1 = this.plays.tag(PlayerFloor, 'user')
    this._p2 = this.plays.tag(PlayerFloor, 'ai')


    this._p1._reset()
    this._p2._reset()
  }

  _update(dt, dt0) {
    if (this.on_interval(ticks.seconds * 4)) {
      this.plays.all(PlayerFloor).forEach(_ => {
        _.lock = false
      })
      this.dispose()
    }
  }
}


class FtoStart extends WithPlays {

  _init() {
    this._p1 = this.plays.tag(PlayerFloor, 'user')
    this._p2 = this.plays.tag(PlayerFloor, 'ai')

    this._p1._x = -200
    this._p2._x = +200
    

    this.make(Counter)
  }

  _update() {
    this.z = -200 + Math.sin(this.life * 0.002) * 10


    if (this.i.just_ons.find(_ => _ === 'f')) {
      this.make(Countdown)
      this.dispose()
    }
  }

  _draw() {

    let x = -200 
    let y = 200
    let z = this.z
    let [_x, _y, _w, _h] = _ss['f']

    let i = Math.sin(this.life * 0.008)
    this.g.texture(0xcccccc, 0, 0, 0, x, y + -200 + i * 20, z,  _w * 2, _h * 2, _x, _y, _w, _h, 1024, 1024)

    let [__x, __y, __w, __h] = _ss['tostart']

    x += 230

    this.g.texture(0xcccccc, 0, 0, 0, x, y -200, z,  __w * 2, __h * 2, __x, __y, __w, __h, 1024, 1024)

  }
}


class Counter extends WithPlays {

  _init() {

    this._p1 = 0
    this._p2 = 0

    this._t_vic = ticks.seconds * 10000
    this._t_reset = ticks.seconds * 10000
  }


  vic(tag: string) {
    if (tag === 'user') {
      this._p1+= 1
    } else {
      this._p2 += 1
    }

    if (this._p1 === 3 || this._p2 === 3) {
      this._t_reset = ticks.seconds * 4
      return
    }



    this._t_vic = ticks.seconds * 2
  }

  _update(dt: number, dt0: number) {


    this._t_vic = appr(this._t_vic, 0, dt)
    this._t_reset = appr(this._t_reset, 0, dt)

    if (this._t_reset === 0) {
      this.dispose()
      this.make(FtoStart, {
        x: this._x
      })

      return
    }

    if (this._t_vic === 0) {
      this._t_vic = ticks.seconds * 30000
      this.make(Countdown)
    }
  }


  _draw() {

    let c_x = this.c.o.x

    let x = -460
    let y = -60
    let z = -50

    for (let i = 0; i < 3; i++) {
      let _on = i < this._p1 ? 'on' : 'off'
      let [_x, _y, _w, _h] = _ss['_c_' + _on]

      this.g.texture(0xcccccc, 0, 0, 0, i * _w * 2 + c_x + x, y -200, z,  _w * 2, _h * 2, _x, _y, _w, _h, 1024, 1024)
    }


    x += 800

    for (let i = 0; i < 3; i++) {
      let _on = i < this._p2 ? 'on' : 'off'
      let [_x, _y, _w, _h] = _ss['_c_' + _on]

      this.g.texture(0xcccccc, 0, 0, 0, i * _w * 2 + c_x + x, y -200, z,  _w * 2, _h * 2, _x, _y, _w, _h, 1024, 1024)
    }
  }
}

class HungaMunga extends WithPlays {


  _init() {
    this._s_x = Spring.make(0, 200, 8)
    this._s_x.pull(-200)

    this._s_y = Spring.make(-2000, 50, 6)
    this._s_y.pull(2000)
  }

  _update(dt: number, dt0: number) {
    this._s_x.update(dt)
    if (this.life > ticks.seconds) {
      this._s_y.update(dt)
    }

    if (this.life > ticks.seconds * 3) {
      this.dispose()
    }

    this.z = this._s_x.x
  }

  _draw() {

    let __x = this.data.x || 0
    let { x } = this._s_x
    let { x: y } = this._s_y

    let [_x, _y, _w, _h] = _ss[this.data.text]

    let i = Math.sin(this.life * 0.001)
    this.g.texture(0xcccccc, 0, i * Math.PI * 0.2 *  100 / _w, 0, __x + y, -200, x,  _w * 2, _h *2, _x, _y, _w, _h, 1024, 1024)
  }
}

let _ss = {
  hunga: [0, 273, 652, 120],
  3: [0, 384, 67, 85],
  2: [86, 384, 67, 85],
  1: [152, 384, 67, 85],
  ko: [0, 480, 180, 120],
  attack: [0, 384, 67, 85],
  f: [20, 630, 48, 50],
  tostart: [64, 624, 176, 48],
  _c_on: [13, 688, 38, 33],
  _c_off: [56, 688, 38, 33]
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

  get audio() {
		return this.one(Audio)
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
      update: blocker_update,
      v_pos: Vec2.make(300, 0),
      z: 0
    })


    this.make(Hitstop)
    this.make(Collision)
    this.make(Cinema)

		this.make(Audio)



    this.make(FtoStart)
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

    this.g.texture(0xcccccc, 0, -half_pi * 0.3, half_pi, -500, 0, 100, 2000, 2000, 0, 0, 256, 120, 1024, 1024)
    this.g.texture(0xcccccc, 0, 0, half_pi * 0.3, 1500, 0, 100, 2000, 2000, 0, 0, 256, 120, 1024, 1024)

    this.z_objects.forEach(_ => _.draw())
  }
}
