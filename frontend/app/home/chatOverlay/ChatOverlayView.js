import { htmlToElement } from "../../../utils.js";

export class ChatOverlayView {
    constructor() {
        // DOM components
        this._chatOverlayDiv = document.querySelector('#chatOverlay');

        // events
        this._chatOverlayDiv.addEventListener("click", (e) => {
          // prevent default behavior of click
          e.preventDefault();
          return false;
        })
    }

    showNew = (message) => {
        this._chatOverlayDiv.appendChild(htmlToElement(
        `<div class="bubble ${message.ownership}">
            <div class="username">${message.username}</div>
            <div class="content showEmojis">${message.data}</div>
        </div>`
      ))
    }

    deleteOldest = () => {
        const firstChild = this._chatOverlayDiv.firstElementChild;
        firstChild.style.opacity = '0';
        setTimeout(() => firstChild.remove(), 300);
    }

    show = () => this._chatOverlayDiv.style.display = 'flex';
    hide = () => this._chatOverlayDiv.style.display = 'none';
}