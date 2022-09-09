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

  vec3 lightDir = vec3(0.2, 0.2, 0.2);
  vec3 viewDir = vec3(0.25, 0.25, 0.7);
  vec3 reflectDir = reflect(-lightDir, shade.rgb);

  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 8.0);
  float light = max(0.0, dot(shade.rgb, lightDir));

  vec3 diffuse = vec3(light);
  vec3 specular = vec3(1.0) * spec;

  col = vec4((col.rgb + diffuse + specular), col.a);

  outColor = vec4(col.rgb * col.a, col.a);
}

