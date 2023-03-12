export class LeaveRoomOverlayView {
    onYes = null;
    onDismiss = null;

    constructor() {
        // DOM components
        this._notificationDiv = document.querySelector('#changeRoomOverlay');
        this._yesButton = document.querySelector('#changeRoomOverlay button.yes');
        this._noButton = document.querySelector('#changeRoomOverlay button.no');

        // events
        this._yesButton.addEventListener("click", (e) => this.onYes && this.onYes(e));
        this._noButton.addEventListener("click", (e) => this.onDismiss && this.onDismiss(e));
    }

    show = () => this._notificationDiv.style.display = 'flex';
    hide = () => this._notificationDiv.style.display = 'none';
}