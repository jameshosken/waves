function HeadsetHandler(headset) {
    this.orientation = () => headset.pose.orientation;
    this.position = () => headset.pose.position;
}

function ControllerHandler(controller) {
    this.isDown = () => controller.buttons[1].pressed;
    this.onEndFrame = () => wasDown = this.isDown();
    this.orientation = () => controller.pose.orientation;
    this.position = () => controller.pose.position;
    this.press = () => !wasDown && this.isDown();
    this.release = () => wasDown && !this.isDown();
    this.tip = () => {
        let P = this.position();          // THIS CODE JUST MOVES
        m.identity();                     // THE "HOT SPOT" OF THE
        m.translate(P[0], P[1], P[2]);      // CONTROLLER TOWARD ITS
        m.rotateQ(this.orientation());    // FAR TIP (FURTHER AWAY
        m.translate(0, 0, -.03);            // FROM THE USER'S HAND).
        let v = m.value();
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