/* TokyoDriftr/public/stateManager.js 

stateManager keeps track of the current state and volume controls
stateManager also handles the transition between states

The constructor sets up all variables that are used in each state and also handles starting the music for each state.
*/
import { GUI } from 'https://unpkg.com/three/examples/jsm/libs/dat.gui.module.js';
export class stateManager {
    constructor(renderer, scene, clock) {
        this.currentState = null;
        this.renderer = renderer
        this.scene = scene
        this.fadeOut = null
        this.ready = false
        this.tick = clock


        //Setup GUI with both volume control and mute control
        {
            this.gui = new GUI()
            this.soundControls = new function() {
                this.masterVolume = 100;
                this.musicVolume = 70;
                this.carVolume = 50;
                this.muted = false;
            }
            var masterVolume = this.gui.add(this.soundControls, 'masterVolume', 0, 100, 1)
            masterVolume.onChange(() => {
                if(this.currentState != null && !this.soundControls.muted){
                    this.currentState.changeVolume(this.soundControls.masterVolume)
                    this.currentState.changeCarVolume(this.soundControls.masterVolume)
                }
            })
            var musicVolume = this.gui.add(this.soundControls, 'musicVolume', 0, 100, 1)
            musicVolume.onChange(() => {
                if(this.currentState != null && !this.soundControls.muted)
                    this.currentState.changeVolume(this.soundControls.masterVolume, this.soundControls.musicVolume)
            })
            var carVolume = this.gui.add(this.soundControls, 'carVolume', 0, 100, 1)
            carVolume.onChange(() => {
                if(this.currentState != null && !this.soundControls.muted)
                    this.currentState.changeCarVolume(this.soundControls.masterVolume, this.soundControls.carVolume)
            })
            var mutedgui = this.gui.add(this.soundControls, 'muted')
            mutedgui.onChange(() => {
                if(this.currentState != null) {
                    this.currentState.changeVolume(this.soundControls.muted ? 0:this.soundControls.masterVolume, this.soundControls.muted ? 0:this.soundControls.musicVolume)
                    this.currentState.changeCarVolume(this.soundControls.muted ? 0:this.soundControls.masterVolume, this.soundControls.muted ? 0:this.soundControls.carVolume)
                }
            })
            this.gui.open()
        }
    }
    //Takes a new state as a parameter
    //Leaves the currentState
    //After Leaving currentState Enters the new state.
    setState(newState) {
        this.ready =false
        if(typeof this.currentState == 'undefined' || this.currentState == null){
            this.currentState = newState;
            newState.Entered()
            this.ready = true
        }
        else {
            this.currentState.Leaving().then(() => {
                this.currentState = newState
                newState.Entered().then(()=>{

                    this.ready = true
                })
            })
        }
    }
    //returns the currentState
    getState() {
        return this.currentState;
    }
    //draw() Renders the current scene and then calls the currentStates update
    //draw() Keeps track of ticks for animations and timings
    draw() {
        //if the state is fully loaded then render otherwise do nothing
        if (!this.ready) return
        
        //render() renders the current scene and calls the currentStates update
        let render = () => {
            this.currentState.renderer.render(this.currentState.scene, this.currentState.objects["camera"]);
            this.currentState.Update()
            if(this.fadeOut != null) {
                if(this.fadeOutMusic(this.fadeOut) <= 0) {
                    this.fadeOut.stop()
                    this.fadeOut = null
                }
            }
        };
        setTimeout(() =>{
            tick();
        }, 200)
        
        var tick = () => {
            var dframes = this.tick.getDelta()
            console.log(dframes)
            render()
            requestAnimationFrame(tick);
        }
        
    }
    //Fades the music to 0, used to fade out previous states music.
    fadeOutMusic(sound) {
        if(!this.muted){
            var num = sound.getVolume()
            num -= .01
            sound.setVolume(num)
            return num;
        }
    }
    

}