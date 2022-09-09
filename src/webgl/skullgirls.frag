#version 300 es
precision highp float;
in vec2 vTextureCoord;
in vec3 vVertexCoord;
in vec3 vTint;
in vec2 vType;
out vec4 outColor;

uniform sampler2D uSampler;
uniform sampler2D uSampler2;


void main() {

  vec2 p = vTextureCoord;

  vec4 shade = texture(uSampler, vTextureCoord);
  vec4 shade2 = texture(uSampler2, vTextureCoord);

  vec4 col = vec4(0.0, 0.0, 0.0, shade.a);


  vec2 off1 = vec2(-1.0) / vec2(512);

  //shade *= 1.1;
  //shade += texture(uSampler, vTextureCoord) * 0.01;
  //shade += texture(uSampler, vTextureCoord + off1) * 0.01;
  //shade -= texture(uSampler, vTextureCoord - off1) * 0.01;



  float blend = 1.0;
  float _mix = 1.5;
  float _hmix = _mix * 0.8;
  float _hhmix = _hmix * 0.8;

  if (shade.r > blend) {
    col.r = (_hmix - (_hmix - shade2.r) * (_hmix - _mix * (shade.r - _hhmix)));
  } else {
    col.r = shade2.r * (_mix * shade.r); 
  }


  if (shade.g > blend) {
    col.g = (_hmix - (_hmix - shade2.g) * (_hmix - _mix * (shade.g - _hhmix)));
  } else {
    col.g = shade2.g * (_mix * shade.g);
  }


  if (shade.b > blend) {
    col.b = (_hmix - (_hmix - shade2.b) * (_hmix - _mix * (shade.b - _hhmix)));
  } else {
    col.b = shade2.b * (_mix * shade.b) ;
  }


  outColor = shade;
 
}
