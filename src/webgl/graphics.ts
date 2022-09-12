import { color_rgb } from './util'
import { generateProgram } from './program'
import { Matrix, Vec2 }  from '../vec2'
import { Mat4, Vec3 } from './math4'

export class Graphics {


  get gl() { return this.canvas.gl }

  get width(): number { return this.canvas.width }
  get height(): number { return this.canvas.height }

  get u_matrix() {
    return this.camera.vp_matrix
  }

  constructor(readonly canvas: Canvas, readonly camera: Camera) {}


  glOnce = (options: GlOnceOptions = {}) => {

    let { gl } = this

    if (!gl) { return }

    let { color } = options

    gl.viewport(0, 0, this.width, this.height)
    gl.clearColor(...color_rgb(color||0x000000), 1)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.DEPTH_TEST)
    //gl.enable(gl.CULL_FACE)
  }

  glProgram = (vSource: string, fSource: string, nb: number) => {

    let { gl } = this

    let { program, uniformData, attributeData } = 
      generateProgram(gl, vSource, fSource)


    let vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    let attributeBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, nb * 10 * 4, gl.DYNAMIC_DRAW)
    
    let indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, nb * 3 * 4, gl.DYNAMIC_DRAW)

    let stride = 3 * 4 + 2 * 4 + 3 * 4 + 2 * 4

    let a1loc = attributeData['aVertexPosition'].location
    gl.enableVertexAttribArray(a1loc)
    gl.vertexAttribPointer(a1loc, 3, gl.FLOAT, false, stride, 0)


    let a2loc = attributeData['aTextureCoord'].location
    gl.enableVertexAttribArray(a2loc)
    gl.vertexAttribPointer(a2loc, 2, gl.FLOAT, false, stride, 3*4)


    let a3loc = attributeData['aTint'].location
    gl.enableVertexAttribArray(a3loc)
    gl.vertexAttribPointer(a3loc, 3, gl.FLOAT, false, stride, 3*4 + 2*4)

    let a4loc = attributeData['aType'].location
    gl.enableVertexAttribArray(a4loc)
    gl.vertexAttribPointer(a4loc, 2, gl.FLOAT, false, stride, 3*4 + 2*4 + 3*4)


    gl.bindVertexArray(null)


    return {
      program,
      uniformData,
      indexBuffer,
      attributeBuffer,
      vao
    }
  }

  glTexture(n: number) {

    let { gl } = this
    let glTexture = gl.createTexture() 

    gl.activeTexture(gl.TEXTURE0 + n)
    gl.bindTexture(gl.TEXTURE_2D, glTexture)

    gl.texImage2D(gl.TEXTURE_2D, 0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255]))

    //gl.generateMipmap(gl.TEXTURE_2D)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    return { glTexture }
  }

  glUseTexture(glTexture, texture, n) {
    let { gl } = this
    

   gl.activeTexture(gl.TEXTURE0 + n)
   gl.bindTexture(gl.TEXTURE_2D, glTexture)
   gl.texImage2D(gl.TEXTURE_2D, 0,
     gl.RGBA, texture.width, texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
     texture)
  }
  
  glUse(program, uniformData) {
    let { gl } = this

    gl.useProgram(program)


    if (uniformData['uSampler']) {
      gl.uniform1i(uniformData['uSampler'].location, 0)
      gl.uniform1i(uniformData['uSampler2'].location, 1)
    } else {
      gl.uniform1i(uniformData['uSampler3'].location, 2)
    }
    //gl.uniformMatrix3fv(uniformData['projectionMatrix'].location, false, this.projectionMatrix.array_t)
    gl.uniformMatrix4fv(uniformData['u_matrix'].location, false, this.u_matrix.out)
  }

  glUniformUpdate(uniformData, u_blend) {
    let { gl } = this
    if (!uniformData['u_blend']) { return } 
    gl.uniform1f(uniformData['u_blend'].location, u_blend[0]);
    gl.uniform1f(uniformData['u_mix'].location, u_blend[1]);
    gl.uniform1f(uniformData['u_hmix'].location, u_blend[2]);
    gl.uniform1f(uniformData['u_hhmix'].location, u_blend[3]);
  }

  glAttribUpdate(buffer, srcData) {

    let { gl } = this

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, srcData, 0)
  }

  glIndexUpdate(buffer, srcData) {

    let { gl } = this

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, srcData, 0)
  }

  glClear() {
    let { gl } = this
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  glDraw(nb, vao) {
    let { gl } = this
    gl.bindVertexArray(vao)
    gl.drawElements(gl.TRIANGLES, nb, gl.UNSIGNED_SHORT, 0)
  }
}
