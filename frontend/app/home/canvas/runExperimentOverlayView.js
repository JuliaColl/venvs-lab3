export class RunExperimentOverlayView {
    onRun = null;

    constructor() {
        // DOM components
        this._runButton = document.querySelector('#run');
        
        // events
        this._runButton.addEventListener("click", e => this.onRun && this.onRun())
    }

    show = () => this._runButton.style.display = 'flex';
    hide = () => this._runButton.style.display = 'none';
}