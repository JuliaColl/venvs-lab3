import { SEND_MESSAGE_COMMAND, JOIN_ROOM_COMMAND } from '../../../frontend/clients/COMMAND.js';
import { sendMessageCommandHandler } from './handlers/sendMessage.js';
import { joinRoomCommandHandler } from './handlers/joinRoom.js';

export const commandHandlerFactory = {
    [SEND_MESSAGE_COMMAND]: sendMessageCommandHandler,
    [JOIN_ROOM_COMMAND]: joinRoomCommandHandler
}
