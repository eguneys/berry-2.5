import vSource from './default.vert'
import fSource from './skullgirls.frag'
import { color_rgb } from './util'
import { Rectangle, Matrix } from '../vec2'
import { Quat, Vec3, Mat4, Billboard } from './math4'
import { Quad } from './quad'

const m_template = Matrix.identity.scale(640, 360)


/* math4 tests */
/*
const arr_equal = (a, b) => a.find((_, i) => _ !== b[i])
const log_err = err => {  if (err !== undefined) { console.log(`fail ${err}`) } }

let b = Billboard.unit
log_err(arr_equal(b.vertices[0].vs, [0, -1, 0]))
log_err(arr_equal(b.vertices[1].vs, [1, -1, 0]))
log_err(arr_equal(b.vertices[2].vs, [1, 0, 0]))
log_err(arr_equal(b.vertices[3].vs, [0, 0, 0]))

b = Billboard.unit.transform(Mat4.identity)
log_err(arr_equal(b.vertices[0].vs, [0, -1, 0]))
log_err(arr_equal(b.vertices[1].vs, [1, -1, 0]))
log_err(arr_equal(b.vertices[2].vs, [1, 0, 0]))
log_err(arr_equal(b.vertices[3].vs, [0, 0, 0]))


b = Billboard.unit.transform(Mat4.identity.translate(Vec3.make(-1/2, 1/2, 0)))
log_err(arr_equal(b.vertices[0].vs, [-0.5, -0.5, 0]))
log_err(arr_equal(b.vertices[1].vs, [0.5, -0.5, 0]))
log_err(arr_equal(b.vertices[2].vs, [0.5, 0.5, 0]))
log_err(arr_equal(b.vertices[3].vs, [-0.5, 0.5, 0]))


b = Billboard.unit.transform(Mat4.identity
                             .scale(Vec3.make(10, 20, 0))
                             .translate(Vec3.make(-1/2, 1/2, 0))
                            )
log_err(arr_equal(b.vertices[0].vs, [-0.5, -0.5, 0]))
log_err(arr_equal(b.vertices[1].vs, [0.5, -0.5, 0]))
log_err(arr_equal(b.vertices[2].vs, [0.5, 0.5, 0]))
log_err(arr_equal(b.vertices[3].vs, [-0.5, 0.5, 0]))
*/

export class Batcher {

  nb = 24000
  _els = []
  _indexBuffer = new Uint16Array(this.nb * 3)
  _attributeBuffer = new Float32Array(this.nb * 9)

  constructor(readonly g: Graphics) {}

  init(bg, images) {
    let { g, nb } = this
    this._def = g.glProgram(vSource, fSource, nb)
    //this._def2 = g.glProgram(vSource, fSource2, nb)

    g.glOnce({
      color: bg
    })

    let { glTexture } = g.glTexture(0)
    g.glUseTexture(glTexture, images[0], 0)

    let { glTexture: glTexture2 } = g.glTexture(1)
    g.glUseTexture(glTexture2, images[1], 1)
  }


  texture(color: number, rx: number, ry: number, rz: number, x: number, y: number, z: number, w: number, h: number, sx: number, sy: number, sw: number, sh: number, tw: number, th: number) {
    let _q = Quat.identity
    .rotateX(rx)
    .rotateY(ry)
    .rotateZ(rz)
    let res = Mat4.identity
    .translate(Vec3.make(x, y, z))
    .scale(Vec3.make(w, h, 0))
    .rotate(_q)
    .translate(Vec3.make(-1/2, 1/2, 0))
    //.translate(Vec3.make(1/2, -1/2, 0))
    let quad = Quad.make(tw, th, sx, sy, sw, sh)
    this._els.push([0, res, color, quad, -1, th])
  }


  u_blend = [0.1, 2.5, 0.5, 0.5]


  render() {

    let { g } = this
    let { _indexBuffer, _attributeBuffer } = this

    let { u_blend } = this

    g.glClear()

    let _batch = this._els[0]?.[0]
    let _batch_i = 0

    let aIndex = 0,
      iIndex = 0

    this._els.forEach((_, i) => {

      let [def, matrix, color, quad, type, type2] = _

      let el = Billboard.unit.transform(matrix)
      let { vertexData, indices } = el
      let { fsUv } = quad
      let tintData = color_rgb(color)
      for (let k = 0; k < vertexData.length; k+= 3) {
        _attributeBuffer[aIndex++] = vertexData[k]
        _attributeBuffer[aIndex++] = vertexData[k+1]
        _attributeBuffer[aIndex++] = vertexData[k+2]

        _attributeBuffer[aIndex++] = fsUv[2 * k/3]
        _attributeBuffer[aIndex++] = fsUv[2 * k/3+1]

        _attributeBuffer[aIndex++] = tintData[0]
        _attributeBuffer[aIndex++] = tintData[1]
        _attributeBuffer[aIndex++] = tintData[2]

        _attributeBuffer[aIndex++] = type
        _attributeBuffer[aIndex++] = type2
      }

      for (let k = 0; k < indices.length; k++) {
        _indexBuffer[iIndex++] = _batch_i * 4 + indices[k]
      }

      if (!this._els[i+1] || this._els[i+1][0] !== _batch) {
        if (iIndex / 6 === _batch_i) {
          //console.log(i, _batch_i, iIndex / 6, iIndex)
          //throw 3
        }
        _batch = this._els[i+1]?.[0]
        let { program, uniformData, indexBuffer, attributeBuffer, vao } = (def || this._def)
        g.glUse(program, uniformData)

        g.glAttribUpdate(attributeBuffer, _attributeBuffer)
        g.glIndexUpdate(indexBuffer, _indexBuffer)
        g.glUniformUpdate(uniformData, u_blend)

        g.glDraw(iIndex, vao)
        aIndex = 0
        iIndex = 0
        _batch_i = 0
      } else {
        _batch_i++
      }
    })

    this._els = []

  }
}
