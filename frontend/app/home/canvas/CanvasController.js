import { CanvasView } from "./CanvasView.js";
import { User } from '../../../models/User.js';
import { Room } from '../../../models/Room.js';
import { clamp } from '../../../utils.js';
import { STATIC_FILE_URI } from '../../../config.js';
import { autoReconnect } from '../../../autoReconnect.js';
import { WsClient } from "../../../clients/wsClient.js";
import { Message } from "../../../models/Message.js";
import { LeaveRoomOverlayView } from "./LeaveRoomOverlayView.js";
import { ExperimentParamsController } from "../experimentParams/ExperimentParamsController.js";
import { world } from './world.js';

var moveCam = true;

export class CanvasController {
    messageInputOverlayController = null;
    chatOverlayController = null;
    audioOverlayController = null;

    //mousePosition = [0, 0];
    //camOffset = [0, 0];
    currentRoom = null;
    myUser = null;

    last = performance.now();
    rooms = {};

    _hasLeaveRoomDialogBeenDismissed = false;

    scene = null;
    renderer = null;
    camera = null;
    character = null;

    animations = {};
    //animation = null;

    walkarea = null;

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

        this._experimentParamsController = new ExperimentParamsController();
        
        this._canvasView = new CanvasView();
        this._canvasView.onMouse = this.onMouse;
        this._initRooms();

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                if (!this.currentRoom) return;
                for (let username in this.currentRoom.users) {
                    const user = this.currentRoom.users[username];
                    user.position = user.target; // TODO
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === "Space") {
                if(this._experimentParamsController.isValid()){
                    const values = this._experimentParamsController.getValues()
                    const dynamic_object = this.currentRoom.demo.dynamic_object;
                    dynamic_object.setParams(values);
                    dynamic_object.reset()
                    dynamic_object.start()
                }
            }
        });

    };

    show = () => {
        this._canvasView.show();
        this._experimentParamsController.show();
    }
    hide = () => {
        this._canvasView.hide();
        this._leaveRoomOverlayView.hide();
        this._experimentParamsController.hide();
    }

    useSsao = false;

    onLogin = ({ username, avatar }, token) => {

        //this.myUser = new User(username, avatar, avatar_scale);   //TODO set avatar and avatar_scale from backend
        this.myUser = new User(username, "girl", 0.3);

        autoReconnect(() => {
            this._ws = new WsClient(token);

            this._ws.onError = () => {
                //delete this._ws;
                window.location.reload();

            }

            this.messageInputOverlayController.wsClient = this._ws;  // todo fix this shit
            this.audioOverlayController.wsClient = this._ws;  // todo fix this shit

            this._ws.onLatestState = ({ username, position, roomId }) => this.setLatestState(roomId, username, position);

            this._ws.onTarget = (body) => this.setOtherUserTarget(body.srcUsername, [body.message.content[0], body.message.content[1]]);

            this._ws.onAudioMessage = (body) => this.audioOverlayController.onAudioReceived(body.message.content);

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

        //create the rendering context
        var context = GL.create({ canvas: document.getElementById("canvas") });

        //setup renderer
        this.renderer = new RD.Renderer(context);
        this.renderer.setDataFolder("data");
        this.renderer.autoload_assets = true;

        //load shader
        this.renderer.loadShaders("shaders.txt");

        //attach canvas to DOM
        document.body.appendChild(this.renderer.canvas);

        //create a scene
        this.scene = new RD.Scene();

        //create camera
        this.camera = new RD.Camera();
        this.camera.perspective(60, gl.canvas.width / gl.canvas.height, 0.1, 1000);
        this.camera.lookAt([0, 40, 100], [0, 20, 0], [0, 1, 0]);

        //global settings
        var bg_color = [1, 1, 1, 1];
        //var avatar = "girl";
        //var avatar_scale = 0.3;
        //var avatar = "tiger";
        //var avatar_scale = 1.5;

        //load some animations
        const loadAnimation = (name, url) => {
            var anim = this.animations[name] = new RD.SkeletalAnimation();
            anim.load(url);
            return anim;
        }
        loadAnimation("idle", "data/" + this.myUser.avatar + "/idle.skanim");
        loadAnimation("walking", "data/" + this.myUser.avatar + "/walking.skanim");
        //loadAnimation("dance","data/girl/dance.skanim");

        /*
        //load a GLTF for the room
        var room = new RD.SceneNode({ scaling: 40, position: [0, -.01, 0] });
        room.loadGLTF("data/room.gltf");
        this.scene.root.addChild(room);
        */

        var gizmo = new RD.Gizmo();
        gizmo.mode = RD.Gizmo.ALL;

        /*
        //create sphere
        var box = new RD.SceneNode({
            position: [0, 10, 0],
            mesh: "cube",
            color: [1, 0, 0, 1],
            scaling: [10, 10, 10],
            name: "parabolic",
        });

        //box.shader = "phong";
        this.scene.root.addChild(box);
        */

        // main loop ***********************

        //main draw function
        context.ondraw = () => {
            gl.canvas.width = document.body.offsetWidth;
            gl.canvas.height = document.body.offsetHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            const myNodeSceneUser = this.scene.getNodeById(this.myUser.username)
            if (myNodeSceneUser){
                var girlpos = myNodeSceneUser.localToGlobal([0, 40, 0]);
                var campos = myNodeSceneUser.localToGlobal([0, 60, -70]);
                var camtarget = myNodeSceneUser.localToGlobal([0, 10, 70]);
                var smoothtarget = vec3.lerp(vec3.create(), this.camera.target, camtarget, 0.1);

                this.camera.perspective(60, gl.canvas.width / gl.canvas.height, 0.1, 1000);
                if (moveCam) {
                    this.camera.lookAt(this.camera.position, this.camera.target, [0, 1, 0]);
                } else {
                    this.camera.lookAt([0, 65, 0], girlpos, [0, 1, 0]);
                }
            }
            
            

            //clear
            this.renderer.clear(bg_color);
            //render scene
            this.renderer.render(this.scene, this.camera, null, 0b11);

            /*
            var vertices = this.walkarea?.getVertices();
            this.renderer.renderPoints(vertices, null, this.camera, null, null, null, gl.LINES);
            */

            //gizmo.setTargets([monkey]);
            //this.renderer.render( this.scene, this.camera, [gizmo] ); //render gizmo on top

            // shader
            if (this.useSsao) {
                var w = gl.canvas.width;
                var h = gl.canvas.height;
                if (!this.normaldepth_fbo || this.normalbuffer.width != w || this.normalbuffer.height != h) {
                    this.normalbuffer = new GL.Texture(w, h, { format: gl.RGB });
                    this.depthbuffer = new GL.Texture(w, h, { format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_SHORT });
                    this.normaldepth_fbo = new GL.FBO([this.normalbuffer], this.depthbuffer);
                }

                this.normaldepth_fbo.bind();
                this.renderer.rendering_normaldepth = true;
                gl.clearColor(1, 1, 1, 1);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


                this.renderer.render(this.scene, this.camera, null, 0b11);


                this.renderer.rendering_normaldepth = false;
                this.normaldepth_fbo.unbind();
                //this.normalbuffer.toViewport();

                if (!this.ssao_fx)
                    this.ssao_fx = new FXSSAO();
                this.ssaobuffer = this.ssao_fx.applyFX(null, this.normalbuffer, this.depthbuffer, this.camera, this.ssaobuffer);
                //this.ssaobuffer.toViewport();

                if (this.ssaobuffer) {
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                    if (this.pixelated) {
                        this.ssaobuffer.bind(0);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    }
                    gl.disable(gl.DEPTH_TEST);
                    this.ssaobuffer.toViewport(gl.shaders["blend_ssao"]);
                    //gl.disable(gl.BLEND);
                    //this.ssaobuffer.toViewport();
                }
            }

        }

        const vel0 = [-20, 30, 1]
        const a = -10;
        //main update
        context.onupdate = (dt) => {
            //not necessary but just in case...
            this.scene.update(dt);

            // to change the camera mode
            if (gl.keys["C"]) {
                moveCam = !moveCam
            }

            //update users
            for (let username in this.currentRoom?.users) {
                var t = getTime();
                var anim = this.animations.idle;
                var time_factor = 1;

                const userNode = this.scene.getNodeById(username)
                const user = this.currentRoom.users[username];

                //update move with mouse
                let dist = vec3.distance([...user.get3DPosition()], [...user.get3DTarget()]);
                let offset = 4;

                if (dist > offset) {
                    userNode.moveLocal([0, 0, 1]);
                    //anim = this.animations.walking;
                    var pos = userNode.position;
                    var nearest = this.walkarea.adjustPosition(pos);
                    userNode.position = nearest.position;
                    user.update3Dposition(nearest.position);

                    if (nearest.isUpdated) {
                        user.set3DTarget(userNode.position)
                    }

                    //console.log("girl pos: " + girl_pivot.position + " target pos: " + this.myUser.target)
                    //console.log(dist)  
                }
                else {
                    user.set3DTarget(userNode.position)
                }


                //move bones in the skeleton based on animation
                anim.assignTime(t * 0.001 * time_factor);
                //copy the skeleton in the animation to the character
                this.character.skeleton.copyFrom(anim.skeleton);

            }


            /*
            // update tir parabolic
            const sdt = dt * 5;
            box.position[0] = box.position[0] + vel0[0] * sdt;
            box.position[1] = box.position[1] + vel0[1] * sdt + 1 / 2 * a * sdt * sdt;
            box.position[2] = box.position[2] + vel0[2] * sdt;
            vel0[1] = vel0[1] + a * sdt;
            box.position = [...box.position];
            */

            if (this.currentRoom && this.currentRoom.demo){
                const dynamic_object = this.currentRoom.demo.dynamic_object;
                if (dynamic_object.running){
                    const node = this.scene.getNodeById(dynamic_object.node.id);
                    node.position = dynamic_object.update(dt);
                }
                
            }
        }

        //user input ***********************

        context.onmouse = (e) => {
            //gizmo.onMouse(e);
        }

        //detect clicks
        context.onmouseup = (e) => {
            if (e.click_time < 200) //fast click
            {
                //compute collision with scene
                var ray = this.camera.getRay(e.canvasx, e.canvasy);
                // var node = this.scene.testRay(ray, null, 10000, 0b1000);


                if (ray.testPlane(RD.ZERO, RD.UP)) //collision with infinite plane
                {
                    console.log("floor position clicked", ray.collision_point);
                    // update target position of my user
                    const myNodeSceneUser = this.scene.getNodeById(this.myUser.username)
                    if (myNodeSceneUser){
                        myNodeSceneUser.orientTo(ray.collision_point, [0, 1, 0])
                    }
                    
                    this.myUser.set3DTarget(ray.collision_point)

                    //send new target to other users in the room
                    if (this.myUser) {
                        this._ws.sendTarget(this.myUser.target);
                    }
                }
            }
        }

        context.onmousemove = (e) => {
            if (e.dragging) {
                //orbit camera around
                this.camera.orbit(e.deltax * -0.01, RD.UP);
                //this.camera.position = vec3.scaleAndAdd( this.camera.position, this.camera.position, RD.UP, e.deltay );
                this.camera.move([-e.deltax * 0.1, e.deltay * 0.1, 0]);
                //girl_pivot.rotate(e.deltax*-0.003,[0,1,0]);

            }
        }

        context.onmousewheel = (e) => {
            //move camera forward
            this.camera.moveLocal([0, 0, e.wheel < 0 ? 10 : -10]);
        }

        //capture mouse events
        context.captureMouse(true);
        context.captureKeys();

        //launch loop
        context.animate();
    }


    /*
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

  */

    _initRooms = async () => {
        // create the rooms
        world.map(room => new Room(room)).forEach((room) => { this.rooms[room.id] = room; });
    };

    onMouse = (e) => {

        /*
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
        */

    };

    setLatestState = (roomId, username, position) => {

        console.log(`My client id: ${username}. Latest state: ${position} @ ${roomId}`)

        roomId = roomId ?? 0;

        this.currentRoom = this.rooms[roomId];

        position = position ? position : [0, 0];

        this._ws.joinRoom(roomId, position);

        this.myUser.setPosition(position);

        //this.camOffset = [-position[0], -position[1], 0];  // TODO update in 3D

        this.currentRoom.addUser(username, this.myUser);
        this.addUserToScene(this.myUser)
        //add room to the scene
        //this.addCurrentRoomToScene();
        //console.log(this.scene);
    };

    setOtherUserTarget = (srcUsername, targetPos) => {
        const user = this.currentRoom.users[srcUsername];
        user?.setTarget(targetPos);

        const userNode = this.scene.getNodeById(srcUsername)
        userNode.orientTo(user.get3DTarget(), [0, 1, 0])

    };


    onUserLeftRoom = (username) => this.currentRoom.removeUser(username);

    onUserJoinedRoom = (roomId, username, avatar, position) => {
        const newUser = new User(username, avatar);
        newUser.setPosition(position);
        this.currentRoom.addUser(username, newUser);
        this.addUserToScene(newUser)

        console.log(`User ${username} joined the room ${roomId}`)
    }

    initCurrentRoom = (roomId, users) => {
        if (roomId !== this.currentRoom.id) return;

        this.addCurrentRoomToScene();

        users.forEach(({ username, avatar, position }) => {
            this.currentRoom.addUser(username, new User(username, avatar, 0.3));
            const user = this.currentRoom.users[username];
            user.setPosition(position);   //TODO check
            this.addUserToScene(user)
        })

        const params = this.currentRoom.demo.dynamic_object.params
        for (const key in params) {
            this._experimentParamsController.loadParam({
                description: params[key].description,
                initialValue: params[key].value,
                id: key,
                minValue: null,  //TODO
                maxValue: null,  // TODO
                type: 'float'  //TODO
            })
        }

        console.log(this._experimentParamsController.isValid(), this._experimentParamsController.getValues())



    }

    addCurrentRoomToScene = () => {
        // create floor
        const floor = new RD.SceneNode({
            position: [0, 0, 0],
            scaling: this.currentRoom.scale,
            color: [0.95, 0.95, 0.95, 1],
            mesh: "planeXZ",
        });

        this.scene.root.addChild(floor);

        // Set walk area
        const walkarea = this.currentRoom.walkarea
        this.walkarea = new WalkArea();
        this.walkarea.addRect([-Math.round(walkarea[0] / 2), 0, -Math.round(walkarea[1] / 2)], walkarea[0], walkarea[1]);

        // create demo
        const demo = this.currentRoom.demo;
        var dynamic_object = new RD.SceneNode(demo.dynamic_object.node);
        this.scene.root.addChild(dynamic_object);

        demo.static_objects.forEach( (node) => {
            var static_objects = new RD.SceneNode(node);
            this.scene.root.addChild(static_objects);
        })

    }

    addUserToScene = (user) => {
        //create material for the girl
        var mat = new RD.Material({
            textures: {
                color: "girl/girl.png"
            }
        });
        mat.register("girl");

        //create pivot point for the girl
        var girl_pivot = new RD.SceneNode({
            position: [-40, 0, -40],
            id: user.username
        });

        //create a mesh for the girl
        var girl = new RD.SceneNode({
            scaling: this.myUser.avatar_scale,
            mesh: this.myUser.avatar + "/" + this.myUser.avatar + ".wbin",
            material: "girl"
        });

        girl_pivot.addChild(girl);
        girl.skeleton = new RD.Skeleton();
        this.scene.root.addChild(girl_pivot);

        var girl_selector = new RD.SceneNode({
            position: [0, 20, 0],
            mesh: "cube",
            material: "girl",
            scaling: [8, 20, 8],
            name: "girl_selector",
            layers: 0b1000
        });

        girl_pivot.addChild(girl_selector);


        this.character = girl;  //TODO animation
    }
}
