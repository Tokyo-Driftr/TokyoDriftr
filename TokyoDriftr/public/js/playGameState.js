import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'https://unpkg.com/three/examples/jsm/controls/FlyControls.js'
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'https://unpkg.com/three/examples/jsm/libs/dat.gui.module.js';
import {keyboardControls} from '/js/controller.js';
import { CSS2DRenderer, CSS2DObject } from 'https://unpkg.com/three/examples/jsm/renderers/CSS2DRenderer.js';
import * as CARS from '/js/cars.js';
import * as GAME_CONTROL from '/js/game_control.js';
import * as PHYSICS_WORLD from '/js/physicsWorld.js';
import * as ROAD from '/js/road.js';
import { gameState } from '/js/gameState.js';
import { endScreenGameState } from '/js/endScreenGameState.js';

export class playGameState extends gameState{
    constructor(renderer,scene,manager,data) {
        super(manager)
        this.options = {
            hit_boxes: false,
            freecam: false
        }
        this.choice = data.choice
        this.objects = {}
        this.camcontrols
        this.flycontrols
        this.renderer = renderer
        this.canvas = this.renderer.domElement
        this.scene = scene
        this.clock = new THREE.Clock();
        this.scene.background = new THREE.Color('#000000');
        this.keyControls=new keyboardControls()
        this.gui = new GUI()
        this.startTime = Date.now()
        this.changing = false
    }

    //Setups up initial scene for playGameState
    Entered() {
        //set up camera
        const fov = 45;
        const aspect = this.canvas.width/this.canvas.height;  // the canvas default
        const near = 0.1;
        const far = 400;
        
        this.objects["camera"] = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.objects["camera"].position.set(10, 20, 5);
        globalThis.camera = this.objects["camera"]
        globalThis.three = THREE

        //set up orbit controls
        this.camcontrols = new OrbitControls(this.objects["camera"], this.canvas);
        this.camcontrols.target.set(0, 0, 0);
        this.camcontrols.update();
        this.camcontrols.enabled = false;
        globalThis.controls = this.camcontrols
        //set up fly controls
        this.flycontrols = new FlyControls( this.objects["camera"], this.canvas);
        this.flycontrols.rollSpeed = .5;
        this.flycontrols.dragToLook = true;
        this.flycontrols.enabled = true;
        this.flycontrols.update();

        //Initiate physics world
        PHYSICS_WORLD.initPhysicsWorld();
        

        //set up global light
        {
            const skyColor = 0xB1E1FF;  // light blue
            const groundColor = 0xB97A20;  // brownish orange
            const intensity = 1;
            this.objects["light"] = new THREE.HemisphereLight(skyColor, groundColor, intensity);
            this.scene.add(this.objects["light"]);
        }

        //set up point light
        {
            const color = 0xFFFFFF;
            const intensity = 2;
            this.objects['light'] = new THREE.DirectionalLight(color, intensity);
            this.objects['light'].position.set(5, 10, 2);
            this.scene.add(this.objects['light']);
            this.scene.add(this.objects['light'].target);
        }

        //add plane

        {
            var geo = new THREE.PlaneBufferGeometry(2000, 2000, 8, 8);
            var mat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
            this.objects['plane'] = new THREE.Mesh(geo, mat);
            this.objects['plane'].rotateX( - Math.PI / 2);
            this.scene.add(this.objects['plane']);
            GAME_CONTROL.genDust(this.scene)
            var collisionBody = {
                type:'box', // type of shape : sphere, box, cylinder 
                size:[2000,1,2000], // size of shape
                pos:[0,-1.1,0], // start position in degree
                rot:[0,0,0], // start rotation in degree
                move:false, // dynamic or statique
                density: 100,
                friction: 1,
                restitution: 0.2
            }
            PHYSICS_WORLD.addBody("plane", collisionBody, this.objects['plane'])
        }
        //add car, car controler, and road
        {
            const gltfLoader = new GLTFLoader();
            if(this.choice == 1)
                this.objects['rx7'] = new CARS.rx7(this.scene, gltfLoader, this.keyControls, this.gui)
            else if(this.choice == 2)
                this.objects['rx7'] = new CARS.rx7(this.scene, gltfLoader, this.keyControls, this.gui)
            else if(this.choice == 3)
                this.objects['rx7'] = new CARS.rx7(this.scene, gltfLoader, this.keyControls, this.gui)
            globalThis.rx7 = this.objects['rx7']
            setTimeout(() => {
                this.objects['testRoad'] = ROAD.testRoad(gltfLoader, this.scene, this.objects['rx7'])
                globalThis.road = this.objects['testRoad']
            }, 100);
        }
        //Please remove eventually.  Collision box
        {
            var geometry = new THREE.BoxGeometry(5, 5, 5);
            var material = new THREE.MeshBasicMaterial( { color: 0x4F4F4F } );
            var cube = new THREE.Mesh( geometry, material );
            cube.position.set(10, 20, 10);
            this.scene.add(cube);
            var collisionBody = {
                type:'box', // type of shape : sphere, box, cylinder 
                size:[5,5,5], // size of shape
                pos:[10,20,10], // start position in degree
                rot:[0,0,0], // start rotation in degree
                move:true, // dynamic or statique
                density: 5,
                friction: 0.2,
                restitution: 0.2
            }
            PHYSICS_WORLD.addBody("testcube", collisionBody, cube);
        }
        setTimeout(() => {
            PHYSICS_WORLD.bodys.forEach(b => {
                this.scene.add(b.hitbox);
            });
        }, 2000)

        var hitboxes = this.gui.add(this.options, 'hit_boxes')
        hitboxes.onChange(PHYSICS_WORLD.toggleHitboxes)
        var freecam = this.gui.add(this.options, 'freecam')
        freecam.onChange(() => {
            this.changeCam(this)
        })

        this.gui.open()
        

        this.Draw()
    }

    //Renders each frame
    Draw() {
        this.manager.draw()
    }
    
    //Update() watches for any keystrokes and updates any moving objects
    Update() {
        var y_axis = new THREE.Vector3( 0, 1, 0 );
        PHYSICS_WORLD.physicsTick()

        this.objects['testRoad'].update()

        if(!this.options.freecam) {
            this.objects['rx7'].update()


            //Camera update
            const camera_distance = 25
            //Generate cam pos based 
            var cameraPos = new THREE.Vector3()
            //calc distance from car
            cameraPos.set(0, 8, camera_distance)
            //rotate to the opposite of velocity vector
            var velocity = PHYSICS_WORLD.getVelocity("rx7")
            var correctedangle = (Math.sqrt(velocity.x*velocity.x + velocity.z*velocity.z) > 10) ? new THREE.Vector2(velocity.z, velocity.x) : new THREE.Vector2(Math.cos(this.objects['rx7'].gltf.scene.rotation.y), Math.sin(this.objects['rx7'].gltf.scene.rotation.y))
            cameraPos.applyAxisAngle(y_axis, correctedangle.angle() + Math.PI)
            //add the position
            cameraPos.add(rx7.gltf.scene.position)
            this.objects['camera'].position.set(cameraPos.x, cameraPos.y, cameraPos.z)

            this.camcontrols.target.set(this.objects['rx7'].gltf.scene.position.x, this.objects['rx7'].gltf.scene.position.y, this.objects['rx7'].gltf.scene.position.z)
            this.camcontrols.update()
        }
        else {
            this.flycontrols.update(this.clock.getDelta())
        }
        //if at the end of the race 
        if(this.keyControls.change && !this.changing){
            this.changing = true
            var data = {time: Date.now()-this.startTime}
            this.manager.setState(new endScreenGameState(this.renderer, this.scene, this.manager, data))
        }
    }
    //Leaving() clears all objects, gemoetry, and materials on the scene when changing to another scene
    //Leaving() is async so that when objects are being deleted it doesn't start deleting objects in the new scene
    async Leaving() {
        function clearThree(obj){
            while(obj.children.length > 0){ 
            clearThree(obj.children[0])
            obj.remove(obj.children[0]);
            }
            if(obj.geometry) obj.geometry.dispose()
        
            if(obj.material){ 
            //in case of map, bumpMap, normalMap, envMap ...
            Object.keys(obj.material).forEach(prop => {
                if(!obj.material[prop])
                return         
                if(typeof obj.material[prop].dispose === 'function')                                  
                obj.material[prop].dispose()                                                        
            })
            //obj.material.dispose()
            }
            return 1
        }   
        clearThree(this.scene)
    }
    changeCam(self) {
        
        if(self.options.freecam){
            self.flycontrols.movementSpeed = 20;
            self.objects['camera'].position.x = this.objects['rx7'].gltf.scene.position.x;
            self.objects['camera'].position.y = this.objects['rx7'].gltf.scene.position.y;
            self.objects['camera'].position.z = this.objects['rx7'].gltf.scene.position.z+5;
            self.objects['camera'].updateProjectionMatrix();
        }
        else {
        }
    }
}