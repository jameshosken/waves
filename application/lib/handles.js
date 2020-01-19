
class Handle {

   constructor(x, y, z) {
      this.position = new Vector(x, y, z);
      this.velocity = new Vector(0, 0, 0);

      this.averagePositionBuffer = [];
      this.bufferPos = 0;
      this.bufferMax = 8;

      for(let i = 0; i < this.bufferMax; i++){
         this.averagePositionBuffer[i] = this.position;
      }

      console.log(this);
      
   }

   update(state) {
      if(isNaN(state.deltaTime) ){
         return;
      }
      this.position = Vector.add(this.position, this.velocity);
      //this.position = Vector.add(this.position, Vector.mult(this.velocity, state.deltaTime));  //*deltaTime to compensate for varying framerate
      this.velocity = Vector.mult(this.velocity, 0.95); //We'll just have to deal with this for now.
      
      this.syncToAveragePositionBuffer()
   }

   checkBounds(floor){
      if(this.position.y < floor){
         this.position.y = floor;   
         this.velocity.y *= -1;
      }
   }

   addVelocity(v){
      this.velocity = Vector.add(this.velocity, v);
   }
   
   setVelocity(v) {
      this.velocity = v;
   }

   pushAveragePositionBuffer(pos){
      this.averagePositionBuffer[this.bufferPos] = pos;
      this.bufferPos = (this.bufferPos + 1)%this.bufferMax;
   }

   syncToAveragePositionBuffer(){
      
      let v = this.velocity
      
      //console.log(v);
      if(v.magnitude() < 0.0001){
         // this.position = Vector.zero();
         let avgPos = Vector.zero();
         for(let i = 0; i < this.averagePositionBuffer.length; i++){
            avgPos.add(this.averagePositionBuffer[i]);
         }
         
         avgPos.mult(1 / this.averagePositionBuffer.length);

         let target = Vector.lerp(this.position, avgPos, 0.1);
         
         if(isNaN(target.x) || isNaN(target.y) || isNaN(target.z)) return
         //console.log(target);
         this.position = target;
      }else{
         this.pushAveragePositionBuffer(this.position);
      }
   }
}



let selection = -1;
let prevRPos = new Vector(0, 0, 0);

let getHandleIntersected = function (vec, state) {
   for (let i = 0; i < state.handles.length; i++) {
      let rad = .1;
      if (Vector.dist(state.handles[i].position, vec) < rad) {
         return i;
      }
   }
   return -1;
}


class HitHandler{

   constructor(){
      this.hitState = false;
      this.previousHitState = false;
   }

   updateHitState(b){
      this.previousHitState = this.hitState;
      this.hitState = b;
   }

   isNewHit(){
      return (this.hitState == true && this.previousHitState == false)
   }



}
