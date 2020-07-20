/*
road.js controls the drawing of the in-game road. The road is built from a 3d vector,
but the y-component is ignored. There are issues with the threejs vector2 at the time of writing this.

The road holds a list  of n total road assets and "leapfrogs" them from behind the player to in front of them as they go along.
*/

import * as THREE from 'https://unpkg.com/three/build/three.module.js';

class road_side_deco{
	/*
		This class controls all of the decorations that are visible alongside the road during normal gameplay.
		It holds a data array that stores data about models in this format:
		{
			name: <model name.glb>
			width: <horizontal width, alongside road>
			dist: <distance from centerpoint of model to edge of model>
			num: <number of copies of this model to be drawn
		}
		Models are assumed to be pre-centered, located in /buildings, and facing in the -y direction
	*/
	models_info = [
		
		{
			name: "building_1.glb",
			width: 22,
			dist: 22,
			num: 5
		},
		{
			name: "building_2.glb",
			width: 20,
			dist: 18,
			num: 5
		},
		{
			name: "building_4.glb",
			width: 18,
			dist: 18,
			num: 5
		},
		
		{
			name: "building_5.glb",
			width: 17,
			dist: 17,
			num: 5
		},
		{
			name: "building_6.glb",
			width: 20,
			dist: 18,
			num: 5
		},
		{
			name: "building_basic_1.glb",
			width: 13,
			dist: 16,
			num: 5
		},
		
		{
			name: "building_basic_2.glb",
			width: 20,
			dist: 18,
			num: 5
		},
		{
			name: "building_basic_3.glb",
			width: 30,
			dist: 22,
			num: 5
		},
		{
			name: "building_7.glb",
			width: 16,
			dist: 25,
			num: 5
		},
		
	]
	constructor(path, scene, car, loader){
		this.car = car
		var meshes_r = []
		var meshes_l = []
		async function loadData(self){
			self.models_info.forEach((data, i) => {
				loader.load(
					'buildings/' + data.name,
					// called when the resource is loaded
					function ( gltf ) {
						var model = gltf.scene
						model.rotation.set(0,Math.PI/2,0)
						model.position.set(-data.dist,0,0)
						model.scale.set(2,2,2)
						var group = new THREE.Group()
						group.add(model)
						for(var i = 0; i < data.num; i++){
							var clone = group.clone()
							scene.add(clone)
							meshes_r.unshift({
								"model": clone,
								"width": data.width,
								"dist": data.dist,

							})
						}
						model.position.set(data.dist,0,0)
						model.rotation.set(0,-Math.PI/2,0)
						group = new THREE.Group()
						group.add(model)
						for(var i = 0; i < data.num; i++){
							var clone = group.clone()
							scene.add(clone)
							meshes_l.unshift({
								"model": clone,
								"width": data.width,
								"dist": data.dist,

							})
						}
						console.log(data.name)
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
			})
		}
		loadData(this).then(()=>{
			setTimeout(()=>{
				this.leapFrogger_l = new leapFrogger(path, shuffleList(meshes_l), car)
				this.leapFrogger_r = new leapFrogger(path, shuffleList(meshes_r), car)
			}, 300)
		})
	}
	update(){
		this.leapFrogger_r.update()
		this.leapFrogger_l.update()
	}
}


export class road_physics_stripe{
	/*
		This class works by using the leapfrogger to display a dotted line along the center of the road.
		Leapfrogger takes an optional function that can be called post-update, and this takes advantage
		of that function in order to update its corresponding physics object
	*/
	constructor(path, scene, car, numAssets = 40){
		this.car = car
		this.lastPoint = path[path.length-1]
		//create a model for the yellow center stripe and then add it to a leapfrogger
		var stripe_material = new THREE.MeshLambertMaterial( { color: 0x774400, wireframe: false } );
		var stripe_geometry = new THREE.BoxGeometry(.5, .3, 2);
		var stripe_mesh = new THREE.Mesh( stripe_geometry, stripe_material );
		var meshes = []
		var bodies = [] //Made of bodies {roadbody, lrail, rrail}
		for (var i = 0; i < numAssets; i++){
			var clone = stripe_mesh.clone()
			var roadgroup = 1 << 1;
			var offset = new THREE.Vector3(0, 0, 0)
			
			var roadBody
			meshes.unshift({
				"model": clone,
				"width": 4,
			})
			scene.add(clone)
		}
		this.leapFrogger = new leapFrogger(path, meshes, car)
	}
	update(){
		this.leapFrogger.update()
		this.car.collide(this.leapFrogger.usedAssets[10].model, this.leapFrogger.usedAssets[12])
		//if(!this.car.proximity(this.lastPoint.model.position) > 8) console.log("END")
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
		this.curve = new THREE.CatmullRomCurve3(path)
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
		var rotation_ang = new THREE.Vector2(tangent.z, tangent.x).angle()
		var rotation = new THREE.Vector3( 0, rotation_ang, 0 )
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
		var curve = new THREE.CatmullRomCurve3(path)
		if(path[0].equals(path[path.length-1])) path.closed = true
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
			steps: path.length * 5,
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

}


export class road{
	/*
		road is the master class for the road, it controls all leapfrogging behavior and draws the road
	*/
	constructor(path, scene, car, loader){
		this.car = car
		this.road_stripes = new road_physics_stripe(path, scene, car)
		this.road_shape = new vectorRoad(path, scene, car)
		this.road_buildings = new road_side_deco(path, scene, car, loader)
	}
	update(){
		this.road_stripes.update()
		this.road_buildings.update()
	}
}

function intersect_self(curve, maxSegDist){
	if (curve.length < 4) return false
	var latestPoint = curve[curve.length - 1]
	for(var i = 0; i < curve.length - 2; i++){
		var dist = (latestPoint.distanceTo(curve[i]))
		if(dist < maxSegDist/2)
			return true
	}
	return false
}

function gen2dpath(numPoints = 10, minSegDist = 15, maxSegDist = 70){
	var path = [
		(new THREE.Vector2(-40, 0)),
		(new THREE.Vector2(35 , 0)),
	]
	
	
	var center = new THREE.Vector2(0,0)
	for (var i = 0; i < numPoints; i++){
		var distance = Math.round(Math.random() * maxSegDist + minSegDist)
		var angle = path[path.length - 1].clone().sub(path[path.length - 2]).rotateAround(center, (Math.random() - 0.5)*3).normalize()
		angle.multiplyScalar(distance)
		angle.add(path[path.length - 1])
		path.push(angle)
		if(intersect_self(path, maxSegDist + 10)){
			//console.log("INTERSECT")
			i -= 1
			path.pop()
		}
	}
	var path3d = []
	for (var i = 0; i < path.length; i++){
		path3d.push(new THREE.Vector3(path[i].x, 0, path[i].y))
	}
	return path3d
}

function gen2dloop(numPoints = 20, radius=100, random_radius=.4){
	var path = [
	]
	var center = new THREE.Vector2(0,100)
	for(var i = 0; i < numPoints+1; i++){
		var path_pos = new THREE.Vector2(0,0)
		path_pos.rotateAround(center, (i / numPoints) * 2 * Math.PI)
		path.push(path_pos)
		console.log(i)
	}
	
	var maxSegDist = radius* 2 * Math.PI / numPoints
	var new_path = []
	path.forEach((elem, i) =>{
		new_path.push(elem)
	})
	for(var i = 2; i < numPoints-1; i++){
		var original_point = path[i]
		for(var j = 0; j < 10; j++){
			var new_point = original_point.clone()
			new_point.rotateAround(path[i-1], randVal(random_radius))
			new_path[i] = new_point
			if(intersect_self(path)) new_path[i] = original_point
		}
	}
	console.log(new_path)
	for(var i = 0; i < numPoints+1; i++) path[i] = new THREE.Vector3(new_path[i].x, 0, new_path[i].y)
	//for(var i = 0; i < 3; i++) path.unshift(path.pop())
	console.log(path)
	path[path.length-1].copy(path[0])
	return path

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
	path = gen2dloop(20)
	return new road(path, scene, car, loader)
}

function randVal(mag){
	return Math.random() * 2 * mag + mag
}

function shuffleList(list){
	for (var i = 0; i < list.length; i++){
		var randomIndex1 = Math.floor(Math.random()*list.length)
		var randomIndex2 = Math.floor(Math.random()*list.length)
		var temp = list[randomIndex1]
		list[randomIndex1] = list[randomIndex2]
		list[randomIndex2] = temp
	}
	return list
}