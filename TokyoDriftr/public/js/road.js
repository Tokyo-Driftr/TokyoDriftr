/*
road.js controls the drawing of the in-game road. The road is built from a 3d vector,
but the y-component is ignored. There are issues with the threejs vector2 at the time of writing this.

The road holds a list  of n total road assets and "leapfrogs" them from behind the player to in front of them as they go along.
*/

import * as THREE from 'https://unpkg.com/three/build/three.module.js';
export class road{
	constructor(path, loader, scene, camera, numAssets = 50){
		//path is an array of vector3 elements
		var self = this
		self.loaded = false
		/*
		loader.load(
			'res/street2.glb',
			// called when the resource is loaded
			function ( gltf ) {
				var assets = []
				var road = gltf
				assets.push({
					model: road.scene,
					asset: road.asset,
					width: 3.5,
				})
				for(var i = 0; i < numAssets-1; i++){
					assets.push({
						model: road.scene.clone(),
						width: 3.5,
					})
				}
				for (var i = 0; i < numAssets; i++){
					scene.add(assets[i].model)
				}
				console.log(assets)
				self.frogger = new leapFrogger(path, assets, camera)
				self.loaded = true
			},
			// called while loading is progressing
			function ( xhr ) {
				console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
			},
			// called when loading has errors
			function ( error ) {
				console.log( 'An error happened while loading road', error );
			}
		);
		*/
		var pt = new vectorRoad(scene, new THREE.CatmullRomCurve3(path, true))
	}
	update(){
		//this.frogger.update()
	}

}



export class leapFrogger{
	/*
	leapfrogger is what controls the "models-along-path" behavior for the road and buildings.
	it takes assets in the form:
	{
		width: n,
		model: <gltf.scene>
		asset: <gltf.asset>
	}
	*/
	unusedAssets = []
	usedAssets = []
	x_axis = new THREE.Vector3( 0, 0, 1 );
	curvePosition = 0
	dist_behind_car = 10
	constructor(path, assets, car){
		
		//path is an array of vector3 elements
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
		//var rotation = new THREE.Vector3( 0, Math.atan(tangent.x / tangent.z), 0 )
		var rotation_ang = new THREE.Vector2(tangent.z, tangent.x).angle()
		var rotation = new THREE.Vector3( 0, rotation_ang, 0 )
		//console.log("rot", rotation)
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

	constructor(scene, path, car){
		this.car = car
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

		//create a leapfrogger for the yellow center stripe
		var stripe_material = new THREE.MeshLambertMaterial( { color: 0x774400, wireframe: false } );
		var stripe_geometry = new THREE.BoxGeometry(.5, .3, 2);
		//var stripe_head =  new THREE.BoxGeometry(.5, .5, .5);
		//stripe_head.translate(0,0,1)
		//stripe_geometry.merge(stripe_head)
		var stripe_mesh = new THREE.Mesh( stripe_geometry, stripe_material );
		var meshes = []
		for (var i = 0; i < 40; i++){
			meshes.unshift({
				"model": stripe_mesh.clone(),
				"width": 4})
			scene.add(meshes[0].model)
		}
		this.leapFrogger = new leapFrogger(path, meshes, car)
	}
	update(){
		this.leapFrogger.update()
		//collision
		this.car.collide(this.leapFrogger.usedAssets[10], this.leapFrogger.usedAssets[12])
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
	return new vectorRoad(scene, path, car)
}

function actualangle(ang){
	var pi = Math.pi
	while (ang > 2*pi) ang -= 2*pi
	while (ang < 0) ang += 2*pi
	return ang
}