"use strict"

let CG = {};

////////////////////////////// SUPPORT FOR VECTORS

//JH Additions:
CG.dist = (a, b) => {
   let sumOfSquares =
       Math.pow((a[0] - b[0]), 2) +
       Math.pow((a[1] - b[1]), 2) +
       Math.pow((a[2] - b[2]), 2);

   return Math.sqrt(sumOfSquares);
}

CG.sub   = (a,b) => [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];

CG.add   = (a,b) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
CG.cross = (a,b) => [ a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0] ];
CG.dot   = (a,b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
CG.ik = (a,b,C,D) => {
   let c = CG.dot(C,C), x = (1 + (a*a - b*b)/c) / 2, y = CG.dot(C,D)/c;
   for (let i = 0 ; i < 3 ; i++) D[i] -= y * C[i];
   y = Math.sqrt(Math.max(0,a*a - c*x*x) / CG.dot(D,D));
   for (let i = 0 ; i < 3 ; i++) D[i] = x * C[i] + y * D[i];
   return D;
}
CG.mix  = (a,b,t) => [ a[0]*(1-t) + b[0]*t, a[1]*(1-t) + b[1]*t, a[2]*(1-t) + b[2]*t ];
CG.norm = a => Math.sqrt(CG.dot(a, a));
CG.normalize = a => {
   let s = Math.sqrt(CG.dot(a,a));
   return [ a[0] / s, a[1] / s, a[2] / s ];
}
CG.scale = (a,s) => [ s*a[0], s*a[1], s*a[2] ];
CG.subtract = (a,b) => [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];
CG.abs = a => [Math.abs(a[0]), Math.abs(a[1]), Math.abs(a[2])];
////////////////////////////// SUPPORT FOR MATRICES

CG.matrixAimZ = function(Z) {
   Z = CG.normalize(Z);
   let X0 = CG.cross([0,1,0], Z), t0 = CG.dot(X0,X0), Y0 = CG.cross(Z, X0),
       X1 = CG.cross([1,0,0], Z), t1 = CG.dot(X1,X1), Y1 = CG.cross(Z, X1),
       t = t1 / (4 * t0 + t1),
       X = CG.normalize(CG.mix(X0, X1, t)),
       Y = CG.normalize(CG.mix(Y0, Y1, t));
   return [ X[0],X[1],X[2],0, Y[0],Y[1],Y[2],0, Z[0],Z[1],Z[2],0, 0,0,0,1 ];
}
CG.matrixFromQuaternion = q => {
   var x = q[0], y = q[1], z = q[2], w = q[3];
   return [ 1 - 2 * (y * y + z * z),     2 * (z * w + x * y),     2 * (x * z - y * w), 0,
                2 * (y * x - z * w), 1 - 2 * (z * z + x * x),     2 * (x * w + y * z), 0,
                2 * (y * w + z * x),     2 * (z * y - x * w), 1 - 2 * (x * x + y * y), 0,  0,0,0,1 ];
}
CG.matrixIdentity = ()       => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
CG.matrixInverse = a => {
  let b = [], d = 0, cf = (c, r) => {
     let s = (i, j) => a[c+i & 3 | (r+j & 3) << 2];
     return (c+r & 1 ? -1 : 1) * ( (s(1,1) * (s(2,2) * s(3,3) - s(3,2) * s(2,3)))
                                 - (s(2,1) * (s(1,2) * s(3,3) - s(3,2) * s(1,3)))
                                 + (s(3,1) * (s(1,2) * s(2,3) - s(2,2) * s(1,3))) );
  }
  for (let n = 0 ; n < 16 ; n++) b.push(cf(n >> 2, n & 3));
  for (let n = 0 ; n <  4 ; n++) d += a[n] * b[n << 2];
  for (let n = 0 ; n < 16 ; n++) b[n] /= d;
  return b;
}
CG.matrixMultiply = (a, b)   => {
   let c = [];
   for (let n = 0 ; n < 16 ; n++)
      c.push( a[n&3     ] * b[    n&12] +
              a[n&3 |  4] * b[1 | n&12] +
              a[n&3 |  8] * b[2 | n&12] +
              a[n&3 | 12] * b[3 | n&12] );
   return c;
}
CG.matrixRotateX = t         => [1,0,0,0, 0,Math.cos(t),Math.sin(t),0, 0,-Math.sin(t),Math.cos(t),0, 0,0,0,1];
CG.matrixRotateY = t         => [Math.cos(t),0,-Math.sin(t),0, 0,1,0,0, Math.sin(t),0,Math.cos(t),0, 0,0,0,1];
CG.matrixRotateZ = t         => [Math.cos(t),Math.sin(t),0,0, -Math.sin(t),Math.cos(t),0,0, 0,0,1,0, 0,0,0,1];
CG.matrixScale = (x,y,z)     => [x,0,0,0, 0,y===undefined?x:y,0,0, 0,0,z===undefined?x:z,0, 0,0,0,1];
CG.matrixTransform = (m,v)   => {
   let x = v[0], y = v[1], z = v[2], w = (v[3] === undefined ? 1 : v[3]);
   return [ m[ 0] * x + m[ 4] * y + m[ 8] * z + m[12] * w,
            m[ 1] * x + m[ 5] * y + m[ 9] * z + m[13] * w,
            m[ 2] * x + m[ 6] * y + m[10] * z + m[14] * w,
            m[ 3] * x + m[ 7] * y + m[11] * z + m[15] * w ];
}
CG.matrixTranslate = (x,y,z) => 
   Array.isArray(x) ? [1,0,0,0, 0,1,0,0, 0,0,1,0, x[0],x[1],x[2],1]
                    : [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
CG.matrixTranspose  = m => [
   m[0] || 0, m[4] || 0, m[8] || 0, m[12] || 0,
   m[1] || 0, m[5] || 0, m[9] || 0, m[13] || 0,
   m[2] || 0, m[6] || 0, m[10] || 0, m[14] || 0,
   m[3] || 0, m[7] || 0, m[11] || 0, m[15] || 0];

class Matrix {
    constructor() {
        let topIndex = 0, stack = [CG.matrixIdentity()], getVal = () => stack[topIndex], setVal = m => { stack[topIndex] = m; return this; };
        this.aimZ = v => setVal(CG.matrixMultiply(getVal(), CG.matrixAimZ(v)));
        this.identity = () => setVal(CG.matrixIdentity());
        this.multiply = a => setVal(CG.matrixMultiply(getVal(), a));
        this.restore = () => --topIndex;
        this.rotateQ = q => setVal(CG.matrixMultiply(getVal(), CG.matrixFromQuaternion(q)));
        this.rotateX = t => setVal(CG.matrixMultiply(getVal(), CG.matrixRotateX(t)));
        this.rotateY = t => setVal(CG.matrixMultiply(getVal(), CG.matrixRotateY(t)));
        this.rotateZ = t => setVal(CG.matrixMultiply(getVal(), CG.matrixRotateZ(t)));
        this.save = () => stack[++topIndex] = stack[topIndex - 1].slice();
        this.scale = (x, y, z) => setVal(CG.matrixMultiply(getVal(), CG.matrixScale(x, y, z)));
        this.set = a => setVal(a);
        this.transform = v => CG.matrixTransform(getVal(), v);
        this.translate = (x, y, z) => setVal(CG.matrixMultiply(getVal(), CG.matrixTranslate(x, y, z)));
        this.value = () => getVal();
    }
}

////////////////////////////// SUPPORT FOR CREATING 3D SHAPES

const VERTEX_SIZE = 11;

CG.quadData = {
   vertices : [
      -1,-1,0, 0,0,1, 1,0,0, 0,0,
       1,-1,0, 0,0,1, 1,0,0, 1,0,
      -1, 1,0, 0,0,1, 0,1,0, 1,0,
       1, 1,0, 0,0,1, 1,1,0, 1,0
   ],
   indices : [ 0,1,3, 0,3,2 ]
}

CG.createQuadVertices = () => {
   return [
      -1,-1, 1,  0, 0, 0,   1, 0, 0,  0,0,      1, 1, 1,  0, 0, 0,   1, 0, 0,  1,1,     -1, 1, 1,  0, 0, 0,   1, 0, 0,  0,1,
       1, 1, 1,  0, 0, 0,   1, 0, 0,  1,1,     -1,-1, 1,  0, 0, 0,   1, 0, 0,  0,0,      1,-1, 1,  0, 0, 0,   1, 0, 0,  1,0,
   ];
}

CG.createCubeVertices = () => {
   let V = [], P = [
      -1,-1, 1,  0, 0, 1,   1, 0, 0,  0,0,      1, 1, 1,  0, 0, 1,   1, 0, 0,  1,1,     -1, 1, 1,  0, 0, 1,   1, 0, 0,  0,1,
       1, 1, 1,  0, 0, 1,   1, 0, 0,  1,1,     -1,-1, 1,  0, 0, 1,   1, 0, 0,  0,0,      1,-1, 1,  0, 0, 1,   1, 0, 0,  1,0,

       1,-1,-1,  0, 0,-1,  -1, 0, 0,  0,0,     -1, 1,-1,  0, 0,-1,  -1, 0, 0,  1,1,      1, 1,-1,  0, 0,-1,  -1, 0, 0,  0,1,
      -1, 1,-1,  0, 0,-1,  -1, 0, 0,  1,1,      1,-1,-1,  0, 0,-1,  -1, 0, 0,  0,0,     -1,-1,-1,  0, 0,-1,  -1, 0, 0,  1,0
   ];
   for (let n = 0 ; n < 3 ; n++)
      for (let i = 0 ; i < P.length ; i += VERTEX_SIZE) {
         let p0 = [P[i   ], P[i+ 1], P[i+ 2]],
	     p1 = [P[i+ 3], P[i+ 4], P[i+ 5]],
	     p2 = [P[i+ 6], P[i+ 7], P[i+ 8]],
	     uv = [P[i+ 9], P[i+10]];
         V = V.concat(p0).concat(p1).concat(p2).concat(uv);
         for (let j = 0 ; j < 3 ; j++) {
            P[i   + j] = p0[(j+1) % 3];
            P[i+3 + j] = p1[(j+1) % 3];
            P[i+6 + j] = p2[(j+1) % 3];
         }
      }
/*
   To do: create edged cube by adding 12*2 edge triangles and 8 corner triangles.
*/
   return V;
}




//PRIMITIVES
CG.vertex = (u,v,A,f) => {
    let e = .001, P = f(u-e, v-e, A), Q = f(u+e, v-e, A),
                  R = f(u-e, v+e, A), S = f(u+e, v+e, A),
          T = CG.subtract(CG.add(Q,S), CG.add(P,R)),
          U = CG.subtract(CG.add(R,S), CG.add(P,Q)),
                  N = CG.cross(T, U);
    return P.concat(CG.normalize(N))
            .concat(CG.normalize(T))
        .concat([u,v]);
 }

CG.sphere = (u, v, r) => {
    let t = 2 * Math.PI * u;
    let p = Math.PI * (v - .5);

    let x = Math.cos(t) * Math.cos(p);
    let y = Math.sin(t) * Math.cos(p);
    let z = Math.sin(p);

    //tangenti,j = normalize(Pi+1,j - Pi,j)
    //where Pi,j is the position of the vertex at (ui,vj). 
    //TANGENT FUNCTIONS:
    let t_t = 2 * Math.PI * u;

    let t_x = Math.cos(t_t) * Math.cos(p);
    let t_y = Math.sin(t_t) * Math.cos(p);
    let t_z = Math.sin(p);

    let tx = t_x - x;
    let ty = t_y - y;
    let tz = t_z - z;

    return [x, y, z, x, y, z, tx, ty, tz, u, v];
}


// CG.cylinder = (u,v) => {
//     let c = Math.cos(2 * Math.PI * u);
//     for (let n = 0 ; n < 3 ; n++)
//        for (let i = 0 ; i < P.length ; i += VERTEX_SIZE) {
//           let p0 = [P[i   ], P[i+ 1], P[i+ 2]],
//           p1 = [P[i+ 3], P[i+ 4], P[i+ 5]],
//           p2 = [P[i+ 6], P[i+ 7], P[i+ 8]],
//           uv = [P[i+ 9], P[i+10]];
//           V = V.concat(p0).concat(p1).concat(p2).concat(uv);
//           for (let j = 0 ; j < 3 ; j++) {
//              P[i   + j] = p0[(j+1) % 3];
//              P[i+3 + j] = p1[(j+1) % 3];
//              P[i+6 + j] = p2[(j+1) % 3];
//           }
//        }
//     return V;
//  }

 CG.lathe = (u,v,C) => CG.uvToVertex(u,v,C, (u,v,C) => {
    let z = CG.evalCubicSpline(C[0], v),
        r = CG.evalCubicSpline(C[1], v);
    return [ r * Math.cos(2*Math.PI*u), r * Math.sin(2*Math.PI*u), z ];
 });
 


 
///////////////////////
// PATCHES & SPLINES //
///////////////////////


CG.evalCubicSpline = (coefs, t) => {
    t = Math.max(0, Math.min(1, t));
    let n = coefs.length / 4;
    let k = Math.min(n-1, Math.floor(n * t));
    let f = n * t - k;
    let a = coefs[4*k], b = coefs[4*k+1], c = coefs[4*k+2], d = coefs[4*k+3];
    return f * (f * (f * a + b) + c) + d;
 }

 CG.bezierToCubic = B => {
    let n = Math.floor(B.length / 3);
    let C = [];
    for (let k = 0 ; k < n ; k++)
       C = C.concat(CG.matrixTransform(CG.BezierBasisMatrix, B.slice(3*k, 3*k+4)));
    return C;
 }

CG.cubicPatch = (u, v, args) => {

    let point = CG.getBicubicPoint(u, v, args);
    let p_u = CG.getBicubicPoint(u + 0.01, v, args);
    let p_v = CG.getBicubicPoint(u, v + 0.01, args);

    let diff_u = CG.subtract(p_u, point);
    let diff_v = CG.subtract(p_v, point);

    let norm = CG.cross(diff_v, diff_u);

    let tan = CG.subtract(p_u, point);

    // return [point[0], point[1], point[2], 0,0,-1, u, v];
    return [
        point[0], point[1], point[2],
        -norm[0], -norm[1], -norm[2],
        tan[0], tan[1], tan[2],
        u, v];
}


CG.HERMITE = [
    2, -3, 0, 1,
    -2, 3, 0, 0,
    1, -2, 1, 0,
    1, -1, 0, 0
];

CG.BEZIER = [
    -1, 3, -3, 1,
    3, -6, 3, 0,
    -3, 3, 0, 0,
    1, 0, 0, 0
];



CG.getBicubicPoint = (u, v, args) => {
    let Cx = args[0];
    let Cy = args[1];
    let Cz = args[2];
    let x = 1;
    let y = 1;
    let z = 1;
    let U = [u * u * u, u * u, u, 1];
    let V = [v * v * v, v * v, v, 1];

    let abcdx = CG.matrixTransform(CG.matrixTranspose(V), CG.matrixTransform(Cx, U));
    x = abcdx[0] * x * x * x + abcdx[1] * x * x + abcdx[2] * x + abcdx[3]

    let abcdy = CG.matrixTransform(CG.matrixTranspose(V), CG.matrixTransform(Cy, U));
    y = abcdy[0] * y * y * y + abcdy[1] * y * y + abcdy[2] * y + abcdy[3]

    let abcdz = CG.matrixTransform(CG.matrixTranspose(V), CG.matrixTransform(Cz, U));
    z = abcdz[0] * z * z * z + abcdz[1] * z * z + abcdz[2] * z + abcdz[3]

    return [x, y, z];
}


///Classes:


class ParametricMesh {
    constructor(M, N, callbackType, args){
    // console.log("Creating Mesh!")
    this.vertices = ParametricMesh.createParametricMesh(M, N, callbackType, args);
    
    //this.vertices = ParametricMesh.getFlatStrip(strip);
    this.size = this.vertices.length / VERTEX_SIZE
    }


    static createParametricMesh = (M, N, callback, args) => {

        let vertices = [];
        for (let row = 0 ; row < N-1 ; row++)
           for (let col = 0 ; col < M ; col++) {
              let u = (row & 1 ? col : M-1 - col) / (M-1);
              if (col != 0 || row == 0)
              vertices = vertices.concat(callback(u,  row    / (N-1), args));
              vertices = vertices.concat(callback(u, (row+1) / (N-1), args));
           }
        return vertices;
    }
}

class BezierPatch{
    constructor(handles){
        
        //Store Handles
        this.handles = handles;

        //Create and store Patch
        this.patch = BezierPatch.toCubicPatchCoefficients(
            CG.BEZIER, 
            this.handlesToPatchArray()
        );
    }

    transformHandle = function(n, x, y, z){
        this.handles[n] = CG.add(this.handles[n], [x, y, z]);
    }
    
    handlesToPatchArray = () => {
        let Cx = [];
        let Cy = [];
        let Cz = [];

        this.handles.forEach(handle => {
            Cx.push(handle.x);
            Cy.push(handle.y);
            Cz.push(handle.z);
        });

        return [Cx, Cy, Cz];
    }

    static toCubicPatchCoefficients = (basisMatrix, M) => {
        let C = [];
        for (let i = 0; i < M.length; i++)
            C.push(CG.matrixMultiply(basisMatrix, CG.matrixMultiply(M[i], CG.matrixTranspose(basisMatrix))));
        return C;
    }

}


/// DECLARATIONS:

let cube = CG.createCubeVertices();
let sphere = new ParametricMesh(32, 16, CG.sphere);
// let cylinder = new ParametricMesh(32, 6, CG.cylinder);
// let torus = createMeshVertices(32, 16, uvToTorus, 0.3);





////////////////
// PARAMETRIC //
////////////////

/*
class ParametricMesh {

    constructor(M, N, callbackType, args) {
        // console.log("Creating Mesh!")
        this.vertices = ParametricMesh.createParametricMesh(M, N, callbackType, args);
        // console.log(srip);
        //this.vertices = ParametricMesh.getFlatStrip(strip);
        this.size = this.vertices.length / VERTEX_SIZE
    }

    static createParametricMesh(M, N, callback, args) {

        ///
        let vertices = [];
        for (let row = 0 ; row < N-1 ; row++)
           for (let col = 0 ; col < M ; col++) {
              let u = (row & 1 ? col : M-1 - col) / (M-1);
              if (col != 0 || row == 0)
              vertices = vertices.concat(callback(u,  row    / (N-1), vars));
              vertices = vertices.concat(callback(u, (row+1) / (N-1), vars));
           }
        return vertices;

        ///
        let strip = [];
        let uv = { u: 1, v: 0 };  //Set initial corner 
        strip.push(callback(uv.u, uv.v, args));
        for (let row = 0; row < N; row++) {

            let uIncrement = (row % 2 == 0) ? -1 : 1;  // Determine traverse direction

            uv = {
                u: (row % 2 == 0) ? 1 : 0,   // If row is even, start from right.
                v: (1 + row) / N              // Alternate rows
            };

            strip.push(callback(uv.u, uv.v, args));

            //First in row:
            for (let col = 1; col <= M; col++) {

                //Clunky logic for alternating rows. TODO: Make nice if time permits

                if (col == 0) {

                } else {
                    let edge = (row % 2 == 0) ? M : 0;  //Determine left or right edge
                    uv = {
                        u:
                            (edge + col * uIncrement) / M,
                        v: (row) / N
                    };
                    strip.push(callback(uv.u, uv.v, args));

                    uv = {
                        u:
                            (edge + col * uIncrement) / M,
                        v: (row + 1) / N
                    };
                    strip.push(callback(uv.u, uv.v, args));
                }
            }
        }
        return strip;
    }

    // static getFlatStrip(strip) {
    //     let flatArray = [];
    //     for (let i = 0; i < strip.length; i++) {
    //         let vert = strip[i];
    //         for (let coord = 0; coord < vert.length; coord++) {
    //             flatArray.push(vert[coord]);
    //         }
    //     }
    //     return flatArray;
    // }

    // static getLeftEdge(y) {
    //     // converts 0,1,2,3,4,5... to 2,2,4,4,6,6....
    //     return Math.ceil((1 + y) / 2) * 2;
    // }

    //PRIMITIVES

    static sphere(u, v) {
        let theta = 2 * Math.PI * u;
        let phi = Math.PI * v - Math.PI / 2;

        let x = Math.cos(theta) * Math.cos(phi);
        let y = Math.sin(theta) * Math.cos(phi);
        let z = Math.sin(phi);

        let t_t = 2 * Math.PI * u;

        let t_x = Math.cos(t_t) * Math.cos(p);
        let t_y = Math.sin(t_t) * Math.cos(p);
        let t_z = Math.sin(p);

        let tx = t_x - x;
        let ty = t_y - y;
        let tz = t_z - z;

        return [x, y, z, x, y, z, y, x, 0, u, v];
    }

    //PATCH

    static cubicPatch(u, v, args) {

        let point = ParametricMesh.getBicubicPoint(u, v, args);
        let p_u = ParametricMesh.getBicubicPoint(u + 0.01, v, args);
        let p_v = ParametricMesh.getBicubicPoint(u, v + 0.01, args);

        let diff_u = subtract(p_u, point);
        let diff_v = subtract(p_v, point);

        let norm = cross(diff_v, diff_u);

        let tan = subtract(p_u, point);


        // return [point[0], point[1], point[2], 0,0,-1, u, v];
        return [
            point[0], point[1], point[2],
            -norm[0], -norm[1], -norm[2],
            tan[0], tan[1], tan[2],
            u, v];
    }

    static getBicubicPoint(u, v, args) {
        let Cx = args[0];
        let Cy = args[1];
        let Cz = args[2];
        let x = 1;
        let y = 1;
        let z = 1;
        let U = [u * u * u, u * u, u, 1];
        let V = [v * v * v, v * v, v, 1];

        let abcdx = transform(transpose(V), transform(Cx, U));
        x = abcdx[0] * x * x * x + abcdx[1] * x * x + abcdx[2] * x + abcdx[3]

        let abcdy = transform(transpose(V), transform(Cy, U));
        y = abcdy[0] * y * y * y + abcdy[1] * y * y + abcdy[2] * y + abcdy[3]

        let abcdz = transform(transpose(V), transform(Cz, U));
        z = abcdz[0] * z * z * z + abcdz[1] * z * z + abcdz[2] * z + abcdz[3]

        return [x, y, z];
    }

}
*/

//// ARCHIVE

// class Spline {

//     constructor(M, callback) {

//     }


//     static toCubicCurveCoefficients = (basisMatrix, M) => {
//         let C = [];
//         for (let i = 0; i < M.length; i++)
//             C.push(transform(basisMatrix, M[i]));
//         return C;
//     }

// }