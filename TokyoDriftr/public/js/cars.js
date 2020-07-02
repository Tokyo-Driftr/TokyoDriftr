import * as THREE from 'https://unpkg.com/three/build/three.module.js';
class base_car{
	max_speed = 10
	acceleration = .1
	handling = .05 //radians turned per frame
	center = new THREE.Vector2(0,0)
	constructor(scene, loader, controller, modelName){
		this.velocity = 0
		//orientation of car
		this.direction = new THREE.Vector2(0,1)
		//delta of drift orientation vs regular orientation
		this.driftDeltaDirection = new THREE.Vector2(1,0)
		this.loader = loader
		this.scene = scene
		this.controller = controller
		
		this.drifting = false
		this.endingDrift = false
		this.driftDirection = 0 //1=left, -1=right

		var self = this
		// Load a glTF resource
		loader.load(
			'res/' + modelName,
			// called when the resource is loaded
			function ( gltf ) {
				self.gltf = gltf
				scene.add( gltf.scene );
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

	update(){
		var car = this.gltf.scene
		//drift
		if(this.controller.brake && this.controller.accelerate){
			if(!this.drifting && this.controller.turning){
				//start drift
				this.endingDrift = false
				this.driftDirection = this.controller.turnDirection
				this.drifting = true
				//this.driftDeltaDirection.set(1,0)
			}
			//rotate car into drift
			if(absangle(this.driftDeltaDirection) < this.maxDriftAngle) 
				this.driftDeltaDirection.rotateAround(this.center, this.controller.turnDirection * this.driftSpeed)
			//put sparks and stuff after it's been drifting for a bit
		}
		else if(this.drifting){
			this.endingDrift = true
			this.drifting = false
		}
		if(this.endingDrift){
			//end drift
			if(absangle(this.driftDeltaDirection)*2 > this.driftSpeed){
				this.endingDrift = true
				console.log("ending drift. dd:", this.driftDeltaDirection.angle(), "td:", this.direction.angle())
				//unrotate deltadirection
				this.driftDeltaDirection.rotateAround(this.center, -1 * this.driftDirection * this.driftSpeed)
				//rotate car direction
				this.direction.rotateAround(this.center,  this.driftDirection * this.driftSpeed)
			}else{
				this.endingDrift = false
				this.driftDeltaDirection.set(1,0)
			}
		}

		//handle acceleration
		if(this.controller.accelerate){
			if (!this.drifting && this.velocity < this.max_speed) this.velocity += this.acceleration
		}else if(this.controller.brake){
			if (this.velocity != 0) this.velocity = Math.max(0, this.velocity - 3*this.acceleration)
		}else{
			//no input
			if (this.velocity != 0) this.velocity = Math.max(0, this.velocity - 0.5*this.acceleration)
		}

		{
			//calculate steering
			var steering_angle = 0
			if(this.drifting){
				steering_angle = (this.driftDirection + this.controller.turnDirection) * 0.5 * (this.handling + this.driftHandling) * this.velocity
			}
			else{
				steering_angle = this.controller.turnDirection * this.handling * this.velocity
			}
			this.direction.rotateAround(this.center, steering_angle)
		}
		//console.log(this.direction)
		var delta_velocity = this.direction.clone()
		delta_velocity.setLength(this.velocity)
		car.rotation.y = this.direction.angle() + this.driftDeltaDirection.angle()
		car.position.x += delta_velocity.y
		car.position.z += delta_velocity.x
		//delta_velocity.set
		//console.log("current vel post", this.velocity.length())
		//car.rotation.y = this.velocity.angleTo(this.axis)
	}
}

export class rx7 extends base_car{
	constructor(scene, loader, controller){
		super(scene, loader, controller, "rx7_3.glb")
		this.max_speed = .6
		this.acceleration = .01
		this.handling = .05
		this.driftHandling = .01 // handling increase in the direction of the drift

		this.maxDriftAngle = .5 //radians
		this.driftSpeed = .01 //rate that the car's orientation changes into and out of drifts
	}
}

export class ae86 extends base_car{
	constructor(scene, loader, controller){
		super(scene, loader, controller, "rx7_3.glb")
		this.max_speed = .5
		this.acceleration = .02
		this.handling = .03
		this.driftHandling = .03 // handling increase in the direction of the drift

		this.maxDriftAngle = .7 //radians
		this.driftSpeed = .03 //rate that the car's orientation changes into and out of drifts
	}
}

function actualangle(vec){
	var ang = vec.angle()
	var pi = Math.pi
	if (ang > pi) return ang - 2*pi
	return ang
}

function absangle(vec){
	//absolute angle of vector2d. max PI radians (180 deg)
	var ang = vec.angle()
	return Math.min(Math.abs(ang - (2*Math.PI)), ang)
}