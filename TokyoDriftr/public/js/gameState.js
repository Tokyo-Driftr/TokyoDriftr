import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import {keyboardControls} from '/js/controller.js'
export class gameState {
    constructor(renderer,scene,manager,data,musicFile) {
        this.renderer = renderer
        this.scene = scene
        this.manager = manager
        this.canvas = this.renderer.domElement
        this.objects = {soundEngine: data.soundEngine}
        
        //Add and Play Music
        this.music
        var sound = data.soundEngine.getNewSound()
		var audioLoader = new THREE.AudioLoader();
		audioLoader.load( musicFile, ( buffer ) => {
			console.log("play sound")
			sound.setBuffer( buffer );
            sound.setLoop( true );
            if(this.manager.soundControls.muted)
                sound.setVolume( 0 )
            else {
                sound.setVolume( this.manager.soundControls.volume );
            }
			sound.setLoopStart(0)
            sound.play();
		});
        this.music = sound

        this.keyControls=new keyboardControls()

        this.changing = false
    }
    changeVolume(volume) {
        if(typeof(this.music) != "undefined" && this.music.isPlaying) {
            this.music.setVolume( volume )
        }
    }
    Entered() {

    }
    Leaving() {

    }
    Update() {

    }
    Draw() {

    }
}