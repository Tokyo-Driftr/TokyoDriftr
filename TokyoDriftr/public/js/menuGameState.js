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
    constructor(renderer,scene) {
        super()
        this.objects = {}
        this.camcontrols
        this.renderer = renderer
        //Pointer to the canvas
        this.canvas = this.renderer.domElement
        this.scene = scene
        this.keyControls=new keyboardControls()
        this.Entered()
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
            var textGeo = new THREE.TextGeometry( 'W-Accelerate\nA/D-Left/Right\nHold Space-Drift\n1 To Start', {
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
            this.objects['textMesh'].position.set(-5,5,5)
            this.objects['textMesh'].quaternion.copy(camera.quaternion)
            this.objects['camera'].lookAt(this.objects['textMesh'])
            this.scene.add(this.objects['textMesh'])
          } );

        this.Draw()
    }
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
        this.camcontrols.update()
        if(this.keyControls.one) {
            this.manager.setState(new playGameState(this.renderer,this.scene))
        }
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
        }   
        clearThree(this.scene)
    }
}