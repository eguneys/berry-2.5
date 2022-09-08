import vSource from './default.vert'
import fSource from './default.frag'
import { color_rgb } from './util'
import { Rectangle, Matrix } from '../vec2'
import { Quat, Vec3, Mat4, Billboard } from './math4'
import { Quad } from './quad'

const m_template = Matrix.identity.scale(640, 360)

export class Batcher {

  nb = 24000
  _els = []
  _indexBuffer = new Uint16Array(this.nb * 3)
  _attributeBuffer = new Float32Array(this.nb * 9)

  constructor(readonly g: Graphics) {}

  init(bg, image) {
    let { g, nb } = this
    this._def = g.glProgram(vSource, fSource, nb)
    //this._def2 = g.glProgram(vSource, fSource2, nb)

    g.glOnce({
      color: bg
    })

    let { glTexture } = g.glTexture()
    g.glUseTexture(glTexture, image)
  }


  texture(color: number, rx: number, ry: number, rz: number, x: number, y: number, z: number, w: number, h: number, sx: number, sy: number, sw: number, sh: number, tw: number, th: number) {
    let _q = Quat.identity
    .rotateX(rx)
    .rotateY(ry)
    .rotateZ(rz)
    let res = Mat4.identity
    .translate(Vec3.make(x, y, z))
    //.translate(Vec3.make(1/2, 1/2, 0))
    .rotate(_q)
    .scale(Vec3.make(w, h, 1))
    //.translate(Vec3.make(-1/2, -1/2, 0))
    let quad = Quad.make(tw, th, sx, sy, sw, sh)
    this._els.push([0, res, color, quad, -1, th])
  }




  render() {

    let { g } = this
    let { _indexBuffer, _attributeBuffer } = this

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
      //console.log(vertexData, fsUv, indices)
      //throw 3

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
