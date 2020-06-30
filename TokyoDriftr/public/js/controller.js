export class keyboardControls{
	var 
	constructor(){
		var self = this
		this.accelerate = false
		this.brake = false
		this.left = false
		this.right = false
		document.addEventListener("keydown", onDocumentKeyDown, false);
		document.addEventListener("keyup", onDocumentKeyUp, false);

		function onDocumentKeyDown(event) {
			//console.log("WHOOP!", event.key)
			var key = event.key;
			if (key == "w" || key == "ArrowUp") {
				self.accelerate = true
			} else if (key == "a" || key == "ArrowLeft") {
				self.left = true
			} else if (key == "d" || key == "ArrowRight") {
				self.right = true
			} else if (key == "s" || key == "ArrowDown" || key == " ") {
				self.brake = true
			}
		}function onDocumentKeyUp(event) {
			//console.log("WHOOP!", event.key)
			var key = event.key;
			if (key == "w" || key == "ArrowUp") {
				self.accelerate = false
			} else if (key == "a" || key == "ArrowLeft") {
				self.left = false
			} else if (key == "d" || key == "ArrowRight") {
				self.right = false
			} else if (key == "s" || key == "ArrowDown" || key == " ") {
				self.brake = false
			}
		}
	}
}