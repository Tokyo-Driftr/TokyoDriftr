export class stateManager {
    constructor(state) {
        this.currentState=state;
        this.currentState.manager = this
    }
    setState(newState) {
        //this.currentState.Leaving()
        this.currentState = newState;
    }
    getState() {
        return this.currentState;
    }
    

}