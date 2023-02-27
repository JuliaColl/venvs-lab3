export class LoginView {
    onLogin = null;
    onGoToSignUp = null;

    get username(){
        return this._usernameInput.value;
    }

    get password(){
        return this._passwordInput.value;
    }

    constructor() {
        // DOM components
        this._usernameInput = document.querySelector('#inputUserNameLogin');
        this._passwordInput = document.querySelector('#inputPasswordLogin');
        this._hintDiv = document.querySelector('.hint.login');
        this._loginButton = document.querySelector('#login');
        this._goToSignUpButton = document.querySelector('#goToSignUp');
        this._loginPageDiv = document.querySelector('#loginPage');
    
        // events
        this._loginButton.addEventListener('click', () => this.onLogin && this._isLoginFormValid() && this.onLogin());
        this._goToSignUpButton.addEventListener('click', () => this.onGoToSignUp && this.onGoToSignUp());
        this._passwordInput.addEventListener('keydown', this._onKeyPress);
        this._usernameInput.addEventListener('keydown', this._onKeyPress);
        this._passwordInput.addEventListener('input', this._updateLoginButton);
        this._usernameInput.addEventListener('input', this._updateLoginButton);

        // initial status
        this._usernameInput.focus();
        this._updateLoginButton();
    }

    show = () => {
        this._loginPageDiv.style.display = 'flex';
        this._usernameInput.focus();
    }
    hide = () => this._loginPageDiv.style.display = 'none';

    _isLoginFormValid = () => this.password !== '' && this.username !== '';
    _updateLoginButton = () => this._loginButton.disabled = !this._isLoginFormValid();
    
    _onKeyPress = (e) => {
        if (e.code !== 'Enter') return;
        if (!this._isLoginFormValid()) return;
        if (!this.onLogin) return;
        this.onLogin();
    }

    showError = (text) => {
        this._hintDiv.innerHTML = text;
        this._hintDiv.style.visibility = 'visible';
    }

    hideError = () => {
        this._hintDiv.style.visibility = 'hidden';
    }
}