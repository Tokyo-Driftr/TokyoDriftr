import * as THREE from 'https://unpkg.com/three/build/three.module.js';
export class road{
    leapfrogArray = []
    x_axis = new THREE.Vector3( 0, 0, 1 );
    curvePointDistance = 3.5
    nextLoadPoint = 0
    constructor(path, loader, scene, numAssets = 110){
        //path is an array of vector3 elements
        this.curve = new THREE.CatmullRomCurve3(path)
        var self = this
        loader.load(
			'res/street2.glb',
			// called when the resource is loaded
			function ( gltf ) {
                var road = gltf
                road.scene.position.x = 1000
                self.leapfrogArray.push(road.scene)
                for(var i = 0; i < numAssets-1; i++){
                    self.leapfrogArray.push(road.scene.clone())
                }
                for (var i = 0; i < numAssets; i++){
                    scene.add(self.leapfrogArray[i])
                }
        
                self.calcPoints()
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
    calcPoints(){
        this.nextLoadPoint = 0
        this.curvePoints = []
        this.curveAngles = []
        var length = this.curve.getLength()
        console.log("len:", length)
        for (var i = 0; i < Math.ceil(this.curve.getLength() / this.curvePointDistance); i++){
            var thisPoint = this.curve.getPointAt((i * this.curvePointDistance) / length)
            this.curvePoints.push(thisPoint)
            this.curveAngles.push(this.curve.getTangentAt((i * this.curvePointDistance) / length))
        }
        this.update()
    }
    update(){
        console.log("num points:", this.curveAngles)
        //check if anything is behind collision plane (ignore for now)

        //pop stuff from leapfrog queue and add to front
        while(this.leapfrogArray.length > 0 && this.nextLoadPoint < this.curvePoints.length){
            console.log("loop", this.nextLoadPoint)
            this.leapfrogArray[0].position.x = this.curvePoints[this.nextLoadPoint].x
            this.leapfrogArray[0].position.z = this.curvePoints[this.nextLoadPoint].z

            //this.leapfrogArray[0].rotation.x = 0
            this.leapfrogArray[0].rotation.y = Math.atan(this.curveAngles[this.nextLoadPoint].x / this.curveAngles[this.nextLoadPoint].z)
            //this.leapfrogArray[0].rotation.z = 0

            //setVec(this.leapfrogArray[0].rotation, this.curveAngles[this.nextLoadPoint])
            this.nextLoadPoint++
            this.leapfrogArray.splice(0, 1)
        }
    }
}

export function testRoad(loader, scene){
    var path = [
        (new THREE.Vector3(-20, 0, 0)),
        (new THREE.Vector3(35 , 0, 0)),
        (new THREE.Vector3(60, 0, 40)),
        (new THREE.Vector3(60, 0, 70)),
        (new THREE.Vector3(40, 0, 90)),
        (new THREE.Vector3(0, 0, 120)),
        (new THREE.Vector3(-20, 0, 100)),
        (new THREE.Vector3(-50, 0, 40)),
        (new THREE.Vector3(-20, 0, 0)),
    ]
    return new road(path, loader, scene)
}

function setVec(v1, v2){
    //it's insane that this isn't built in
    v1.set(v2.x, v2.y, v2.z)
}