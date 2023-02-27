import { htmlToElement } from "../../../utils.js";

export class MessageInputOverlayView {
    onEnter = null;
    onInput = null;

    get text(){
        return this._chatInput.value;
    }
    set text(value){
        this._chatInput.value = value;
    }

    constructor() {
        // DOM components
        this._inputOverlayDiv = document.querySelector('#inputOverlay');
        this._chatInput = document.querySelector('#inputBar');

        // events
        this._chatInput.addEventListener("keypress", (e) => e.key === 'Enter' && this.onEnter && this.onEnter(e));
        this._chatInput.addEventListener("input", (e) => this.onInput && this.onInput(e));
        window.addEventListener('keydown', this._onKeydown);
    }

    _onKeydown = (e) => {
        switch (e) {
          case 9: // tab
            this._chatInput.focus();
            break;
        }
    }

    show = () => this._inputOverlayDiv.style.display = 'flex';
    hide = () => this._inputOverlayDiv.style.display = 'none';
}