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

  shade = normalize(shade);
  vec3 lightDir = normalize(vec3(100, 10, 100));
  vec3 viewDir = normalize(vec3(1, 2, 3));
  vec3 reflectDir = reflect(-lightDir, shade.rgb);

  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 8.0);
  float light = max(0.0, dot(shade.rgb, lightDir));

  vec3 diffuse = vec3(light);
  vec3 specular = vec3(1.0) * spec;

  col = vec4((col.rgb + diffuse), col.a);

  outColor = vec4(col.rgb * col.a, col.a);
}

