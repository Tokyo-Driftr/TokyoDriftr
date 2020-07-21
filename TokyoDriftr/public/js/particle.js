/*
particle.js
Kevin Pinney

Used to spawn particles.
*/

import * as THREE from 'https://unpkg.com/three/build/three.module.js';

let gravity = -5; //Base gravity for the particles
let density = 5; //Particle density for each call
var particles = []; //List of of all spawned particles

/*
Genereates particles
scene - THREE.js scene context
pos - THREE.Vector3 representing the spawn position
dir - THREE.Vector3 representing the direction the particle should travel
color - Hexadecimal value representing the color of the particle
*/
export function spawnParticle (scene, pos, dir, color) {
	  dir.normalize() //normalize direction so particle speed is fairly consistant
	  //Repeats multiple time based off density constant.  Higher the density, the more particles
    for (var i = 0; i < density; i++){
        //Creates tiny cube representing particle
  		  var geometry = new THREE.CubeGeometry( 0.05, 0.05, 0.05 );
  		  var material = new THREE.MeshBasicMaterial( { color: color, transparent: true } );
  		  var particle = new THREE.Mesh( geometry, material );
          //Sets position to the pos vector and randomly offset it
  		  particle.position.x = pos.x + rand(-0.1, 0.1)
  		  particle.position.y = Math.max(pos.y + rand(-0.1, 0.1), 0.01) //Must be >0 to not instantly despawn
  		  particle.position.z = pos.z + rand(-0.1, 0.1)
  		  //particle is added to scene
          scene.add(particle);
          //Sets a velocity randomly offset from the passed direction.  Biased to go up
  		  var velocity = new THREE.Vector3(
  		  	dir.x * rand(0, 0.25),
  		  	dir.y * rand(0, 0.5) + 0.5,
  		  	dir.z * rand(0, 0.25)
  		  )
          //Pair of particle mesh and Vector3 velocity
  		  particles.push({
  		  	particle : particle,
  		  	velocity : velocity
  		  });
  	}
}

/*
Updates the position and velocity for each particle in the particles lis
Despawns particles that have hit the floor 
scene - THREE.js scene context
*/
export function particleTick(scene) {
	particles.forEach(p => {
        //Adds velocity to position
		p.particle.position.x += p.velocity.x
  		p.particle.position.y += p.velocity.y
  		p.particle.position.z += p.velocity.z
        //changes velocity with respect to gravity
  		p.velocity.y += gravity/60
        //despawns particle if it hits the floor
  		if (p.particle.position.y < 0) {
  			scene.remove(p.particle)
  		}
	});
}

/*
Random function given a minimum and maximum value
*/
function rand (min, max) {
	if (min > max) return 0;
	return min + (max-min)*Math.random()
}