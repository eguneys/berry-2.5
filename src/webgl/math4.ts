export class Billboard {


  static make = (x: number, y: number, z: number,
                 w: number, h: number) => new Billboard([
    Vec3.make(x, y - h, z),
    Vec3.make(x + w, y - h, z),
    Vec3.make(x + w, y, z),
    Vec3.make(x, y, z),
  ])

  static get unit() { return Billboard.make(0, 0, 0, 1, 1) }

  get vertexData(): Float32Array {
    return new Float32Array(
      this.vertices.flatMap(_ => _.vs))
  }

  get indices(): Uint16Array {
    return new Uint16Array([1, 0, 3, 1, 3, 2])
  }


  constructor(readonly vertices: Array<Vec3>) {}


  transform(m: Mat4): Billboard {
    return new Billboard(this.vertices.map(_ => m.mVec3(_)))
  }

}


export class Vec3 {



  static make = (x: number, y: number, z: number) =>
  new Vec3(x, y, z)


  static get unit() { return new Vec3(1, 1, 1) }
  static get zero() { return new Vec3(0, 0, 0) }
  static get up() { return new Vec3(0, -1, 0) }

  get vs(): Array<number> {
    return [this.x, this.y, this.z]
  }


  get mul_inverse(): Vec3 {
    return new Vec3(1/this.x, 1/this.y, 1/this.z)
  }

  get inverse(): Vec3 {
    return new Vec3(-this.x, -this.y, -this.z)
  }

  get half(): Vec3 {
    return new Vec3(this.x/2, this.y/2, this.z/2)
  }


  get length_squared() {
    return this.x * this.x + this.y * this.y + this.z * this.z
  }

  get length() {
    return Math.sqrt(this.length_squared)
  }

  get normalize() {
    if (this.length === 0) {
      return Vec3.zero
    }
    return this.scale(1/this.length)
  }


  get clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z)
  }


  constructor(x: number, y: number, z: number) {
    this.x = x
    this.y = y
    this.z = z
  }

  dot(v: Vec3) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }


  cross(v: Vec3) {
    return Vec3.make(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    )
  }

  distance(v: Vec3) {
    return this.sub(v).length
  }



  scale(n: number) {
    let { clone } = this
    return clone.scale_in(n)
  }


  scale_in(n: number) {
    this.x *= n
    this.y *= n
    this.z *= n
    return this
  }


  add(v: Vec3) {
    let { clone } = this
    return clone.add_in(v)
  }

  add_in(v: Vec3) {
    this.x += v.x
    this.y += v.y
    this.z += v.z
    return this
  }


  sub(v: Vec3) {
    let { clone } = this
    return clone.sub_in(v)
  }

  sub_in(v: Vec3) {
    this.x -= v.x
    this.y -= v.y
    this.z -= v.z
    return this
  }

  mul(v: Vec3) {
    let { clone } = this
    return clone.mul_in(v)
  }

  mul_in(v: Vec3) {
    this.x *= v.x
    this.y *= v.y
    this.z *= v.z
    return this
  }


  div(v: Vec3) {
    let { clone } = this
    return clone.div_in(v)
  }

  div_in(v: Vec3) {
    this.x /= v.x
    this.y /= v.y
    this.z /= v.z
    return this
  }

  set_in(x: number, y: number = this.y, z: number = this.z) {
    this.x = x
    this.y = y
    this.z = z
    return this
  }

}



export class Mat4 {

  static make = (out: Array<number>) => new Mat4(out)

  static get identity () {
    return new Mat4([
      1, 0, 0, 0, 
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ])
  }

  static perspective = (fov: number, aspect: number, near: number, far: number) => {

    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov)

    let rangeInv = 1.0 / (near - far)


    let out = [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ]

    return new Mat4(out)
  }


  static frustum = (top: number, bottom: number, left: number, right: number, near: number, far: number) => {


    let out = [
      2 * near / (right - left), 0, 0, 0,
      0,                         2 * near/(top -bottom), 0, 0,

      (right+left)/(right-left),(top+bottom)/(top-bottom), -(far+near)/(far-near), -1,
      0, 0, -2*far*near/(far-near), 0
    ]
    return new Mat4(out)
  }

  static perspective_from_frust = (fov: number, aspectRatio: number, near: number, far: number) => {
    let top = near * Math.tan(fov * 0.5),
      height = top * 2,
      width = aspectRatio * height,
      left = -0.5 * width,
      right = left + width,
      bottom = top - height

    return this.frustum(top, bottom, left, right, near, far)
  }

  static lookAt = (cam_pos: Vec3, target: Vec3, up: Vec3) => {

    let zAxis = cam_pos.sub(target).normalize,
      xAxis = up.cross(zAxis).normalize,
      yAxis = zAxis.cross(xAxis).normalize

    return Mat4.make([
      ...xAxis.vs, 0,
      ...yAxis.vs, 0,
      ...zAxis.vs, 0,
      ...cam_pos.vs,
      1
    ])
  }


  static from_quat = (q: Quat) => {
    let [x, y, z, w] = q.out

    let x2 = x + x, y2 = y + y, z2 = z + z

    let xx = x * x2,
      yx = y * x2,
      yy = y * y2,
      zx = z * x2,
      zy = z * y2,
      zz = z * z2,
      wx = w * x2,
      wy = w * y2,
      wz = w * z2

    return Mat4.make([
      1 - yy - zz, yx + wz, zx - wy, 0,
      yx - wz, 1 - xx - zz, zy + wx, 0,
      zx + wy, zy - wx, 1 - xx - yy, 0,
      0, 0, 0, 1
    ])
  }

  get inverse() {

    let [
      a00, a01, a02, a03,
      a10, a11, a12, a13,
      a20, a21, a22, a23,
      a30, a31, a32, a33] = this.out

      let [
        b00, b01, b02, b03,
        b04, b05, b06, b07,
        b08, b09, b10, b11,
        b12, b13, b14, b15] = [
          a00 * a11 - a01 * a10,
          a00 * a12 - a02 * a10,
          a00 * a13 - a03 * a10,
          a01 * a12 - a02 * a11,

          a01 * a13 - a03 * a11,
          a02 * a13 - a03 * a12,
          a20 * a31 - a21 * a30,
          a20 * a32 - a22 * a30,

          a20 * a33 - a23 * a30,
          a21 * a32 - a22 * a31,
          a21 * a33 - a23 * a31,
          a22 * a33 - a23 * a32
        ]

        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06

        if (!det) {
          return null
        }

        det = 1.0 / det

        let out = [
          (a11 * b11 - a12 * b10 + a13 * b09) * det,
          (a02 * b10 - a01 * b11 - a03 * b09) * det,
          (a31 * b05 - a32 * b04 + a33 * b03) * det,
          (a22 * b04 - a21 * b05 - a23 * b03) * det,
          (a12 * b08 - a10 * b11 - a13 * b07) * det,
          (a00 * b11 - a02 * b08 + a03 * b07) * det,
          (a32 * b02 - a30 * b05 - a33 * b01) * det,
          (a20 * b05 - a22 * b02 + a23 * b01) * det,
          (a10 * b10 - a11 * b08 + a13 * b06) * det,
          (a01 * b08 - a00 * b10 - a03 * b06) * det,
          (a30 * b04 - a31 * b02 + a33 * b00) * det,
          (a21 * b02 - a20 * b04 - a23 * b00) * det,
          (a11 * b07 - a10 * b09 - a12 * b06) * det,
          (a00 * b09 - a01 * b07 + a02 * b06) * det,
          (a31 * b01 - a30 * b03 - a32 * b00) * det,
          (a20 * b03 - a21 * b01 + a22 * b00) * det,
        ]

        return new Mat4(out)
  }


  get clone() {
    return Mat4.make(this.out.slice(0))
  }

  constructor(readonly out: Array<number>) {}


  rotate(q: Quat) {
    return this.mul(Mat4.from_quat(q))
  }

  scale(v: Vec3) {
    let m = this.out
    return Mat4.make([
      m[0] * v.x, m[1] * v.x, m[2] * v.x, m[3] * v.x,
      m[4] * v.y, m[5] * v.y, m[6] * v.y, m[7] * v.y,
      m[8] * v.z, m[9] * v.z, m[10] * v.z, m[11] * v.z,
      m[12], m[13], m[14], m[15]
    ])
  }

  translate(v: Vec3) {
    let { clone } = this
    return clone.translate_in(v)
  }

  translate_in(v: Vec3) {
    let m = this.out

    m[12] = m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12]
    m[13] = m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13]
    m[14] = m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14]
    m[15] = m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15]

    return this
  }

  mul(m: Mat4) {
    let { clone } = this
    return clone.mul_in(m)
  }

  mul_in(b: Mat4) {
    let m = this.out
    let [
      a00, a01, a02, a03,
      a10, a11, a12, a13,
      a20, a21, a22, a23,
      a30, a31, a32, a33] = m

      let [
        b00, b01, b02, b03,
        b10, b11, b12, b13,
        b20, b21, b22, b23,
        b30, b31, b32, b33] = b.out

        m[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30
        m[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31
        m[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32
        m[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33

        m[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30
        m[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31
        m[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32
        m[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33


        m[8]  = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30
        m[9]  = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31
        m[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32
        m[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33


        m[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30
        m[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31
        m[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32
        m[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33

        return this
  }

  mVec3(v: Vec3): Vec3 {

    let m = this.out
    let [x, y, z] = v.vs
    let w = m[3] * x + m[7] * y + m[11] * z + m[15]
    w = w || 1.0


    return Vec3.make(
      (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
      (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
      (m[2] * x + m[6] * y + m[10] * z + m[14]) / w)
  }
}



export class Quat {

  static make = (out: Array<number>) => new Quat(out)

  static get identity() {
    return Quat.make([0, 0, 0, 1])
  }


  get clone() {
    return new Quat(this.out.slice(0))
  }

  rotateX(r: number) {
    let { clone } = this
    return clone.rotateX_in(r)
  }

  rotateX_in(r: number) {
    r *= 0.5

    let m = this.out

    let bx = Math.sin(r),
      bw = Math.cos(r)

    let [ax, ay, az, aw] = m

    m[0] = ax * bw + aw * bx
    m[1] = ay * bw + az * bx
    m[2] = az * bw - ay * bx
    m[3] = aw * bw - ax * bx

    return this
  }

  rotateY(r: number) {
    let { clone } = this
    return clone.rotateY_in(r)
  }

  rotateY_in(r: number) {
    r *= 0.5

    let m = this.out

    let by = Math.sin(r),
      bw = Math.cos(r)

    let [ax, ay, az, aw] = m

    m[0] = ax * bw - az * by
    m[1] = ay * bw + aw * by
    m[2] = az * bw + ax * by
    m[3] = aw * bw - ay * by
    return this
  }

  rotateZ(r: number) {
    let { clone } = this
    return clone.rotateZ_in(r)
  }

  rotateZ_in(r: number) {
    r *= 0.5

    let m = this.out

    let bz = Math.sin(r),
      bw = Math.cos(r)

    let [ax, ay, az, aw] = m

    m[0] = ax * bw + ay * bz
    m[1] = ay * bw - ax * bz
    m[2] = az * bw + aw * bz
    m[3] = aw * bw - az * bz
    return this
  }



  constructor(readonly out: Array<number>) {}
}
