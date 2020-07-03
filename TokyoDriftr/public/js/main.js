import { stateManager } from '/js/stateManager.js'
import { playGameState } from '/js/playGameState.js'
import { menuGameState } from '/js/menuGameState.js'
import * as THREE from 'https://unpkg.com/three/build/three.module.js';

/*
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
*/

function main() {
  //Set up Renderer for the scene
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  //Creates scene
  var scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');

  var state = new stateManager(new playGameState(renderer, scene))
  
}

main();
