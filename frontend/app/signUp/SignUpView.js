export class SignUpView {
    onSignUp = null;
    onGoToLogin = null;

    get username(){
        return this._usernameInput.value;
    }

    get password(){
        return this._passwordInput.value;
    }

    get repeatPassword(){
        return this._repeatPasswordInput.value;
    }

    get avatarIdx(){
        return this._avatarInput.selectedIndex;
    }

    get avatar(){
        return this._avatarInput.options[this.avatarIdx].value;
    }

    constructor() {
        // DOM components
        this._usernameInput = document.querySelector('#inputUserNameSignup');
        this._passwordInput = document.querySelector('#inputPasswordSignUp');
        this._repeatPasswordInput = document.querySelector('#inputValidationPasswordSignUp');
        this._avatarInput = document.querySelector('#avatar');
        this._hintDiv = document.querySelector('.hint.signUp');
        this._signUpButton = document.querySelector('#signUp');
        this._goToLoginButton = document.querySelector('#goToLogin');
        this._signUpPageDiv = document.querySelector('#signUpPage');

        // events
        this._signUpButton.addEventListener('click', () => this.onSignUp && this._isSignUpFormFilled() && this._passwordsMatch() && this.onSignUp());
        this._goToLoginButton.addEventListener('click', () => this.onGoToLogin && this.onGoToLogin());
        this._usernameInput.addEventListener('input', this._updateSignUpButton);
        this._passwordInput.addEventListener('input', this._updateSignUpButton);
        this._repeatPasswordInput.addEventListener('input', this._updateSignUpButton);
        this._avatarInput.addEventListener('input', this._updateSignUpButton);

        // init
        this._updateSignUpButton();
    }

    show = () => {
        this._signUpPageDiv.style.display = 'flex';
        this._usernameInput.focus();
    }

    hide = () => this._signUpPageDiv.style.display = 'none';

    _passwordsMatch = () => this.password === this.repeatPassword;

    _isSignUpFormFilled = () => {
        if (this.username === '') return false;
        if (this.password === '') return false;
        if (this.repeatPassword === '') return false;
        if (this.avatarIdx === 0) return false;
        return true;
    }
    _updateSignUpButton = () => {
        const passwordsMatch = this._passwordsMatch();
        this._signUpButton.disabled = !this._isSignUpFormFilled() || !passwordsMatch;
        if (!passwordsMatch) {
            this.showError('Your passwords don\'t match.');
        } else {
            this.hideError();
        }
    }

    showError = (text) => {
        this._hintDiv.innerHTML = text;
        this._hintDiv.style.visibility = 'visible';
    }

    hideError = () => {
        this._hintDiv.style.visibility = 'hidden';
    }
}