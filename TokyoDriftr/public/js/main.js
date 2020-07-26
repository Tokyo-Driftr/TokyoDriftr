/* TokyoDriftr/public/main.js 
    main.js creates the initial:
        renderer
        scene
        stateManager
        soundEngine
        state
    When the state is created the game loads in
*/
import { stateManager } from '/js/stateManager.js'
import { menuGameState } from '/js/states/menuGameState.js'
import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { soundEngine } from '/js/soundEngine.js';

function main() {
    //Set up renderer for the game
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    //Creates scene that objects will be placed on and starts with a default background color
    var scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');
    var clock = new THREE.Clock()
    var state = new stateManager(renderer, scene, clock)
    var sound = new soundEngine()
    
    state.setState(new menuGameState(renderer, scene, state, {soundEngine: sound}))
}

main();
