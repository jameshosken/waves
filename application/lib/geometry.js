
class PhyscisBody {
    constructor(velocity, angularMomentum) {
       this.velocity = velocity;
       this.angularMomentum = angularMomentum;
 
       //TODO: Apply frictions?
       this.friction = 0.99;
       this.angularFriction = 0.9;
    }
 
    applyForce(force) {
       //Expects Vector
       this.velocity.add(force);
    }
 
    addTorque(transform, torque) {
       //Expects Vector
       this.angularMomentum.add(torque);
    }
 }
 
 class Transform {
    constructor(pos = new Vector(0, 0, 0), rot = new Vector(0, 0, 0), scale = new Vector(1, 1, 1)) {
       this.position = pos;
       this.rotation = rot;
       this.scale = scale;
    }
 }
 
 //Based off Unity GameObject system. Sort of. 
 class Geometry {
    constructor(transform, mesh) {
       this.mesh = mesh;
       this.transform = transform;
       this.physicsBody = null;
       this.age = 0;
    }
 
    addPhysicsBody(velocity = new Vector(0, 0, 0), angularMomentum = new Vector(0, 0, 0)) {
       this.physicsBody = new PhyscisBody(velocity, angularMomentum);
    }
 
    applyTransform(m) {
       let transform = this.transform;
       m.translate(transform.position.x, transform.position.y, transform.position.z);
       m.rotateX(transform.rotation.x);
       m.rotateY(transform.rotation.y);
       m.rotateZ(transform.rotation.z);
       m.scale(transform.scale.x, transform.scale.y, transform.scale.z);
 
    }
 
    update() {
       if (this.physicsBody != null) {
          this.transform.position.add(this.physicsBody.velocity);
          this.transform.rotation.add(this.physicsBody.angularMomentum);
       }
 
       this.age += 1;
    }
 }