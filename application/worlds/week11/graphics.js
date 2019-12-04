"use strict"

////////////////////////////// USEFUL VECTOR OPERATIONS

let dot = (a, b) => {
    let value = 0;
    for (let i = 0; i < a.length; i++)
        value += a[i] * b[i];
    return value;
}

let subtract = (a, b) => {
    let c = [];
    for (let i = 0; i < a.length; i++)
        c.push(a[i] - b[i]);
    return c;
}

let normalize = a => {
    let s = Math.sqrt(dot(a, a)), b = [];
    for (let i = 0; i < a.length; i++)
        b.push(a[i] / s);
    return b;
}

let cross = (a, b) => [a[1] * b[2] - a[2] * b[1],
a[2] * b[0] - a[0] * b[2],
a[0] * b[1] - a[1] * b[0]];

////////////////////////////// MATRIX SUPPORT

let cos = t => Math.cos(t);
let sin = t => Math.sin(t);
let identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
let rotateX = t => [1, 0, 0, 0, 0, cos(t), sin(t), 0, 0, -sin(t), cos(t), 0, 0, 0, 0, 1];
let rotateY = t => [cos(t), 0, -sin(t), 0, 0, 1, 0, 0, sin(t), 0, cos(t), 0, 0, 0, 0, 1];
let rotateZ = t => [cos(t), sin(t), 0, 0, -sin(t), cos(t), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
let scale = (x, y, z) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
let translate = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
let multiply = (a, b) => {
    let c = [];
    for (let n = 0; n < 16; n++)
        c.push(a[n & 3] * b[n & 12] +
            a[n & 3 | 4] * b[1 | n & 12] +
            a[n & 3 | 8] * b[2 | n & 12] +
            a[n & 3 | 12] * b[3 | n & 12]);
    return c;
}
let fromQuaternion = q => {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    return [1 - 2 * (y * y + z * z), 2 * (z * w + x * y), 2 * (x * z - y * w), 0,
    2 * (y * x - z * w), 1 - 2 * (z * z + x * x), 2 * (x * w + y * z), 0,
    2 * (y * w + z * x), 2 * (z * y - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1];
}
let inverse = a => {
    let b = [], d = 0, cf = (c, r) => {
        let s = (i, j) => a[c + i & 3 | (r + j & 3) << 2];
        return (c + r & 1 ? -1 : 1) * ((s(1, 1) * (s(2, 2) * s(3, 3) - s(3, 2) * s(2, 3)))
            - (s(2, 1) * (s(1, 2) * s(3, 3) - s(3, 2) * s(1, 3)))
            + (s(3, 1) * (s(1, 2) * s(2, 3) - s(2, 2) * s(1, 3))));
    }
    for (let n = 0; n < 16; n++) b.push(cf(n >> 2, n & 3));
    for (let n = 0; n < 4; n++) d += a[n] * b[n << 2];
    for (let n = 0; n < 16; n++) b[n] /= d;
    return b;
}


let transpose = m => [
    m[0] || 0, m[4] || 0, m[8] || 0, m[12] || 0,
    m[1] || 0, m[5] || 0, m[9] || 0, m[13] || 0,
    m[2] || 0, m[6] || 0, m[10] || 0, m[14] || 0,
    m[3] || 0, m[7] || 0, m[11] || 0, m[15] || 0];

let transform = (m, v) => [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
    m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3]
];


let Matrix = function () {
    let topIndex = 0,
        stack = [identity()],
        getVal = () => stack[topIndex],
        setVal = m => { stack[topIndex] = m; return this; }

    this.identity = () => setVal(identity());
    this.multiply = a => setVal(multiply(getVal(), a));
    this.restore = () => --topIndex;
    this.rotateQ = q => setVal(multiply(getVal(), fromQuaternion(q)));
    this.rotateX = t => setVal(multiply(getVal(), rotateX(t)));
    this.rotateY = t => setVal(multiply(getVal(), rotateY(t)));
    this.rotateZ = t => setVal(multiply(getVal(), rotateZ(t)));
    this.save = () => stack[++topIndex] = stack[topIndex - 1].slice();
    this.scale = (x, y, z) => setVal(multiply(getVal(), scale(x, y, z)));
    this.set = a => setVal(a);
    this.translate = (x, y, z) => setVal(multiply(getVal(), translate(x, y, z)));
    this.value = () => getVal();
}

////////////////////////////// SUPPORT FOR CREATING 3D SHAPES

const VERTEX_SIZE = 11;

let createCubeVertices = () => {
    let V = [], P = [-1, -1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, -1, 1, 1, 0, 1, 1, 0, 1,
        1, 1, 1, 0, 0, 1, 1, 1, -1, -1, 1, 0, 0, 1, 0, 0, 1, -1, 1, 0, 0, 1, 1, 0,
        1, 1, -1, 0, 0, -1, 0, 0, -1, -1, -1, 0, 0, -1, 1, 1, -1, 1, -1, 0, 0, -1, 1, 0,
    -1, -1, -1, 0, 0, -1, 1, 1, 1, 1, -1, 0, 0, -1, 0, 0, 1, -1, -1, 0, 0, -1, 0, 1];
    for (let n = 0; n < 3; n++)
        for (let i = 0; i < P.length; i += 8) {
            let p0 = [P[i], P[i + 1], P[i + 2]], 
                p1 = [P[i + 3], P[i + 4], P[i + 5]], 

                uv = [P[i + 6], P[i + 7]];

            V = V.concat(p0).concat(p1).concat(uv);

            for (let j = 0; j < 3; j++) {
                P[i + j] = p0[(j + 1) % 3];
                P[i + 3 + j] = p1[(j + 1) % 3];
            }
        }
    return V;
}


function createMeshVertices(M, N, uvToShape, vars) {
    let vertices = [];
    for (let row = 0; row < N - 1; row++)
        for (let col = 0; col < M; col++) {
            let u = (row & 1 ? col : M - 1 - col) / (M - 1);
            if (col != 0 || row == 0)
                vertices = vertices.concat(uvToShape(u, row / (N - 1), vars));
            vertices = vertices.concat(uvToShape(u, (row + 1) / (N - 1), vars));
        }
    return vertices;
}

let uvToSphere = (u, v, r) => {
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


// TODO: implement tangent
let uvToCylinder = (u,v) => {
    let c = Math.cos(2 * Math.PI * u);
    let s = Math.sin(2 * Math.PI * u);
    let z = Math.max(-1, Math.min(1, 10*v - 5));

    switch (Math.floor(5.001 * v)) {
    case 0: case 5: return [ 0,0,z, 0,0,z, u,v]; // center of back/front end cap
    case 1: case 4: return [ c,s,z, 0,0,z, u,v]; // perimeter of back/front end cap
    case 2: case 3: return [ c,s,z, c,s,0, u,v]; // back/front of cylindrical tube
    }
}

let uvToTorus = (u,v,r) => {
   let t = 2 * Math.PI * u;
   let p = 2 * Math.PI * v;

   let x = Math.cos(t) * (1 + r * Math.cos(p));
   let y = Math.sin(t) * (1 + r * Math.cos(p));
   let z = r * Math.sin(p);

   let nx = Math.cos(t) * Math.cos(p);
   let ny = Math.sin(t) * Math.cos(p);
   let nz = Math.sin(p);

   return [x,y,z, nx,ny,nz, u,v];
}

let cube = createCubeVertices();
let sphere = createMeshVertices(32, 16, uvToSphere);
let cylinder = createMeshVertices(32, 6, uvToCylinder);
// let torus = createMeshVertices(32, 16, uvToTorus, 0.3);


///////////////////////
// PATCHES & SPLINES //
///////////////////////

class BezierPatch {
    constructor(handles) {
        this.handles = handles;
    }

    transformHandle(n, x, y, z) {
        this.handles[n].add(new Vector(x, y, z));
    }

    handlesToPatchArray() {
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
}

class Spline {

    constructor(M, callback) {

    }

    static HermiteBasisMatrix = [
        2, -3, 0, 1,
        -2, 3, 0, 0,
        1, -2, 1, 0,
        1, -1, 0, 0
    ];

    static BezierBasisMatrix = [
        -1, 3, -3, 1,
        3, -6, 3, 0,
        -3, 3, 0, 0,
        1, 0, 0, 0
    ];

    static toCubicCurveCoefficients = (basisMatrix, M) => {
        let C = [];
        for (let i = 0; i < M.length; i++)
            C.push(transform(basisMatrix, M[i]));
        return C;
    }

}

class Patch {


    static toCubicPatchCoefficients = (basisMatrix, M) => {
        let C = [];
        for (let i = 0; i < M.length; i++)
            C.push(multiply(basisMatrix, multiply(M[i], transpose(basisMatrix))));
        return C;
    }
}

class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    toArray() {
        return [this.x, this.y, this.z];
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
    }

    mult(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
    }

    static dist(v1, v2) {
        let sumOfSquares =
            Math.pow((v1.x - v2.x), 2) +
            Math.pow((v1.y - v2.y), 2) +
            Math.pow((v1.z - v2.z), 2);

        return Math.sqrt(sumOfSquares);
    }

    static add(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z)
    }

    static sub(v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z)
    }

}


////////////////
// PARAMETRIC //
////////////////

class ParametricMesh {

    constructor(M, N, callbackType, args) {
        // console.log("Creating Mesh!")
        let strip = ParametricMesh.createParametricMesh(M, N, callbackType, args);
        // console.log(srip);
        this.vertices = ParametricMesh.getFlatStrip(strip);
        this.size = this.vertices.length / VERTEX_SIZE


    }

    static createParametricMesh(M, N, callback, args) {

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

    static getFlatStrip(strip) {
        let flatArray = [];
        for (let i = 0; i < strip.length; i++) {
            let vert = strip[i];
            for (let coord = 0; coord < vert.length; coord++) {
                flatArray.push(vert[coord]);
            }
        }
        return flatArray;
    }

    static getLeftEdge(y) {
        // converts 0,1,2,3,4,5... to 2,2,4,4,6,6....
        return Math.ceil((1 + y) / 2) * 2;
    }

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


    //    static torus(u, v, args) {

    //        let r = 0.5;
    //        if (args && args.r) {
    //            r = args.r
    //        }
    //        let theta = 2 * Math.PI * u;
    //        let phi = 2 * Math.PI * v;

    //        let x = Math.cos(theta) * (1 + r * Math.cos(phi))
    //        let y = Math.sin(theta) * (1 + r * Math.cos(phi))
    //        let z = r * Math.sin(phi)

    //        let nx = Math.cos(theta) * Math.cos(phi);
    //        let ny = Math.sin(theta) * Math.cos(phi);
    //        let nz = Math.sin(phi);

    //        return [x, y, z, nx, ny, nz, u, v]
    //    }
    //TODO: Implement tangent
    //    static cylinder(u, v, args) {

    //        let c = Math.cos(2 * Math.PI * u)
    //        let s = Math.sin(2 * Math.PI * u)
    //        let z = Math.max(-1, Math.min(1, 10 * v - 5))

    //        switch (Math.floor(5.001 * v)) {
    //            case 0: case 5: return [0, 0, z, 0, 0, z, u, v] // center of back/front end cap
    //            case 1: case 4: return [c, s, z, 0, 0, z, u, v] // perimeter of back/front end cap
    //            case 2: case 3: return [c, s, z, c, s, 0, u, v] // back/front of cylindrical tube
    //        }
    //    }

    //    static cone(u, v, args) {

    //        let c = Math.cos(2 * Math.PI * u)
    //        let s = Math.sin(2 * Math.PI * u)
    //        let z = Math.max(-1, Math.min(1, 10 * v - 5))

    //        switch (Math.floor(3.001 * v)) {
    //            case 0: case 3: return [0, 0, z, 0, 0, z, u, v] // center of back/front end cap
    //            case 1: case 2: return [c, s, z, c, s, z/3, u, v] // perimeter of back/front end cap
    //            // case 2: case 3: return [c, s, z, c, s, 0, u, v] // back/front of cylindrical tube
    //        }
    //    }

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
        // console.log(args);
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