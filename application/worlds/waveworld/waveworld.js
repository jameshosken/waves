"use strict"
console.log("Start")
/*--------------------------------------------------------------------------------

The proportions below just happen to match the dimensions of my physical space
and the tables in that space.

Note that I measured everything in inches, and then converted to units of meters
(which is what VR requires) by multiplying by 0.0254.

--------------------------------------------------------------------------------*/

const inchesToMeters = inches => inches * 0.0254;
const metersToInches = meters => meters / 0.0254;

const EYE_HEIGHT = inchesToMeters(69);
const RING_RADIUS = 0.0425;
const MAX_TRIANGLES = 100;

const MAX_SQUARES = 100;

let MATERIALS = {
   default: 0,
   sun: 1,
   orb: 2,
   emission: 3
}

let enableModeler = true;

const GRIDSIZE = 1; // How many patches are there (1 for best performance)
const RES = 9; //REsolution of grid
const COLLISIONTHRESHOLD = 0.05;

const SYNTH = false;




////////////////////////////// SCENE SPECIFIC CODE

let noise = new ImprovedNoise();
let m = new Matrix();

function sendSpawnMessage(object) {
   const response =
   {
      type: "spawn",
      uid: object.uid,
      state: object.state,
      //lockid: MR.playerid,
      lockid: -1,
   };

   MR.syncClient.send(response);
}

let setupWorld = function (state) {

   let scl = .5
   let c = 0;
   if (state.handles == undefined) {
      state.handles = [];
      //MR.objs = [];
      for (let x = 0; x < GRIDSIZE * 3 + 1; x++) {
         for (let y = 0; y < GRIDSIZE * 3 + 1; y++) {
            let cX = (x - (GRIDSIZE * 3) / 2) * scl;
            let cY = (y - (GRIDSIZE * 3) / 2) * scl;
            state.handles.push(new Handle(cX, 0, cY));
            // SETUP NETWORKED VELOCITY DATA
            let data = {
               uid: c,
               state: {
                  velocity: Vector.zero().toArray(),
                  handleIndex: c,
                  update: false
               },
               lock: new Lock()
            }

            MR.objs.push(data);
            sendSpawnMessage(data);
            c++;
            console.log(">>>>>>>>>>>>>>")
         }
      }

      // Add flag for 'all' handles
      let data = {
         uid: c,
         state: {
            velocity: Vector.zero().toArray(),
            handleIndex: -1,
            update: false
         },
         lock: new Lock()
      }
      // c++;

      MR.objs.push(data);
      sendSpawnMessage(data);
   }

   console.log("MR OBJS:");
   console.log(MR.objs);

   //HERE OFFSET WORLD 

   if (!state.worldOffset) {
      state.worldOffset = new Vector(0, 0, 0);
   }

   for (let i = 0; i < state.handles.length; i++) {
      state.handles[i].position.add(state.worldOffset);
   }


   if (state.patches == null) {
      updatePatches(state);
   }


   if (state.triangles == null) {
      state.triangles = [];

   }

   if (state.squares == null) {
      state.squares = [];
   }

   if (state.lines == null) {
      state.lines = [];
   }



   if (state.pianoSounds == null) {
      state.pianoSounds = [];

      for (let i = 1; i < 8; i++) {
         let path = "assets/audio/pianoloud/"
         let medTail = "-49-96.wav"

         let loudTail = "-97-127.wav"

         let Ab = path + "Ab" + i + loudTail;
         let A = path + "A" + i + loudTail;
         let Bb = path + "Bb" + i + loudTail;
         let B = path + "B" + i + loudTail;
         let C = path + "C" + i + loudTail;
         let Db = path + "Db" + i + loudTail;
         let D = path + "D" + i + loudTail;
         let Eb = path + "Eb" + i + loudTail;
         let E = path + "E" + i + loudTail;
         let F = path + "F" + i + loudTail;
         let Gb = path + "Gb" + i + loudTail;
         let G = path + "G" + i + loudTail;

         //Pentatonic with 4th:
         state.pianoSounds.push(C);
         //state.pianoSounds.push(Db);
         state.pianoSounds.push(D);
         //state.pianoSounds.push(Eb);
         state.pianoSounds.push(E);
         state.pianoSounds.push(F);
         //state.pianoSounds.push(Gb);
         state.pianoSounds.push(G);
         //state.pianoSounds.push(Ab);
         state.pianoSounds.push(A);
         //state.pianoSounds.push(Bb);
         //state.pianoSounds.push(B);


      }
   }

   console.log(state.pianoSounds)

}

let updatePatches = function (state) {
   state.patches = [];

   //Allows for more than 1 patch but for performance sake our demo is 1
   for (let gridX = 0; gridX < GRIDSIZE; gridX++) {

      for (let gridY = 0; gridY < GRIDSIZE; gridY++) {

         let positions = [];

         for (let localX = 0; localX < 4; localX++) {
            for (let localY = 0; localY < 4; localY++) {

               let x = gridX * 3 + localX;
               let y = gridY * 3 + localY;
               let gridLength = GRIDSIZE * 3 + 1
               let idx = (y * gridLength) + x;

               positions.push(state.handles[idx].position);
            }
         }

         state.patches.push(new BezierPatch(positions, RES, RES));
      }
   }
}

let updateObjects = function (state) {
   /**
    * UPDATE OBJECTS HERE
    */
   for (let i = 0; i < state.triangles.length; i++) {
      let tri = state.triangles[i];
      tri.update();
   }
   if (state.triangles.length > MAX_TRIANGLES) {
      state.triangles.shift();
   }

   for (let i = 0; i < state.squares.length; i++) {
      let sq = state.squares[i];
      sq.update();
   }
   if (state.squares.length > MAX_TRIANGLES) {
      state.squares.shift();
   }

   for (let i = 0; i < state.lines.length; i++) {
      let ln = state.lines[i];
      ln.update();
   }
   if (state.lines.length > MAX_TRIANGLES) {
      state.lines.shift();
   }
}

let updateHandles = function (state) {
   if (state.handles) {
      for (let i = 0; i < state.handles.length; i++) {
         state.handles[i].update(state);
         state.handles[i].checkBounds(-EYE_HEIGHT);
      }
   }
}


/*--------------------------------------------------------------------------------

I wrote the following to create an abstraction on top of the left and right
controllers, so that in the onStartFrame() function we can detect press()
and release() events when the user depresses and releases the trigger.

The field detecting the trigger being pressed is buttons[1].pressed.
You can detect pressing of the other buttons by replacing the index 1
by indices 0 through 5.

You might want to try more advanced things with the controllers.
As we discussed in class, there are many more fields in the Gamepad object,
such as linear and angular velocity and acceleration. Using the browser
based debugging tool, you can do something like console.log(leftController)
to see what the options are.

--------------------------------------------------------------------------------*/

async function initCommon(state) {
   // (New Info): use the previously loaded module saved in state, use in global scope
   // TODO automatic re-setting of loaded libraries to reduce boilerplate?
   // gfx = state.gfx;
   // state.m = new CG.Matrix();
   // noise = state.noise;
}

async function onReload(state) {
   // called when this file is reloaded
   // re-initialize imports, objects, and state here as needed
   await initCommon(state);

   // Note: you can also do some run-time scripting here.
   // For example, do some one-time modifications to some objects during
   // a performance, then remove the code before subsequent reloads
   // i.e. like coding in the browser console
}

async function onExit(state) {

   console.log("Goodbye! =)");
}

async function setup(state) {

   hotReloadFile(getPath('waveworld.js'));
   // (New Info): Here I am loading the graphics module once
   // This is for the sake of example:
   // I'm making the arbitrary decision not to support
   // reloading for this particular module. Otherwise, you should
   // do the import in the "initCommon" function that is also called
   // in onReload, just like the other import done in initCommon
   // the gfx module is saved to state so I can recover it
   // after a reload
   // state.gfx = await MR.dynamicImport(getPath('lib/graphics.js'));
   state.noise = new ImprovedNoise();
   await initCommon(state);

   state.input = {
      turnAngle: 0,
      tiltAngle: 0,
      cursor: ScreenCursor.trackCursor(MR.getCanvas()),
      cursorPrev: [0, 0, 0],
      LC: null,
      RC: null
   }

   let libSources = await MREditor.loadAndRegisterShaderLibrariesForLiveEditing(gl, "libs", [
      { key: "pnoise", path: "shaders/noise.glsl", foldDefault: true },
      { key: "sharedlib1", path: "shaders/sharedlib1.glsl", foldDefault: true },
   ]);

   if (!libSources)
      throw new Error("Could not load shader library");

   function onNeedsCompilationDefault(args, libMap, userData) {
      const stages = [args.vertex, args.fragment];
      const output = [args.vertex, args.fragment];
      const implicitNoiseInclude = true;

      if (implicitNoiseInclude) {
         let libCode = MREditor.libMap.get('pnoise');
         for (let i = 0; i < 2; i++) {
            const stageCode = stages[i];
            const hdrEndIdx = stageCode.indexOf(';');
            const hdr = stageCode.substring(0, hdrEndIdx + 1);
            output[i] = hdr + '\n#line 2 1\n' +
               '#include<pnoise>\n#line ' + (hdr.split('\n').length + 1) + ' 0' +
               stageCode.substring(hdrEndIdx + 1);

         }
      }

      MREditor.preprocessAndCreateShaderProgramFromStringsAndHandleErrors(
         output[0],
         output[1],
         libMap
      );
   }

   // load vertex and fragment shaders from the server, register with the editor
   let shaderSource = await MREditor.loadAndRegisterShaderForLiveEditing(
      gl,
      "mainShader",
      {

         onNeedsCompilationDefault: onNeedsCompilationDefault,
         onAfterCompilation: (program) => {
            gl.useProgram(state.program = program);
            state.uColorLoc = gl.getUniformLocation(program, 'uColor');
            state.uMaterialLoc = gl.getUniformLocation(program, 'uMaterial');
            state.uCursorLoc = gl.getUniformLocation(program, 'uCursor');
            state.uModelLoc = gl.getUniformLocation(program, 'uModel');
            state.uProjLoc = gl.getUniformLocation(program, 'uProj');
            state.uTimeLoc = gl.getUniformLocation(program, 'uTime');
            state.uViewLoc = gl.getUniformLocation(program, 'uView');
         }
      },
      {
         paths: {
            vertex: "shaders/vertex.vert.glsl",
            fragment: "shaders/fragment.frag.glsl"
         },
         foldDefault: {
            vertex: true,
            fragment: false
         }
      }
   );

   if (!shaderSource)
      throw new Error("Could not load shader");

   state.cursor = ScreenCursor.trackCursor(MR.getCanvas());

   state.buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);

   let bpe = Float32Array.BYTES_PER_ELEMENT;

   let aPos = gl.getAttribLocation(state.program, 'aPos');
   gl.enableVertexAttribArray(aPos);
   gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 0);

   let aNor = gl.getAttribLocation(state.program, 'aNor');
   gl.enableVertexAttribArray(aNor);
   gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 3);

   let aTan = gl.getAttribLocation(state.program, 'aTan');
   gl.enableVertexAttribArray(aTan);
   gl.vertexAttribPointer(aTan, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 6);

   let aUV = gl.getAttribLocation(state.program, 'aUV');
   gl.enableVertexAttribArray(aUV);
   gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 9);

   state.calibrationCount = 0;

   Input.initKeyEvents();

   setupWorld(state);

}

function onStartFrame(t, state) {

   const input = state.input;
   const editor = state.editor;

   if (!state.avatarMatrixForward) {
      // MR.avatarMatrixForward is because i need accesss to this in callback.js, temp hack
      MR.avatarMatrixForward = state.avatarMatrixForward = CG.matrixIdentity();
      MR.avatarMatrixInverse = state.avatarMatrixInverse = CG.matrixIdentity();
   }

   //Create controller & headset handlers each time VR mode is entered
   if (MR.VRIsActive()) {
      if (!input.HS) input.HS = new HeadsetHandler(MR.headset);
      if (!input.LC) input.LC = new ControllerHandler(MR.leftController);
      if (!input.RC) input.RC = new ControllerHandler(MR.rightController);

      if (!state.calibrate) {
         m.identity();
         // m.rotateY(Math.PI / 2);
         // m.translate(-2.01, .04, 0);
         state.calibrate = m.value().slice();
      }
   }

   //Handle Timing
   if (!state.tStart) { state.tStart = t; }
   state.time = (t - state.tStart) / 1000;
   state.deltaTime = state.time - state.pTime;
   state.pTime = state.time;

   //HANDLE CURSOR
   handleCursor(state);

   //SETUP GRAPHIC STATE

   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   gl.clearColor(0.0, 0.0, 0.0, 1.0);

   gl.uniform3fv(state.uCursorLoc, state.cursorXYZ);
   gl.uniform1f(state.uTimeLoc, state.time);

   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.CULL_FACE);

   let patches = state.patches;
   state.intersectionSphere = { vec: new Vector(0, -1, 0), contact: false };


   handleController(input.RC, state);
   handleController(input.LC, state);


   updateHandles(state);

   updateObjects(state);

   updatePatches(state);

   calibrate(input, state);

   releaseLocks(state)

   pollGrab(input.RC, state);
   pollGrab(input.LC, state);

}

function onDraw(t, projMat, viewMat, state, eyeIdx) {
   m.identity();
   m.save()
   m.rotateX(state.tiltAngle);
   m.rotateY(state.turnAngle);
   let P = state.position;
   m.translate(P[0], P[1], P[2]);
   m.save();
   myDraw(t, projMat, viewMat, state, eyeIdx, false);
   m.restore();
   m.restore();
}

function myDraw(t, projMat, viewMat, state, eyeIdx) {

   let patches = state.patches;

   if (!state.handles) {
      console.log("No Handles")
      return;
   }

   viewMat = CG.matrixMultiply(viewMat, state.avatarMatrixInverse);
   gl.uniformMatrix4fv(state.uViewLoc, false, new Float32Array(viewMat));
   gl.uniformMatrix4fv(state.uProjLoc, false, new Float32Array(projMat));

   let prev_mesh = null;
   let prev_width = 1;
   let prev_mat = 0;

   const input = state.input;

   let drawStrip = (mesh, color, mat = 0) => {
      gl.uniform3fv(state.uColorLoc, color);
      gl.uniformMatrix4fv(state.uModelLoc, false, m.value());

      if (prev_mat != mat) {
         gl.uniform1i(state.uMaterialLoc, mat);
         prev_mat = mat;
      }

      gl.uniformMatrix4fv(state.uModelLoc, false, m.value());
      if (mesh != prev_mesh)
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, mesh.size);
      prev_mesh = mesh;
   }

   let drawLines = (mesh, color, width = 1) => {

      if (width != prev_width) {
         gl.lineWidth(width);
      }

      if (prev_mat != MATERIALS.emission) {
         gl.uniform1i(state.uMaterialLoc, MATERIALS.emission);
         prev_mat = MATERIALS.emission;
      }

      gl.uniform3fv(state.uColorLoc, color);
      gl.uniformMatrix4fv(state.uModelLoc, false, m.value());
      if (mesh != prev_mesh)
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
      gl.drawArrays(gl.LINES, 0, mesh.size);
      prev_mesh = mesh;
   }

   m.save();


   /**
    * DRAW HANDLES
    */

   for (let i = 0; i < state.handles.length; i++) {
      m.save();

      m.multiply(state.avatarMatrixForward);
      let pos = state.handles[i].position;
      m.translate(pos.x, pos.y, pos.z);
      m.scale(.03, .03, .03);
      drawStrip(CG.sphere, [0.33, .33, 0.0], 2);

      m.restore();
   }

   /**
    * DRAW PATCHES
    */

   m.multiply(state.avatarMatrixForward);
   patches.forEach(function (patch) {
      drawLines(patch.mesh, [1, 0, 1]);
   })


   m.restore();



   let drawController = (C, color) => {

      let P = C.position(), s = C.isDown() ? .0125 : .0225;
      m.multiply(state.avatarMatrixForward)

      if (C.isButtonDown(2)) {
         //Handle
         m.save();
         m.translate(P[0], P[1], P[2]);
         m.rotateQ(C.orientation());
         m.save();
         m.translate(0, 0.0, 0.03);
         m.scale(.01, .01, .05);
         drawLines(CG.cube, color, 0.1);
         m.restore();
         //Hitter

         m.save();
         m.translate(0, 0, -0.02);
         m.scale(.05, .05, .05);
         m.rotateX(-Math.PI / 2);
         drawLines(CG.lowResLineSphere, color, 0.1);
         m.restore();

         m.restore();
      } else {
         m.save();
         m.translate(P[0], P[1], P[2]);
         m.rotateQ(C.orientation());

         m.save();
         m.translate(-s, 0, .001);
         m.scale(.0125, .016, .036);
         drawLines(CG.cube, color, 0.1);
         m.restore();
         m.save();
         m.translate(s, 0, .001);
         m.scale(.0125, .016, .036);
         drawLines(CG.cube, color);
         m.restore();
         m.save();
         m.translate(0, 0, .025);
         m.scale(.015, .015, .01);
         drawLines(CG.cube, color);
         m.restore();
         m.save();
         m.translate(0, 0, .035);
         m.rotateX(.5);
         m.save();
         m.translate(0, -.001, .035);
         m.scale(.014, .014, .042);
         drawLines(CG.cube, color);
         m.restore();
         m.save();
         m.translate(0, -.001, .077);
         m.scale(.014, .014, .014);

         drawLines(CG.cube, [1, 1, 1,]);

         m.restore();
         m.restore();
         m.restore();
      }

   }

   m.save();
   if (input.LC) {
      drawController(input.LC, [1, 0, 0]);
   }

   m.restore();
   m.save();
   if (input.RC) {
      drawController(input.RC, [0, 1, 1]);
   }

   m.restore();


   /**
    * 
    * ENV
    * 
    */

   let envColour = [0, .2, .5]
   //DRAW GRID
   let floor = -EYE_HEIGHT
   m.save();

   //SUN
   m.save();
   m.translate(0, 0, -1000);
   m.scale(200, 200, 1);
   drawStrip(CG.sphere, [2, 2, 0], MATERIALS.sun);
   m.restore();

   //SUN STRIPES
   m.save();
   m.translate(0, 7, -990);
   m.scale(200, 5, 1);
   drawStrip(CG.cube, [0, 0, 0])
   m.restore();

   m.save();
   m.translate(0, 18, -990);
   m.scale(200, 3, 1);
   drawStrip(CG.cube, [0, 0, 0])
   m.restore();

   m.save();
   m.translate(0, 27, -990);
   m.scale(200, 2, 1);
   drawStrip(CG.cube, [0, 0, 0])
   m.restore();

   m.save();
   m.translate(0, 35, -990);
   m.scale(200, 1, 1);
   drawStrip(CG.cube, [0, 0, 0])
   m.restore();

   //FLOOR
   m.save();
   m.translate(0, floor - 0.1, 0);
   m.scale(1000, .01, 1000);
   drawStrip(CG.sphere, [0, 0, 0]);
   m.restore();


   //FLOOR GRID
   for (let x = -10; x < 10; x++) {
      m.save();

      m.scale(1, 1, 1000);
      m.translate((x * 0.5) ** 3, -EYE_HEIGHT, 0);

      drawLines(CG.line, envColour, 2);
      m.restore();

      m.save();
      m.rotateY(Math.PI / 2);
      m.scale(1, 1, 1000);
      m.translate((x * 0.5) ** 3, -EYE_HEIGHT, 0);

      drawLines(CG.line, envColour, 2);
      m.restore();
   }


   if (state.triangles) {
      state.triangles.forEach(function (tri) {
         m.save();
         tri.applyTransform(m);
         drawLines(tri.mesh, [1, 0, 1], 2)
         m.restore();
      });
   }

   if (state.squares) {
      state.squares.forEach(function (sq) {
         m.save();
         sq.applyTransform(m);
         drawLines(sq.mesh, [1, 0, 1], 2)
         m.restore();
      });
   }

   if (state.lines) {
      state.lines.forEach(function (line) {
         m.save();
         line.applyTransform(m);
         drawLines(line.mesh, [1, 0, 1], 2)
         m.restore();
      });
   }

   m.restore();


}

function onEndFrame(t, state) {
   pollAvatarData();

   const input = state.input;

   if (input.HS != null) {

      if (state.audioContext == null) {
         state.audioContext = new SpatialAudioContext(state.pianoSounds);
      }

      //if (state.audio.isPlaying) {
      if (state.audioContext != null) {
         state.audioContext.updateListener(input.HS.position(), input.HS.orientation());
      }
   }

   if (input.LC) input.LC.onEndFrame();
   if (input.RC) input.RC.onEndFrame();
}

export default function main() {
   const def = {
      name: 'Waves',
      setup: setup,
      onStartFrame: onStartFrame,
      onEndFrame: onEndFrame,
      onDraw: onDraw,

      // (New Info): New callbacks:

      // VR-specific drawing callback
      // e.g. for when the UI must be different 
      //      in VR than on desktop
      //      currently setting to the same callback as on desktop
      onDrawXR: onDraw,
      // call upon reload
      onReload: onReload,
      // call upon world exit
      onExit: onExit
   };

   return def;
}


//////////////EXTRA TOOLS

// A better approach for this would be to define a unit sphere and
// apply the proper transform w.r.t. corresponding grabbable object

function checkIntersection(point, verts) {
   const bb = calcBoundingBox(verts);
   const min = bb[0];
   const max = bb[1];

   if (point[0] > min[0] && point[0] < max[0] &&
      point[1] > min[1] && point[1] < max[1] &&
      point[2] > min[2] && point[2] < max[2]) return true;

   return false;
}

// see above

function calcBoundingBox(verts) {
   const min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
   const max = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE];

   for (let i = 0; i < verts.length; i += 2) {

      if (verts[i] < min[0]) min[0] = verts[i];
      if (verts[i + 1] < min[1]) min[1] = verts[i + 1];
      if (verts[i + 2] < min[2]) min[2] = verts[i + 2];

      if (verts[i] > max[0]) max[0] = verts[i];
      if (verts[i + 1] > max[1]) max[1] = verts[i + 1];
      if (verts[i + 2] > max[2]) max[2] = verts[i + 2];
   }

   return [min, max];
}

/********************
 * 
 * CONTROLS
 * 
 **********************/


function HeadsetHandler(headset) {
   this.orientation = () => headset.pose.orientation;
   this.position = () => headset.pose.position;
}

function ControllerHandler(controller) {

   this.isDown = () => controller.buttons[1].pressed;

   this.isButtonDown = (b) => controller.buttons[b].pressed;
   this.onEndFrame = () => wasDown = this.isDown();
   this.orientation = () => controller.pose.orientation;
   this.position = () => controller.pose.position;
   this.press = () => !wasDown && this.isDown();
   this.release = () => wasDown && !this.isDown();
   this.tip = () => {
      m.save();
      let P = this.position();            // THIS CODE JUST MOVES
      m.identity();                       // THE "HOT SPOT" OF THE
      m.translate(P[0], P[1], P[2]);      // CONTROLLER TOWARD ITS
      m.rotateQ(this.orientation());      // FAR TIP (FURTHER AWAY
      m.translate(0, 0, -.03);            // FROM THE USER'S HAND).
      let v = m.value();
      m.restore();
      return [v[12], v[13], v[14]];
   }
   this.center = () => {
      let P = this.position();
      m.identity();
      m.translate(P[0], P[1], P[2]);
      m.rotateQ(this.orientation());
      m.translate(0, .02, -.005);
      let v = m.value();
      return [v[12], v[13], v[14]];
   }
   let wasDown = false;
}

function map_range(value, low1, high1, low2, high2) {
   return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


function handleNoteHit(point, state) {


   //JH: Switch between synth and piano modes:
   if (SYNTH) {

      state.audioContext.playToneAt([point.x, point.y, point.z]);

   } else {
      let toneToPlay = map_range(point.y, -1, 2, 0, state.pianoSounds.length);
      console.log(point.y);
      toneToPlay = Math.floor(toneToPlay);
      console.log(toneToPlay);
      let note = state.pianoSounds[toneToPlay]
      console.log(note);
      state.audioContext.playFileAt(note, [point.x, point.y, point.z])
   }


   //JH NEXT STEP: a harder hit results in more geometry spawned.  
   if (Math.random() < 0.8) {
      createNewGeometryOnHit(point, CG.line, state.lines);
   }
   if (Math.random() < 0.6) {
      createNewGeometryOnHit(point, CG.triangle, state.triangles);
   }
   if (Math.random() < 0.3) {
      createNewGeometryOnHit(point, CG.square, state.squares);
   }

}


function createNewGeometryOnHit(point, type, arr) {
   let velocity = new Vector(
      (Math.random() * 2 - 1) * 0.01,
      (Math.random() * 2 - 1) * 0.01,
      (Math.random() * 2 - 1) * 0.01
   );
   let angularVeclocity = new Vector(
      (Math.random() * 2 - 1) * 0.01,
      (Math.random() * 2 - 1) * 0.01,
      (Math.random() * 2 - 1) * 0.01
   );
   let rotation = new Vector(
      (Math.random() * 2 - 1),
      (Math.random() * 2 - 1),
      (Math.random() * 2 - 1)
   );
   let t = new Transform(new Vector(point.x, point.y, point.z), rotation, new Vector(0.1, 0.1, 0.1));
   let obj = new Geometry(t, type);
   obj.addPhysicsBody(velocity, angularVeclocity);

   arr.push(obj);
}

/*************
* CONTROLLERS
*************/

function handleMultiplayerController(state) {

}


function handleController(controller, state) {
   if (controller) {
      controller.newVelocities = []; //EMpty array to populate with velocities (to send to other clients)
      let tip = controller.tip();
      let pos = new Vector(tip[0], tip[1], tip[2]);
      let patches = state.patches;

      if (controller.prevPos == null) {
         controller.prevPos = new Vector(0, 0, 0);
      }

      //Each controller gets its own hit handler:
      if (controller.hitHandler == null) {
         controller.hitHandler = new HitHandler();
      }

      selection = -1;

      let handleSelection = getHandleIntersected(pos, state);

      let motion = Vector.sub(pos, controller.prevPos); // Find framerate-independent velocity

      if (handleSelection >= 0) {

         selection = handleSelection;

         if (controller.isDown()) {
            //MOVE SINGLE HANDLE
            //TODO: Broadcast to other clients here
            controller.newVelocities.push({ idx: handleSelection, vec: motion })
            //state.handles[handleSelection].setVelocity(motion);
         }
      }

      if (controller.isButtonDown(3)) {
         // MOVE ALL HANDLES SIMULTANEOUSLY
         //If button for moving is down, add velocity to each handle handle:
         state.handles.forEach(function (handle) {
            //TODO: Broadcast to other clients here
            controller.newVelocities.push({ idx: -1, vec: motion });   //-1 = flag for all handles
            //handle.setVelocity(motion);
         });
      }

      controller.prevPos = pos;

      let closest = 1000;
      let point = null;

      //If MUSIC MODE
      if (controller.isButtonDown(2)) {

         patches.forEach(function (patch) {

            // Check position of controller again collision points of mesh
            patch.mesh.collisionPoints.forEach(function (collisionPoint) {
               let d = Vector.dist(pos, collisionPoint);
               if (d < closest) {
                  closest = d;
                  point = collisionPoint;
               }
            });
         });

         if (closest < COLLISIONTHRESHOLD) {
            controller.hitHandler.updateHitState(true);
            if (controller.hitHandler.isNewHit()) {

               let emitPoint = Vector.matrixMultiply(state.avatarMatrixForward, point);
               handleNoteHit(emitPoint, state); // Changed to controller position rather than collision point because collision point returned untransformed mesh point.
            }
         } else {
            //Flag exit hit:
            controller.hitHandler.updateHitState(false);
         }
      }
   }
}


let calibrate = function (input, state) {

   m.save();
   if (input.LC) {
      let LP = input.LC.center();
      let RP = input.RC.center();
      let D = CG.subtract(LP, RP);
      let d = metersToInches(CG.norm(D));
      let getX = C => {
         m.save();
         m.identity();
         m.rotateQ(CG.matrixFromQuaternion(C.orientation()));
         m.rotateX(.75);
         let x = (m.value())[1];
         m.restore();
         return x;
      }

      let lx = getX(input.LC);
      let rx = getX(input.RC);
      let sep = metersToInches(2 * RING_RADIUS);

      if (d >= sep - 1 && d <= sep + 1 && Math.abs(lx) < .03 && Math.abs(rx) < .03) {
         if (state.calibrationCount === undefined)
            state.calibrationCount = 0;
         if (++state.calibrationCount == 30) {


            //Multiply by forward to find world value of handles
            console.log("Calibrating!")
            for (let i = 0; i < state.handles.length; i++) {

               state.handles[i].position = Vector.matrixMultiply(state.avatarMatrixForward, state.handles[i].position);

            }


            m.save();
            m.identity();
            m.translate(CG.mix(LP, RP, .5));
            m.rotateY(Math.atan2(D[0], D[2]) + Math.PI / 2);
            m.translate(0, 0, 0);
            //m.translate(-2.35, 1.00, -.72);
            //m.translate(-.5, .5, .5);
            state.avatarMatrixForward = CG.matrixInverse(m.value());
            state.avatarMatrixInverse = m.value();
            m.restore();


            //Multiply by inverse to find new relative value
            for (let i = 0; i < state.handles.length; i++) {
               state.handles[i].position = Vector.matrixMultiply(state.avatarMatrixInverse, state.handles[i].position);
            }

            state.calibrationCount = 0;
         }
      }
   }

   m.restore();
}


function pollGrab(controller, state) {



   //check if updating velocity;

   //if updating velocity,
   //check if locked. If locked
   //update MR velocities
   //else
   //request lock

   let queryLock = (i, vec) => {
      console.log("Querying Lock")
      if (MR.objs[i].lock.locked) {
         console.log("Lock Held")

         //Update MR obj with velocity from controller
         MR.objs[i].state.velocity = vec.toArray();

         const response =
         {
            type: "object",
            uid: MR.objs[i].uid,
            state: {
               handleIndex: MR.objs[i].state.handleIndex,
               velocity: MR.objs[i].state.velocity,
               update: true
            },
            lockid: MR.playerid,
         };
         console.log(response);
         MR.syncClient.send(response);

      } else {
         console.log("No Lock. Requesting Lock")
         console.log("UID: " + MR.objs[i].uid);
         MR.objs[i].lock.request(MR.objs[i].uid);
      }
   }

   if (controller) {
      controller.newVelocities.forEach(newVelocity => {
         if (newVelocity.idx == -1) {
            // If all handles are moving, send flag for all handles:
            queryLock(16, newVelocity.vec);
         }
         else {
            //If certain handles are moving, update each one individually (using the handle index obtained in handleController() )
            for (let i = 0; i < controller.newVelocities.length; i++) {
               queryLock(controller.newVelocities[i].idx, newVelocity.vec);
            }
         }
      });
   }


   /*
   UPDATE VELOCITIES
   Update all velocities! // TODO break this out to separate function; do after request locks
   */
   
   MR.objs.forEach(velocityDatum => {
      //Check if update requested:
      if (velocityDatum.state.update == true) {
         console.log("UPDATE REQUESTED")

         //set update request back to false:
         velocityDatum.state.update = false;

       let vec = new Vector(
         velocityDatum.state.velocity[0],
         velocityDatum.state.velocity[1],
         velocityDatum.state.velocity[2])

         if (velocityDatum.state.handleIndex == -1) {
            
            //Move all handles simultaneously
            state.handles.forEach(function (handle) {
               handle.setVelocity(vec);
            })
         } else {
            state.handles[velocityDatum.state.handleIndex].setVelocity(vec)
            // For now apply friction locally, within handles.js
         }
      }


   });



}

function isControllerDown(controller) {
   if (controller) {
      if (controller.isDown()) return true;
      if (controller.isButtonDown(3)) return true;
   }
   return false;
}

function releaseLocks(state) {
   let input = state.input;

   if (!isControllerDown(input.LC) && !isControllerDown(input.RC)) {
      //console.log("RELEASING")
      for (let i = 0; i < MR.objs.length; i++) {
         if (MR.objs[i].lock.locked == true) {
            MR.objs[i].lock.locked = false;
            MR.objs[i].lock.release(MR.objs[i].uid);
         }
      }
   }
}




/*************
 * CALIBRATION
 ************/

/**
 * Archive
 */

 //TODO
