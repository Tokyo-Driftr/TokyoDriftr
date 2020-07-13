import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as PHYSICS_WORLD from '/js/physicsWorld.js';

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
    constructor(scene, loader, controller, gui, modelName){
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
                var collisionBody = {
                    type:'box', // type of shape : sphere, box, cylinder 
                    size:[5,2,5], // size of shape
                    pos:[0, 2, 0], // start position in degree
                    rot:[0,90,0], // start rotation in degree
                    move:true, // dynamic or statique
                    density: 10,
                    friction: 0.2,
                    restitution: 0.2
                }
                PHYSICS_WORLD.addBody(self.id, collisionBody, self.gltf.scene)
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
    }

    updateold(){
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
        
        PHYSICS_WORLD.applyimpulse("rx7", {x: car.position.x, y: car.position.y, z: car.position.z}, {x: delta_velocity.y, y: 0, z: delta_velocity.x})
        PHYSICS_WORLD.steer("rx7", this.direction.angle() + this.driftDeltaDirection.angle())

        //car.rotation.y = this.direction.angle() + this.driftDeltaDirection.angle()
        //car.position.x += delta_velocity.y
        //car.position.z += delta_velocity.x
    }

    update() {
        PHYSICS_WORLD.carPhysicsTick(this);
    }
}

export class rx7 extends base_car{
    constructor(scene, loader, controller, gui){
        super(scene, loader, controller, gui, "rx7_3.glb")
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
    constructor(scene, loader, controller, gui){
        super(scene, loader, controller, gui, "ae86.glb")
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