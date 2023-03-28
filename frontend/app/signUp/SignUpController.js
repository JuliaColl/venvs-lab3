import { SignUpView } from "./SignUpView.js";
import RestClient from "../../clients/RestClient.js";

export class SignUpController {
    onLogin = null;
    onGoToLogin = null;

    constructor() {
        this._signUpView = new SignUpView();
        this._signUpView.onSignUp = this.signUp;
        this._signUpView.onGoToLogin = () => this.onGoToLogin && this.hide() && this.onGoToLogin();
    };
    
    signUp = async () => {
        const username = this._signUpView.username;
        const password = this._signUpView.password;
        const avatar = this._signUpView.avatar;
        console.log(avatar)

        const signUpResult = await RestClient.signUp(username, password, avatar);
        if (signUpResult.status !== 200) {
            this._signUpView.showError(signUpResult.data.reason)
            return;
        }

        const loginResult = await RestClient.login(username, password);
        if (loginResult.status != 200) {
            this.loginView.showError("Something is not working right now...");  // should not happen
            return;
        }

        if (this.onLogin) this.onLogin(loginResult.data)
    }

    show = () => this._signUpView.show();
    hide = () => this._signUpView.hide();
}