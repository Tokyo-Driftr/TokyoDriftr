//physicsWorld.js
//Runs physics simulation using oimo.js
//Kevin Pinney

import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as OIMO from 'https://unpkg.com/oimo@1.0.9/build/oimo.module.js';

//World where physics calculations takes place
export var physicsWorld;
//Colission bodys in world; each element is a {id, collision body, mesh}
export var bodys = [];

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

//Add a new body pair to bodys
export function addBody(id, collisionData, mesh) {
    var newBody = physicsWorld.add(collisionData);
    bodys.push({
        id: id,
        body: newBody,
        mesh: mesh
    });
    if (id == "rx7") console.log(newBody)
}

//Performs necessary calculations to simulate driving a car
export function carPhysicsTick(car) {

    var body = bodys.find(b => b.id == car.id);
    if (!body) return;

    var pos = body.body.getPosition();
    var dir = new THREE.Vector3(0, 0, 1)
    dir.applyQuaternion(body.body.getQuaternion())
    if (car.controller.accelerate) {
        if (Math.sqrt(body.body.linearVelocity.x*body.body.linearVelocity.x+body.body.linearVelocity.z*body.body.linearVelocity.z) < car.max_speed) {
            body.body.applyImpulse(pos, scalarMul(dir, car.acceleration))
        }
    } else if (car.controller.brake) {
        body.body.applyImpulse(pos, scalarMul(dir, -car.handling*100))
    }
    if (car.controller.turning) {
        var theta = car.controller.turnDirection * car.handling * amplitude({x: body.body.linearVelocity.x, y:0, z: body.body.linearVelocity.z })
        if (!theta) theta = 0
        body.body.angularVelocity.y = theta
        if (car.controller.brake) {
            body.body.applyImpulse(pos, scalarMul(dir, -car.handling*100))
        } else if (car.controller.accelerate) {
            var temp = scalarMul(dir, Math.sqrt(body.body.linearVelocity.x*body.body.linearVelocity.x+body.body.linearVelocity.z*body.body.linearVelocity.z))
            body.body.linearVelocity.x = temp.x
            body.body.linearVelocity.z = temp.z
        } else {
            var temp = scalarMul(dir, Math.sqrt(body.body.linearVelocity.x*body.body.linearVelocity.x+body.body.linearVelocity.z*body.body.linearVelocity.z))
            body.body.linearVelocity.x = temp.x
            body.body.linearVelocity.z = temp.z
        }
    } else {
        body.body.angularVelocity.y = 0
    }
}

//Runs a new physics calculation.  Should be called each tick
export function physicsTick() {
	physicsWorld.step();

    bodys.forEach(b => {
        if (b.mesh != null && b.id != "plane") {
            b.mesh.position.copy( b.body.getPosition() ); 
            b.mesh.quaternion.copy( b.body.getQuaternion() );
        }
    });
}

export function getVelocity(id) {
    var body = bodys.find(b => b.id == id);
    return body.body.linearVelocity
}

//util

function amplitude(vec) {
    return Math.sqrt(vec.x*vec.x + vec.y*vec.y + vec.z*vec.z);
}

//accepts vec3 and unit vec3 and returns a vector of same amplitude with new direction
function shiftAngle(vec, dir) {
    var amp = amplitude(vec);
    return {
        x: dir.x * amp,
        y: dir.y * amp,
        z: dir.z * amp
    }
}

function scalarMul (vec, c) {
    return {
        x: vec.x * c,
        y: vec.y * c,
        z: vec.z * c
    }
}

function Matrix4to3 (mat4) {
    return [mat4[0], mat4[1], mat4[2], mat4[4], mat4[5], mat4[6], mat4[8], mat4[9], mat4[10]];
}

function Matrix3to4 (mat) {
    return [mat[0], mat[1], mat[2], 0, mat[3], mat[4], mat[5], 0, mat[6], mat[7], mat[8], 0, 0, 0, 0, 1]
}

function massageQuatToTHREE (quat) {
    return {
        _x : quat.x,
        _y : quat.y,
        _z : quat.z,
        _w : quat.w
    }
}

function massageQuatToOIMO (quat) {
    return {
        x : quat._x,
        y : quat._y,
        z : quat._z,
        w : quat._w
    }
}
