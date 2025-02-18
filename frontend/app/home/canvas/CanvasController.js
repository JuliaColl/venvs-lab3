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
import { RunExperimentOverlayView } from "./runExperimentOverlayView.js";
import { MeasuringTapeOverlayView } from "./MeasuringTapeOverlayView.js";
import { CheckExperimentOverlayView } from "./CheckExperimentOverlayView.js";

export class CanvasController {
    messageInputOverlayController = null;
    chatOverlayController = null;
    audioOverlayController = null;

    currentRoom = null;
    myUser = null;

    last = performance.now();
    rooms = {};

    _hasLeaveRoomDialogBeenDismissed = false;

    scene = null;
    renderer = null;
    camera = null;
    animations = {};

    walkarea = null;

    zoom = 0;

    _isMeasuring = false;
    _measureStartPosition = null;
    _MEASURE_PRECISION = 100;

    constructor() {
        this._leaveRoomOverlayView = new LeaveRoomOverlayView();
        this._leaveRoomOverlayView.onYes = () => {
            if (!this.currentRoom) return;

            this._isMeasuring = false;

            const exit = this.currentRoom.getExit(this.myUser.position);
            if (!exit) {  // should never happen
                this._hasLeaveRoomDialogBeenDismissed = true;
                this._leaveRoomOverlayView.hide();
                return;
            }

            this._hasLeaveRoomDialogBeenDismissed = false;

            this.scene.clear();
            this._experimentParamsController.clearParams();

            this._ws.joinRoom(exit.toRoomId, exit.spawnPos);
            this.myUser.setPosition(exit.spawnPos);

            this.myUser.currentRoom = exit.toRoomId;
            this.currentRoom = this.rooms[exit.toRoomId];
            this.currentRoom.removeAllUsers();
            this.currentRoom.addUser(this.myUser.username, this.myUser);
            this.addUserToScene(this.myUser);


            this._leaveRoomOverlayView.hide();

        }
        this._leaveRoomOverlayView.onDismiss = () => {
            this._leaveRoomOverlayView.hide();
            this._hasLeaveRoomDialogBeenDismissed = true;
        }

        this._experimentParamsController = new ExperimentParamsController();
        this._experimentParamsController.onValue = (id, value) => this._ws.sendParams(id, value)

        this._canvasView = new CanvasView();
        this._canvasView.onMouse = this.onMouse;
        this._initRooms();

        this._runView = new RunExperimentOverlayView();
        this._runView.onRun = () => {
            if (this._experimentParamsController.isValid()) {
                this._ws?.runExperiment();
                this.doRunExperiment();
            }
        }
        this._runView.onReset = () => {

            this._ws?.resetExperiment();
            this.doResetExperiment();
        }

        this._measuringView = new MeasuringTapeOverlayView();
        this._measuringView.onStartMeasure = () => {
            this._isMeasuring = true;
            this._measureStartPosition = null;
        }
        this._measuringView.onStopMeasure = () => {
            this._isMeasuring = false;
        }

        this._checkExperimentView = new CheckExperimentOverlayView();

    };

    doRunExperiment = () => {
            const values = this._experimentParamsController.getValues()
            const demo = this.currentRoom.demo;
            demo.setParams(values);
            demo.reset()
            demo.start()

            if(demo.isCorrect()){
                this._checkExperimentView.viewCorrectExperiment();
            }
    };

    doResetExperiment = () => {this.currentRoom.demo.reset()};

    show = () => {
        this._canvasView.show();
        this._experimentParamsController.show();
        this._runView.show();
        this._measuringView.show();
    }
    hide = () => {
        this._canvasView.hide();
        this._leaveRoomOverlayView.hide();
        this._experimentParamsController.hide();
        this._runView.hide();
        this._measuringView.hide();
        this._checkExperimentView.hide();
    }

    useSsao = false;

    onLogin = ({ username, avatar }, token) => {

        //this.myUser = new User(username, avatar, avatar_scale);   //TODO set avatar and avatar_scale from backend
        this.myUser = new User(username, avatar, 0.3);

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
            this._ws.onRun = this.doRunExperiment;
            this._ws.onResetExperiment = this.doResetExperiment;
            this._ws.onParamUpdated = ({ id, value }) => this._experimentParamsController.setValue(id, value)
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

        //load some animations
        const loadAnimation = (name, url) => {
            var anim = this.animations[name] = new RD.SkeletalAnimation();
            anim.load(url);
            return anim;
        }
        loadAnimation("idle", "data/girl/idle.skanim");
        loadAnimation("walking", "data/girl/walking.skanim");

        // main loop ***********************

        //main draw function
        context.ondraw = () => {
            gl.canvas.width = document.body.offsetWidth;
            gl.canvas.height = document.body.offsetHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            const myNodeSceneUser = this.scene.getNodeById(this.myUser.username)
            if (myNodeSceneUser) {
                var girlpos = myNodeSceneUser.localToGlobal([0, 40, 0]);
                var campos = myNodeSceneUser.localToGlobal([0, 60, -70]);
                var camtarget = myNodeSceneUser.localToGlobal([0, 10, 70]);
                var smoothtarget = vec3.lerp(vec3.create(), this.camera.target, camtarget, 0.1);

                this.camera.perspective(60, gl.canvas.width / gl.canvas.height, 0.1, 1000);
                const initialPosition = [0, 70, 200];
                this.camera.lookAt(initialPosition, girlpos, [0, 1, 0]);
                this.camera.moveLocal([0, 0, this.zoom]);
            }


            //clear
            this.renderer.clear(bg_color);
            //render scene
            this.renderer.render(this.scene, this.camera, null, 0b11);

            //draw measure
            if (this._isMeasuring) {
                let x = this._measureStartPosition[0];
                let z = this._measureStartPosition[2];
                let x2 = myNodeSceneUser.position[0];
                let z2 = myNodeSceneUser.position[2];
                this.renderer.renderPoints(new Float32Array([x,0,z, x2,0,z2]), null, this.camera, null, null, null, gl.LINES, vec4.fromValues(0,0,0,1));
            }

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

        //main update
        context.onupdate = (dt) => {
            if (!this.currentRoom) return;

            //not necessary but just in case...
            this.scene.update(dt);

            //update users
            for (let username in this.currentRoom.users) {
                var t = getTime();
                var time_factor = 1;

                const userNode = this.scene.getNodeById(username)
                const user = this.currentRoom.users[username];

                var anim = this.animations.idle;

                if (!userNode) {
                    console.log(`user @${username} is not added to the scene!!!`)
                    continue;
                }

                //update move with mouse
                let dist = vec3.distance([...user.get3DPosition()], [...user.get3DTarget()]);
                let offset = 4;

                if (dist > offset) {
                    userNode.moveLocal([0, 0, 1]);
                    anim = this.animations.walking;
                    var pos = userNode.position;
                    var nearest = this.walkarea.adjustPosition(pos);
                    userNode.position = nearest.position;
                    user.update3Dposition(nearest.position);

                    if (nearest.isUpdated) {
                        user.set3DTarget(userNode.position)
                    }

                    if (this._isMeasuring) {
                        let distance = 0;
                        if (this._measureStartPosition == null) {
                            this._measureStartPosition = [...userNode.position];
                        } else {
                            distance = Math.round(Math.sqrt(
                                Math.pow(userNode.position[0] - this._measureStartPosition[0], 2)
                                +
                                Math.pow(userNode.position[2] - this._measureStartPosition[2], 2)
                            ) * this._MEASURE_PRECISION) / this._MEASURE_PRECISION
                                ;
                        }
                        this._measuringView.setMeasure(`${distance}u`);
                    }
                }
                else {
                    user.set3DTarget(userNode.position)
                }


                //move bones in the skeleton based on animation
                anim.assignTime(t * 0.001 * time_factor);
                //copy the skeleton in the animation to the character
                var character = this.scene.getNodeById(user.username + "_character")
                character.skeleton.copyFrom(anim.skeleton);

            }


            if (this.currentRoom.demo) {
                const demo = this.currentRoom.demo;
                demo.update(dt);
                demo.stop();
                
                
                demo.dynamic_objects.forEach((dynamic_object) => {
                    const node = this.scene.getNodeById(dynamic_object.node.id);
                    node.position = dynamic_object.node.position;

                })

            }

            // check exit
            const exit = this.currentRoom.getExit(this.myUser.getPosition());
            if (!exit) {
                this._leaveRoomOverlayView.hide();
                this._hasLeaveRoomDialogBeenDismissed = false;
                return;
            };
            if (this._hasLeaveRoomDialogBeenDismissed) return;
            this._leaveRoomOverlayView.show();
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
                    console.log(ray.collision_point);
                    // update target position of my user
                    const myNodeSceneUser = this.scene.getNodeById(this.myUser.username)
                    if (myNodeSceneUser) {
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
            this.zoom = this.zoom + (e.wheel < 0 ? 10 : -10);
        }

        //capture mouse events
        context.captureMouse(true);
        context.captureKeys();

        //launch loop
        context.animate();
    }

    _initRooms = async () => {
        // create the rooms
        world.map(room => new Room(room)).forEach((room) => { this.rooms[room.id] = room; });
    };

    setLatestState = (roomId, username, position) => {
        console.log(`My client id: ${username}. Latest state: ${position} @ ${roomId}`)
        roomId = roomId ?? 0;
        this.currentRoom = this.rooms[roomId];
        position = position ? position : [0, 0];
        this._ws.joinRoom(roomId, position);
        this.myUser.setPosition(position);
        this.currentRoom.addUser(username, this.myUser);
        this.addUserToScene(this.myUser)
    };

    setOtherUserTarget = (srcUsername, targetPos) => {
        const user = this.currentRoom.users[srcUsername];
        user?.setTarget(targetPos);

        const userNode = this.scene.getNodeById(srcUsername)
        userNode.orientTo(user.get3DTarget(), [0, 1, 0])

    };


    onUserLeftRoom = ((username) => {
        this.currentRoom.removeUser(username);

        const userNode = this.scene.getNodeById(username);
        userNode.remove();
    });

    onUserJoinedRoom = (roomId, username, avatar, position) => {
        const newUser = new User(username, avatar, 0.3);
        console.log("position", position)
        newUser.setPosition(position);
        this.currentRoom.addUser(username, newUser);
        this.addUserToScene(newUser)

        console.log(`User ${username} joined the room ${roomId}`)

        const params = this._experimentParamsController.getValues();
        Object.keys(params).forEach(paramId => {
            this._ws.sendParams(paramId, params[paramId])
        })
        
    }

    initCurrentRoom = (roomId, users) => {
        if (roomId !== this.currentRoom.id) return;

        this.addCurrentRoomToScene();

        users.forEach(({ username, avatar, position }) => {
            this.currentRoom.addUser(username, new User(username, avatar, 0.3));  //todo add avatar 
            const user = this.currentRoom.users[username];
            user.setPosition(position);   //TODO check
            this.addUserToScene(user)
        })

        const params = this.currentRoom.demo.params
        if (params) {
            this._experimentParamsController.show();
            this._runView.show();
            this._measuringView.show();
            this._experimentParamsController.loadParams(Object.values(params))
        } else {
            this._experimentParamsController.hide();
            this._runView.hide();
            this._measuringView.hide();
        }

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

        demo.materials.forEach(({ path, name }) => {
            var mat = new RD.Material({
                textures: {
                    color: path
                }
            });
            mat.register(name);

        })

        demo.dynamic_objects.forEach((object) => {
            var dynamic_object = new RD.SceneNode(object.node);
            if (object.node.rotation) {
                dynamic_object.rotate(object.node.rotation * DEG2RAD, RD.UP)
            }
            if (object.node.gltf) {
                dynamic_object.loadGLTF(object.node.gltf);
            }
            this.scene.root.addChild(dynamic_object);
        })

        demo.static_objects.forEach(({ rotation, gltf, ...node }) => {
            var static_object = new RD.SceneNode(node);
            if (rotation) {
                static_object.rotate(rotation * DEG2RAD, RD.UP)
            }
            if (gltf) {
                static_object.loadGLTF(gltf);
            }
            this.scene.root.addChild(static_object);
        })

    }

    addUserToScene = (user) => {
        //create material for the girl
        var mat = new RD.Material({
            textures: {
                color: `girl/${user.avatar}.png`
            }
        });
        mat.register(`girl/${user.avatar}.png`);

        //create pivot point for the girl
        var girl_pivot = new RD.SceneNode({
            position: user.get3DPosition(),
            id: user.username
        });

        //create a mesh for the girl
        var girl = new RD.SceneNode({
            scaling: user.avatar_scale,
            mesh: "girl/girl.wbin",
            material: `girl/${user.avatar}.png`,
            id: user.username + "_character"
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
    }

}
