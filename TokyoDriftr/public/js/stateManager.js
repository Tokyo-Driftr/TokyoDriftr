export class stateManager {
    constructor(state) {
        this.currentState=state;
    }
    setState(newState) {
        this.currentState = newState;
    }
    getState() {
        return this.currentState;
    }

}