import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import {keyboardControls} from '/js/controller.js'
import * as CARS from '/js/cars.js'
import * as GAME_CONTROL from '/js/game_control.js'
import { stateManager } from '/js/stateManager.js'
import { gameState } from '/js/gameState.js'
import { playGameState } from '/js/playGameState.js';


export class menuGameState extends gameState{
    //this.scene
    //this.renderer
    //this.canvas
    //this.camcontrols
    //this.objects = {}
    constructor(renderer,scene,manager) {
        super(manager)

        this.objects = {}
        this.camcontrols
        this.renderer = renderer
        //Pointer to the canvas
        this.canvas = this.renderer.domElement
        this.scene = scene
        this.keyControls=new keyboardControls()
        this.changing = false
    }
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
        this.camcontrols.enabled = false;
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

        //set up text
        var loader = new THREE.FontLoader();
        loader.load( 'js/font.json', ( font ) => {
            var textGeo = new THREE.TextGeometry( 'W-Accelerate\nA/D-Left/Right\nHold Space-Drift\nPress 1 2 or 3 \nto choose car', {
              font: font,
              size: 1,
              height: 1,
              curveSegments: 1,
              bevelSize: 1,
              bevelOffset: 0,
              bevelSegments: 1
            } );
            var materials = [
              new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } ), // front
              new THREE.MeshPhongMaterial( { color: 0xffffff } ) // side
            ];
            this.objects['textMesh'] = new THREE.Mesh( textGeo, materials );
            this.objects['textMesh'].position.set(-5,5,2.5)
            this.objects['textMesh'].quaternion.copy(camera.quaternion)
            this.objects['camera'].lookAt(this.objects['textMesh'])
            this.scene.add(this.objects['textMesh'])
          } );

        this.Draw()
    }
    Draw() {
        this.manager.draw()
    }
    Update() {
        this.camcontrols.update()
        if(this.keyControls.one && !this.changing) {
            this.manager.setState(new playGameState(this.renderer, this.scene, this.manager))
            this.changing = true
        }
    }
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
            console.log("HUH?")
            return 1
        }   
        console.log("frick")
        clearThree(this.scene)
    }
}