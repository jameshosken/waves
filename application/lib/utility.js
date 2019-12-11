function handleCursor(state){
   // console.log("Cursor")
    let cursorValue = () => {
        let p = state.cursor.position(), canvas = MR.getCanvas();
      //   console.log(p)
        return [ p[0] / canvas.clientWidth * 2 - 1, 1 - p[1] / canvas.clientHeight * 2, p[2] ];
     }
  
     state.cursorXYZ = cursorValue();
     if (state.cursorPrev === undefined)
        state.cursorPrev = [0,0,0];
     if (state.turnAngle === undefined)
        state.turnAngle = state.tiltAngle = 0;
     if (state.cursorXYZ[2] && state.cursorPrev[2]) {
        state.turnAngle -= Math.PI/2 * (state.cursorXYZ[0] - state.cursorPrev[0]);
        state.tiltAngle += Math.PI/2 * (state.cursorXYZ[1] - state.cursorPrev[1]);
     }
     state.cursorPrev = state.cursorXYZ;
  
     if (state.position === undefined)
        state.position = [0,0,0];
     let fx = -.01 * Math.sin(state.turnAngle),
         fz =  .01 * Math.cos(state.turnAngle);
     if (Input.keyIsDown(Input.KEY_UP)) {
        state.position[0] += fx;
        state.position[2] += fz;
     }
     if (Input.keyIsDown(Input.KEY_DOWN)) {
        state.position[0] -= fx;
        state.position[2] -= fz;
     }
}