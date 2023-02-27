import { MessageInputOverlayView } from "./MessageInputOverlayView.js";
import { Message } from "../../../models/Message.js";
import { uuid } from "../../../utils.js";

const WELL_KNOWN_EMOJIS = {
    ':)': '☺️',
    ':(': '😔',
    '<<3': '💕',
    '<3': '💛',
    'o_o': '😯',
    ':-D': '😎',
    ':-)': '😁',
    ':"D': '😂',
    ":'-)": '🥲',
    '>:(': '😡',
    "D-':": '😨',
    ':-3': '😸',
    ':x': '😘',
    ':-P': '😛',
    ':|': '😑',
    ':-|': '😐',
    ':$': '😖',
    '>:)': '😈',
    'O:-)': '😇',
    '|;-)': '😎',
    '%-)': '😵‍💫',
    ':E': '😬',
    'x_x': '😵',
    '(-_-)': '😴',
    'uwu': '😌',
    'UwU': '😌',
    'zzz': '💤',
    '(Y)': '👍',
    '(N)': '👎'
}

const replaceEmojis = (src) => {
    let value = src;
    Object.keys(WELL_KNOWN_EMOJIS).forEach(textEmoji => {
        const searchTextEmoji = `${textEmoji} `; // must have finished sentence and clicked space
        const replacementEmoji = `${WELL_KNOWN_EMOJIS[textEmoji]} `; // preserve space
        value = value.replace(searchTextEmoji, replacementEmoji);
    });
    return value;
}

export class MessageInputOverlayController {
    wsClient = null;
    username = null;  // todo can we avoid this?

    constructor(chatOverlayController) {
        this._messageInputOverlayView = new MessageInputOverlayView();
        this._chatOverlayController = chatOverlayController; 

        this._messageInputOverlayView.onEnter = (e) => {
            this._onSendMessage(replaceEmojis(e.target.value + ' ').trimEnd());
        }
        this._messageInputOverlayView.onInput = (e) => {
            this._messageInputOverlayView.text = replaceEmojis(e.target.value);
        }
    };
    
    _onSendMessage = (value) => {
        if (!this.wsClient) {
            console.error("Trying to send a message, but the wsClient has not been injected yet.");
            return;
        }
        if (!this.username) {
            console.error("Trying to send a message, but the username has not been injected yet.");
            return;
        }
        this._messageInputOverlayView.text = "";
        const message = new Message(uuid(), this.username, value, 'me');
        this.wsClient.sendChatMessage(message);
        this._chatOverlayController.addNewMessage(message);
    }

    show = () => this._messageInputOverlayView.show();
    hide = () => this._messageInputOverlayView.hide();
}