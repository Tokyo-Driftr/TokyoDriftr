# About TokyoDriftr
TokyoDriftr is a time trial webapp racing game with an emphasis on drifting. Our end goal is to have daily time trial maps for anyone to compete on to get the best scores they can.
# Required Installations

- Node.js
- Mongodb Community Server

## Installation

Go inside the TokyoDriftr folder and run
- npm install

## Usage

In one terminal you must run a mongodb server
```shell
mongod
```
In another terminal you must run the node server
```shell
node index.js
```

## Progress
#### Implemented
- Main Menu to explain controls and quickly start playing
- Map Generation based on splines
- Records your times and compares you to other players
- Ability to see the best players time at the end of the race
#### WIP
- Better collision detection
- Adding additional cars with different handlings
- Cleaning up the start menu and end game screens.
#### ToDo
- Terrain Generation (Procedurally generated decorations next to the road)
- Road Extrusions for better collision detection
- Particle effects for a cleaner look
- Music
#### Stretch Goal
- User Created Maps
