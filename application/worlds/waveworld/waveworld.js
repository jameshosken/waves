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
const HALL_LENGTH = inchesToMeters(306);
const HALL_WIDTH = inchesToMeters(215);
const RING_RADIUS = 0.0425;
const TABLE_DEPTH = inchesToMeters(30);
const TABLE_HEIGHT = inchesToMeters(29);
const TABLE_WIDTH = inchesToMeters(60);
const TABLE_THICKNESS = inchesToMeters(11 / 8);
const LEG_THICKNESS = inchesToMeters(2.5);
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






////////////////////////////// SCENE SPECIFIC CODE

let noise = new ImprovedNoise();
let m = new Matrix();

let setupWorld = function (state) {
   let scl = 1
   if (state.handles == undefined) {
      state.handles = [];


      for (let x = 0; x < GRIDSIZE * 3 + 1; x++) {
         for (let y = 0; y < GRIDSIZE * 3 + 1; y++) {
            let cX = (x - (GRIDSIZE * 3) / 2) * scl;
            let cY = (y - (GRIDSIZE * 3) / 2) * scl;
            state.handles.push(new Handle(cX, 0, cY))
         }
      }
   }

   //HERE OFFSET WORLD 

   if (!state.worldOffset) {
      state.worldOffset = new Vector(0, -0.5, 0);
   }

   for (let i = 0; i < state.handles.length; i++) {
      state.handles[i].position.add(state.worldOffset);
   }




   if (state.triangles == null) {
      state.triangles = [];
      // let transform = new Transform(new Vector(0, 0, -0), new Vector(0, 0, 0), new Vector(5, 5, 5));

      // let tri = new Geometry(transform, CG.triangle);
      // tri.addPhysicsBody(new Vector(.1, 0, 0), new Vector(0, 0.001, 0));
      // state.triangles = [tri];
   }

   if (state.squares == null) {
      state.squares = [];
      // let transform = new Transform(new Vector(0, 0, -0), new Vector(0, 0, 0), new Vector(5, 5, 5));

      // let sq = new Geometry(transform, CG.square);
      // tri.addPhysicsBody(new Vector(.1, 0, 0), new Vector(0, 0.001, 0));
      // state.squares = [tri];
   }

   if (state.lines == null) {
      state.lines = [];
      // let transform = new Transform(new Vector(0, 0, -0), new Vector(0, 0, 0), new Vector(5, 5, 5));

      // let tri = new Geometry(transform, CG.triangle);
      // tri.addPhysicsBody(new Vector(.1, 0, 0), new Vector(0, 0.001, 0));
      // state.triangles = [tri];
   }

   if (state.hitHandler == null) {
      state.hitHandler = new HitHandler();
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


         state.pianoSounds.push(C);
         state.pianoSounds.push(Db);
         state.pianoSounds.push(D);
         state.pianoSounds.push(Eb);
         state.pianoSounds.push(E);
         state.pianoSounds.push(F);
         state.pianoSounds.push(Gb);
         state.pianoSounds.push(G);
         state.pianoSounds.push(Ab);
         state.pianoSounds.push(A);
         state.pianoSounds.push(Bb);
         state.pianoSounds.push(B);


      }
   }

   console.log(state.pianoSounds)

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
   // called when world is switched
   // de-initialize / close scene-specific resources here
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




   // //CREATE FRAME BUFFER:
   // function createFramebuffer(gl, size) {
   //    var buffer = gl.createFramebuffer();
   //    //bind framebuffer to texture
   //    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
   //    var texture = createTexture(gl, size);
   //    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

   //    return {
   //      texture: texture,
   //      buffer: buffer
   //    };
   //  }


   // let image = null
   // gl.activeTexture(gl.TEXTURE0);
   // gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
   // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
   // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
   // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
   // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
   // gl.generateMipmap(gl.TEXTURE_2D);


   state.calibrationCount = 0;

   Input.initKeyEvents();

   // this.audioContext = new SpatialAudioContext();

   setupWorld(state);


   /************************************************************************

   OBJECT SYNC EXAMPLE

   ************************************************************************/


   // MR.objs.push(grabbableCube);
   // grabbableCube.position    = [0,0,-0.5].slice();
   // grabbableCube.orientation = [1,0,0,1].slice();
   // grabbableCube.uid = 0;
   // grabbableCube.lock = new Lock();
   // sendSpawnMessage(grabbableCube);
}

function onStartFrame(t, state) {


   /*-----------------------------------------------------------------

   Whenever the user enters VR Mode, create the left and right
   controller handlers.

   -----------------------------------------------------------------*/

   const input = state.input;
   const editor = state.editor;

   if (!state.avatarMatrixForward) {
      // MR.avatarMatrixForward is because i need accesss to this in callback.js, temp hack
      MR.avatarMatrixForward = state.avatarMatrixForward = CG.matrixIdentity();
      MR.avatarMatrixInverse = state.avatarMatrixInverse = CG.matrixIdentity();
   }

   if (MR.VRIsActive()) {
      if (!input.HS) input.HS = new HeadsetHandler(MR.headset);
      if (!input.LC) input.LC = new ControllerHandler(MR.leftController);
      if (!input.RC) input.RC = new ControllerHandler(MR.rightController);

      // if (!state.calibrate) {
      //    m.identity();
      //    m.rotateY(Math.PI / 2);
      //    m.translate(-2.01, .04, 0);
      //    state.calibrate = m.value().slice();
      // }
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

   // if (input.LC) {
   //    let LP = input.LC.center();
   //    let RP = input.RC.center();
   //    let D  = CG.subtract(LP, RP);
   //    let d  = metersToInches(CG.norm(D));
   //    let getX = C => {
   //       m.save();
   //          m.identity();
   //          m.rotateQ(CG.matrixFromQuaternion(C.orientation()));
   //          m.rotateX(.75);
   //          let x = (m.value())[1];
   //       m.restore();
   //       return x;
   //    }
   //    let lx = getX(input.LC);
   //    let rx = getX(input.RC);
   //    let sep = metersToInches(TABLE_DEPTH - 2 * RING_RADIUS);
   //    if (d >= sep - 1 && d <= sep + 1 && Math.abs(lx) < .03 && Math.abs(rx) < .03) {
   //       if (state.calibrationCount === undefined)
   //          state.calibrationCount = 0;
   //       if (++state.calibrationCount == 30) {
   //          m.save();
   //             m.identity();
   //             m.translate(CG.mix(LP, RP, .5));
   //             m.rotateY(Math.atan2(D[0], D[2]) + Math.PI/2);
   //             m.translate(-2.35,1.00,-.72);
   //             state.avatarMatrixForward = CG.matrixInverse(m.value());
   //             state.avatarMatrixInverse = m.value();
   //          m.restore();
   //          state.calibrationCount = 0;
   //       }
   //    }
   // }


   if (input.RC) {

      let tip = input.RC.tip();
      let rPos = new Vector(tip[0], tip[1], tip[2]);

      selection = -1;

      let handleSelection = getHandleIntersected(rPos, state);

      let motion = Vector.sub(rPos, prevRPos);

      if (handleSelection >= 0) {

         selection = handleSelection;

         if (input.RC.isDown()) {
            state.handles[handleSelection].setVelocity(motion);
         }
      }

      if (input.RC.isButtonDown(3)) {

         //If button for moving is down, store velocity:
         state.handles.forEach(function (handle) {
            handle.setVelocity(motion);
         });
      }

      prevRPos = rPos;

      let closest = 1000;
      let point = null;
      //If drum mode
      if (input.RC.isButtonDown(2)) {

         let tip = input.RC.tip();
         let rPos = new Vector(tip[0], tip[1], tip[2]);

         patches.forEach(function (patch) {
            
            // console.log(patch)
            patch.mesh.collisionPoints.forEach(function (collisionPoint) {
               let d = Vector.dist(rPos, collisionPoint);
               if (d < closest) {
                  closest = d;
                  point = collisionPoint;
               }
            });

         });

         
         if (closest < COLLISIONTHRESHOLD) {

            state.hitHandler.updateHitState(true);

            if (state.hitHandler.isNewHit()) {

               handleNoteHit(point, state);

            }


         } else {
            //Flag exit hit:
            state.hitHandler.updateHitState(false);
         }
      }
   }

   if (state.handles) {
      // console.log("FRAME");
      for (let i = 0; i < state.handles.length; i++) {
         state.handles[i].update();
         state.handles[i].checkBounds(-EYE_HEIGHT);
      }

   }


   //UPDATE OBJECTS HERE
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



   //updatePatches(state);

   releaseLocks(state);
   pollGrab(state);
}



function onDraw(t, projMat, viewMat, state, eyeIdx) {


   m.identity();
   m.rotateX(state.tiltAngle);
   m.rotateY(state.turnAngle);
   let P = state.position;
   m.translate(P[0], P[1], P[2]);

   m.save();
   myDraw(t, projMat, viewMat, state, eyeIdx, false);
   m.restore();

}

function myDraw(t, projMat, viewMat, state, eyeIdx) {

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

      if(prev_mat != mat){
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

      if(width != prev_width){
         gl.lineWidth(width);
      }

      if(prev_mat != MATERIALS.emission){
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



   let patches = [];

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

         patches.push(new BezierPatch(positions, RES, RES));
      }
   }

   let intersectionSphere = { vec: new Vector(0, -1, 0), contact: false };
   if (input.RC) {

      //If drum mode
      if (input.RC.isButtonDown(2)) {

         //TODO this in onStartFrame

         let tip = input.RC.tip();
         let rPos = new Vector(tip[0], tip[1], tip[2]);

         patches.forEach(function (patch) {
            let closest = 1000;
            let point = null;
            // console.log(patch)
            patch.mesh.collisionPoints.forEach(function (collisionPoint) {
               let d = Vector.dist(rPos, collisionPoint);
               if (d < closest) {
                  closest = d;
                  point = collisionPoint;
               }
            });

            if (closest < .1) {
               intersectionSphere.vec = new Vector(point.x, point.y, point.z);
               intersectionSphere.contact = true;
            }


         });

      }
   }

   m.save();

   for (let i = 0; i < state.handles.length; i++) {
      m.save();
      let pos = state.handles[i].position;
      m.translate(pos.x, pos.y, pos.z);
      m.scale(.03, .03, .03);

      if (selection == i) {
         drawStrip(CG.sphere, [1, 1, 1]);

      } else {
         drawStrip(CG.sphere, [0.33, .33, 0.0], 2);

      }
      m.restore();
   }


   /**DRAW REFERENCE SPHERE */
   if (intersectionSphere.contact) {
      m.save();
      m.translate(intersectionSphere.vec.x, intersectionSphere.vec.y, intersectionSphere.vec.z);
      m.scale(.1, .1, .1);
      drawStrip(CG.sphere, [1, 0, 0]);
      m.restore();

   }

   if (input.RC) {
      if (input.RC.isButtonDown(2)) {
         patches.forEach(function (patch) {
            drawLines(patch.mesh, [1, 0, 1]);
         })

      } else {
         patches.forEach(function (patch) {

            drawLines(patch.mesh, [1, 0, 1]);
         })
         // drawLines(bezierPatch.patch, [1, 1, 1]);
      }
   } else {
      patches.forEach(function (patch) {

         drawLines(patch.mesh, [1, 0, 1]);
      })
      // drawLines(bezierPatch.patch, [1, 1, 1]);
   }




   m.restore();



   let drawController = (C, color) => {

      let P = C.position(), s = C.isDown() ? .0125 : .0225;

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

      drawLines(CG.cube, [1, 1, 1,]);

      m.restore();
      m.restore();
      m.restore();
   }

   if (input.LC) {
      drawController(input.LC, [1, 0, 0]);
   }

   if (input.RC) {
      if (input.RC.isButtonDown(2)) {

         drawController(input.RC, [1, 1, 1]);
      } else {

         drawController(input.RC, [0, 1, 1]);
      }
   }


   /**
    * 
    * ENV
    * 
    */

   let envColour = [0,.2,.5]
   //DRAW GRID
   let floor = -EYE_HEIGHT
   m.save();

   //SUN
   m.save();
   m.translate(0, 0, -1000);
   m.scale(100, 100, 1);
   drawStrip(CG.sphere, [2, 2, 0], MATERIALS.sun);
   m.restore();

   //SUN STRIPES
   m.save();
   m.translate(0, 7, -990);
   m.scale(100,5,1);
   drawStrip(CG.cube, [0,0,0])
   m.restore();

   m.save();
   m.translate(0, 18, -990);
   m.scale(100,3,1);
   drawStrip(CG.cube, [0,0,0])
   m.restore();

   m.save();
   m.translate(0, 27, -990);
   m.scale(100,2,1);
   drawStrip(CG.cube, [0,0,0])
   m.restore();

   m.save();
   m.translate(0, 35, -990);
   m.scale(100,1,1);
   drawStrip(CG.cube, [0,0,0])
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

   
   let tri = new Geometry(new Vector(0,40,-30), new Vector(0,0,0), CG.triangle);

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
      if (state.audio == null) {
         state.audio = new SpatialAudioContext(state.pianoSounds)
      }


      if (state.audio.isPlaying) {
         state.audio.updateListener(input.HS.position(), input.HS.orientation());
      }

      //this.audioContext.updateListener(input.HS.position(), input.HS.orientation());

      // Here you initiate the 360 spatial audio playback from a given position,
      // in this case controller position, this can be anything,
      // i.e. a speaker, or an drum in the room.
      // You must provide the path given, when you construct the audio context.

      // for example:
      // if (input.LC && input.LC.press())
      //    this.audioContext.playToneAt(440.0, 0.5, 0.2, input.LC.position());
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

function pollGrab(state) {
   /*-----------------------------------------------------------------

    This function checks for intersection and if user has ownership over 
    object then sends a data stream of position and orientation.

    -----------------------------------------------------------------*/

   let input = state.input;
   if ((input.LC && input.LC.isDown()) || (input.RC && input.RC.isDown())) {

      let controller = input.LC.isDown() ? input.LC : input.RC;
      for (let i = 0; i < MR.objs.length; i++) {
         //ALEX: Check if grabbable.
         let isGrabbed = checkIntersection(controller.position(), MR.objs[i].shape);
         //requestLock(MR.objs[i].uid);
         if (isGrabbed == true) {
            if (MR.objs[i].lock.locked) {
               MR.objs[i].position = controller.position();
               const response =
               {
                  type: "object",
                  uid: MR.objs[i].uid,
                  state: {
                     position: MR.objs[i].position,
                     orientation: MR.objs[i].orientation,
                  },
                  lockid: MR.playerid,

               };

               MR.syncClient.send(response);
            } else {
               MR.objs[i].lock.request(MR.objs[i].uid);
            }
         }
      }
   }
}

function releaseLocks(state) {

   /*-----------------------------------------------------------------

    This function releases stale locks. Stale locks are locks that
    a user has already lost ownership over by letting go

    -----------------------------------------------------------------*/

   let input = state.input;
   if ((input.LC && !input.LC.isDown()) && (input.RC && !input.RC.isDown())) {
      for (let i = 0; i < MR.objs.length; i++) {
         if (MR.objs[i].lock.locked == true) {
            MR.objs[i].lock.locked = false;
            MR.objs[i].lock.release(MR.objs[i].uid);
         }
      }
   }
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


function handleNoteHit(point, state){
   

   console.log("Tone!")

   let toneToPlay = map_range(point.y, -1, 2, 0, state.pianoSounds.length);
   console.log(point.y);
   toneToPlay = Math.floor(toneToPlay);
   console.log(toneToPlay);
   let note = state.pianoSounds[toneToPlay]
   console.log(note);
   state.audio.playFileAt(note, [point.x, point.y, point.z])


   //state.audio.generateTone([point.x, point.y, point.z]);

   // //harder hit = more tris
   // let amt = Vector.mult(motion, 10).magnitude() + 1;
   // state.intersectionSphere.vec = new Vector(point.x, point.y, point.z);
   // state.intersectionSphere.contact = true;

   if (Math.random() < 0.5) {
        createNewGeometryOnHit(point, CG.line, state.lines);
   }
   if (Math.random() < 0.5) {
      createNewGeometryOnHit(point, CG.square, state.squares);
   }
   if (Math.random() < 0.5) {
      createNewGeometryOnHit(point, CG.triangle, state.triangles);
   }

}


function createNewGeometryOnHit(point, type, arr){
   let v = new Vector(
      (Math.random() * 2 - 1) * 0.01,
      (Math.random() * 2 - 1) * 0.01,
      (Math.random() * 2 - 1) * 0.01
   );
   let a = new Vector(
      (Math.random() * 2 - 1) * 0.01,
      (Math.random() * 2 - 1) * 0.01,
      (Math.random() * 2 - 1) * 0.01
   );
   let r = new Vector(
      (Math.random() * 2 - 1),
      (Math.random() * 2 - 1),
      (Math.random() * 2 - 1)
   );
   let t = new Transform(new Vector(point.x, point.y, point.z), r, new Vector(0.1, 0.1, 0.1));
   let obj = new Geometry(t, type);
   obj.addPhysicsBody(v, a);

   arr.push(obj);
}

/********************
* DRAW CONTROLLERS
*******************/

function drawControllers(state) {
   const input = state.input;

   // let drawHeadset = (position, orientation) => {
   //     //  let P = HS.position();'
   //     let P = position;

   //     m.save();
   //         m.multiply(state.avatarMatrixForward);
   //         m.translate(P[0], P[1], P[2]);
   //         m.rotateQ(orientation);
   //         m.scale(.1);
   //         m.save();
   //             m.scale(1, 1.5, 1);
   //             drawStrip(CG.sphere, [0, 0, 0]);
   //         m.restore();
   //         for (let s = -1; s <= 1; s += 2) {
   //             m.save();
   //                 m.translate(s * .4, .2, -.8);
   //                 m.scale(.4, .4, .1);
   //                 drawStrip(CG.sphere, [10, 10, 10]);
   //             m.restore();
   //         }
   //     m.restore();
   // }

   // let drawAvatar = (avatar, pos, rot, scale, state) => {
   //    m.save();
   //    //   m.identity();
   //       m.translate(pos[0],pos[1],pos[2]);
   //       m.rotateQ(rot);
   //       m.scale(scale,scale,scale);
   //       drawStrip(avatar.headset.vertices, [1,1,1], 0);
   //    m.restore();
   // }



   // let drawSyncController = (pos, rot, color) => {
   //     let P = pos;
   //     m.save();
   //         // m.identity();
   //         m.translate(P[0], P[1], P[2]);
   //         m.rotateQ(rot);
   //         m.translate(0, .02, -.005);
   //         m.rotateX(.75);
   //         m.save();
   //             m.translate(0, 0, -.0095).scale(.004, .004, .003);
   //         m.restore();
   //         m.save();
   //             m.translate(0, 0, -.01).scale(.04, .04, .13);
   //             drawStrip(CG.sphere, [0, 0, 0]);
   //         m.restore();
   //         m.save();
   //             m.translate(0, -.0135, -.008).scale(.04, .0235, .0015);
   //             drawStrip(CG.sphere, [0, 0, 0]);
   //         m.restore();
   //         m.save();
   //             m.translate(0, -.01, .03).scale(.012, .02, .037);
   //             drawStrip(CG.sphere, [0, 0, 0]);
   //         m.restore();
   //         m.save();
   //             m.translate(0, -.01, .067).scale(.012, .02, .023);
   //             drawStrip(CG.sphere, [0, 0, 0]);
   //         m.restore();
   //     m.restore();
   // }


   // for (let id in MR.avatars) {

   //     const avatar = MR.avatars[id];

   //     if (avatar.mode == MR.UserType.vr) {
   //         if (MR.playerid == avatar.playerid)
   //             continue;

   //         let headsetPos = avatar.headset.position;
   //         let headsetRot = avatar.headset.orientation;

   //         if (headsetPos == null || headsetRot == null)
   //             continue;

   //         if (typeof headsetPos == 'undefined') {
   //             console.log(id);
   //             console.log("not defined");
   //         }

   //         const rcontroller = avatar.rightController;
   //         const lcontroller = avatar.leftController;

   //         let hpos = headsetPos.slice();
   //         hpos[1] += EYE_HEIGHT;

   //         drawHeadset(hpos, headsetRot);
   //         let lpos = lcontroller.position.slice();
   //         lpos[1] += EYE_HEIGHT;
   //         let rpos = rcontroller.position.slice();
   //         rpos[1] += EYE_HEIGHT;

   //         drawSyncController(rpos, rcontroller.orientation, [1, 0, 0]);
   //         drawSyncController(lpos, lcontroller.orientation, [0, 1, 1]);
   //     }
   // }
}




