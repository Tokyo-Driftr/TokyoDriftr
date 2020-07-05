import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import {keyboardControls} from '/js/controller.js'
import * as CARS from '/js/cars.js'
import * as GAME_CONTROL from '/js/game_control.js'
import * as ROAD from '/js/road.js'
import { stateManager } from '/js/stateManager.js'
import { gameState } from '/js/gameState.js'

export class playGameState extends gameState{
    constructor(renderer,scene,manager) {
        super(manager)

        this.objects = {}
        this.camcontrols
        this.renderer = renderer
        //Pointer to the canvas
        this.canvas = this.renderer.domElement
        this.scene = scene
        this.scene.background = new THREE.Color('#000000');
        this.keyControls=new keyboardControls()
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
        }
        //add car, car controler, and road
        {
            const gltfLoader = new GLTFLoader();
            this.objects['rx7'] = new CARS.rx7(this.scene, gltfLoader, this.keyControls)
            globalThis.rx7 = this.objects['rx7']
            this.objects['testRoad'] = ROAD.testRoad(gltfLoader, this.scene)
        }
        this.Draw()
    }

    //Renders each frame
    Draw() {
        this.manager.draw()
    }
    Update() {
        var y_axis = new THREE.Vector3( 0, 1, 0 );
        this.objects['rx7'].update()
        //Camera update
        const camera_distance = 25

        //Generate cam pos based 
        //controls.target.set(rx7.gltf.scene.position.x, rx7.gltf.scene.position.y + 2, rx7.gltf.scene.position.z)
        var cameraPos = new THREE.Vector3()
        //calc distance from car
        cameraPos.set(0, 8, camera_distance)
        //rotate to the opposite of velocity vector
        cameraPos.applyAxisAngle(y_axis, rx7.direction.angle() + Math.PI)
        //add the position
        cameraPos.add(rx7.gltf.scene.position)
        this.objects['camera'].position.set(cameraPos.x, cameraPos.y, cameraPos.z)

        this.camcontrols.target.set(this.objects['rx7'].gltf.scene.position.x, this.objects['rx7'].gltf.scene.position.y, this.objects['rx7'].gltf.scene.position.z)
        this.camcontrols.update()
    }
    Leaving() {
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
}