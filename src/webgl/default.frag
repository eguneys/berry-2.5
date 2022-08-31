#version 300 es
precision highp float;
in vec2 vTextureCoord;
in vec3 vVertexCoord;
in vec3 vTint;
in vec2 vType;
out vec4 outColor;


void main() {
  vec2 p = vTextureCoord;
  vec4 col = vec4(1.0);
  col.rgb *= vTint;
  col.r = p.x;
  outColor = vec4(col.rgb, col.a);
}

