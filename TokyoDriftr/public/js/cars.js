import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as PHYSICS_WORLD from '/js/physicsWorld.js';

var cargroup = 1 << 2

class base_car{
    options = {
        max_speed: 45,
        acceleration: 100,
        handling: .04, //radians turned per frame
        driftHandling: .05, // handling increase in the direction of the drift
        maxDriftAngle: .3, //radians
        driftSpeed: .01
    } 
    center = new THREE.Vector2(0,0)
    constructor(scene, loader, controller, gui, soundEngine, modelName){
        this.id = ""
        this.velocity = 0
        //orientation of car
        this.direction = new THREE.Vector3(-1, 0, 0)
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
                    density: 15,
                    friction: 0.2,
                    restitution: 0.2,
                    belongsTo: cargroup,
                    collidesWith: 0xffffffff
                }
                PHYSICS_WORLD.addBody(self.id, collisionBody, self.gltf.scene, new THREE.Vector3(0, -0.75, 0))

                //Front wheel
                var fwheelbody = {
                    type:'box', // type of shape : sphere, box, cylinder 
                    size:[2.5,1,1], // size of shape
                    pos:[0, 0, 0], // start position in degree
                    rot:[0,90,0], // start rotation in degree
                    move:true, // dynamic or statique
                    belongsTo: cargroup,
                    collidesWith: 0xffffffff ^ cargroup
                }
                PHYSICS_WORLD.addBody(self.id.concat("fwheel"), fwheelbody, false, new THREE.Vector3(0, 0, 0))

                //Back wheel
                var bwheelbody = {
                    type:'box', // type of shape : sphere, box, cylinder 
                    size:[2.5,1,1], // size of shape
                    pos:[0, 0, 0], // start position in degree
                    rot:[0,90,0], // start rotation in degree
                    move:true, // dynamic or statique
                    belongsTo: cargroup,
                    collidesWith: 0xffffffff ^ cargroup
                }
                PHYSICS_WORLD.addBody(self.id.concat("bwheel"), bwheelbody, false, new THREE.Vector3(0, 0, 0))
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
        this.gui = gui;
        var guiControls = gui.addFolder("Car Controls")
        guiControls.add(this.options, 'max_speed', 0, 70).listen()
        guiControls.add(this.options, 'acceleration', 0, 1000).listen()
        guiControls.add(this.options, 'handling', 0, .1).listen()
        guiControls.add(this.options, 'driftHandling', 0, .2).listen()
        guiControls.add(this.options, 'maxDriftAngle', 0, 1).listen()
        guiControls.add(this.options, 'driftSpeed', 0, 1).listen()
		guiControls.open()
		
		var sound = soundEngine.getNewSound()
		console.log(this.sound)
		var audioLoader = new THREE.AudioLoader();
		audioLoader.load( 'res/accel.mp3', function( buffer ) {
			console.log("play sound")
			sound.setBuffer( buffer );
			sound.setLoop( true );
			sound.setVolume( 0.5 );
			sound.setLoopStart(0.1)
			sound.setLoopEnd(4)
			sound.play();
		});
		this.sound = sound

    }
    update() {
		PHYSICS_WORLD.carPhysicsTick(this);
		var car_velocity = PHYSICS_WORLD.getVelocity(this.id).length()
		var engine_pitch = car_velocity / 15 % 1.2 + car_velocity/50 + 0.9
		this.sound.setPlaybackRate(engine_pitch)
		//console.log(engine_pitch)
		
    }
}

export class rx7 extends base_car{
    constructor(scene, loader, controller, gui, soundEngine){
        super(scene, loader, controller, gui, soundEngine, "rx7_3.glb")
        this.id = "rx7"
        this.options.max_speed = 45
        this.options.acceleration = 100
        this.options.handling = .03
        this.options.driftHandling = .05 // handling increase in the direction of the drift

        this.options.maxDriftAngle = .3 //radians
        this.options.driftSpeed = .01 //rate that the car's orientation changes into and out of drifts
    }
}

export class ae86 extends base_car{
    constructor(scene, loader, controller, gui, soundEngine){
        super(scene, loader, controller, gui, soundEngine, "ae86.glb")
        this.id = "ae86"
        this.options.max_speed = 45
        this.options.acceleration = 100
        this.options.handling = .02
        this.options.driftHandling = .03 // handling increase in the direction of the drift

        this.options.maxDriftAngle = .7 //radians
        this.options.driftSpeed = .03 //rate that the car's orientation changes into and out of drifts
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