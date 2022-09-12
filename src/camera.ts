import { Mat4, Vec3 } from './webgl/math4'
import { Quat, Billboard } from './webgl/math4'



export default class Camera  {


  get v_matrix() {
    return this.c_matrix.inverse
  }

  get vp_matrix() {
    return this.p_matrix.mul(this.v_matrix)
  }

  //p_matrix = Mat4.perspective(Math.PI*0.4, 16/9, 10, 1000)
  p_matrix = Mat4.perspective_from_frust(Math.PI*0.4, 16/9, 10, 1000)

  get c_matrix() {
    //return Mat4.identity.translate(Vec3.make(100, 100, 500))
    return Mat4.lookAt(this.o, this.l, Vec3.up)
  }

  constructor(readonly o: Vec3, readonly l: Vec3) {}
 
}


const mm = (rx, ry, rz, x, y, z, w, h) => {
  let _q = Quat.identity
    .rotateX(rx)
    .rotateY(ry)
    .rotateZ(rz)
  return Mat4.identity
    .translate(Vec3.make(x, y, z))
    .rotate(_q)
    .scale(Vec3.make(w, h, 0))
    .translate(Vec3.make(-1/2, 1/2, 0))
}


let camera = new Camera(Vec3.make(0, 0, -500), Vec3.make(0, 0, 0))

let mt = mm(0.2, 0, 0, 0, 6, 0, 100, 100)


let b = Billboard.unit

let vs = b.vertices.map(_ => mt.mVec3(_))

console.table(b.vertices)
console.table(vs)
