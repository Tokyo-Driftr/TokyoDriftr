import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as PHYSICS_WORLD from '/js/physicsWorld.js';

class base_car{
    max_speed = 10
    acceleration = .1
    handling = .05 //radians turned per frame
    center = new THREE.Vector2(0,0)
    constructor(scene, loader, controller, modelName){
        this.id = ""
        this.velocity = 0
        //orientation of car
        this.direction = new THREE.Vector3(0, 0, 1)
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

                //Car body
                var collisionBody = {
                    type:'box', // type of shape : sphere, box, cylinder 
                    size:[2.5,1.25,5], // size of shape
                    pos:[0, 3, -1], // start position in degree
                    rot:[0,90,0], // start rotation in degree
                    move:true, // dynamic or statique
                    density: 10,
                    friction: 0.2,
                    restitution: 0.2,
                    belongsTo: 1,
                    collidesWith: 0xffffffff
                }
                PHYSICS_WORLD.addBody(self.id, collisionBody, self.gltf.scene)

                //Front wheel
                var fwheelbody = {
                    type:'box', // type of shape : sphere, box, cylinder 
                    size:[2.5,1,5], // size of shape
                    pos:[0, 3, -1], // start position in degree
                    rot:[0,90,0], // start rotation in degree
                    move:true, // dynamic or statique
                    belongsTo: 1,
                    collidesWith: 0x00000000
                }
                PHYSICS_WORLD.addBody(self.id.concat("fwheel"), fwheelbody, false)

                //Back wheel
                var bwheelbody = {
                    type:'box', // type of shape : sphere, box, cylinder 
                    size:[2.5,1,5], // size of shape
                    pos:[0, 3, -1], // start position in degree
                    rot:[0,90,0], // start rotation in degree
                    move:true, // dynamic or statique
                    belongsTo: 1,
                    collidesWith: 0x00000000
                }
                PHYSICS_WORLD.addBody(self.id.concat("bwheel"), bwheelbody, false)
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
    update() {
        PHYSICS_WORLD.carPhysicsTick(this);
    }
}

export class rx7 extends base_car{
    constructor(scene, loader, controller){
        super(scene, loader, controller, "rx7_3.glb")
        this.id = "rx7"
        this.max_speed = 45
        this.acceleration = 100
        this.handling = .03
        this.driftHandling = .05 // handling increase in the direction of the drift

        this.maxDriftAngle = .3 //radians
        this.driftSpeed = .01 //rate that the car's orientation changes into and out of drifts
    }
}

export class ae86 extends base_car{
    constructor(scene, loader, controller){
        super(scene, loader, controller, "rx7_3.glb")
        this.id = "ae86"
        this.max_speed = 45
        this.acceleration = 100
        this.handling = .02
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