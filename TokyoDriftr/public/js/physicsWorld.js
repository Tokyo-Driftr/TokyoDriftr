//physicsWorld.js
//Runs physics simulation using oimo.js
//Kevin Pinney

import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as OIMO from 'https://unpkg.com/oimo@1.0.9/build/oimo.module.js';

//World where physics calculations takes place
export var physicsWorld;
//Colission bodys in world; each element is a {id, collision body, mesh}
export var bodys = [];
var showHitBoxes = false;

//Creates physics world
export function initPhysicsWorld() {
	physicsWorld = new OIMO.World({ 
    	timestep: 1/60, 
    	iterations: 8, 
    	broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
    	worldscale: 1, // scale full world 
    	random: false,  // randomize sample
    	info: true,   // calculate statistic or not
    	gravity: [0,-10,0] 
	});
}

//Add a new body to bodys
export function addBody(id, collisionData, mesh) {
    var newBody = physicsWorld.add(collisionData);
    var geometry = new THREE.BoxGeometry(collisionData.size[0], collisionData.size[1], collisionData.size[2]);
    var material = new THREE.MeshBasicMaterial( { color: 16777215*Math.random() } );
    var cube = new THREE.Mesh( geometry, material );
    cube.visible = false;
    cube.position.copy( newBody.getPosition() );
    bodys.push({
        id: id, //string id for object
        body: newBody, //oimo collision object
        mesh: mesh, //corrosponding three mesh
        move: collisionData.move, //does the object move
        hitbox: cube//box representing hitbox
    });
}

//Performs necessary calculations to simulate driving a car
export function carPhysicsTick(car) {
    var body = bodys.find(b => b.id == car.id);
    //var fwheel = bodys.find(b => b.id == "fwheel");
    //var bwheel = bodys.find(b => b.id == "bwheel");
    if (!body) return;

    //unit vector pointing towards velocity
    var vhat = new THREE.Vector3(body.body.linearVelocity.x, body.body.linearVelocity.y, body.body.linearVelocity.z)
    vhat.normalize()

    //car position
    var pos = body.body.getPosition();

    //unit vecror pointing towards front of hood
    var dir = new THREE.Vector3(0, 0, 1)
    dir.applyQuaternion(body.body.getQuaternion())
    dir.normalize()

    //wheels locked
    if (car.controller.brake) {
        if (car.controller.accelerate) {
            //Do we want to handle anything here?
        } else {
            //Brakes apply, car slows down
            body.body.applyImpulse(pos, scalarMul(vhat, car.handling*-10000))
        }
        
        //Rolling wheels make velcoity vector step towards direction vector
        var theta = Math.acos(dir.dot(vhat))
        var q = Math.max(Math.abs(theta)-car.handling*0.25, 0)
        var w = Math.abs(q/theta)
        var temp = scalarMul(
            {x: w*vhat.x + (1-w)*dir.x, y: w*vhat.y + (1-w)*dir.y, z: w*vhat.z + (1-w)*dir.z}, 
            Math.sqrt(body.body.linearVelocity.x*body.body.linearVelocity.x+body.body.linearVelocity.z*body.body.linearVelocity.z)
        )
        body.body.linearVelocity.x = temp.x
        body.body.linearVelocity.z = temp.z

        //Turning applys angular velocity
        if (car.controller.turning) {
            var theta = car.controller.turnDirection * car.driftHandling * (magnitude({x: body.body.linearVelocity.x, y:0, z: body.body.linearVelocity.z }))
            if (!theta) theta = 0
            body.body.angularVelocity.y = theta;
            //body.body.angularVelocity.y = unsignedMin(theta, body.body.angularVelocity.y+0.01*car.controller.turnDirection)
        }


    } else { //wheels are not locked
        //Handles engine, impulse pointing towards front of car
        if (car.controller.accelerate && Math.sqrt(body.body.linearVelocity.x*body.body.linearVelocity.x+body.body.linearVelocity.z*body.body.linearVelocity.z) < car.max_speed) {
            body.body.applyImpulse(pos, scalarMul(dir, car.acceleration))
        }

        //Turning applys angular velocity
        if (car.controller.turning) {
            var theta = car.controller.turnDirection * car.handling * (magnitude({x: body.body.linearVelocity.x, y:0, z: body.body.linearVelocity.z }))
            if (!theta) theta = 0
            body.body.angularVelocity.y = theta;
            //body.body.angularVelocity.y = unsignedMin(theta, body.body.angularVelocity.y+0.1*car.controller.turnDirection)
        } else if (body.body.angularVelocity.y != 0) {
        var newAngular = Math.max(Math.abs(body.body.angularVelocity.y) - car.handling*10, 0) * ((body.body.angularVelocity.y > 0 ) ? 1 : -1)
        if (newAngular) {
            body.body.angularVelocity.y = newAngular;
        }
        //body.body.angularVelocity.y = 0;
    }

        //Rolling wheels make velcoity vector step towards direction vector
        var theta = Math.acos(dir.dot(vhat))
        var q = Math.max(Math.abs(theta)-car.handling, 0)
        var w = Math.abs(q/theta)
        var temp = scalarMul(
        {x: w*vhat.x + (1-w)*dir.x, y: w*vhat.y + (1-w)*dir.y, z: w*vhat.z + (1-w)*dir.z}, 
        Math.sqrt(body.body.linearVelocity.x*body.body.linearVelocity.x+body.body.linearVelocity.z*body.body.linearVelocity.z))
        body.body.linearVelocity.x = temp.x
        body.body.linearVelocity.z = temp.z

        //simulates friction from getting car to turn
        //var stoppage = 1-Math.max(Math.abs(dir.dot(vhat)),0)
        //body.body.applyImpulse(pos, scalarMul(vhat, -100*stoppage))
    }
}

//Runs a new physics calculation.  Should be called each tick
export function physicsTick() {
    physicsWorld.step();

    bodys.forEach(b => {
        if (b.mesh != false && b.move) {
            b.mesh.position.copy( b.body.getPosition() ); 
            b.mesh.quaternion.copy( b.body.getQuaternion() );
        }
        b.hitbox.position.copy( b.body.getPosition() ); 
        b.hitbox.quaternion.copy( b.body.getQuaternion() );
    });
}

export function getVelocity(id) {
    var body = bodys.find(b => b.id == id);
    if (body) 
        return body.body.linearVelocity
    else
        return false
}

export function toggleHitboxes() {
    showHitBoxes = !showHitBoxes
    bodys.forEach(b => {
        //if (b.mesh) b.mesh.visible = !showHitBoxes
        b.hitbox.visible = showHitBoxes
    });
}

//----
//util
//----

//Returns magnitude of a vec3
function magnitude(vec) {
    return Math.sqrt(vec.x*vec.x + vec.y*vec.y + vec.z*vec.z);
}

//accepts vec3 and unit vec3 and returns a vector of same magnitude with new direction
function shiftAngle(vec, dir) {
    var mag = magnitude(vec);
    return {
        x: dir.x * mag,
        y: dir.y * mag,
        z: dir.z * mag
    }
}

//Returns the min of the two absolute values of a and b
function unsignedMin(a, b) {
    if (Math.abs(a) < Math.abs(b)) {
        return a;
    } else {
        return b;
    }
}

//Vec3 scalar multiplication
function scalarMul (vec, c) {
    return {
        x: vec.x * c,
        y: vec.y * c,
        z: vec.z * c
    }
}

//Truncate bottom row, furthest column
function Matrix4to3 (mat4) {
    return [mat4[0], mat4[1], mat4[2], mat4[4], mat4[5], mat4[6], mat4[8], mat4[9], mat4[10]];
}

//Adds a row and column
function Matrix3to4 (mat) {
    return [mat[0], mat[1], mat[2], 0, mat[3], mat[4], mat[5], 0, mat[6], mat[7], mat[8], 0, 0, 0, 0, 1]
}

//Data massage for THREE quaternions
function massageQuatToTHREE (quat) {
    return {
        _x : quat.x,
        _y : quat.y,
        _z : quat.z,
        _w : quat.w
    }
}

//Data massage for Oimo quaternions
function massageQuatToOIMO (quat) {
    return {
        x : quat._x,
        y : quat._y,
        z : quat._z,
        w : quat._w
    }
}
