import { ExperimentParamsView } from "../experimentParams/ExperimentParamsView.js";


export class ExperimentParamsController {
    _params = []
    _keyParams = {}

    onValue = null;

    constructor() {
        this._experimentDetailsView = new ExperimentParamsView();
        this._experimentDetailsView.onValue = this.onValueHandler;
    };

    onValueHandler = (id, value) => {
        const idx = this._keyParams[id];
        const param = this._params[idx];

        if (param.value.toString() !== value.toString()){
            this.onValue && this.onValue(id, value)
        }

        if (param.type === 'float'){
            param.value = parseFloat(value);
            param.isValid = false;
            if (isNaN(param.value) || isNaN(Number(value))){
                this._experimentDetailsView.setValidationError(idx, 'Write a valid number')
                return;
            }
            console.log(param.value)
            if (param.minValue !== null && param.minValue > param.value){
                this._experimentDetailsView.setValidationError(idx, `Must be > ${param.minValue}`)
                return;
            }
            if (param.maxValue !== null && param.maxValue < param.value){
                this._experimentDetailsView.setValidationError(idx, `Must be < ${param.maxValue}`)
                return;
            }
            param.isValid = true;
            this._experimentDetailsView.setValidationError(idx, '')  // no error
        } else {
            throw new Error(`type ${param.type} not implemented`)
        }
    }

    isValid = () => {
        for (const idx in this._params){
            const param = this._params[idx]
            if (!param.isValid){
                return false;
            }
        }
        return true;
    }

    _refreshKeys = () => {
        this._keyParams = {}
        this._params.forEach(({ id }, idx) => this._keyParams[id] = idx)
    }

    getValue = (id) => this._params[this._keyParams[id]].value;
    getValues = () => {
        const values = {}
        this._params.forEach(({id, value}) => values[id] = value)
        return values;
    }
    setValue = (id, value) => {
        console.log("setting value", id, value)
        const idx = this._keyParams[id];
        const param = this._params[idx];
        param.value = parseFloat(value)
        this._experimentDetailsView.setValue(this._keyParams[id], value)
    }

    loadParam = (param) => {
        this._params.push({...param, isValid: true })
        this._experimentDetailsView.appendParam(param)
        this._refreshKeys()
    }

    loadParams = (params) => {
        params.forEach(param => this.loadParam(param))
    }

    clearParams = () => {
        this._experimentDetailsView.clear();
        this._params = [];
        this._keyParams = {}
    }

    show = () => this._experimentDetailsView.show();
    hide = () => this._experimentDetailsView.hide();
}
