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
  vec4 shade = texture(uSampler, vTextureCoord);
  vec4 col = vec4(vTint, shade.a);

  vec3 lightDir = vec3(0.1, 0.1, 0.2);
  vec3 viewDir = vec3(0.5, 0.5, 0.8);
  vec3 reflectDir = reflect(-lightDir, shade.rgb);

  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 24.0);
  float light = max(0.0, dot(shade.rgb, lightDir));

  col *= light + spec;


  outColor = vec4(col.rgb * col.a, col.a);
}

