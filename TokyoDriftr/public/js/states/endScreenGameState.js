/* TokyoDriftr/public/endScreenGameState.js 
    endScreenGameState is the end screen state showing your place on the leaderboard
    Sends your score to the mongodb database and then displays your place
    Only Text is rendered
*/
import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { gameState } from '/js/states/gameState.js'
import { menuGameState } from '/js/states/menuGameState.js';

//Simple string to Hours:Minutes:Seconds
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
}

export class endScreenGameState extends gameState{
    constructor(renderer,scene,manager,data) {
        super(renderer,scene,manager,{soundEngine: data.soundEngine},'res/tokyo3.wav')

        this.playerTime = data.time/1000
    }


    async Entered() {
        //Create Camera pointed towards where the text will load
        {
            this.objects["camera"] = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
            this.objects["camera"].position.z = 5;
        
        }
        //SpotLight pointed towards the location of the text
        {
            this.objects['light'] = new THREE.SpotLight( 0xFFFFFF,1 );
            this.objects['light'].position.set(100,100,100)
            this.scene.add(this.objects['light'])
        }

        //Sent the players time to the database and store it
        var newtime = {time: this.playerTime, course: 3, name:"Name"}
        await fetch(document.URL+'newtime', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(newtime)
        });

        //Get all times from the database
        var times = await fetch(document.URL+'alltimes/3', {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });

        //Find players place on the leaderboard
        if(times && !(times instanceof Array)){
            var best = 99999
            var i = 0
        }
        else {
            var best = this.playerTime>times[0].time ? times[0].time:this.playerTime
            var t = times[0].time
            var i = 0
            while(this.playerTime>t) {
                t = times[i].time
                i++
            }
        }

        //Create 3d Text Displaying Players Time, Best Time on map, What Place they're in, and instructions on restarting
        {
            this.objects['mesh'] = new THREE.Mesh( new THREE.Geometry(), new THREE.MeshPhongMaterial( { color: 0x00fffc } ));
            this.scene.add( this.objects['mesh']  );

            var data = {
                text : "You Finished!\nYour Time: "+this.playerTime.toString().toHHMMSS()+"\nBest Time: "+best.toString().toHHMMSS()+"\nYou're in "+(i+1)+" place\nPress R to Restart!",
                size : .5,
                height : 0.1,
                curveSegments : 10,
                font : "helvetiker",
                weight : "Regular",
                bevelEnabled : false,
                bevelThickness : .5,
                bevelSize : 0.2,
                bevelSegments: 10,
            };

            this.controller = () => {
                this.textColor = this.objects['mesh'].material.color.getHex();
            
            }

            var loader = new THREE.FontLoader();
            loader.load( 'https://threejs.org//examples/fonts/helvetiker_regular.typeface.json',  ( font ) => {
                var geometry = new THREE.TextGeometry( data.text, {
                    font: font,
                    size: data.size,
                    height: data.height,
                    curveSegments: data.curveSegments,
                    bevelEnabled: data.bevelEnabled,
                    bevelThickness: data.bevelThickness,
                    bevelSize: data.bevelSize,
                    bevelSegments: data.bevelSegments
                } );
                //place 3dText at the camera's center
                geometry.computeBoundingBox()
                geometry.center();
                this.objects['mesh'].geometry.dispose();
                this.objects['mesh'].geometry = geometry;
                this.objects['mesh'].position.set(0,0,0)
            })
        }

        this.Draw()
    }

    //Update() watches for any keystrokes
    Update() {
        if(this.keyControls.r && !this.changing) {
            this.manager.setState(new menuGameState(this.renderer, this.scene, this.manager, 
                {soundEngine: this.objects['soundEngine']}))
            this.changing = true
        }
    }
}