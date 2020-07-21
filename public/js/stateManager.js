import { GUI } from 'https://unpkg.com/three/examples/jsm/libs/dat.gui.module.js';
export class stateManager {
    constructor(renderer, scene) {
        this.currentState = null;
        this.renderer = renderer
        this.scene = scene
        this.fadeOut = null
        this.ready = false


        //Setup GUI with both volume control and mute control
        this.gui = new GUI()
        this.soundControls = new function() {
            this.volume = .7;
            this.muted = false;
        }
        var soundgui = this.gui.add(this.soundControls, 'volume', 0, 1, .05)
        soundgui.onChange(() => {
            if(this.currentState != null && !this.soundControls.muted)
                this.currentState.changeVolume(this.soundControls.volume)
        })
        var mutedgui = this.gui.add(this.soundControls, 'muted')
        mutedgui.onChange(() => {
            if(this.currentState != null)
                this.currentState.changeVolume(this.soundControls.muted ? 0:this.soundControls.volume)
        })
        this.gui.open()
    }
    //Takes a new state as a parameter
    //Leaves the currentState
    //After Leaving currentState Enters the new state.
    setState(newState) {
        //this.currentState.Leaving()
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
        if (!this.ready) return
        //Resizes the display when it is changed
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
        
        //render() renders the current scene and calls the currentStates update
        let render = () => {
            if (resizeRendererToDisplaySize(this.currentState.renderer)) {
                this.currentState.canvas = this.currentState.renderer.domElement;
                this.currentState.objects["camera"].aspect = this.currentState.canvas.clientWidth / this.currentState.canvas.clientHeight;
                this.currentState.objects["camera"].updateProjectionMatrix();
            }
        
            this.currentState.renderer.render(this.currentState.scene, this.currentState.objects["camera"]);
            this.currentState.Update()
            if(this.fadeOut != null) {
                if(this.fadeOutMusic(this.fadeOut) <= 0) {
                    this.fadeOut.stop()
                    this.fadeOut = null
                }
            }
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
    fadeOutMusic(sound) {
        if(!this.muted){
            var num = sound.getVolume()
            num -= .01
            sound.setVolume(num)
            return num;
        }
    }
    

}