"use strict"

/*
   Things you might want to try:
      object modify: move, rotate, scale, clone, delete, color, proportions
*/

/*--------------------------------------------------------------------------------

The proportions below just happen to match the dimensions of my physical space
and the tables in that space.

Note that I measured everything in inches, and then converted to units of meters
(which is what VR requires) by multiplying by 0.0254.

--------------------------------------------------------------------------------*/

const EYE_HEIGHT = 0.0254 * 69;
const HALL_LENGTH = 0.0254 * 306;
const HALL_WIDTH = 0.0254 * 213;
const TABLE_DEPTH = 0.0254 * 30;
const TABLE_HEIGHT = 0.0254 * 29;
const TABLE_WIDTH = 0.0254 * 60;
const TABLE_THICKNESS = 0.0254 * 11 / 8;
const LEG_THICKNESS = 0.0254 * 2.5;

////////////////////////////// SCENE SPECIFIC CODE

async function setup(state) {
   
   hotReloadFile(getPath('week11.js'));

   const images = await imgutil.loadImagesPromise([
      getPath("textures/wood.png"),
      getPath("textures/tiles.jpg"),
   ]);

   let libSources = await MREditor.loadAndRegisterShaderLibrariesForLiveEditing(gl, "libs", [
      { key: "pnoise", path: "shaders/noise.glsl", foldDefault: true },
      { key: "sharedlib1", path: "shaders/sharedlib1.glsl", foldDefault: true },
   ]);
   if (!libSources)
      throw new Error("Could not load shader library");

   // load vertex and fragment shaders from the server, register with the editor
   let shaderSource = await MREditor.loadAndRegisterShaderForLiveEditing(
      gl,
      "mainShader",
      {
         onNeedsCompilation: (args, libMap, userData) => {
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
         },
         onAfterCompilation: (program) => {
            gl.useProgram(state.program = program);
            state.uColorLoc = gl.getUniformLocation(program, 'uColor');
            state.uCursorLoc = gl.getUniformLocation(program, 'uCursor');
            state.uModelLoc = gl.getUniformLocation(program, 'uModel');
            state.uProjLoc = gl.getUniformLocation(program, 'uProj');
            state.uTexScale = gl.getUniformLocation(program, 'uTexScale');
            state.uTexIndexLoc = gl.getUniformLocation(program, 'uTexIndex');
            state.uTimeLoc = gl.getUniformLocation(program, 'uTime');
            state.uViewLoc = gl.getUniformLocation(program, 'uView');
            state.uTexLoc = [];
            for (let n = 0; n < 8; n++) {
               state.uTexLoc[n] = gl.getUniformLocation(program, 'uTex' + n);
               gl.uniform1i(state.uTexLoc[n], n);
            }
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

   let aTan = gl.getAttribLocation(state.program, 'aNor');
   gl.enableVertexAttribArray(aTan);
   gl.vertexAttribPointer(aTan, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 6);

   let aUV = gl.getAttribLocation(state.program, 'aUV');
   gl.enableVertexAttribArray(aUV);
   gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 9);

   for (let i = 0; i < images.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
      gl.generateMipmap(gl.TEXTURE_2D);
   }

   setupWorld(state);
}


let setupWorld = function (state) {

   if (state.handles == undefined) {
      state.handles = [
         new Vector(0, -.5, 0), new Vector(.5, -.5, 0), new Vector(1, -.5, .0), new Vector(1.5, -.5, .0),
         new Vector(0, -.5, .5), new Vector(.5, -.5, .5), new Vector(1, -.5, .5), new Vector(1.5, -.5, .5),
         new Vector(0, -.5, 1), new Vector(.5, -.5, 1), new Vector(1, -.5, 1), new Vector(1.5, -.5, 1),
         new Vector(0, -.5, 1.5), new Vector(.5, -.5, 1.5), new Vector(1, -.5, 1.5), new Vector(1.5, -.5, 1.5)
      ];
   }

   for(let i = 0; i < state.handles.length; i++){
      state.handles[i].add(new Vector(-1,0,-1));
   }


}


let noise = new ImprovedNoise();
let m = new Matrix();
let turnAngle = 0, tiltAngle = 0, cursorPrev = [0, 0, 0];

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

function ControllerHandler(controller) {
   this.isDown = () => controller.buttons[1].pressed;
   this.isButtonDown = (b) => controller.buttons[b].pressed;
   

   this.onEndFrame = () => wasDown = this.isDown();
   this.orientation = () => controller.pose.orientation;
   this.position = () => controller.pose.position;
   this.press = () => !wasDown && this.isDown();
   this.release = () => wasDown && !this.isDown();
   this.tip = () => {
      let P = this.position();          // THIS CODE JUST MOVES
      m.identity();                     // THE "HOT SPOT" OF THE
      m.translate(P[0], P[1], P[2]);    // CONTROLLER TOWARD ITS
      m.rotateQ(this.orientation());    // FAR TIP (FURTHER AWAY
      m.translate(0, 0, -.03);            // FROM THE USER'S HAND).
      let v = m.value();
      return [v[12], v[13], v[14]];
   }
   let wasDown = false;
}

let LC, RC, isNewObj;

function onStartFrame(t, state) {

   /*-----------------------------------------------------------------

   Whenever the user enters VR Mode, create the left and right
   controller handlers.

   Also, for my particular use, I have set up a particular transformation
   so that the virtual room would match my physical room, putting the
   resulting matrix into state.calibrate. If you want to do something
   similar, you would need to do a different calculation based on your
   particular physical room.

   -----------------------------------------------------------------*/

   if (MR.VRIsActive()) {
      if (!LC) LC = new ControllerHandler(MR.leftController);
      if (!RC) RC = new ControllerHandler(MR.rightController);

      if (!state.calibrate) {
         m.identity();
         m.rotateY(Math.PI / 2);
         m.translate(-2.01, .04, 0);
         state.calibrate = m.value().slice();
      }
   }

   if (!state.tStart)
      state.tStart = t;
   state.time = (t - state.tStart) / 1000;

   // THIS CURSOR CODE IS ONLY RELEVANT WHEN USING THE BROWSER MOUSE, NOT WHEN IN VR MODE.

   let cursorValue = () => {
      let p = state.cursor.position(), canvas = MR.getCanvas();
      return [p[0] / canvas.clientWidth * 2 - 1, 1 - p[1] / canvas.clientHeight * 2, p[2]];
   }

   let cursorXYZ = cursorValue();
   if (cursorXYZ[2] && cursorPrev[2]) {
      turnAngle -= Math.PI / 2 * (cursorXYZ[0] - cursorPrev[0]);
      tiltAngle += Math.PI / 2 * (cursorXYZ[1] - cursorPrev[1]);
   }
   cursorPrev = cursorXYZ;

   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   gl.uniform3fv(state.uCursorLoc, cursorXYZ);
   gl.uniform1f(state.uTimeLoc, state.time);

   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.CULL_FACE);

   /*-----------------------------------------------------------------

   Below is the logic for my little toy geometric modeler example.
   You should do something more or different for your assignment. 
   Try modifying the size or color or texture of objects. Try
   deleting objects or adding constraints to make objects align
   when you bring them together. Try adding controls to animate
   objects. There are lots of possibilities.

   -----------------------------------------------------------------*/
   
   if (LC) {
      let tip = RC.tip();
      let rPos = new Vector(tip[0], tip[1], tip[2]);

      selection = -1;
      
      let handleSelection = getHandleIntersected(rPos, state);

      let motion = Vector.sub(rPos, prevRPos);

      if (handleSelection >= 0) {

         selection = handleSelection;

         if (RC.isDown()) {
            state.handles[handleSelection] = Vector.add(state.handles[handleSelection], motion);
         }
      }

      if(RC.isButtonDown(0)){
         for(let i = 0; i < state.handles.length; i++){
            state.handles[i].add(motion);
         }
      }
      
      prevRPos = rPos;
   }
}


let selection = -1;
let prevRPos = new Vector(0,0,0);
/*-----------------------------------------------------------------

If the controller tip is near to a menu item, return the index
of that item. If the controller tip is not near to any menu
item, return -1.

mp == position of the menu origin (position of the right controller).
p  == the position of the left controller tip.

-----------------------------------------------------------------*/


let getHandleIntersected = function(vec, state){

   for(let i = 0; i < state.handles.length; i++){

      let rad = .1;

      
      if(Vector.dist(state.handles[i], vec) < rad ){
         return i;
      }
   }
   return -1;

}


function onDraw(t, projMat, viewMat, state, eyeIdx) {




   gl.uniformMatrix4fv(state.uViewLoc, false, new Float32Array(viewMat));
   gl.uniformMatrix4fv(state.uProjLoc, false, new Float32Array(projMat));

   let prev_shape = null;

   /*-----------------------------------------------------------------

   The drawShape() function below is optimized in that it only downloads
   new vertices to the GPU if the vertices (the "shape" argument) have
   changed since the previous call.

   Also, currently we only draw gl.TRIANGLES if this is a cube. In all
   other cases, we draw gl.TRIANGLE_STRIP. You might want to change
   this if you create other kinds of shapes that are not triangle strips.

   -----------------------------------------------------------------*/

   let drawShape = (shape, color) => {
      gl.uniform3fv(state.uColorLoc, color);
      gl.uniformMatrix4fv(state.uModelLoc, false, m.value());

      if (shape != prev_shape)
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape), gl.STATIC_DRAW);
      gl.drawArrays(shape == cube ? gl.TRIANGLES : gl.TRIANGLE_STRIP, 0, shape.length / VERTEX_SIZE);
      prev_shape = shape;
   }

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
      gl.drawArrays(gl.LINE_STRIP, 0, mesh.size);
   }

   /*-----------------------------------------------------------------

   Bezier Patch functions from le past (wk 7);

   -----------------------------------------------------------------*/



   let bezierPatch = new BezierPatch(state.handles);
   let cubicPatch = bezierPatch.handlesToPatchArray();

   let patch = new ParametricMesh(
      32, 32,
      ParametricMesh.cubicPatch,
      Patch.toCubicPatchCoefficients(Spline.BezierBasisMatrix, cubicPatch)
   );

   let lowResPatch = new ParametricMesh(
      3, 3,
      ParametricMesh.cubicPatch,
      Patch.toCubicPatchCoefficients(Spline.BezierBasisMatrix, cubicPatch)
   );





   /*-----------------------------------------------------------------

   In my little toy geometric modeler, the pop-up menu of objects only
   appears while the right controller trigger is pressed. This is just
   an example. Feel free to change things, depending on what you are
   trying to do in your homework.

   -----------------------------------------------------------------*/






   let showMenu = p => {
      let x = p[0], y = p[1], z = p[2];
      for (let n = 0; n < 4; n++) {
         m.save();
         m.translate(x + menuX[n], y + menuY[n], z);
         m.scale(.03, .03, .03);
         drawShape(menuShape[n], n == menuChoice ? [1, .5, .5] : [1, 1, 1]);
         m.restore();
      }
   }

   /*-----------------------------------------------------------------

   drawTabbe() just happens to model the physical size and shape of the
   tables in my lab (measured in meters). If you want to model physical
   furniture, you will probably want to do something different.

   -----------------------------------------------------------------*/

   /*-----------------------------------------------------------------

   The below is just my particular "programmer art" for the size and
   shape of a controller. Feel free to create a different appearance
   for the controller. You might also want the controller appearance,
   as well as the way it animates when you press the trigger or other
   buttons, to change with different functionality.

   For example, you might want to have one appearance when using it as
   a selection tool, a resizing tool, a tool for drawing in the air,
   and so forth.

   -----------------------------------------------------------------*/

   let drawController = (C, color) => {
      let P = C.position(), s = C.isDown() ? .0125 : .0225;
      m.save();
      m.translate(P[0], P[1], P[2]);
      m.rotateQ(C.orientation());
      m.save();
      m.translate(-s, 0, .001);
      m.scale(.0125, .016, .036);
      drawShape(cube, color);
      m.restore();
      m.save();
      m.translate(s, 0, .001);
      m.scale(.0125, .016, .036);
      drawShape(cube, color);
      m.restore();
      m.save();
      m.translate(0, 0, .025);
      m.scale(.015, .015, .01);
      drawShape(cube, [0, 0, 0]);
      m.restore();
      m.save();
      m.translate(0, 0, .035);
      m.rotateX(.5);
      m.save();
      m.translate(0, -.001, .035);
      m.scale(.014, .014, .042);
      drawShape(cylinder, [0, 0, 0]);
      m.restore();
      m.save();
      m.translate(0, -.001, .077);
      m.scale(.014, .014, .014);
      drawShape(sphere, [0, 0, 0]);

      m.restore();
      m.restore();
      m.restore();
   }

   m.identity();

   /*-----------------------------------------------------------------

   Notice that the actual drawing for my application is done in the
   onDraw() function, whereas the controller logic is done in the
   onStartFrame() function. Whatever your application, it is
   important to make this separation.

   -----------------------------------------------------------------*/

   if (LC) {
      drawController(LC, [1, 0, 0]);
      drawController(RC, [0, 1, 1]);
      // if (RC.isDown())
      //    showMenu(RC.position());
   }

   /*-----------------------------------------------------------------

   This is where I draw the objects that have been created.

   If I were to make these objects interactive (that is, responsive
   to the user doing things with the controllers), that logic would
   need to go into onStartFrame(), not here.

   -----------------------------------------------------------------*/

   m.rotateX(tiltAngle);
   m.rotateY(turnAngle);


   /*-----------------------------------------------------------------

   Notice that I make the room itself as an inside-out cube, by
   scaling x,y and z by negative amounts. This negative scaling
   is a useful general trick for creating interiors.

   -----------------------------------------------------------------*/

   
   m.save();
      for(let i = 0; i < state.handles.length; i++){
         m.save();
         let pos = state.handles[i];
         m.translate(pos.x, pos.y, pos.z);
         m.scale(.03,.03,.03);

         if(selection == i){
            drawShape(sphere, [1,1,1]);
         }else{
            drawShape(sphere, [0.33,.33, 0.0]);
         }
         m.restore();
      }

      if(RC){
         if(RC.isButtonDown(2)){
            drawLines(patch, [1,1,1]);
         }else{
            drawStrip(patch, [.2, 0.01, .01] );
         }
      }else{
         drawStrip(patch, [.2, 0.01, .01] );
      }
      // drawLines(lowResPatch, [1,1,1] );
   m.restore();
   m.restore();

}

function onEndFrame(t, state) {

   /*-----------------------------------------------------------------

   The below two lines are necessary for making the controller handler
   logic work properly -- in particular, detecting press() and release()
   actions.

   -----------------------------------------------------------------*/

   if (LC) LC.onEndFrame();
   if (RC) RC.onEndFrame();
}

export default function main() {
   const def = {
      name: 'week11',
      setup: setup,
      onStartFrame: onStartFrame,
      onEndFrame: onEndFrame,
      onDraw: onDraw,
   };
   return def;
}

