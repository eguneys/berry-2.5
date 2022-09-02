#version 300 es
precision highp float;
in vec2 vTextureCoord;
in vec3 vVertexCoord;
in vec3 vTint;
in vec2 vType;
out vec4 outColor;

uniform sampler2D uSampler;

void main() {
  vec2 p = vTextureCoord;
  vec4 col = texture(uSampler, vTextureCoord);
  //col.a = 0.0;
  //col = vec4(1.0);
  //col.rgb *= vTint;
  //col.r = p.x;
  col.a = vVertexCoord.z / 200.0;
  outColor = vec4(col.rgb * col.a, col.a);
}

