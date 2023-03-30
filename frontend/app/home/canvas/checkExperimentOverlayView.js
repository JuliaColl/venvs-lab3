export class CheckExperimentOverlayView {
    //onRun = null;

    constructor() {
        // DOM components
        this._overlay = document.querySelector('#congratsOverlay');
        
        // events
        //this._runButton.addEventListener("click", e => this.onRun && this.onRun())
    }

    show = () => this._overlay.style.display = 'flex';
    hide = () => this._overlay.style.display = 'none';
}