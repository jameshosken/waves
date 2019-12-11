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

let enableModeler = true;

////////////////////////////// SCENE SPECIFIC CODE

let noise = new ImprovedNoise();
let m = new Matrix();

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
         // (New Info): example of how the pre-compilation function callback
         // could be in the standard library instead if I put the function defintion
         // elsewhere
         onNeedsCompilationDefault: onNeedsCompilationDefault,
         onAfterCompilation: (program) => {
            gl.useProgram(state.program = program);
            state.uColorLoc = gl.getUniformLocation(program, 'uColor');
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

   // load files into a spatial audio context for playback later - the path will be needed to reference this source later
   this.audioContext1 = new SpatialAudioContext([
      'assets/audio/blop.wav'
   ]);

   this.audioContext2 = new SpatialAudioContext([
      'assets/audio/peacock.wav'
   ]);


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

   gl.uniform3fv(state.uCursorLoc, cursorXYZ);
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

      if(input.RC.isButtonDown(3)){
         //If button for moving is down, store velocity:
         state.handles.forEach(function(handle){
               handle.setVelocity(motion);
         });
      }

      prevRPos = rPos;
   }   

   state.handles.forEach(function(handle){
      handle.update();
   });

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

   viewMat = CG.matrixMultiply(viewMat, state.avatarMatrixInverse);
   gl.uniformMatrix4fv(state.uViewLoc, false, new Float32Array(viewMat));
   gl.uniformMatrix4fv(state.uProjLoc, false, new Float32Array(projMat));

   let prev_shape = null;

   const input = state.input;

   // let drawShape = (shape, color) => {
   //    gl.uniform3fv(state.uColorLoc, color);
   //    gl.uniformMatrix4fv(state.uModelLoc, false, m.value());

   //    if (shape != prev_shape)
   //       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape), gl.STATIC_DRAW);
   //    gl.drawArrays(shape == CG.cube ? gl.TRIANGLES : gl.TRIANGLE_STRIP, 0, shape.length / VERTEX_SIZE);
   //    prev_shape = shape;
   // }

   let drawStrip = (mesh, color) => {
      gl.uniform3fv(state.uColorLoc, color);
      gl.uniformMatrix4fv(state.uModelLoc, false, m.value());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, mesh.size);
   }

   let drawLines = (mesh, color) => {
      gl.uniform3fv(state.uColorLoc, color);
      gl.uniformMatrix4fv(state.uModelLoc, false, m.value());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
      gl.drawArrays(gl.LINES, 0, mesh.size);
   }

   let bezierPatch = new BezierPatch(positions, 16, 16);

   m.save();

   for (let i = 0; i < state.handles.length; i++) {
      m.save();
      let pos = state.handles[i].position;
      m.translate(pos.x, pos.y, pos.z);
      m.scale(.03, .03, .03);

      if (selection == i) {
         drawStrip(CG.sphere, [1, 1, 1]);
      } else {
         drawStrip(CG.sphere, [0.33, .33, 0.0]);
      }
      m.restore();
   }


   // m.rotateY(t * 0.001);
   // m.rotateZ(t * 0.002);
   // m.rotateX(t * 0.003);
   if (input.RC) {
      if (input.RC.isButtonDown(2)) {
         drawLines(lowResPatch, [1, 0, 1]);
      } else {
         drawLines(patch, [1, 1, 1]);
      }
   } else {
      drawLines(patch, [1, 1, 1]);
   }

   m.restore();

   drawControllers(state);


}

function onEndFrame(t, state) {
   pollAvatarData();

   const input = state.input;

   if (input.HS != null) {

      // Here is an example of updating each audio context with the most
      // recent headset position - otherwise it will not be spatialized

      this.audioContext1.updateListener(input.HS.position(), input.HS.orientation());
      this.audioContext2.updateListener(input.HS.position(), input.HS.orientation());

      // Here you initiate the 360 spatial audio playback from a given position,
      // in this case controller position, this can be anything,
      // i.e. a speaker, or an drum in the room.
      // You must provide the path given, when you construct the audio context.

      if (input.LC && input.LC.press())
         this.audioContext1.playFileAt('assets/audio/blop.wav', input.LC.position());

      if (input.RC && input.RC.press())
         this.audioContext2.playFileAt('assets/audio/peacock.wav', input.RC.position());
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
