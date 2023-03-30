export class RunExperimentOverlayView {
    onRun = null;
    onReset = null;
    
    constructor() {
        // DOM components
        this._runButton = document.querySelector('#run');
        this._resetButton = document.querySelector('#reset');

        
        // events
        this._runButton.addEventListener("click", e => this.onRun && this.onRun())
        this._resetButton.addEventListener("click", e => this.onReset && this.onReset())

    }

    show = () => {
        this._runButton.style.display = 'flex';
        this._resetButton.style.display = 'flex';
    }
    hide = () => {
        this._runButton.style.display = 'none';
        this._resetButton.style.display = 'none';
    }
}