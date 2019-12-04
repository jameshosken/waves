#version 300 es        // NEWER VERSION OF GLSL
precision highp float; // HIGH PRECISION FLOATS

uniform vec3  uColor;
uniform vec3  uCursor; // CURSOR: xy=pos, z=mouse up/down
uniform float uTime;   // TIME, IN SECONDS

in vec2 vXY;           // POSITION ON IMAGE
in vec3 vPos;          // POSITION
in vec3 vNor;          // NORMAL
in vec3 vTan;
in vec3 vBiNor;
in vec2 vUV;           // U,V
in vec3 vWorld;

struct Light{
    vec3 dir;
    vec3 colour;
};

Light light;
Light light2;

uniform int uTexIndex;
uniform float uTexScale;

uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform sampler2D uTex2;

out vec4 fragColor;    // RESULT WILL GO HERE

// vec4 b = texture2D(uSampler[1], vUV) - 0.5; // We are assuming here that the bump map is texture[1].
// vec3 normal = normalize(b.r * vTangent + b.g * vBinormal + b.b * vNormal);


vec3 bumpSampler(vec3 v){
   float x = (1. + noise(v)) * 0.5;
   float y = (1.+noise(v.yzx)) * 0.5;
   float z = (1.+ noise(v.zyx)) * 0.5;
   return normalize(vec3(x,y,z));
}

vec3 phongShading(){
   // vec3 normal = normalize(vNor);
   vec3 b = bumpSampler(vWorld.xyz * 10.123);

   // vec3 normal = normalize(b.x * vTan + b.y * vBiNor + b.z * vNor);
   vec3 normal = normalize(vNor + b*0.01);
   vec3 diffuseMat = uColor;
   vec4 specularMat = vec4(0.5, 0.5, 0.5, 10.);

   vec3 emissionMat = vec3(0., 0., 0.);
   float roughness = .2;

   vec3 outColour = vec3(0.,0.,0.);

   outColour += emissionMat;

   vec3 diffuse = max(vec3(0.,0.,0.), dot(light.dir, normal) ) * diffuseMat;

   vec3 R = 2. * normal * dot(light.dir, normal) + light.dir; 

   outColour += light.colour * ( diffuse ) ;

   diffuse = max(vec3(0.,0.,0.), dot(light2.dir, normal) ) * diffuseMat;
   
   R = 2. * normal * dot(light2.dir, normal) + light2.dir; 

   outColour += light2.colour * ( diffuse ) ;

   return outColour;
}



void main() {

   light = Light(
      normalize(vec3(.5,.2, .2)), 
      vec3(2.,1.,1.) 
   );

   light2 = Light(
      normalize(vec3(-.5,.3, .2)), 
      vec3(.5,.5, 1.) 
   );
   
   

    vec3 color = phongShading();

    fragColor = vec4(sqrt(color), 1.0);

}


