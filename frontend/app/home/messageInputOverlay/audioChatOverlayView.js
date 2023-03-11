export class AudioChatOverlayView {
    onClick = null;

    constructor() {
        // DOM components
        this._micIcon = document.querySelector('#mic');

        // events
        this._micIcon.addEventListener("click", (e) => this.onClick && this.onClick(e));
    }

    mute = () => {
        this._micIcon.classList.add('fa-microphone-slash');
        this._micIcon.classList.remove('fa-microphone');
    }
    unmute = () => {
        this._micIcon.classList.add('fa-microphone');
        this._micIcon.classList.remove('fa-microphone-slash');
    }
}