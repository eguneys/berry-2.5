import { ticks } from './shared'
import { read, tween, completed, update } from './anim'

const expand_ff = (_ff: Array<string>) => {
  let next_s, last_t

  return _ff.flatMap(_ => {
    let [name, res] = _.split('@')

    let [s, n, t] = res.split(' ')

    if (!t) {
      t = '0,0'
    }
    if (t === '~') {
      t = last_t
    }
    if (s === '~') {
      s = next_s
    }

    let [x,y,w,h] = s.split(',').map(_ => parseInt(_)),
      [tx, ty] = t.split(',').map(_ => parseInt(_));

    return [...Array(parseInt(n)).keys()].map(i => {
      next_s = [x+w * (i + 1),y,w,h].join(',')
      last_t = t

      return [[name, i].join('_'), x + w * i, y, w, h, tx, ty]
    })
  })
}


let _ff = [
  `i@0,0,70,120 2`,
  `w@140,0,70,120 3`,
  `bw@140,0,70,120 3`,
  `d@0,120,70,120 1`,
  `bd@284,240,70,120 1`,
  `att@576,0,124,130 3`,
  `dam@70,120,70,120 1`,
  `tt@0,0,70,120 1`,
  `ko@210,120,70,120 1`,
  `koh@0,240,70,120 1`,
  `lie@432,0,113,103 1`,
  `vic@144,240,70,120 1`
]


const _ff_expand = expand_ff(_ff)

export let __f_walk = `w@0.1 _l`
export let __f_back_walk = `bw@0.2 _l`
export let __f_idle = `i@0.2 _l`
export let __f_turn = `tt@0.1 _`
export let __f_dash = `d@0.2 _`
export let __f_back_dash = `bd@0.2 _`
export let __f_attack = `att@0.1 _`
export let __f_dam = `dam@0.2 _`
export let __f_ko = `ko@0.5 _`
export let __f_ko_hit = `koh@0.5 _`
export let __f_lie = `lie@0.3 _l`
export let __f_vic = `vic@0.3 _l`




let _hu = [
  `i_0@0,50,30,100`,
  `i_1@0,40,30,100`,
  `w_0@0,40,30,100`,
  `w_1@0,40,30,100`,
  `w_2@0,40,30,100`,
  `att_0@-30,30,30,100`
]

let _hi = [
  `att_1@50,30,60,30`
]




export class Hitboxes {

  get(name: string) {
    return this._ff.get(name)
  }

  hit(name: string) {
    return this._ft.get(name)
  }


  constructor() {
    this._ff = new Map(_hu.map(_ => {
      let [name, res] = _.split('@')

      let __res = res.split(' ').map(_ => {
        let [x, y, w, h] = _.split(',')

        return [+x, +y, +w, +h]
      })

      return [name, __res]
    }))

    this._ft = new Map(_hi.map(_ => {
      let [name, res] = _.split('@')

      let __res = res.split(' ').map(_ => {
        let [x, y, w, h] = _.split(',')

        return [+x, +y, +w, +h]
      })

      return [name, __res]
    }))






  }
}


export const hurtboxes = new Hitboxes()

export class AnimState2 {

  get i() {
    return read(this.th)[0]
  }

  get res() {
    return this.current_frame?.[1]
  }

  get current_frame() {
    return this._frames[0]
  }

  get frames() {
    let _last_dur
    return this._f.split(' ').slice(0, -1).flatMap(_ => {
      let [name, dur] = _.split('@')
      if (!dur) {
        dur = _last_dur
      }
      _last_dur = dur

      return _ff_expand
      .filter(__ => __[0].split('_')[0] === name)
      .map(_ => [parseFloat(dur) * ticks.seconds, _])
    })
  }
  
  get loop() {
    return this._f.split(' ').at(-1) === '_l'
  }


  update(dt: number, dt0: number) {
    this.res0 = this.res
    if (!this.res) {
      return
    }
    update(this.th, dt, dt0)
    if (completed(this.th)) {
      this._th = undefined
      this._frames.shift()
      if (this.loop && this._frames.length === 0) {
        this._frames = this.frames.slice(0)
      }
    }
  }

  get th() {
    if (!this._th) {
      this._th = tween([0, 1], [this.current_frame[0]])
    }
    return this._th
  }

  constructor(readonly _f: string) { 
    this._frames = this.frames.slice(0)
  }
}
