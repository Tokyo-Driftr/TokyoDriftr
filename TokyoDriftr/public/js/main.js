import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as OIMO from 'https://unpkg.com/oimo@1.0.9/build/oimo.module.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import {keyboardControls} from '/js/controller.js'
import * as CARS from '/js/cars.js'
import * as GAME_CONTROL from '/js/game_control.js'
import * as PHYSICS_WORLD from '/js/physicsWorld.js'

/*
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
*/

function main() {
  //set up renderer
  var renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
      document.body.appendChild( renderer.domElement );
  var canvas = renderer.domElement


  //set up camera
  const fov = 45;
  const aspect = canvas.width/canvas.height;  // the canvas default
  const near = 0.1;
  const far = 400;
  
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(10, 15, 5);
  globalThis.camera = camera

  //set up orbit controls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();
  globalThis.controls = controls

  //set up keyboard controls
  const keyControls = new keyboardControls()

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#220c41');

  //set up global light
  {
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  //set up point light
  {
    const color = 0xFFFFFF;
    const intensity = 2;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(5, 10, 2);
    scene.add(light);
    scene.add(light.target);
  }

  //add plane

  {
    var geo = new THREE.PlaneBufferGeometry(2000, 2000, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
    var plane = new THREE.Mesh(geo, mat);
    plane.rotateX( - Math.PI / 2);
    scene.add(plane);
    GAME_CONTROL.genDust(scene)
  }

  
  
  {
    const gltfLoader = new GLTFLoader();
    var rx7 = new CARS.rx7(scene, gltfLoader, keyControls)
    globalThis.rx7 = rx7
    /*
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('res/rx7.glb', (gltf) => {
      globalThis.gltf = gltf
      const root = gltf.scene;
      scene.add(root);
    */
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render() {
    rx7.update()
    controls.update()

    //Camera
    controls.target.set(rx7.gltf.scene.position.x, rx7.gltf.scene.position.y + 1, rx7.gltf.scene.position.z)
    camera.position.set(rx7.gltf.scene.position.x + 1, rx7.gltf.scene.position.y + 1, rx7.gltf.scene.position.z + 1)
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
  }

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

main();
