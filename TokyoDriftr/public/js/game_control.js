/*
game_control.js: helper functions to do with the game and assets, etc
*/
import * as THREE from 'https://unpkg.com/three/build/three.module.js';

//literally just generates random low poly dust
export function genDust(scene, x=100, z=0, y=0, num=100, radius=100){
    for (var i = 0; i < num; i++){
        var scaleFactor = getRandomArbitary(.05,.3)
        var geometry = new THREE.BoxGeometry(scaleFactor, scaleFactor, scaleFactor);
        var material = new THREE.MeshBasicMaterial( { color: 0x888888 } );
        var cube = new THREE.Mesh( geometry, material );
        cube.position.set(getRandomArbitary(-radius,radius), scaleFactor/2, getRandomArbitary(-radius,radius))
        //console.log("adding cube")
        scene.add( cube );
    }
}

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomArbitary (min, max) {
    return Math.random() * (max - min) + min;
}
