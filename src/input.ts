import JPR from './jpr'
let RE = /^[sdfSDF]$/
let RE2 = /^(\s|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|\*)$/
function capture_key(key: string) {
    return key.match(RE) || key.match(RE2)
}

export class Input {
  clear() {
    this._jpr = new Map()
  }


  _jpr: Map<string, JPR> = new Map()

  get just_ons() {
    let { _jpr } = this
    return [..._jpr.keys()].filter(_ => _jpr.get(_).just_on)
  }

  get been_ons() {
    let { _jpr } = this
    return [..._jpr.keys()]
    .filter(_ => _jpr.get(_).been_on !== undefined)
    .map(_ => [_, _jpr.get(_).been_on])
  }

  get just_offs() {
    let { _jpr } = this
    return [..._jpr.keys()].filter(_ => _jpr.get(_).just_off)
  }

  _on(key: string) {
    if (!this._jpr.has(key)) {
      this._jpr.set(key, new JPR())
    }

    if (this._jpr.get(key).been_on) {
      return
    }
    this._jpr.get(key)._on()
  }

  _off(key: string) {
    if (!this._jpr.has(key)) {
      this._jpr.set(key, new JPR())
    }

    this._jpr.get(key)._off()
  }

  update(dt: number, dt0: number) {
    for (let [key, value] of this._jpr) {
      value.update(dt, dt0)
    }
  }


  init() {


    document.addEventListener('keydown', e => {
      if (e.ctrlKey || !capture_key(e.key)) {
        return
      }
      e.preventDefault()
      this._on(e.key)
    })


    document.addEventListener('keyup', e => {
      if (e.ctrlKey || !capture_key(e.key)) {
        return
      }

      e.preventDefault()
      this._off(e.key)
    })

    return this
  }

}
