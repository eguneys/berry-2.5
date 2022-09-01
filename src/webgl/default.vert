#version 300 es
in vec3 aTint;
in vec4 aVertexPosition;
in vec2 aTextureCoord;
in vec3 aType;
uniform mat4 u_matrix;
out vec3 vType;
out vec3 vTint;
out vec2 vTextureCoord;
out vec3 vVertexCoord;

void main() {
  gl_Position = u_matrix * aVertexPosition;
  vTextureCoord = aTextureCoord;
  vVertexCoord = gl_Position.xyz;
  vTint = aTint;
  vType = aType;
}
