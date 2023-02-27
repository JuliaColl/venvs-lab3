import { LoginView } from "./LoginView.js";
import RestClient from "../../clients/RestClient.js";

export class LoginController {
    onLogin = null;
    onGoToSignUp = null;

    constructor() {
        this._loginView = new LoginView();
        this._loginView.onLogin = this.login;
        this._loginView.onGoToSignUp = () => this.onGoToSignUp && this.hide() && this.onGoToSignUp()
    };

    login = async () => {
        const username = this._loginView.username;
        const password = this._loginView.password;

        const result = await RestClient.login(username, password);
        if (result.status !== 200) {
            this._loginView.showError("Check your username and password.");
            return;
        }

        if (this.onLogin) this.onLogin(result.data);  
    }

    show = () => this._loginView.show();
    hide = () => this._loginView.hide();
}