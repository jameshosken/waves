
class Handle{

    constructor(x,y,z){
       this.position = new Vector(x,y,z);
       this.velocity = new Vector(0,0,0);
    }
 
    update(){
       this.position.add(this.velocity);
       this.velocity.mult(0.97);
    }
 
    setVelocity(v){
       this.velocity = v;
    }
 
 }
 
 
 let selection = -1;
 let prevRPos = new Vector(0,0,0);
 
 let getHandleIntersected = function(vec, state){
    state.handles.forEach(function(handle){
       let rad = .1;
       if(Vector.dist(state.handles[i].position, vec) < rad ){
          return i;
       }
    })
    return -1;
 }
 