/*
Cars.js controls the display and physics of all the cars in the game. There is a base_car class that
handles nearly everything, and the specific classes for each car just hold values based on the
physics properties and the model to display.

The orientation data for the car is held as 2d vectors for ease of rotation. Collisions are calculated based on the
car's distance to the center of the road. Upon a collision, the car is slightly slowed down,
and rebounded slightly forward, down the course. The rebound angle is always in the direction of "forward",
in order to prevent players from turning around backwards.
*/
import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as PARTICLES from '/js/particle.js'
class base_car{
		options = {
			max_speed: 10,
			acceleration: .1,
			handling: .05, //radians turned per frame
			driftHandling: .01, // handling increase in the direction of the drift
			maxDriftAngle: .3, //radians
			driftSpeed: .01,
		}
	width = 2
	length = 4
	collision_bounce = 0
	center = new THREE.Vector2(0,0)
	forward = new THREE.Vector2(1,0)
	dampedAngle = new THREE.Vector2(1,0)
	road_center_target = null
	y_axis = new THREE.Vector3(0,1,0)
	constructor(scene, loader, controller, modelName, gui, sound_engine, callback=null){
		var hitbox_material = new THREE.MeshLambertMaterial( { color: 0x004400, wireframe: true } );
		var hitbox_geometry = new THREE.BoxGeometry(this.width, 4, this.length);
		this.hitbox = new THREE.Mesh( hitbox_geometry, hitbox_material );
		//scene.add(this.hitbox)
		this.velocity = 0
		//orientation of car
		this.direction = new THREE.Vector2(0,1)
		//delta of drift orientation vs regular orientation
		this.driftDeltaDirection = new THREE.Vector2(1,0)
		this.loader = loader
		this.scene = scene
		this.controller = controller
		
		this.drifting = false
		this.driftTime = 0
		this.endingDrift = false
		this.driftDirection = 0 //1=left, -1=right

		var sound = sound_engine.getNewSound()
		var audioLoader = new THREE.AudioLoader();
		audioLoader.load( 'res/accel.mp3', function( buffer ) {
			sound.setBuffer( buffer );
			sound.setLoop( true );
			sound.setVolume( 0.5 );
			sound.setLoopStart(0.1)
			sound.setLoopEnd(4)
			sound.play();
		});
		this.sound = sound


		var self = this
		// Load the model
		loader.load(
			'res/' + modelName,
			// called when the resource is loaded
			function ( gltf ) {
				self.gltf = gltf
				scene.add( gltf.scene );
				if (callback != null) callback(self)
			},
			// called while loading is progressing
			function ( xhr ) {
				console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
			},
			// called when loading has errors
			function ( error ) {
				console.log( 'An error happened', error );

			}
		);

	}
	proximity(targetPosition){
		//finds the max distance from any vertex in the car's hitbox to the given vector3
		var temp = new THREE.Vector3()
		var max = 0
		this.hitbox.geometry.vertices.forEach((elem, i)=>{
			temp.copy(elem)
			temp.add(this.gltf.scene.position)
			var dist = temp.distanceTo(targetPosition)
			if (dist > max) max = dist
		})
		return max
	}
	collide(collider, center){
		/*
			This checks for a collision (or more specifically, if the car is a given distance from the collider),
			and then in the case of a collision, pushes the car towards the second specified "center".
		*/
		//check collision
		var distance = this.proximity(collider.position)
		if(distance < 8) return //no collision
		//reduce speed
		if(this.velocity > this.options.max_speed/2) this.velocity = Math.min(this.velocity, this.options.max_speed)*0.9
		//change angle to that of the wall you just hit
		var colliderRotation = new THREE.Vector2(1,0).rotateAround(this.center, collider.rotation.y)
		this.direction.rotateAround(colliderRotation, .1)
		
		//set up rebound. The variable changes the duration of the rebound
		this.collision_bounce = 10
		if(this.drifting) this.endingDrift = true
		this.road_center_target = center

		//get the car out of the wall
		var reboundDir = center.model.position.clone()
		reboundDir.sub(this.gltf.scene.position).setLength(distance-8)
		this.gltf.scene.position.add(reboundDir)

		this.collide_angle_dir = (this.direction.angle() - this.road_center_target.model.rotation.y) / 20

		if (this.velocity > 0.35) {
			var pdir = reboundDir.clone()
			pdir.x *= -1;
			pdir.z *= -1;
			PARTICLES.spawnParticle (this.scene, this.gltf.scene.position, pdir, 0xFC9800)
		}
	}
	driftBoostReady(){
		return this.driftTime > this.options.driftBoostTime
	}
	update(move){
		var car = this.gltf.scene
		this.hitbox.position.copy(car.position)
		this.hitbox.rotation.copy(car.rotation)

		var engine_pitch = this.velocity + 0.9
		this.sound.setPlaybackRate(engine_pitch)

		PARTICLES.particleTick(this.scene)

		if(this.collision_bounce > 0){
			this.collision_bounce--
			var bounce_force = Math.sqrt(this.collision_bounce) / 20
			var delta_pos = car.position.clone()
			delta_pos.sub(this.road_center_target.model.position).normalize().multiplyScalar(bounce_force)

			car.position.sub(delta_pos)

			//get axis
			var target_rotation = this.road_center_target.model.rotation.y
			var delta_ang = this.road_center_target.model.rotation.y -this.direction.angle()
			delta_ang = reduceAngle(delta_ang)
			//this.direction.set(1,0)
			this.direction.rotateAround(this.center, delta_ang/10)

		}
		else{

		}
		//drift
		if(this.drifting){
			this.driftTime++
			//spawn particles at rear
			if(true){
				var color = 0x555555
				if(this.driftBoostReady()) color = 0x6666ff
				var direction = new THREE.Vector3(-this.direction.y + Math.random(), 0, -this.direction.x+ Math.random())
				var position = this.gltf.scene.position.clone()
				console.log("pos1", position)
				position.sub(new THREE.Vector3(this.direction.y + Math.random(), 0,  this.direction.x + Math.random()))
				console.log("pos", position)
				PARTICLES.spawnParticle (this.scene, position, direction, color)

			}

		}
		if(this.controller.brake && this.controller.accelerate && !this.endingDrift){
			if(!this.drifting && this.controller.turning){
				//start drift
				this.endingDrift = false
				this.driftDirection = this.controller.turnDirection
				this.drifting = true
				//this.driftDeltaDirection.set(1,0)
			}
			//rotate car into drift
			if(absangle(this.driftDeltaDirection) < this.options.maxDriftAngle) 
				this.driftDeltaDirection.rotateAround(this.center, this.driftDirection * this.options.driftSpeed)
			//put sparks and stuff after it's been drifting for a bit
		}
		else if(this.drifting){
			this.endingDrift = true
			this.drifting = false
			if(this.driftBoostReady()){
				this.velocity += this.options.driftBoostStrength
			}
			this.driftTime = 0
			this.driftBoostTime = this.options.driftBoostDuration

		}
		if(this.endingDrift){
			//end drift
			if(absangle(this.driftDeltaDirection)*2 > this.options.driftSpeed){
				this.endingDrift = true
				//unrotate deltadirection
				var temp = this.direction.clone()
				temp.rotateAround(this.center, this.driftDeltaDirection.angle())
				this.driftDeltaDirection.lerp(this.forward, .1)
				//rotate car direction
				this.direction.lerp(temp.normalize(), .1)
			}else{
				this.endingDrift = false
				this.driftDeltaDirection.set(1,0)
			}
		}
		//handle post-drift boost
		this.driftBoostTime = Math.max(0, this.driftBoostTime - 1)
		if (this.velocity > this.options.max_speed && this.driftBoostTime <= 0){
			this.velocity *= 0.97
		}

		//handle acceleration
		if(this.controller.accelerate && move){
			if (!this.drifting && this.velocity < this.options.max_speed) this.velocity += this.options.acceleration
		}else if(this.controller.brake){
			if (this.velocity != 0) this.velocity = Math.max(0, this.velocity - 1*this.options.acceleration)
		}else{
			//no input
			if (this.velocity != 0) this.velocity = Math.max(0, this.velocity - 0.2*this.options.acceleration)
		}

		{
			//calculate steering
			var steering_angle = 0
			if(this.drifting){
				steering_angle = (this.driftDirection + this.controller.turnDirection) * 0.5 * (this.options.handling + this.options.driftHandling) * this.velocity
			}
			else{
				steering_angle = this.controller.turnDirection * this.options.handling * this.velocity
			}
			this.direction.rotateAround(this.center, steering_angle)
		}
		var delta_velocity = this.direction.clone()
		delta_velocity.setLength(this.velocity)
		car.rotation.y = this.direction.angle() + this.driftDeltaDirection.angle()
		car.position.x += delta_velocity.y
		car.position.z += delta_velocity.x
		
		//update damped angle for camera
		this.dampedAngle.lerp(this.direction, 0.2)

	}
}

export class rx7 extends base_car{
	constructor(scene, loader, controller, gui, sound_engine, callback=null){
		super(scene, loader, controller, "rx7_3.glb", gui, sound_engine, callback)
		this.options.max_speed = .7
		this.options.acceleration = .02
		this.options.handling = .03
		this.options.driftHandling = .01 // handling increase in the direction of the drift

		this.options.driftBoostStrength = .3
		this.options.driftBoostDuration = 20
		this.options.driftBoostTime = 50

		this.maxDriftAngle = .3 //radians
		this.driftSpeed = .01 //rate that the car's orientation changes into and out of drifts
	}
}

export class ae86 extends base_car{
	constructor(scene, loader, controller, gui, sound_engine, callback=null){
		super(scene, loader, controller, "ae86_2.glb", gui, sound_engine, callback)
		this.options.max_speed = .6
		this.options.acceleration = .025
		this.options.handling = .04
		this.options.driftHandling = .025 // handling increase in the direction of the drift

		this.options.driftBoostStrength = .2
		this.options.driftBoostDuration = 80
		this.options.driftBoostTime = 40

		this.options.maxDriftAngle = .5 //radians
		this.options.driftSpeed = .018 //rate that the car's orientation changes into and out of drifts
	}
}

export class civic extends base_car{
	constructor(scene, loader, controller, gui, sound_engine, callback=null){
		super(scene, loader, controller, "civic_hatch.glb", gui, sound_engine, callback)
		this.options.max_speed = .63
		this.options.acceleration = .02
		this.options.handling = .06
		this.options.driftHandling = .01 // handling increase in the direction of the drift

		this.options.driftBoostStrength = .5
		this.options.driftBoostDuration = 30
		this.options.driftBoostTime = 800

		this.options.maxDriftAngle = .1 //radians
		this.options.driftSpeed = .01 //rate that the car's orientation changes into and out of drifts
	}
}


function comp_angl2(ang1, ang2){
	//returns -1 if ang1 is to the right of ang2, 1 else
	if (ang1 < 0) ang1 += 2*Math.PI
	if (ang2 < 0) ang2 += 2*Math.PI
	var res = 0
	if(ang1 < ang2) ang1 += 2*Math.PI
	if (ang1 - ang2 < Math.PI) res = 1
	else res = -1

	return res
}

function actualangle(ang){
	var pi = Math.pi
	while (ang > 2*pi) ang -= 2*pi
	while (ang < 0) ang += 2*pi
	return ang
}

function reduceAngle(ang){
	//map an angle to the range -pi - pi
	while(ang < -Math.PI) ang += 2*Math.PI
	while(ang > Math.PI) ang -= 2*Math.PI
	return ang
}

function absangle(vec){
	//absolute angle of vector2d. max PI radians (180 deg)
	var ang = vec.angle()
	return Math.min(Math.abs(ang - (2*Math.PI)), ang)
}