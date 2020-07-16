import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'https://unpkg.com/three/examples/jsm/controls/FlyControls.js'
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'https://unpkg.com/three/examples/jsm/libs/dat.gui.module.js';
import {keyboardControls} from '/js/controller.js';
import { CSS2DRenderer, CSS2DObject } from 'https://unpkg.com/three/examples/jsm/renderers/CSS2DRenderer.js';
import * as CARS from '/js/cars.js';
import * as GAME_CONTROL from '/js/game_control.js';
import * as ROAD from '/js/road.js';
import { gameState } from '/js/gameState.js';
import { endScreenGameState } from '/js/endScreenGameState.js';
import { soundEngine } from '/js/soundEngine.js';

export class playGameState extends gameState{
    constructor(renderer,scene,manager,data) {
        super(manager)
        this.options = {
            hit_boxes: false,
            freecam: false
        }
        this.choice = data.choice
        this.objects = {soundEngine: data.soundEngine}
        this.camcontrols
        this.flycontrols
        this.renderer = renderer
        this.canvas = this.renderer.domElement
        this.scene = scene
        this.clock = new THREE.Clock();
        this.scene.background = new THREE.Color('#000000');
        this.keyControls=new keyboardControls()
        //this.gui = new GUI()
        this.startTime = Date.now()
        this.changing = false

        var sound = data.soundEngine.getNewSound()
		var audioLoader = new THREE.AudioLoader();
		audioLoader.load( 'res/tokyo1.wav', function( buffer ) {
			console.log("play sound")
			sound.setBuffer( buffer );
			sound.setLoop( true );
			sound.setVolume( .75 );
			sound.setLoopStart(0)
			sound.play();
		});
        this.music = sound
        this.count = 0
    }

    //Setups up initial scene for playGameState
    async Entered() {
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


        this.countDown(3);
        

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
                pos:[0,0,0], // start position in degree
                rot:[0,0,0], // start rotation in degree
                move:false, // dynamic or statique
                density: 100,
                friction: 1,
                restitution: 0.2
            }
        }
        //add car, car controler, and road
        {
            const gltfLoader = new GLTFLoader();
            var car_class = CARS.rx7
            if(this.choice == 2)
                car_class = CARS.ae86
            else if(this.choice == 3)
                car_class = CARS.rx7
                
            //this.objects['rx7'] = new car_class(this.scene, gltfLoader, this.keyControls, this.gui, this.objects.soundEngine)
            this.objects['rx7'] = new car_class(this.scene, gltfLoader, this.keyControls)
            globalThis.rx7 = this.objects['rx7']
            setTimeout(() => {
                this.objects['testRoad'] = ROAD.testRoad(gltfLoader, this.scene, this.objects['rx7'])
                globalThis.road = this.objects['testRoad']
            }, 200);
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
                restitution: 0.2,
                belongsTo: 1 << 4,
            }
        }

        //var freecam = this.gui.add(this.options, 'freecam')
        /*freecam.onChange(() => {
            this.changeCam(this)
        })*/

        //this.gui.open()
        
        setTimeout(() => {
            
            this.Draw()
        }, 500);
    }

    //Renders each frame
    Draw() {
        this.manager.draw()
    }
    
    //Update() watches for any keystrokes and updates any moving objects
    Update() {
        //Countdown implementation for starting the race.
        var num = (Date.now()-this.startTime)/1000
        if(num > this.count*2){
            switch(this.count){
                case 1:
                    this.countDown(2)
                    break;
                case 2:
                    this.countDown(1)
                    break;
                case 3:
                    this.countDown(0)
                    break;
            }
        }
        

        var y_axis = new THREE.Vector3( 0, 1, 0 );

        this.objects['testRoad'].update()

        //after countdown is done let the car move
        if(!this.options.freecam) {
            if(this.count==4)
                this.objects['rx7'].update()

            //Camera update
            const camera_distance = 25

            //Generate cam pos based 
            //controls.target.set(rx7.gltf.scene.position.x, rx7.gltf.scene.position.y + 2, rx7.gltf.scene.position.z)
            var cameraPos = new THREE.Vector3()
            //calc distance from car
            cameraPos.set(0, 8, camera_distance)
            //rotate to the opposite of velocity vector
            cameraPos.applyAxisAngle(y_axis, rx7.dampedAngle.angle() + Math.PI)
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
            var data = {time: Date.now()-this.startTime, soundEngine: this.objects['soundEngine']}
            this.manager.setState(new endScreenGameState(this.renderer, this.scene, this.manager, data))
            //this.gui.close()
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
        //this.objects['rx7'].sound.stop()
        clearThree(this.scene)
        this.manager.fadeOut = this.music
        
    }

    //For switching between freecam static camera for development features.
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
    //Creates textGeometry for countdown at the begginning of the race.
    countDown(num) {
        this.count++
        if(num!=3)
            this.scene.remove(this.objects['countdown'])

        if(num!=0) {
            this.objects['countdown'] = new THREE.Mesh( new THREE.Geometry(), new THREE.MeshPhongMaterial( { color: 0x3FFAEF } ));
            this.scene.add( this.objects['countdown']  );

            var data = {
                text : num.toString(),
                size : 10,
                height : .8,
                curveSegments : 10,
                font : "helvetiker",
                weight : "Regular",
                bevelEnabled : false,
                bevelThickness : .5,
                bevelSize : 0.2,
                bevelSegments: 10,
            };


            this.controller = () => {
                this.textColor = this.objects['countdown'].material.color.getHex();
            }

            var loader = new THREE.FontLoader();
        
            loader.load( 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',  ( font ) => {
                
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
                this.objects['countdown'].geometry.dispose();
                this.objects['countdown'].geometry = geometry;
                this.objects['countdown'].position.set(-6,6,0)
                this.objects['countdown'].rotation.set(0,-1.5708,0)
            })
        }
    }
}