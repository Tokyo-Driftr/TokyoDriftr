import { stateManager } from '/js/stateManager.js'
import { playGameState } from '/js/playGameState.js'
import { menuGameState } from '/js/menuGameState.js'
import { endScreenGameState } from '/js/endScreenGameState.js'
import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { soundEngine } from '/js/soundEngine.js';

function main() {
  //Set up Renderer for the scene
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  //Creates scene that objects will be placed on and starts with a default background color
  var scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');

  var state = new stateManager(renderer, scene)
  var sound= new soundEngine()
  //change playGameState to menuGameState or viceversa depending on what you need to look at.
  state.setState(new menuGameState(renderer, scene, state, {soundEngine: sound}))
}

main();
