import { ticks } from './shared'
import { tween, completed, update } from './anim'

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
  `i@0,0,160,200 5`,
  `w@0,200,160,200 4`
]


const _ff_expand = expand_ff(_ff)

export let __f_walk = `w@0.2 _l`
export let __f_idle = `i@0.2 _l`
export let __f_turn = `tt@0.1 _`



export class AnimState2 {


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
    if (!this.res) {
      return
    }
    this.res0 = this.res
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
