import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'https://unpkg.com/three/examples/jsm/controls/FlyControls.js'
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import * as CARS from '/js/cars.js';
import * as GAME_CONTROL from '/js/game_control.js';
import * as ROAD from '/js/road.js';
import { gameState } from '/js/gameState.js';
import { endScreenGameState } from '/js/endScreenGameState.js';

export class playGameState extends gameState{
    constructor(renderer,scene,manager,data) {
        super(renderer,scene,manager,{soundEngine: data.soundEngine},'res/tokyo1.wav')
        this.options = {
            hit_boxes: false,
            freecam: false
        }

        this.choice = data.choice
        this.camcontrols
        this.flycontrols
        this.clock = new THREE.Clock();
        this.scene.background = new THREE.Color('#000000');
        this.startTime = Date.now()

        this.count = 0
    }

    //Setups up initial scene for playGameState
    async Entered() {
        //this.ready becomes true once all assets are loaded on
        this.ready = false

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
        /*this.flycontrols = new FlyControls( this.objects["camera"], this.canvas);
        this.flycontrols.rollSpeed = .5;
        this.flycontrols.dragToLook = true;
        this.flycontrols.enabled = true;
        this.flycontrols.update();*/


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
                car_class = CARS.civic
                
            //this.objects['rx7'] = new car_class(this.scene, gltfLoader, this.keyControls, this.gui, this.objects.soundEngine)
            var self = this
            var setupRoad = function(car){
                console.log("setupRoad")
                self.objects['testRoad'] = ROAD.testRoad(gltfLoader, self.scene, car, function(road){
                    self.ready = true
                }, 
                function() {
                    if(!self.changing){
                        self.changing = true
                        var data = {time: Date.now()-self.startTime, soundEngine: self.objects['soundEngine']}
                        self.manager.setState(new endScreenGameState(self.renderer, self.scene, self.manager, data))
                    }
                })
                globalThis.road = self.objects['testRoad']
            }
            this.objects['car'] = new car_class(this.scene, gltfLoader, this.keyControls, this.gui, setupRoad);
            globalThis.car = this.objects['car']
        }
        
        //add the dev option for freecam
        /*var freecam = this.gui.add(this.options, 'freecam')
        freecam.onChange(() => {
            this.changeCam(this)
        })*/
        setTimeout(() => {
            //this.Draw()
        }, 500);
    }

    //Renders each frame
    Draw() {
        this.manager.draw()
    }
    
    //Update() watches for any keystrokes and updates any moving object and the camera.
    //Update() also handles the countDown
    Update() {
        if(!this.ready) return
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
        

        
        if(typeof(this.objects['testRoad']) != "undefined")
            this.objects['testRoad'].update()

        this.updateCam()

        //after countdown is done let the car move
        if(!this.options.freecam) {
            if(this.count == 4) {
                this.objects['car'].update(true)
            }
            else {
                this.objects['car'].update(false)
            }
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

    //Updates the camera position and rotation to be behind the players car.
    //Only the objects['camera'] and camcontrols are changed during this update
    updateCam() {
        var y_axis = new THREE.Vector3( 0, 1, 0 );
        const camera_distance = 25
        var cameraPos = new THREE.Vector3()
        //calc distance from car
        cameraPos.set(0, 8, camera_distance)
        //rotate to the opposite of velocity vector
        cameraPos.applyAxisAngle(y_axis, car.dampedAngle.angle() + Math.PI)
        //add the position
        cameraPos.add(this.objects['car'].gltf.scene.position)
        this.objects['camera'].position.set(cameraPos.x, cameraPos.y, cameraPos.z)

        this.camcontrols.target.set(this.objects['car'].gltf.scene.position.x, this.objects['car'].gltf.scene.position.y, this.objects['car'].gltf.scene.position.z)
        this.camcontrols.update()
    }

    //For switching between freecam static camera for development features.
    changeCam(self) {
        
        if(self.options.freecam){
            self.flycontrols.movementSpeed = 20;
            self.objects['camera'].position.x = this.objects['car'].gltf.scene.position.x;
            self.objects['camera'].position.y = this.objects['car'].gltf.scene.position.y;
            self.objects['camera'].position.z = this.objects['car'].gltf.scene.position.z+5;
            self.objects['camera'].updateProjectionMatrix();
        }
        else {
        }
    }
    //Creates textGeometry for countdown at the begginning of the race.
    //Each time the countdown changes the old text is deleted and new text is created
    countDown(num) {
        this.count++
        //Deletes the text object if one is created
        if(num!=3)
            this.scene.remove(this.objects['countdown'])

        //This if statement will create a new Text Object of the current 
        if(num!=0) {
            this.objects['countdown'] = new THREE.Mesh( new THREE.Geometry(), new THREE.MeshPhongMaterial( { 
                color: 0x3FFAEF //light blue
            } ));
            this.scene.add( this.objects['countdown']  );

            var data = {
                text : num.toString(),
                size : 8,
                height : .6,
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
                this.objects['countdown'].position.set(-6,5,0)
                this.objects['countdown'].position.set(this.objects['car'].gltf.scene.position.x,
                    this.objects['car'].gltf.scene.position.y+5, 
                    this.objects['car'].gltf.scene.position.z)
                this.objects['countdown'].rotation.set(0,-1.5708,0)
                this.objects['countdown'].rotation.set(0,this.objects['car'].gltf.scene.rotation.y-3.1416,0)
            })
        }
    }
}