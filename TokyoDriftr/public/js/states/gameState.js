/* TokyoDriftr/public/gameState.js 

gameState is the parent class to each of the states. The main purpose of this class is to handle
    all redudant proccesses that happen in each state. 

The constructor sets up all variables that are used in each state and also handles starting the music for each state.
*/
import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import {keyboardControls} from '/js/controller.js'
export class gameState {
    constructor(renderer,scene,manager,data,musicFile) {
        //Variables Needed in each scene
        {
            this.renderer = renderer
            this.scene = scene
            this.manager = manager
            //this.canvas gives us a reference to the actual html canvas at all times
            this.canvas = this.renderer.domElement
            //this.objects holds references to meshes, camera, soundEngine, lights, etc.
            this.objects = {soundEngine: data.soundEngine}
            this.keyControls=new keyboardControls()
            this.changing = false
        }
        
        //Start up State Music
        {
            this.music
            var sound = data.soundEngine.getNewSound()
            var audioLoader = new THREE.AudioLoader();
            audioLoader.load( musicFile, ( buffer ) => {
                sound.setBuffer( buffer );
                sound.setLoop( true );
                //Implements Sound Controls to work with music when it is first started
                if(this.manager.soundControls.muted)
                    sound.setVolume( 0 )
                else {
                    sound.setVolume( this.manager.soundControls.volume );
                }
                sound.setLoopStart(0)
                sound.play();
            });
            this.music = sound
        }
    }
    //changeVolume takes in a float changes the volume of the current music
    //used primarily by the soundControls in stateManager.js
    changeVolume(volume) {
        if(this.music && this.music.isPlaying) {
            this.music.setVolume( volume )
        }
    }

    //Renders the scene then calls Update()
    Draw() {
        this.manager.draw()
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