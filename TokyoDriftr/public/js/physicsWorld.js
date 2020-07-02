//physicsWorld.js
//Runs physics simulation using oimo.js

import * as OIMO from 'https://unpkg.com/oimo@1.0.9/build/oimo.module.js';

export var physicsWorld;

export function initPhysicsWorld() {
	physicsWorld = new OIMO.World({ 
    	timestep: 1/60, 
    	iterations: 8, 
    	broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
    	worldscale: 1, // scale full world 
    	random: false,  // randomize sample
    	info: false,   // calculate statistic or not
    	gravity: [0,-10,0] 
	});
}

export function updateCar(car) {

}

export function physicsTick() {
	physicsWorld.step();
}

//Util