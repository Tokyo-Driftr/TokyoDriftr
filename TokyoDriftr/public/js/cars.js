class base_car{
	speed = 0
	max_speed = 10
	acceleration = 1

	constructor(scene, loader, controller, modelName){
		this.loader = loader
		this.scene = scene
		this.controller = controller
		var self = this
		// Load a glTF resource
		loader.load(
			// resource URL
			'res/' + modelName,
			// called when the resource is loaded
			function ( gltf ) {
				self.gltf = gltf
				scene.add( gltf.scene );

			},
			// called while loading is progressing
			function ( xhr ) {

				console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

			},
			// called when loading has errors
			function ( error ) {
				console.log( 'An error happened', error );

			}
		);

	}

	update(){

	}
}

export class rx7 extends base_car{
	constructor(scene, loader, controller){
		super(scene, loader, controller, "rx7_3.glb")
	}
}