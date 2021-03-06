
class Handle {

   constructor(x, y, z) {
      this.position = new Vector(x, y, z);
      this.velocity = new Vector(0, 0, 0);
   }

   update() {
      this.position= Vector.add(this.position, this.velocity);
      this.velocity = Vector.mult(this.velocity, 0.95);

      
   }

   checkBounds(floor){
      if(this.position.y < floor){
         this.position.y = floor;   
         this.velocity.y *= -1;
      }
   }

   setVelocity(v) {
      this.velocity = v;
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
