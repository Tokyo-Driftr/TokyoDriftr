import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import {keyboardControls} from '/js/controller.js'
import { gameState } from '/js/gameState.js'
import { playGameState } from '/js/playGameState.js';


export class menuGameState extends gameState{
    constructor(renderer,scene,manager,data) {
        super(manager)
        
        this.objects = {soundEngine: data.soundEngine}
        this.camcontrols
        this.renderer = renderer
        this.canvas = this.renderer.domElement
        this.scene = scene
        this.keyControls=new keyboardControls()
        this.changing = false
        this.splash = null

        //Load menu music
        var sound = data.soundEngine.getNewSound()
		var audioLoader = new THREE.AudioLoader();
		audioLoader.load( 'res/tokyo2.wav', ( buffer ) => {
			console.log("play sound")
			sound.setBuffer( buffer );
			sound.setLoop( true );
			sound.setVolume( .2 );
			sound.setLoopStart(0)
            sound.play();
		});
        this.music = sound

        this.cars = []
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2( 1, 1 );
        
    }
    //Creates all elements in the scene (Camera, Spotlights, Sprites, Models)
    //All initial positions for the menu scene are also set here
    async Entered() {
        window.addEventListener( 'mousemove', (event) => {
            event.preventDefault();
            this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

            this.objects["rx7_stats"].position.set(0,0,1000)
            this.objects["ae86_stats"].position.set(0,0,1000)
            this.objects["civic_stats"].position.set(0,0,1000)
            this.objects["menu_text_"].position.set(0,0,0)

            this.objects["rx7_model"].position.y = -2
            this.objects["ae86_model"].position.y = -2
            this.objects["civic_model"].position.y = -2

            // update the picking ray with the camera and mouse position
            this.raycaster.setFromCamera( this.mouse, this.objects["camera"] );

            // calculate objects intersecting the picking ray
            var intersects = this.raycaster.intersectObjects( this.cars, true);
        
            for ( var i = 0; i < intersects.length; i++ ) {
                var point = intersects[ i ].point.x
                if(point < -.5){
                    this.objects["rx7_stats"].position.set(0,.1,2)
                    this.objects["menu_text_"].position.set(0,0,100)
                    this.objects["rx7_model"].position.y = -1.8
                }
                else if(point > -.5 && point < .5){
                    this.objects["ae86_stats"].position.set(0,.1,2)
                    this.objects["menu_text_"].position.set(0,0,100)
                    this.objects["ae86_model"].position.y = -1.8
                }
                else if(point > .5){
                    this.objects["civic_stats"].position.set(0,.1,2)
                    this.objects["menu_text_"].position.set(0,0,100)
                    this.objects["civic_model"].position.y = -1.8
                }
            }
        }, false );
        window.addEventListener( 'click', (event) => {
            event.preventDefault();
            this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

            // update the picking ray with the camera and mouse position
            this.raycaster.setFromCamera( this.mouse, this.objects["camera"] );

            // calculate objects intersecting the picking ray
            var intersects = this.raycaster.intersectObjects( this.cars, true);
        
            for ( var i = 0; i < intersects.length; i++ ) {
                var point = intersects[ i ].point.x
                var choice = 1
                if(point < -.5){
                    choice = 1
                }
                else if(point > -.5 && point < .5){
                    choice = 2
                }
                else if(point > .5){
                    choice = 3
                }
                if( !this.changing && this.music.isPlaying ) {
                    this.manager.setState(new playGameState(this.renderer, this.scene, this.manager, 
                        {choice: choice, soundEngine: this.objects['soundEngine']}))
                    this.changing = true
                }
            }
        }, false );
        //Create Camera positioned to look at the cars
        this.objects["camera"] = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
        this.objects["camera"].position.z = 5;
        //Cam Controls for Dev purposes
        this.camcontrols = new OrbitControls(this.objects["camera"], this.canvas);
        this.camcontrols.target.set(0, 0, 0);
        this.camcontrols.update();
        this.camcontrols.enabled = true;
        globalThis.controls = this.camcontrols

        //Creating spotlights for the scene
        {	
            this.objects['light'] = new THREE.SpotLight( 0xFFFFFF,1 ); //White Spotlight
            this.objects['light'].position.set(0,75,75)
            this.scene.add(this.objects['light'])
            this.objects['light2'] = new THREE.SpotLight( 0xFF33E9,1.5 ); //Pink Spotlight
            this.objects['light2'].position.set(-50,-25,50)
            this.scene.add(this.objects['light2']) 
            this.objects['light3'] = new THREE.SpotLight( 0x00FFFB,1.5 ); //Aqua Spotlight
            this.objects['light3'].position.set(50,-25,50)
            this.scene.add(this.objects['light3'])
        }

        
        
        //Loading Menu Text and Splash Screen
        var loader = new THREE.TextureLoader()
        //Create Splash Screen Logo
        await loader.load( 
            'res/logo.png' ,
            (map) => {
                var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
                var sprite = new THREE.Sprite( material );
                this.splash = sprite
                sprite.scale.set(2.5,1.75,1)
                sprite.position.set(0,0,4)
                this.scene.add( sprite );

            },
        )  
        //Create Menu Text with Controls Explanation
        loader.load( 
            'res/menu_text_top.png' ,
            (map) => {
                var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
                var sprite = new THREE.Sprite( material );
                sprite.scale.set(5,2.5,2)
                sprite.position.set(0,2.5,0)
                this.objects["menu_text"] = sprite
                this.scene.add( sprite );

            },
        )  
        //Create Menu Text with Controls Explanation
        loader.load( 
            'res/menu_text_.png' ,
            (map) => {
                var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
                var sprite = new THREE.Sprite( material );
                sprite.scale.set(5,4,4)
                sprite.position.set(0,0,0)
                this.objects["menu_text_"] = sprite
                this.scene.add( sprite );

            },
        )  
        //Create Rx7 Stats Display
        loader.load( 
            'res/rx7_stats.png' ,
            (map) => {
                var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
                var sprite = new THREE.Sprite( material );
                sprite.scale.set(2,1.5,1.5)
                sprite.position.set(-2.5,-1,100)
                this.objects["rx7_stats"] = sprite
                this.scene.add( sprite );
            },
        ) 
        //Create AE86 Stats Display
        loader.load( 
            'res/ae86_stats.png' ,
            (map) => {
                var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
                var sprite = new THREE.Sprite( material );
                sprite.scale.set(2,1.5,1.5)
                sprite.position.set(0,-1,100)
                this.objects["ae86_stats"] = sprite
                this.scene.add( sprite );
            },
        )  
        //Create Civic Stats Display
        loader.load( 
            'res/civic_stats.png' ,
            (map) => {
                var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
                var sprite = new THREE.Sprite( material );
                sprite.scale.set(2,1.5,1.5)
                sprite.position.set(2.5,-1,100)
                this.objects["civic_stats"] = sprite
                this.scene.add( sprite );
            },
        )  

        //Loading all models onto Scene
        //Loads Rx7 Model onto scene
        var gltfLoader = new GLTFLoader();
        await gltfLoader.load(
            'res/rx7_3.glb',
            // called when the resource is loaded
            ( gltf ) => {
                self.gltf = gltf
                self.gltf.scene.scale.set(.5,.5,.5)
                self.gltf.scene.position.set(-2.5, -2, 0)
                this.objects["rx7_model"] = self.gltf.scene
                this.cars.push(self.gltf.scene)
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
        //Loads AE86 Model onto scene
        await gltfLoader.load(
            'res/ae86_2.glb',
            // called when the resource is loaded
            ( gltf ) => {
                self.gltf = gltf
                self.gltf.scene.scale.set(.5,.5,.5)
                self.gltf.scene.position.set(0, -2, 0)
                this.objects["ae86_model"] = self.gltf.scene
                this.cars.push(self.gltf.scene)
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
        //Loads Civic Model onto scene
        await gltfLoader.load(
            'res/civic_hatch.glb',
            // called when the resource is loaded
            ( gltf ) => {
                self.gltf = gltf
                self.gltf.scene.scale.set(.5,.5,.5)
                self.gltf.scene.position.set(2.5, -2, 0)
                this.objects["civic_model"] = self.gltf.scene
                this.cars.push(self.gltf.scene)
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
        //Loads the Street Scene
        gltfLoader.load(
            'res/street_scene.glb',
            // called when the resource is loaded
            ( gltf ) => {
                self.gltf = gltf
                self.gltf.scene.scale.set(.5,.5,.5)
                self.gltf.scene.position.set(-1.3, -2, -8)
                self.gltf.scene.rotation.set(0,.23,0)

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

    //Renders the scene then calls Update()
    Draw() {
        this.manager.draw()
    }

    //Update() watches for any keystrokes and updates any moving objects
    Update() {

        //this.camcontrols.update()
        if(this.splash != null && this.music.isPlaying) {
            this.scene.remove(this.splash)
            this.splash = null
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
        this.manager.fadeOut = this.music
    }
}