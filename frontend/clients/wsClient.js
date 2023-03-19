import { WS_SERVER_URI } from "../config.js";
import { ROOM_SUMMARY_MESSAGE_TYPE, SEND_MESSAGE_COMMAND,  LATEST_STATE_COMMAND, MESSAGE_COMMAND, LEFT_ROOM_COMMAND, JOINED_ROOM_COMMAND, JOIN_ROOM_COMMAND, TARGET_MESSAGE_TYPE, CHAT_MESSAGE_TYPE, AUDIO_MESSAGE_TYPE, RUN_MESSAGE_TYPE, PARAMS_MESSAGE_TYPE } from "./COMMAND.js";

export class WsClient {  
    onCommand = null;
    onLatestState = null;
    onMessage = null;
    onTarget = null;
    onAudioMessage = null;
    onChatMessage = null;
    onOpen = null;
    onClose = null;
    onClientLeftRoom = null;
    onClientJoinedRoom = null;
    onRoomSummary = null;
    onError = null;
    onRun = null;
    onParamUpdated = null;

    constructor(token) {
        this.client = new WebSocket(`${WS_SERVER_URI}?token=${token}`, 'messaging-protocol');

        this.client.onerror = () => {
            console.log('Connection Error');
            this.onError()
        };

        this.client.onopen = () => {
            console.log('WebSocket Client Connected');
            if (this.onOpen) this.onOpen();
        };
        
        this.client.onclose = () => {
            console.log('echo-protocol Client Closed');
            if (this.onClose) this.onClose();
        };
        
        this.client.onmessage = (e) => {
            const { command, body } = JSON.parse(e.data);
            if (this.onCommand) this.onCommand(command, body);
            if (command ===  LATEST_STATE_COMMAND && this.onLatestState) this.onLatestState(body)
            if (command === MESSAGE_COMMAND && this.onMessage) this.onMessage(body)
            if (command === LEFT_ROOM_COMMAND && this.onClientLeftRoom) this.onClientLeftRoom(body.roomId, body.username)
            if (command === JOINED_ROOM_COMMAND && this.onClientJoinedRoom) this.onClientJoinedRoom(body.roomId, body)
            if (command === MESSAGE_COMMAND && body.message.type === TARGET_MESSAGE_TYPE) this.onTarget(body)
            if (command === MESSAGE_COMMAND && body.message.type === CHAT_MESSAGE_TYPE) this.onChatMessage(body)
            if (command === MESSAGE_COMMAND && body.message.type === AUDIO_MESSAGE_TYPE) this.onAudioMessage(body)
            if (command === MESSAGE_COMMAND && body.message.type === ROOM_SUMMARY_MESSAGE_TYPE) this.onRoomSummary(body.message.content)
            if (command === MESSAGE_COMMAND && body.message.type === RUN_MESSAGE_TYPE) this.onRun()
            if (command === MESSAGE_COMMAND && body.message.type === PARAMS_MESSAGE_TYPE) {
                
                console.log("received", body.message.content.id, body.message.content.value)
                this.onParamUpdated(body.message.content);
            }
        };
    }

    joinRoom(roomId, position){
        this.client.send(JSON.stringify({
            command: JOIN_ROOM_COMMAND,
            body: {
                roomId,
                position
            }
        }));
    }

    _sendMessage = (message, to = 'all') => {
        if (!message.content) throw new Error(`Message must have content. I.e. 'hiii!'`);
        if (!message.type) throw new Error(`Message must have type. I.e. ChatMessage`)
        this.client.send(JSON.stringify({
            command: SEND_MESSAGE_COMMAND,
            body: {
                message
            },
            to
        }));
    }

    sendTarget = (target) => {
        if (this.client.readyState !== this.client.OPEN) return;
        if (target[0] === undefined) throw new Error(`Target must have field x`);
        if (target[1] === undefined) throw new Error(`Target must have field y`);
        return this._sendMessage({
            content: target,
            type: TARGET_MESSAGE_TYPE
        });
    } 

    sendChatMessage = (message) => {
        if (this.client.readyState !== this.client.OPEN) return;
        return this._sendMessage({
            content: {
                data: message.data,
                id: message.id
            },
            type: CHAT_MESSAGE_TYPE
        });
    }

    sendAudio = (blob) => {
        if (this.client.readyState !== this.client.OPEN) return;
        return this._sendMessage({
            content: blob,
            type: AUDIO_MESSAGE_TYPE
        });
    }

    runExperiment = () => {
        if (this.client.readyState !== this.client.OPEN) return;
        return this._sendMessage({
            type: RUN_MESSAGE_TYPE,
            content: {}
        });
    }

    sendParams = (id, value) => {
        if (this.client.readyState !== this.client.OPEN) return;
        console.log("sending", id, value)
        return this._sendMessage({
            type: PARAMS_MESSAGE_TYPE,
            content: {
                id, 
                value
            }
        });
    }
}




