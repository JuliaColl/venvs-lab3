import { ChatOverlayView } from "./ChatOverlayView.js";

export class ChatOverlayController {
    constructor(messageDisappearTimeoutMs = 10000, maxMessagesInStack = 10) {
        this._chatOverlayView = new ChatOverlayView();
        this._messageStack = [];
        this._messageDisappearTimeoutMs = messageDisappearTimeoutMs;
        this._maxMessagesInStack = maxMessagesInStack;
    };

    addNewMessage = (message) => {
        this._messageStack.push(message)
        this._chatOverlayView.showNew(message);

        if (this._messageStack.length > this._maxMessagesInStack){
            this._messageStack = this._messageStack.slice(1)
            this._chatOverlayView.deleteOldest();
        }
        setTimeout(() => {
            this._messageStack = this._messageStack.slice(1)
            this._chatOverlayView.deleteOldest();
        }, this._messageDisappearTimeoutMs);
    }

    show = () => this._chatOverlayView.show();
    hide = () => this._chatOverlayView.hide();
}