import { ChatOverlayController } from './app/home/chatOverlay/ChatOverlayController.js';
import { LoginController } from './app/login/LoginController.js';
import { SignUpController } from './app/signUp/SignUpController.js';
import { CanvasController } from './app/home/canvas/CanvasController.js';
import { MessageInputOverlayController } from './app/home/messageInputOverlay/MessageInputOverlayController.js';

const chatOverlayController = new ChatOverlayController();
const loginController = new LoginController();
const signUpController = new SignUpController();
const canvasController = new CanvasController();
const messageInputOverlayController = new MessageInputOverlayController(chatOverlayController);

canvasController.messageInputOverlayController = messageInputOverlayController;
canvasController.chatOverlayController = chatOverlayController;

loginController.onGoToSignUp = () => signUpController.show();
signUpController.onGoToLogin = () => loginController.show();

canvasController.goToLogin = () => {
  loginController.show();

  chatOverlayController.hide();
  canvasController.hide();
  messageInputOverlayController.hide();
}

signUpController.onLogin = loginController.onLogin = ({ user, token }) => {
  canvasController.onLogin(user, token);  // todo123 why initMyUser and token in different methods if called together, just do canvasController.onUser(user, token)
  messageInputOverlayController.username = user.username;  // todo try to remove

  loginController.hide();
  signUpController.hide();

  chatOverlayController.show();
  canvasController.show();
  messageInputOverlayController.show();
}
