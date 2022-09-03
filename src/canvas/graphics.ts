export class Graphics {

  get ctx() { return this.canvas.ctx }

  get width(): number { return this.canvas.width }
  get height(): number { return this.canvas.height }


  constructor(readonly canvas: Canvas) {}

  init(sprites) {
    this.sprites = sprites
  }

  clear() {
    let { ctx } = this
    ctx.clearRect(0, 0, this.width, this.height)
  }

  sspr(r, dx, dy, dw, dh, sx, sy, sw, sh, flipH) {
    let { ctx } = this
    dx = Math.round(dx)
    dy = Math.round(dy)

    ctx.translate(dx, dy)
    //ctx.translate(dw/2, dh/2)
    ctx.rotate(r)
    ctx.translate(-dw/2, -dh/2)

    if (flipH) {
      ctx.scale(-1, 1)
      ctx.translate(-dw, 0)
    }

    ctx.drawImage(this.sprites, sx, sy, sw, sh, 0, 0, dw, dh)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  };
}
