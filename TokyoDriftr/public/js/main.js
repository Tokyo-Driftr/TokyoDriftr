import { stateManager } from '/js/stateManager.js'
import { playGameState } from '/js/playGameState.js'

/*
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
*/

function main() {
  var state = new stateManager(new playGameState)
}

main();
