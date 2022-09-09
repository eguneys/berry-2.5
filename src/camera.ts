import { Mat4, Vec3 } from './webgl/math4'

export default class Camera  {



  p_matrix = Mat4.perspective(Math.PI*0.4, 16/9, 10, 1000)

  get c_matrix() {
    return Mat4.lookAt(this.o, this.l, Vec3.up)
  }

  constructor(readonly o: Vec3, readonly l: Vec3) {}
 
}
