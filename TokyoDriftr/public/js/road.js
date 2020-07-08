/*
road.js controls the drawing of the in-game road. The road is built from a 3d vector,
but the y-component is ignored. There are issues with the threejs vector2 at the time of writing this.

The road holds a list  of n total road assets and "leapfrogs" them from behind the player to in front of them as they go along.
*/

import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as PHYSICS_WORLD from "/js/physicsWorld.js";

export class road_physics_stripe{
	/*
		This class works by using the leapfrogger to display a dotted line along the center of the road.
		Leapfrogger takes an optional function that can be called post-update, and this takes advantage
		of that function in order to update its corresponding physics object
	*/
	constructor(path, scene, car, numAssets = 30){
		//create a model for the yellow center stripe and then add it to a leapfrogger
		var stripe_material = new THREE.MeshLambertMaterial( { color: 0x774400, wireframe: false } );
		var stripe_geometry = new THREE.BoxGeometry(.5, .3, 2);
		var stripe_mesh = new THREE.Mesh( stripe_geometry, stripe_material );
		var meshes = []
		for (var i = 0; i < numAssets; i++){
			var clone = stripe_mesh.clone()
			var roadBody = PHYSICS_WORLD.addBody(
				"road".concat(clone.uuid), 
				{
					type: 'box',
					size: [12, 1.1, 5],
					pos: [0, 2, 0],
					rot: [0, 0, 0],
					move: false,
					density: 100,
					friction: 1,
					restitution: 1
				}, 
				scene
			)
			var lRailBody = PHYSICS_WORLD.addBody(
				"lrail".concat(clone.uuid), 
				{
					type: 'box',
					size: [1, 1, 1],
					pos: [0, 0, 0],
					rot: [0, 0, 0],
					move: false,
					density: 100,
					friction: 1,
					restitution: 1
				}, 
				scene
			)
			var rRailBody = PHYSICS_WORLD.addBody(
				"rrail".concat(clone.uuid), 
				{
					type: 'box',
					size: [1, 1, 1],
					pos: [0, 0, 0],
					rot: [0, 0, 0],
					move: false,
					density: 100,
					friction: 1,
					restitution: 1
				}, 
				scene
			)
			meshes.unshift({
				"model": clone,
				"width": 4,
				"roadBody": roadBody,
				"lRailBody": lRailBody,
				"rRailBody": rRailBody,
				"update": (data)=>{
					console.log("update called")
					data.roadBody.body.setPosition(data.model.position)
					data.roadBody.body.setQuaternion(data.model.quaternion)
				}})
			scene.add(clone)
		}
		this.leapFrogger = new leapFrogger(path, meshes, car)
	}
	update(){
		this.leapFrogger.update()
	}

}




export class leapFrogger{
	/*
	leapfrogger is what controls the "models-along-path" behavior for the road and buildings.
	it takes assets in the form:
	{
		width: n,
		model: <gltf.scene>
		update: <optional function>
	}
	the function update is called with the asset passed into iself whenever the leapfrogging occurs.
	The asset may contain additional data for internal use in its update funciton
	*/
	unusedAssets = []
	usedAssets = []
	x_axis = new THREE.Vector3( 0, 0, 1 );
	curvePosition = 0
	dist_behind_car = 10
	constructor(path, assets, car, back_elements = 10){
		/*
			path is an array of vector3 elements, used to define the leapfrog path.
			assets is a list of assets in the format given above
			car is simply a reference to the car object, containing gltf
			back_elements is the number of elements to draw behind the car.
		*/
		this.curve = new THREE.CatmullRomCurve3(path, true)
		this.unusedAssets = assets
		this.curveLength = this.curve.getLength()
		this.car = car
		this.reset()
		this.update()



		
		
	}
	reset(){
		while(this.usedAssets.length != 0){
			this.unusedAssets.push(this.usedAssets.pop())
		}
		this.unusedAssets.forEach((asset) => {
			console.log(asset)
			asset.model.position.set(1000,0,0)
		})
		this.curvePosition = 0
	}
	getNextPoint(width){
		/*
			Returns the next XYZ point in the path in this form:
			{
				position: <vector3>,
				rotation: <vector3>
			}
		*/
		console.log("len:", this.curveLength)

		var point = this.curve.getPointAt(this.curvePosition)
		var tangent = this.curve.getTangentAt(this.curvePosition)
		var rotation = new THREE.Vector3( 0, Math.atan(tangent.x / tangent.z), 0 )
		this.curvePosition += width/this.curveLength
		return {
			position: point,
			rotation: rotation
		}
	}
	update(){
		/*
			updates the models along the path, performs the leapfrogging
		*/

		while(this.unusedAssets.length > 0){
			if(this.curvePosition > 1)this.curvePosition -=1
			var data = this.getNextPoint(this.unusedAssets[0].width)

			this.unusedAssets[0].model.position.set(data.position.x, data.position.y, data.position.z )
			this.unusedAssets[0].model.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z )
			if(this.unusedAssets[0]["update"] != undefined)
				this.unusedAssets[0].update(this.unusedAssets[0])

			this.usedAssets.push(this.unusedAssets.shift())

			this.nextLoadPoint++
		}
		this.processLeap()
	}

	processLeap(){
		var carPos = this.car.gltf.scene.position
	
		while(carPos.distanceTo(this.usedAssets[this.dist_behind_car].model.position) > carPos.distanceTo(this.usedAssets[this.dist_behind_car+1].model.position)){
	
			this.usedAssets[0].model.position.x = 1000
			this.unusedAssets.push(this.usedAssets.shift())
		}
	}
}

export class vectorRoad{
	/*
		the vectorRoad class implements the road by extruding a 2d shape along the path of the road.
		this is good for performance and more visually appealing than the leapfrog method.
		The leapfrog method is still used for the center stripe, however.
	*/
	road_width = 7
	barrier_width = 0.5
	barrier_height = 0.75
	stripe_width = 0.5
	stripe_distance = 0.

	constructor(path, scene, car){
		var curve = new THREE.CatmullRomCurve3(path, true)
		var road_walls = [];
		road_walls.push( new THREE.Vector2( 2, this.road_width ) );
		road_walls.push( new THREE.Vector2( -this.barrier_height, this.road_width ) );
		road_walls.push( new THREE.Vector2( -this.barrier_height, (this.road_width + this.barrier_width) ) );
		road_walls.push( new THREE.Vector2( 2, (this.road_width + this.barrier_width) ) );
		road_walls.push( new THREE.Vector2( 2, -(this.road_width + this.barrier_width) ) );
		road_walls.push( new THREE.Vector2( -this.barrier_height, -(this.road_width + this.barrier_width) ) );
		road_walls.push( new THREE.Vector2( -this.barrier_height, -this.road_width ) );
		road_walls.push( new THREE.Vector2( 2, -this.road_width ) );

		var road_floor = [];
		road_floor.push( new THREE.Vector2( 2, this.road_width ) );
		road_floor.push( new THREE.Vector2( -0.1, this.road_width ) );
		road_floor.push( new THREE.Vector2( -0.1, -this.road_width ) );
		road_floor.push( new THREE.Vector2( 2, -this.road_width ) );

		var road_highlight = []
		road_walls.forEach((elem, i) => {
			road_highlight.push(new THREE.Vector2(elem.x * 0.2, elem.y * 0.95))
		})

		var extrudeSettings = {
			steps: 100,
			bevelEnabled: false,
			extrudePath: curve
		};


		var walls_material = new THREE.MeshLambertMaterial( { color: 0x333333, wireframe: false } );
		var walls_shape = new THREE.Shape( road_walls );
		var walls_geometry = new THREE.ExtrudeBufferGeometry( walls_shape, extrudeSettings );
		var walls_mesh = new THREE.Mesh( walls_geometry, walls_material );

		var floor_material = new THREE.MeshPhongMaterial( { color: 0x111111, wireframe: false } );
		var floor_shape = new THREE.Shape( road_floor );
		var floor_geometry = new THREE.ExtrudeBufferGeometry( floor_shape, extrudeSettings );
		var floor_mesh = new THREE.Mesh( floor_geometry, floor_material );

		var highlight_material = new THREE.MeshPhongMaterial( { color: 0x992255, wireframe: false } );
		var highlight_shape = new THREE.Shape( road_highlight );
		var highlight_geometry = new THREE.ExtrudeBufferGeometry( highlight_shape, extrudeSettings );
		var highlight_mesh = new THREE.Mesh( highlight_geometry, highlight_material );

		scene.add( walls_mesh );
		scene.add( floor_mesh );
		scene.add( highlight_mesh );

		
	}
	update(){
		//do nothing
	}

}


export class road{
	constructor(path, scene, car){
		this.road_stripes = new road_physics_stripe(path, scene, car)
		this.road_shape = new vectorRoad(path, scene, car)
	}
	update(){
		this.road_stripes.update()
		this.road_shape.update()
	}
}

export function testRoad(loader, scene, car){
	var path = [
		(new THREE.Vector3(-20, 0, 0)),
		(new THREE.Vector3(35 , 0, 0)),
		(new THREE.Vector3(60, 0, 40)),
		(new THREE.Vector3(60, 0, 70)),
		(new THREE.Vector3(40, 0, 90)),
		(new THREE.Vector3(0, 0, 120)),
		(new THREE.Vector3(-20, 0, 100)),
		(new THREE.Vector3(-50, 0, 40)),
	]
	return new road(path, scene, car)
}