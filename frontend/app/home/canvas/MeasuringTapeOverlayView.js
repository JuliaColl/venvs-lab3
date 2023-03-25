export class MeasuringTapeOverlayView {
    onStartMeasure = null;
    onStopMeasure = null;

    constructor() {
        // DOM components
        this._overlayDiv = document.querySelector('#measuringTape');
        this._newMeasureIcon = document.querySelector('#new-marker');
        this._finishMeasureIcon = document.querySelector('#save-marker');
        this._measureDiv = document.querySelector('#measure');

        // events
        this._newMeasureIcon.addEventListener("click", () => this.onStartMeasure())
        this._finishMeasureIcon.addEventListener("click", () => this.onStopMeasure())
    }

    setMeasure = (x) => this._measureDiv.textContent = x;

    show = () => this._overlayDiv.style.display = 'flex';
    hide = () => this._overlayDiv.style.display = 'none';
}