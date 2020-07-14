import * as THREE from 'https://unpkg.com/three/build/three.module.js';
class base_car{
	max_speed = 10
	acceleration = .1
	handling = .05 //radians turned per frame
	center = new THREE.Vector2(0,0)
	dampedAngle = new THREE.Vector2(1,0)
	width = 2
	length = 4
	collision_bounce = 0
	road_center_target = null
	y_axis = new THREE.Vector3(0,1,0)
	constructor(scene, loader, controller, modelName){
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
	checkProximity(object, distance){
		//console.log(object)
		var temp = new THREE.Vector3()
		var rt = false
		this.hitbox.geometry.vertices.forEach((elem, i)=>{
			temp.copy(elem)
			temp.add(this.gltf.scene.position)
			var dist = temp.distanceTo(object) > distance
			//console.log(dist)
			if(temp.distanceTo(object) > distance) rt = true
		})
		return rt
	}
	collide(collider, center){
		if (this.collision_bounce) return
		//check collision
		if(!this.checkProximity(collider.position, 8)) return
		console.log("COLLIDE")
		this.velocity *= 0.7
		//change angle to that of the wall you just hit
		this.direction.set(1,0)
		this.direction.rotateAround(this.center, collider.rotation.y)
		
		
		if(this.controller.collide) console.log(temp, center.model.position)


		this.collision_bounce = 25
		if(this.drifting) this.endingDrift = true
		this.road_center_target = center

		this.collide_angle_dir = (this.direction.angle() - this.road_center_target.model.rotation.y) / 20
	}
	update(){
		var car = this.gltf.scene
		this.hitbox.position.copy(car.position)
		this.hitbox.rotation.copy(car.rotation)

		if(this.collision_bounce > 0){
			this.collision_bounce--
			var bounce_force = Math.sqrt(this.collision_bounce) / 20
			var delta_pos = car.position.clone()
			delta_pos.sub(this.road_center_target.model.position).normalize().multiplyScalar(bounce_force)

			car.position.sub(delta_pos)

			//get axis
			var target_rotation = this.road_center_target.model.rotation.y
			if(this.collision_bounce == 14) console.log("target", target_rotation, "this", this.direction.angle())
			var delta_ang = this.road_center_target.model.rotation.y -this.direction.angle()
			delta_ang = reduceAngle(delta_ang)
			//this.direction.set(1,0)
			this.direction.rotateAround(this.center, delta_ang/10)

		}
		else{

		}
		//drift
		if(this.controller.brake && this.controller.accelerate && !this.endingDrift){
			if(!this.drifting && this.controller.turning){
				//start drift
				this.endingDrift = false
				this.driftDirection = this.controller.turnDirection
				this.drifting = true
				//this.driftDeltaDirection.set(1,0)
			}
			//rotate car into drift
			if(absangle(this.driftDeltaDirection) < this.maxDriftAngle) 
				this.driftDeltaDirection.rotateAround(this.center, this.driftDirection * this.driftSpeed)
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

		//update damped angle for camera
		var ang = this.direction.angle() - this.dampedAngle.angle()
		this.dampedAngle.rotateAround(this.center, ang/5)

	}
}

export class rx7 extends base_car{
	constructor(scene, loader, controller){
		super(scene, loader, controller, "rx7_3.glb")
		this.max_speed = .6
		this.acceleration = .01
		this.handling = .03
		this.driftHandling = .01 // handling increase in the direction of the drift

		this.maxDriftAngle = .3 //radians
		this.driftSpeed = .01 //rate that the car's orientation changes into and out of drifts
	}
}

export class ae86 extends base_car{
	constructor(scene, loader, controller){
		super(scene, loader, controller, "ae86_2.glb")
		this.max_speed = .5
		this.acceleration = .02
		this.handling = .03
		this.driftHandling = .03 // handling increase in the direction of the drift

		this.maxDriftAngle = .7 //radians
		this.driftSpeed = .03 //rate that the car's orientation changes into and out of drifts
	}
}

function comp_angle(ang1, ang2){
	a1 = new THREE.ve
}
function comp_angl2(ang1, ang2){
	//returns -1 if ang1 is to the right of ang2, 1 else
	if (ang1 < 0) ang1 += 2*Math.PI
	if (ang2 < 0) ang2 += 2*Math.PI
	var res = 0
	if(ang1 < ang2) ang1 += 2*Math.PI
	if (ang1 - ang2 < Math.PI) res = 1
	else res = -1

	console.log("comp", ang1, "and ", ang2, "res:", res)
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