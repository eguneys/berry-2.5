export class Canvas {
  $canvas: HTMLCanvasElement

  ctx?: Canvas2DRenderingContext

  constructor(readonly $wrap: HTMLElement,
              readonly width: number,
              readonly height: number) {
                this.$canvas = document.createElement('canvas')

                this.$canvas.width = width
                this.$canvas.height = height

                $wrap.appendChild(this.$canvas)

                let ctx = this.$canvas.getContext('2d')
                ctx.imageSmoothingEnabled = false
                this.ctx = ctx
              }

}
