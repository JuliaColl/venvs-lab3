import { ImagesCache } from './ImagesCache.js';

export class CanvasView {
    onMouse = null;
    scale = 2.5;

    constructor() {
        this._canvas = document.querySelector('canvas');

        // events
        this._canvas.addEventListener("mousedown", (e) => this.onMouse && this.onMouse(e));
        this._canvas.addEventListener("mousemove", (e) => this.onMouse && this.onMouse(e));
        this._canvas.addEventListener("mouseup", (e) => this.onMouse && this.onMouse(e));
        this.imagesCache = new ImagesCache();

    };


    getBoundingClientRect = () => this._canvas.getBoundingClientRect();
    getRoomImage = (url) => this.imagesCache.getImage(url);

    show = () => this._canvas.style.display = 'flex';
    hide = () => this._canvas.style.display = 'none';


    draw = (currentRoom, camOffset) => {
        // get full size canvas
        var parent = this._canvas.parentNode;
        var rect = parent.getBoundingClientRect();
        this._canvas.width = rect.width;
        this._canvas.height = rect.height;

        var ctx = this._canvas.getContext('2d');

        // clear rect
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        // bg
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

        // cursor
        ctx.save(); //save the coordinate system 
        ctx.translate(this._canvas.width / 2, this._canvas.height / 2);   // to center the cordinate system in the middlle of the screen
        ctx.scale(this.scale, this.scale);
        ctx.translate(camOffset[0], camOffset[1]);
        this.drawRoom(ctx, currentRoom);

        ctx.restore();
    };

    drawRoom = (ctx, currentRoom) => {
        if (currentRoom === null) return;
        var img = this.getRoomImage(currentRoom.url);

        ctx.drawImage(img, img.width / -2, img.height / -2);

        // draw users of the room
        Object.keys(currentRoom.users).forEach(username =>
            this.drawUser(ctx, currentRoom.users[username])
        )
    };

    drawUser = (ctx, user) => {

        var img = this.imagesCache.getImage("/data/images/players/Characters_MV.png");

        const animation = {
            idle: [1],
            walking: [0, 1, 2],
        };

        var anim = animation[user.animation];

        var area = [48, 96];

        var time = performance.now() * 0.001;
        var avatarOffset = 3 * user.avatarId;
        var frame = anim[Math.floor(time * 5) % anim.length] + avatarOffset;
        var facing = user.facing;

        var centerUser = [Math.floor(area[0] / 2), Math.floor(area[1] / 2) + 7];

        ctx.drawImage(img,
            frame * area[0] + 1, area[1] * facing + 1,  // source offset
            area[0] - 2, area[1], // source size
            user.position[0] - centerUser[0], user.position[1] - centerUser[1], // destination offset
            area[0] - 2, area[1]); // destination size


        //ctx.fillRect(user.position[0] - 2, user.position[1] - 2, 4, 4);  todo remove

        ctx.font = "bold 8px 'Roboto', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#121212";
        ctx.fillText(user.username + (user.tooFar ? ' 🔇' : ''), user.position[0], user.position[1] - centerUser[1] + 22);

    }

    // transform from your world coordinate system (0,0 is center) to canvas coordinate (0,0 is top left)
    worldToCanvas = (pos) => {
        return [
            pos[0] + canvas.width / 2,
            pos[1] + canvas.height / 2
        ];
    }

    // transform from canvas coordinates (0,0 is top-left) to your own offset world coordinates
    canvasToWorld = (pos, cam_offset) => {
        var posX = (pos[0] - this._canvas.width / 2) / this.scale - cam_offset[0];
        var posY = (pos[1] - this._canvas.height / 2) / this.scale - cam_offset[1];
        return [posX, posY];
    };

    getMaxOffset = (roomWidth, roomHeight) => {
        var maxX = -this._canvas.width / (2 * this.scale) + roomWidth / 2;
        var maxY = -this._canvas.height / (2 * this.scale) + roomHeight / 2;
        return [maxX, maxY];
    };

    getMinOffset = (roomWidth, roomHeight) => {
        var minX = this._canvas.width / (2 * this.scale) - roomWidth / 2;
        var minY = this._canvas.height / (2 * this.scale) - roomHeight / 2;
        return [minX, minY];

    }

}