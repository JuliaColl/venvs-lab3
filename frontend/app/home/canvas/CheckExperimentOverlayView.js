export class CheckExperimentOverlayView {
    constructor(disappearTimeoutMs = 2500) {
        // DOM components
        this._overlay = document.querySelector('#congratsOverlay');
        this._disappearTimeoutMs = disappearTimeoutMs;
        // events
        //this._runButton.addEventListener("click", e => this.onRun && this.onRun())
    }

    viewCorrectExperiment = () => {
        this.show();
        setTimeout(this.hide, this._disappearTimeoutMs);
    }

    show = () => this._overlay.style.display = 'flex';
    hide = () => this._overlay.style.display = 'none';
}