import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import {keyboardControls} from '/js/controller.js';
import * as CARS from '/js/cars.js';
import * as GAME_CONTROL from '/js/game_control.js';
import * as PHYSICS_WORLD from '/js/physicsWorld.js';
import * as ROAD from '/js/road.js';
import { stateManager } from '/js/stateManager.js';
import { gameState } from '/js/gameState.js';

export class playGameState extends gameState{
    //this.scene
    //this.renderer
    //this.canvas
    constructor() {
        super()
        this.objects = {}
        this.camcontrols
        //Set up Renderer for the scene
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );
        //Pointer to the canvas
        this.canvas = this.renderer.domElement
        //Creates scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#220c41');

        
        this.Entered()
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

        //set up orbit controls
        this.camcontrols = new OrbitControls(this.objects["camera"], this.canvas);
        this.camcontrols.target.set(0, 0, 0);
        this.camcontrols.update();
        globalThis.controls = this.camcontrols

        //Initiate physics world
        PHYSICS_WORLD.initPhysicsWorld();
        

        //set up keyboard controls
        const keyControls = new keyboardControls()

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
            this.objects['rx7'] = new CARS.rx7(this.scene, gltfLoader, keyControls)
            globalThis.rx7 = this.objects['rx7']
            this.objects['testRoad'] = ROAD.testRoad(gltfLoader, this.scene)
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
        this.Draw()
    }

    //Renders each frame
    Draw() {
        //Must be an arrow function or it loses context of 'this'
        let resizeRendererToDisplaySize = (renderer) => {
            const canvas = renderer.domElement;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const needResize = canvas.width !== width || canvas.height !== height;
            if (needResize) {
                renderer.setSize(width, height, false);
            }
            return needResize;
        };
        
        //Render Loop must be arrow function or else it loses context of 'this'
        let render = () => {
            if (resizeRendererToDisplaySize(this.renderer)) {
                this.canvas = this.renderer.domElement;
                this.objects["camera"].aspect = canvas.clientWidth / canvas.clientHeight;
                this.objects["camera"].updateProjectionMatrix();
            }
        
            this.renderer.render(this.scene, this.objects["camera"]);
            this.Update()
        };
        /*
        function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
            const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
            const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
            const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
            // compute a unit vector that points in the direction the camera is now
            // in the xz plane from the center of the box
            const direction = (new THREE.Vector3())
                .subVectors(camera.position, boxCenter)
                .multiply(new THREE.Vector3(1, 0, 1))
                .normalize();
        
            // move the camera to a position distance units way from the center
            // in whatever direction the camera was from the center already
            camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
        
            // pick some near and far values for the frustum that
            // will contain the box.
            camera.near = boxSize / 100;
            camera.far = boxSize * 100;
        
            camera.updateProjectionMatrix();
        
            // point the camera to look at the center of the box
            camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
        }
        */
        setTimeout(() =>{
            tick();
        }, 200)
    
        var oldTime = Date.now();
    
        var tick = function() {
            var dframe = getFramesPassed();
            render()
            requestAnimationFrame(tick);
        }
    
        //Runs at 60 fps, returns how many frames passed since the last tick
        function getFramesPassed() {
            var now = Date.now();
            var dframe = Math.floor((now - oldTime)*3/50)
            if (dframe > 0) oldTime = Date.now();
            return dframe;
        }
          
    }
    Update() {
        var y_axis = new THREE.Vector3( 0, 1, 0 );
        this.objects['rx7'].update()
        PHYSICS_WORLD.physicsTick()
        //Camera update
        const camera_distance = 25

        //Generate cam pos based 
        //controls.target.set(rx7.gltf.scene.position.x, rx7.gltf.scene.position.y + 2, rx7.gltf.scene.position.z)
        var cameraPos = new THREE.Vector3()
        //calc distance from car
        cameraPos.set(0, 8, camera_distance)
        //rotate to the opposite of velocity vector
        var velocity = PHYSICS_WORLD.getVelocity("rx7")
        var correctedangle = (Math.abs(velocity.x) + Math.abs(velocity.z) > 1) ? new THREE.Vector2(velocity.z, velocity.x) : new THREE.Vector2(Math.sin(this.objects['rx7'].gltf.scene.rotation.x), Math.cos(this.objects['rx7'].gltf.scene.rotation.z))
        cameraPos.applyAxisAngle(y_axis, correctedangle.angle() + Math.PI)
        //add the position
        cameraPos.add(rx7.gltf.scene.position)
        this.objects['camera'].position.set(cameraPos.x, cameraPos.y, cameraPos.z)

        this.camcontrols.target.set(this.objects['rx7'].gltf.scene.position.x, this.objects['rx7'].gltf.scene.position.y, this.objects['rx7'].gltf.scene.position.z)
        this.camcontrols.update()
    }
}