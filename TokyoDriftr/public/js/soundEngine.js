import * as THREE from 'https://unpkg.com/three/build/three.module.js';

export class soundEngine{
    constructor(){
        this.listener = new THREE.AudioListener();
        //camera.add( this.listener );
    }
    getNewSound(){
        // create a global audio source
        return new THREE.Audio( this.listener );
    }
}


