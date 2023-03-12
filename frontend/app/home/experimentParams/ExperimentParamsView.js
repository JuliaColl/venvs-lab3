import { htmlToElement } from "../../../utils.js";

export class ExperimentParamsView {
    onValue = null;

    constructor() {
        // DOM components
        this._paramsDiv = document.querySelector('#params');
        
        // events
    }

    show = () => this._paramsDiv.style.display = 'flex';
    hide = () => this._paramsDiv.style.display = 'none';

    appendParam = ({ description, initialValue, id }) => {
        const paramDiv = htmlToElement(`<div class="param">
        <div class="title">
            ${description}
        </div>
        <input type="text" class="input" placeholder="${description}" value="${initialValue}">
        <div class="validation">
            
        </div>
    </div>`);
        this._paramsDiv.append(paramDiv)
        paramDiv.querySelector('.input').addEventListener('input', (e) => {
            this.onValue && this.onValue(id, e.target.value)
        })
    }

    _getParam = (idx) => this._paramsDiv.children[idx]

    setValidationError = (idx, validationError) => {
        this._getParam(idx).querySelector('.validation').textContent = validationError;
    }

    clear = () => {
        [...this._paramsDiv.children].forEach(child => child.remove())
    }
}