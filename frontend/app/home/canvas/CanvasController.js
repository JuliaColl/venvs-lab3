import { CanvasView } from "./CanvasView.js";
import { User } from '../../../models/User.js';
import { Room } from '../../../models/Room.js';
import { clamp } from '../../../utils.js';
import { STATIC_FILE_URI } from '../../../config.js';
import { autoReconnect } from '../../../autoReconnect.js';
import { WsClient } from "../../../clients/wsClient.js";
import { Message } from "../../../models/Message.js";
import { LeaveRoomOverlayView } from "./LeaveRoomOverlayView.js";


export class CanvasController {
    messageInputOverlayController = null;
    chatOverlayController = null;

    goToLogin = null;

    mousePosition = [0,0];
    camOffset = [0, 0];
    currentRoom = null;
    myUser = null;

    last = performance.now();
    rooms = {};

    _hasLeaveRoomDialogBeenDismissed = false;

    constructor() {
        this._leaveRoomOverlayView = new LeaveRoomOverlayView();
        this._leaveRoomOverlayView.onYes = () => {
            const exit = this.currentRoom.getExit(this.myUser.position);
            if (!exit) {  // should never happen
                this._hasLeaveRoomDialogBeenDismissed = true;
                this._leaveRoomOverlayView.hide();
                return;
            }

            this._hasLeaveRoomDialogBeenDismissed = false;
            this.myUser.currentRoom = exit.toRoomId;
            this.currentRoom = this.rooms[exit.toRoomId];
            this.currentRoom.removeAllUsers();
            this.currentRoom.addUser(this.myUser.username, this.myUser);
            this._ws.joinRoom(exit.toRoomId, exit.spawnPos); 
            this.myUser.setPosition(exit.spawnPos);  
            
            this._leaveRoomOverlayView.hide();

        }
        this._leaveRoomOverlayView.onDismiss = () => {
            this._leaveRoomOverlayView.hide();
            this._hasLeaveRoomDialogBeenDismissed = true;
        }

        this._canvasView = new CanvasView();
        this._canvasView.onMouse = this.onMouse;
        this._initRooms();

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                if (!this.currentRoom) return;
                for (let username in this.currentRoom.users) {
                    const user = this.currentRoom.users[username];
                    user.setPosition(user.getTarget());
                }
            }
        });
    };

    show = () => this._canvasView.show();
    hide = () => {
        this._canvasView.hide();
        this._leaveRoomOverlayView.hide();
    }

    onLogin = ({ username, avatar }, token) => {
        this.myUser = new User(username, avatar);

        autoReconnect(() => {
            this._ws = new WsClient(token);

            this._ws.onError = () => {
                //this.goToLogin();
                //delete this._ws;
                window.location.reload();

            }
           
            
            this.messageInputOverlayController.wsClient = this._ws;  // todo fix this shit

            this._ws.onLatestState = ({ username, position, roomId }) => this.setLatestState(roomId, username, position);

            this._ws.onTarget = (body) => this.setOtherUserTarget(body.srcUsername, [body.message.content[0], body.message.content[1]]);

            this._ws.onChatMessage = (body) => {
                const message = new Message(
                    body.message.content.id,
                    body.srcUsername,
                    body.message.content.data,
                    'other'
                );
                this.chatOverlayController.addNewMessage(message);
            }

            this._ws.onClientLeftRoom = (roomId, username) => this.onUserLeftRoom(username);
            this._ws.onClientJoinedRoom = (roomId, { username, avatar, position }) => this.onUserJoinedRoom(roomId, username, avatar, position);
            this._ws.onRoomSummary = ({ roomId, users }) => this.initCurrentRoom(roomId, users);

            return this._ws;
        })

        this.loop();
    }

    loop = () => {
        //update our canvas
        this._canvasView.draw(this.currentRoom, this.camOffset);

        //to compute seconds since last loop
        var now = performance.now();
        //compute difference and convert to seconds
        var elapsed_time = (now - this.last) / 1000;
        //store current time into last time
        this.last = now;

        //now we can execute our update method
        this.update(elapsed_time);

        //request to call loop() again before next frame
        requestAnimationFrame(this.loop);
    };

    update = (dt) => {
        if (this.currentRoom === null) return;

        const myUsername = this.myUser.username
        const myUserPosition = this.myUser.getPosition()

        const CAN_HEAR_CHAT_RANGE = 250;  // todo import from backend
        for (let username in this.currentRoom.users) {
            const user = this.currentRoom.users[username];
            user.updatePos(dt);

            if (username !== myUsername) {
                const position = user.getPosition()
                user.tooFar = Math.hypot(position[0] - myUserPosition[0], position[1] - myUserPosition[1]) > CAN_HEAR_CHAT_RANGE;
            }
        }

        if (this.myUser && this.myUser.animation === "walking") {
            this.updateRoom();

        }

        this.updateOffset();

    };

    updateRoom = () => {
        const exit = this.currentRoom.getExit(this.myUser.position);
        if (!exit) {
            this._leaveRoomOverlayView.hide();
            this._hasLeaveRoomDialogBeenDismissed = false;
            return;
        };
        if (this._hasLeaveRoomDialogBeenDismissed) return;
        this._leaveRoomOverlayView.show();
    };

    updateOffset = () => {

        const [maxX, maxY] = this._canvasView.getMaxOffset(this.currentRoom.width, this.currentRoom.height);
        const [minX, minY] = this._canvasView.getMinOffset(this.currentRoom.width, this.currentRoom.height);


        if (maxX > minX) {
            var x = clamp(this.myUser.position[0], minX, maxX);
            this.camOffset[0] = -x;
        } else {
            this.camOffset[0] = 0;

        }

        if (maxY > minY) {
            var y = clamp(this.myUser.position[1], minY, maxY);
            this.camOffset[1] = -y;
        } else {
            this.camOffset[1] = 0;
        }
    };

    _initRooms = async () => {
        // create the rooms
        const rooms = (await fetch(STATIC_FILE_URI + "data/world.json").then(r => r.json())).map(room => new Room(room))
        rooms.forEach(
            (room) => {
                var img = this._canvasView.getRoomImage(room.url);
                img.room = room.id;
                img.onload = () => {
                    this.rooms[img.room].height = img.height;
                    this.rooms[img.room].width = img.width;
                }
                this.rooms[room.id] = room;
            }
        );
    };

    onMouse = (e) => {
        var rect = this._canvasView.getBoundingClientRect();
        this.mousePosition[0] = e.clientX - rect.left;
        this.mousePosition[1] = e.clientY - rect.top;

        if (e.type == "mousedown") {

            const worldPosition = this._canvasView.canvasToWorld(
                [this.mousePosition[0], this.mousePosition[1]],
                this.camOffset
            );

            const clampedWorldPosition = this.currentRoom.clampToRoom(worldPosition);

            this.myUser.setTarget(clampedWorldPosition);

            if (this.myUser) {
                const target = this.myUser.getTarget();  
                this._ws.sendTarget(target);

            }
        }
    };

    setLatestState = (roomId, username, position) => {

        console.log(`My client id: ${username}. Latest state: ${position} @ ${roomId}`)

        roomId = roomId ?? 0;

        this.currentRoom = this.rooms[roomId];
        
        position = position ? position : [0, 0];

        this._ws.joinRoom(roomId, position);


        this.myUser.setPosition(position);

        this.camOffset = [-position[0], -position[1]];
        this.currentRoom.addUser(username, this.myUser);
    };

    setOtherUserTarget = (srcUsername, targetPos) => {
        const user = this.currentRoom.users[srcUsername];
        user?.setTarget(targetPos);
    };


    onUserLeftRoom = (username) => this.currentRoom.removeUser(username);

    onUserJoinedRoom = (roomId, username, avatar, position) => {
        const newUser = new User(username, avatar);
        newUser.setPosition(position);
        this.currentRoom.addUser(username, newUser);
        console.log(`User ${username} joined the room ${roomId}`)
    }

    initCurrentRoom = (roomId, users) => {
        if (roomId !== this.currentRoom.id) return;
        users.forEach(({ username, avatar, position }) => {
            this.currentRoom.addUser(username, new User(username, avatar));
            const user = this.currentRoom.users[username];
            user.setPosition(position);
        })
    }
}