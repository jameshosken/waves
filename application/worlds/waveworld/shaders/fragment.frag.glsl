#version 300 es        // NEWER VERSION OF GLSL
precision highp float; // HIGH PRECISION FLOATS



vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec4 mod289(vec4 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec4 permute(vec4 x) { return mod289(((x*34.)+1.)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - .85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.-15.)+10.); }
float noise(vec3 P) {
vec3 i0 = mod289(floor(P)), i1 = mod289(i0 + vec3(1.)),
   f0 = fract(P), f1 = f0 - vec3(1.), f = fade(f0);
vec4 ix = vec4(i0.x, i1.x, i0.x, i1.x), iy = vec4(i0.yy, i1.yy),
   iz0 = i0.zzzz, iz1 = i1.zzzz,
   ixy = permute(permute(ix) + iy), ixy0 = permute(ixy + iz0), ixy1 = permute(ixy + iz1),
   gx0 = ixy0 * (1. / 7.), gy0 = fract(floor(gx0) * (1. / 7.)) - .5,
   gx1 = ixy1 * (1. / 7.), gy1 = fract(floor(gx1) * (1. / 7.)) - .5;
gx0 = fract(gx0); gx1 = fract(gx1);
vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0), sz0 = step(gz0, vec4(0.)),
   gz1 = vec4(0.5) - abs(gx1) - abs(gy1), sz1 = step(gz1, vec4(0.));
gx0 -= sz0 * (step(0., gx0) - .5); gy0 -= sz0 * (step(0., gy0) - .5);
gx1 -= sz1 * (step(0., gx1) - .5); gy1 -= sz1 * (step(0., gy1) - .5);
vec3 g0 = vec3(gx0.x,gy0.x,gz0.x), g1 = vec3(gx0.y,gy0.y,gz0.y),
   g2 = vec3(gx0.z,gy0.z,gz0.z), g3 = vec3(gx0.w,gy0.w,gz0.w),
   g4 = vec3(gx1.x,gy1.x,gz1.x), g5 = vec3(gx1.y,gy1.y,gz1.y),
   g6 = vec3(gx1.z,gy1.z,gz1.z), g7 = vec3(gx1.w,gy1.w,gz1.w);
vec4 norm0 = taylorInvSqrt(vec4(dot(g0,g0), dot(g2,g2), dot(g1,g1), dot(g3,g3))),
   norm1 = taylorInvSqrt(vec4(dot(g4,g4), dot(g6,g6), dot(g5,g5), dot(g7,g7)));
g0 *= norm0.x; g2 *= norm0.y; g1 *= norm0.z; g3 *= norm0.w;
g4 *= norm1.x; g6 *= norm1.y; g5 *= norm1.z; g7 *= norm1.w;
vec4 nz = mix(vec4(dot(g0, vec3(f0.x, f0.y, f0.z)), dot(g1, vec3(f1.x, f0.y, f0.z)),
                 dot(g2, vec3(f0.x, f1.y, f0.z)), dot(g3, vec3(f1.x, f1.y, f0.z))),
            vec4(dot(g4, vec3(f0.x, f0.y, f1.z)), dot(g5, vec3(f1.x, f0.y, f1.z)),
                 dot(g6, vec3(f0.x, f1.y, f1.z)), dot(g7, vec3(f1.x, f1.y, f1.z))), f.z);
return 2.2 * mix(mix(nz.x,nz.z,f.y), mix(nz.y,nz.w,f.y), f.x);
}
float turbulence(vec3 P) {
float f = 0., s = 1.;
for (int i = 0 ; i < 9 ; i++) {
 f += abs(noise(s * P)) / s;
 s *= 2.;
 P = vec3(.866 * P.x + .5 * P.z, P.y + 100., -.5 * P.x + .866 * P.z);
}
return f;
}


uniform vec3  uColor;
uniform vec3  uCursor; // CURSOR: xy=pos, z=mouse up/down
uniform float uTime;   // TIME, IN SECONDS
uniform int uMaterial;

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
   float x = (noise(v)) * 0.5;
   float y = (noise(v.yzx)) * 0.5;
   float z = (noise(v.zyx)) * 0.5;
   return normalize(vec3(1,1,1));
}

vec3 handleShading(){

   // vec3 blue = vec3(0,0,1);
   vec3 purp = vec3(1,0,1);

   // float gradient =  (vPos.y*vPos.y);
   // vec3 col = mix(purp, blue,  gradient);

   return purp;

}

vec3 sunShading(){

   vec3 red = vec3(1,0,0);
   vec3 yellow = vec3(1,1,0);

   float gradient =  (vPos.y*vPos.y);
   vec3 col = mix(red, yellow,  gradient);

   return col;

}

vec3 emissiveShading(){


   return uColor;

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

   // diffuse = max(vec3(0.,0.,0.), dot(light2.dir, normal) ) * diffuseMat;
   
   // R = 2. * normal * dot(light2.dir, normal) + light2.dir; 

   // outColour += light2.colour * ( diffuse ) ;


   return outColour;
}



void main() {

   light = Light(
      normalize(vec3(0,.1, -1.)), 
      vec3(2.,1.,0.) 
   );

   // light2 = Light(
   //    normalize(vec3(-.5,.3, .2)), 
   //    vec3(.5,.5, 1.) 
   // );

   
    vec3 color;

    switch(uMaterial){
      case 0:
         color = phongShading();
         break;
      case 1:
         color = sunShading();
         break;
      case 2:
         color = handleShading();
         break;
      case 3:
         color = emissiveShading();
         break;
      default:
         break;
    }

    fragColor = vec4(sqrt(color), 1.0);

}








// #version 300 es        // NEWER VERSION OF GLSL
// precision highp float; // HIGH PRECISION FLOATS

// uniform vec4  uColor;
// uniform vec3  uCursor; // CURSOR: xy=pos, z=mouse up/down
// uniform float uTime;   // TIME, IN SECONDS

// in vec2 vXY;           // POSITION ON IMAGE
// in vec3 vPos;          // POSITION
// in vec3 vNor;          // NORMAL
// in vec3 vTan;          // TANGENT
// in vec3 vBin;          // BINORMAL
// in vec2 vUV;           // U,V

// vec3 Ldir[2];
// vec3 Lrgb[2];

// uniform int uBumpIndex;
// uniform float uBumpScale;
// uniform float uToon;

// uniform int uTexIndex;
// uniform float uTexScale;

// uniform sampler2D uTex0;
// uniform sampler2D uTex1;
// uniform sampler2D uTex2;

// out vec4 fragColor;    // RESULT WILL GO HERE

// float noize(vec3 v) {
//    vec4 r[2];
//    const mat4 E = mat4(0.,0.,0.,0., 0.,.5,.5,0., .5,0.,.5,0., .5,.5,0.,0.);
//    for (int j = 0 ; j < 2 ; j++)
//    for (int i = 0 ; i < 4 ; i++) {
//       vec3 p = .6 * v + E[i].xyz, C = floor(p), P = p-C-.5, A = abs(P);
//       C += mod(C.x+C.y+C.z+float(j),2.) * step(max(A.yzx,A.zxy),A)*sign(P);
//       vec3 D = 43758. * sin(13. * (2.1*C     + 3.2*C.xzy + 4.3*float(i)) +
//                             78. * (1.2*C.yzx + 2.3*C.zxy + 3.4*float(j)));
//       r[j][i] = dot(P=p-C-.5,fract(D)-.5) * pow(max(0.,1.-2.*dot(P,P)),4.);
//    }
//    return 6.5 * (r[0].x+r[0].y+r[0].z+r[0].w+r[1].x+r[1].y+r[1].z+r[1].w);
// }

// vec3 bumpTexture(vec3 normal, vec4 bump) {
//    return normalize((.5-bump.x) * normalize(vTan) + (.5-bump.y) * normalize(vBin) + (.5-bump.z) * normal);
// }

// vec3 phong(vec3 Ldir, vec3 Lrgb, vec3 normal, vec3 diffuse, vec3 specular, float p) {
//     vec3 color = vec3(0.,0.,0.);
//     float d = dot(Ldir, normal);
//     if (d > 0.)
//        color += diffuse * d * Lrgb;
//     vec3 R = 2. * normal * dot(Ldir, normal) - Ldir;
//     float s = dot(R, normal);
//     if (s > 0.)
//        color += specular * pow(s, p) * Lrgb;
//     return color;
// }

// void main() {
//     vec4 texture0 = texture(uTex0, vUV * uTexScale);
//     vec4 texture1 = texture(uTex1, vUV * uTexScale);
//     vec4 texture2 = texture(uTex2, vUV * uTexScale);

//     vec3 ambient = .1 * uColor.rgb;
//     vec3 diffuse = .5 * uColor.rgb;
//     vec3 specular = vec3(.4,.4,.4);
//     float p = 30.;

//     Ldir[0] = normalize(vec3(1.,1.,2.));
//     Ldir[1] = normalize(vec3(-1.,-1.,-1.));
//     Lrgb[0] = vec3(.6,.6,1.);
//     Lrgb[1] = vec3(.6,.3,.1);

//     vec3 normal = normalize(vNor);

//     if (uBumpIndex == 0) normal = bumpTexture(normal, texture(uTex0, vUV * uBumpScale));
//     if (uBumpIndex == 1) normal = bumpTexture(normal, texture(uTex1, vUV * uBumpScale));
//     if (uBumpIndex == 2) normal = bumpTexture(normal, texture(uTex2, vUV * uBumpScale));

//     vec3 color = ambient;
//     color += phong(Ldir[0], Lrgb[0], normal, diffuse, specular, p);
//     color += phong(Ldir[1], Lrgb[1], normal, diffuse, specular, p);

//     //color *= .5 + .5 * noize(10. * vPos);

//     fragColor = vec4(sqrt(color.rgb) * (uToon == 0. ? 1. : 0.), uColor.a);
//     if (uTexIndex == 0) fragColor *= texture(uTex0, vUV * uTexScale);
//     if (uTexIndex == 1) fragColor *= texture(uTex1, vUV * uTexScale);
//     if (uTexIndex == 2) fragColor *= texture(uTex2, vUV * uTexScale);
// }


