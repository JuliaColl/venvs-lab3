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

var moveCam = false;

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
            //this.myUser.setPosition(exit.spawnPos);  TODO

            this._leaveRoomOverlayView.hide();

        }
        this._leaveRoomOverlayView.onDismiss = () => {
            this._leaveRoomOverlayView.hide();
            this._hasLeaveRoomDialogBeenDismissed = true;
        }

        this._experimentParamsController = new ExperimentParamsController();
        this._experimentParamsController.loadParams([
            {
                description: 'Acceleration (m/&sup2;)',
                initialValue: 9.98,
                id: 'a',
                minValue: 0,
                maxValue: null,
                type: 'float'
            },
            {
                description: 'Mass (kg)',
                initialValue: 2,
                id: 'm',
                minValue: 0,
                maxValue: 10,
                type: 'float'
            },
            {
                description: 'Initial velocity (v/s)',
                initialValue: 20,
                id: 'v0',
                minValue: null,
                maxValue: null,
                type: 'float'
            }
        ]);
        console.log(this._experimentParamsController.isValid(), this._experimentParamsController.getValues())

        this._canvasView = new CanvasView();
        this._canvasView.onMouse = this.onMouse;
        this._initRooms();

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                if (!this.currentRoom) return;
                for (let username in this.currentRoom.users) {
                    const user = this.currentRoom.users[username];
                    user.setPosition(user.getTarget()); // TODO
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

        //this.loop();


        //create the rendering context
        var context = GL.create({canvas: document.getElementById("canvas")});

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
        var bg_color = [1,1,1, 1];
        //var avatar = "girl";
        //var avatar_scale = 0.3;
        //var avatar = "tiger";
        //var avatar_scale = 1.5;

        //create material for the girl
        var mat = new RD.Material({
            textures: {
                color: "girl/girl.png"
            }
        });
        mat.register("girl");

        //create pivot point for the girl
        var girl_pivot = new RD.SceneNode({
            position: [-40, 0, -40]
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


        this.character = girl;

        //load some animations
        const loadAnimation = (name, url) => {
            var anim = this.animations[name] = new RD.SkeletalAnimation();
            anim.load(url);
            return anim;
        }
        loadAnimation("idle", "data/" + this.myUser.avatar + "/idle.skanim");
        loadAnimation("walking", "data/" + this.myUser.avatar + "/walking.skanim");
        //loadAnimation("dance","data/girl/dance.skanim");

        //load a GLTF for the room
        var room = new RD.SceneNode({ scaling: 40, position: [0, -.01, 0] });
        room.loadGLTF("data/room.gltf");
        //this.scene.root.addChild(room);

        var gizmo = new RD.Gizmo();
        gizmo.mode = RD.Gizmo.ALL;

        /*
        // create floor
        var floor = new RD.SceneNode({
            position: [0,0,0],
            scaling: 400,
            color: [0.95,0.95,0.95,1],
            mesh: "planeXZ",
        });
        this.scene.root.addChild( floor );

        this.walkarea = new WalkArea();
        this.walkarea.addRect([-200,0,-200], 400, 400);
        */

        //create sphere
        var box = new RD.SceneNode();
        box.position = [0,10,0]
        box.color = [1,0,0,1]
        box.mesh = "cube";
        //box.shader = "phong";
        box.scale([10,10,10])
        this.scene.root.addChild(box);


        // to check todo remove
        this.myUser.position = [...girl_pivot.position];
        this.myUser.target = [...girl_pivot.position];


        // main loop ***********************

        //main draw function
        context.ondraw = () => {
            gl.canvas.width = document.body.offsetWidth;
            gl.canvas.height = document.body.offsetHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            var girlpos = girl_pivot.localToGlobal([0, 40, 0]);
            var campos = girl_pivot.localToGlobal([0,60,-70]);
            var camtarget = girl_pivot.localToGlobal([0, 10, 70]);
            var smoothtarget = vec3.lerp(vec3.create(), this.camera.target, camtarget, 0.1);

            this.camera.perspective(60, gl.canvas.width / gl.canvas.height, 0.1, 1000);
            if (moveCam){
                this.camera.lookAt(this.camera.position, this.camera.target, [0, 1, 0]);
            }else{
                this.camera.lookAt([0,65,0], girlpos, [0, 1, 0]);
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
            if (this.useSsao){
                var w = gl.canvas.width;
                var h = gl.canvas.height;
                if(!this.normaldepth_fbo || this.normalbuffer.width != w || this.normalbuffer.height != h )
                {
                    this.normalbuffer = new GL.Texture( w,h, { format: gl.RGB } );
                    this.depthbuffer = new GL.Texture( w,h, { format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_SHORT } );
                    this.normaldepth_fbo = new GL.FBO([this.normalbuffer], this.depthbuffer);
                }
    
                this.normaldepth_fbo.bind();
                this.renderer.rendering_normaldepth = true;
                gl.clearColor(1,1,1,1);
                gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
                
                
                this.renderer.render(this.scene, this.camera, null, 0b11);
    
    
                this.renderer.rendering_normaldepth = false;
                this.normaldepth_fbo.unbind();
                //this.normalbuffer.toViewport();
            
                if(!this.ssao_fx)
                    this.ssao_fx = new FXSSAO();
                this.ssaobuffer = this.ssao_fx.applyFX( null, this.normalbuffer, this.depthbuffer, this.camera, this.ssaobuffer );
                //this.ssaobuffer.toViewport();
                
                if(this.ssaobuffer)
                {
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
                    if(this.pixelated)
                    {
                        this.ssaobuffer.bind(0);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    }
                    gl.disable( gl.DEPTH_TEST );
                    this.ssaobuffer.toViewport( gl.shaders["blend_ssao"] );
                    //gl.disable(gl.BLEND);
                    //this.ssaobuffer.toViewport();
                }
            }
            
        }

        const vel0 = [-20,30,1]
        const a = -10;
        //main update
        context.onupdate = (dt) => {
            //not necessary but just in case...
            this.scene.update(dt);
            
            // to change the camera mode
            if (gl.keys["C"]) {
                moveCam = !moveCam
            }


            //update user
            var t = getTime();
            var anim = this.animations.idle;
            var time_factor = 1;

            //this.myUser.updatePos(dt);
            /*
            //control with keys
            if (gl.keys["UP"]) {
                girl_pivot.moveLocal([0, 0, 1]);
                anim = this.animations.walking;
            }
            else if (gl.keys["DOWN"]) {
                girl_pivot.moveLocal([0, 0, -1]);
                anim = this.animations.walking;
                time_factor = -1;
            }
            if (gl.keys["LEFT"])
                girl_pivot.rotate(90 * DEG2RAD * dt, [0, 1, 0]);
            else if (gl.keys["RIGHT"])
                girl_pivot.rotate(-90 * DEG2RAD * dt, [0, 1, 0]);


            var pos = girl_pivot.position;
            var nearest = this.walkarea.adjustPosition(pos);
            girl_pivot.position = nearest.position;
            */

            
            
            //update move with mouse
            let dist = vec3.distance([...girl_pivot.position], [...this.myUser.target]);
            let offset = 4;
            //console.log(dist)
            if(dist > offset)
            {
                //console.log("entered with target: " + this.myUser.target)
                //girl_pivot.orientTo(this.myUser.target, [0,1,0])
                girl_pivot.moveLocal([0, 0, 1]);
                anim = this.animations.walking;
                var pos = girl_pivot.position;
                var nearest = this.walkarea.adjustPosition(pos);
                this.myUser.position = girl_pivot.position = nearest.position;

                if(nearest.isUpdated){
                    this.myUser.target = [...girl_pivot.position]
                }

                //console.log("girl pos: " + girl_pivot.position + " target pos: " + this.myUser.target)
                //console.log(dist)  
            }
            else{
                this.myUser.target = [...girl_pivot.position]
            }


            //move bones in the skeleton based on animation
            anim.assignTime(t * 0.001 * time_factor);
            //copy the skeleton in the animation to the character
            this.character.skeleton.copyFrom(anim.skeleton);

            // update tir parabolic
            const sdt = dt * 5;
            box.position[0] = box.position[0] + vel0[0] * sdt;
            box.position[1] = box.position[1] + vel0[1] * sdt + 1/2 * a * sdt*sdt;
            box.position[2] = box.position[2] + vel0[2] * sdt;
            vel0[1] = vel0[1] + a * sdt;
            box.position = [...box.position];

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
                
                
                if( ray.testPlane( RD.ZERO, RD.UP ) ) //collision with infinite plane
                {
                    console.log( "floor position clicked", ray.collision_point );
                    girl_pivot.orientTo(ray.collision_point, [0,1,0])
				    //girl_pivot.lookAt(ray.collision_point, [0,1,0])
                    this.myUser.target = [...ray.collision_point];
                    //girl_pivot.position = [...ray.collision_point];
                }
            }
        }

        context.onmousemove = (e) => {
            if (e.dragging) {
                //orbit camera around
                this.camera.orbit( e.deltax * -0.01, RD.UP );
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

        position = position ? position : [0, 0, 0];

        this._ws.joinRoom(roomId, position);


        //this.myUser.setPosition(position);  //TODO

        this.camOffset = [-position[0], -position[1], 0];  // TODO update in 3D
        this.currentRoom.addUser(username, this.myUser);

        //add room to the scene
        addCurrentRoomToScene();
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
            //user.setPosition(position);   TODO
        })
    }

    addCurrentRoomToScene = () => {
        // create floor
        const floor = new RD.SceneNode({
            position: [0,0,0],
            scaling: this.currentRoom.scale,
            color: [0.95,0.95,0.95,1],
            mesh: "planeXZ",
        });

        this.scene.root.addChild( floor );
        
        const walkarea = this.currentRoom.walkarea
        this.walkarea = new WalkArea();
        this.walkarea.addRect([-Math.round(walkarea[0]/2),0,-Math.round(walkarea[1]/2)], walkarea[0], walkarea[1]);

    }
}
