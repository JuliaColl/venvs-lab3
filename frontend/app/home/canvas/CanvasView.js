export class CanvasView {
    constructor() {
        this._canvas = document.querySelector('canvas');
    };

    show = () => this._canvas.style.display = 'flex';
    hide = () => this._canvas.style.display = 'none';
}