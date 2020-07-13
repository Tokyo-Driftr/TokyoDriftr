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
    constructor(renderer,scene,manager,data) {
        super(manager)

        this.objects = {}
        this.camcontrols
        this.renderer = renderer
        this.canvas = this.renderer.domElement
        this.scene = scene
        this.keyControls=new keyboardControls()
        this.changing = false
    }
    async Entered() {
        this.objects["camera"] = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
        this.objects["camera"].position.z = 5;
        this.camcontrols = new OrbitControls(this.objects["camera"], this.canvas);
        this.camcontrols.target.set(0, 0, 0);
        this.camcontrols.update();
        this.camcontrols.enabled = true;
        globalThis.controls = this.camcontrols

				this.objects['light'] = new THREE.SpotLight( 0xFFFFFF,1 );
				this.objects['light'].position.set(100,100,100)
				this.scene.add(this.objects['light'])


        this.objects['mesh'] = new THREE.Mesh( new THREE.Geometry(), new THREE.MeshPhongMaterial( { color: 0x00fffc } ));
        this.scene.add( this.objects['mesh']  );

        var data = {
            text : "W-Accelerate\nA/D-Left/Right\nHold Space-Drift\nPress 1 2 or 3 \nto choose car",
            size : .5,
            height : 0.1,
            curveSegments : 10,
            font : "helvetiker",
            weight : "Regular",
            bevelEnabled : false,
            bevelThickness : .5,
            bevelSize : 0.2,
            bevelSegments: 10,
        };


        this.controller = () => {
            this.textColor = this.objects['mesh'].material.color.getHex();
        }

        var loader = new THREE.FontLoader();
    
        await loader.load( 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',  ( font ) => {
            
            var geometry = new THREE.TextGeometry( data.text, {
                font: font,
                size: data.size,
                height: data.height,
                curveSegments: data.curveSegments,
                bevelEnabled: data.bevelEnabled,
                bevelThickness: data.bevelThickness,
                bevelSize: data.bevelSize,
                bevelSegments: data.bevelSegments
            } );

            geometry.computeBoundingBox()
            geometry.center();
            this.objects['mesh'].geometry.dispose();
            this.objects['mesh'].geometry = geometry;
            this.objects['mesh'].position.set(0,1.5,0)
        })
        var gltfLoader = new GLTFLoader();
        await gltfLoader.load(
            'res/rx7_3.glb',
            // called when the resource is loaded
            ( gltf ) => {
                self.gltf = gltf
                self.gltf.scene.scale.set(.5,.5,.5)
                self.gltf.scene.position.set(-2.5, -2, 0)
                this.scene.add( gltf.scene );
            },
            // called while loading is progressing
            function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // called when loading has errors
            function ( error ) {
                console.log( 'An error happened', error );

            }
        )
        await gltfLoader.load(
            'res/rx7_3.glb',
            // called when the resource is loaded
            ( gltf ) => {
                self.gltf = gltf
                self.gltf.scene.scale.set(.5,.5,.5)
                self.gltf.scene.position.set(0, -2, 0)
                this.scene.add( gltf.scene );
            },
            // called while loading is progressing
            function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // called when loading has errors
            function ( error ) {
                console.log( 'An error happened', error );

            }
        )
        await gltfLoader.load(
            'res/rx7_3.glb',
            // called when the resource is loaded
            ( gltf ) => {
                self.gltf = gltf
                self.gltf.scene.scale.set(.5,.5,.5)
                self.gltf.scene.position.set(2.5, -2, 0)
                this.scene.add( gltf.scene );
            },
            // called while loading is progressing
            function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // called when loading has errors
            function ( error ) {
                console.log( 'An error happened', error );

            }
        )

        

        this.Draw()
    }
    Draw() {
        this.manager.draw()
    }
    //Update() watches for any keystrokes and updates any moving objects
    Update() {
        //this.camcontrols.update()
        if(this.keyControls.choice && !this.changing) {
            this.manager.setState(new playGameState(this.renderer, this.scene, this.manager, {choice: this.keyControls.num}))
            this.changing = true
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
}