import * as THREE from 'https://unpkg.com/three/build/three.module.js';

let gravity = -5;
let particleCount = 5;
let particleSize = 0.07
var particles = [];

/*
*/
export function spawnParticle (scene, pos, dir, color) {
	dir.normalize()
	for (var i = 0; i < particleCount; i++){
  		var geometry = new THREE.CubeGeometry( particleSize, particleSize, particleSize );
  		var material = new THREE.MeshBasicMaterial( { color: color, transparent: true } );
  		var particle = new THREE.Mesh( geometry, material );
  		particle.position.x = pos.x + rand(-0.1, 0.1)
  		particle.position.y = pos.y + rand(-0.1, 0.1) + 0.1
  		particle.position.z = pos.z + rand(-0.1, 0.1)
  		scene.add(particle);
  		var velocity = new THREE.Vector3(
  			dir.x * rand(0, 0.25),
  			dir.y * rand(0, 0.5) + 0.5,
  			dir.z * rand(0, 0.25)
  		)
  		particles.push({
  			particle : particle,
  			velocity : velocity
  		});
  	}
 }

export function particleTick(scene) {
	particles.forEach(p => {
		p.particle.position.x += p.velocity.x
  		p.particle.position.y += p.velocity.y
  		p.particle.position.z += p.velocity.z
  		p.velocity.y += gravity/60
  		if (p.particle.position.y < 0) {
  			scene.remove(p.particle)
  		}
	});
}

function rand (min, max) {
	if (min > max) return 0;
	return min + (max-min)*Math.random()
}