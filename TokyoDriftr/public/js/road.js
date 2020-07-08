/*
road.js controls the drawing of the in-game road. The road is built from a 3d vector,
but the y-component is ignored. There are issues with the threejs vector2 at the time of writing this.

The road holds a list  of n total road assets and "leapfrogs" them from behind the player to in front of them as they go along.
*/

import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as PHYSICS_WORLD from "/js/physicsWorld.js";

export class road{
	constructor(path, loader, scene, camera, numAssets = 50){
		//path is an array of vector3 elements
		var self = this
		self.loaded = false
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
					var clone = road.scene.clone()
					assets.push({
						model: clone,
						width: 3.5,
					})
					PHYSICS_WORLD.addBody(
						"road".concat(clone.uuid), 
						{
							type: 'box',
							size: [12, 0.1, 5],
							pos: [road.scene.position.x, road.scene.position.y, road.scene.position.z],
							rot: [0, 0, 0],
							move: false,
							density: 100,
							friction: 1,
							restitution: 1
						}, 
						road.scene
					)
					PHYSICS_WORLD.addBody(
						"lrail".concat(clone.uuid), 
						{
							type: 'box',
							size: [1, 1, 1],
							pos: [road.scene.position.x, road.scene.position.y, road.scene.position.z],
							rot: [0, 0, 0],
							move: false,
							density: 100,
							friction: 1,
							restitution: 1
						}, 
						road.scene
					)
					PHYSICS_WORLD.addBody(
						"rrail".concat(clone.uuid), 
						{
							type: 'box',
							size: [1, 1, 1],
							pos: [road.scene.position.x, road.scene.position.y, road.scene.position.z],
							rot: [0, 0, 0],
							move: false,
							density: 100,
							friction: 1,
							restitution: 1
						}, 
						road.scene
					)
				}
				for (var i = 0; i < numAssets; i++){
					scene.add(assets[i].model)
				}
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
		
	}
	update(){
		this.frogger.update()
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

		//check if anything is behind collision plane
		//pop stuff from leapfrog queue and add to front
		while(this.unusedAssets.length > 0){
			if(this.curvePosition > 1)this.curvePosition -=1
			var data = this.getNextPoint(this.unusedAssets[0].width)

			this.unusedAssets[0].model.position.set(data.position.x, data.position.y, data.position.z )
			this.unusedAssets[0].model.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z )
			
			var roadbod, lrailbod, rrailbod;
			PHYSICS_WORLD.bodys.forEach(b => {
				if (b.id == "road".concat(this.unusedAssets[0].model.uuid)) {
					b.body.setPosition(this.unusedAssets[0].model.position)
					b.body.setQuaternion(this.unusedAssets[0].model.quaternion)
				} else if (b.id == "lrail".concat(this.unusedAssets[0].model.uuid)) {

				} else if (b.id == "rrail".concat(this.unusedAssets[0].model.uuid)) {

				}
			})
			
			this.usedAssets.push(this.unusedAssets.shift())

			
			this.nextLoadPoint++
		}
		this.processLeap()
	}

	processLeap(){
		var carPos = this.car.gltf.scene.position
	
		try{
		while(carPos.distanceTo(this.usedAssets[this.dist_behind_car].model.position) > carPos.distanceTo(this.usedAssets[this.dist_behind_car+1].model.position)){
			this.usedAssets[0].model.position.x = 1000
			this.unusedAssets.push(this.usedAssets.shift())
		}
		} catch (err) {
			console.log("game made a fucky: ", err)
		}
	}

	processOffscreenObjects(){
		this.camera.updateMatrixWorld(); // make sure the camera matrix is updated
		this.camera.matrixWorldInverse.getInverse( this.camera.matrixWorld );
		this.cameraViewProjectionMatrix.multiplyMatrices( this.camera.projectionMatrix, this.camera.matrixWorldInverse );
		this.frustum.setFromProjectionMatrix( this.cameraViewProjectionMatrix );
		
		// this.frustum is now ready to check all the objects you need
		var intersecting = true
		while(this.usedAssets.length > 0 && this.frustum.intersectsObject( this.usedAssets[0].asset)){
			console.log("remove")
			this.unusedAssets.push(this.unusedAssets[0])
			this.usedAssets.splice(0, 1)
		}
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
	return new road(path, loader, scene, car)
}

function setVec(v1, v2){
	//it's insane that this isn't built in
	v1.set(v2.x, v2.y, v2.z)
}