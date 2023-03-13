import FACING from '../FACING.js';

export class User {

    username = null;

    position = [0, 0, 0];
    target = [0, 0, 0];

    avatar = "girl";
    avatar_scale = 0.3;

    facing = FACING.FACING_FRONT;
    animation = 'idle';

    currentRoom = null;

    tooFar = false;

    constructor(username, avatar, avatar_scale) {
        this.username = username;
        this.avatar = avatar;
        this.avatar_scale = avatar_scale;
    }

    setTarget(position){
        this.target = [position[0], position[1], 0];  //TODO
    }

    getTarget(){
        return [...this.target]
    }

    setPosition(position){
        this.position = [position[0], position[1], 0]   //TODO
        this.setTarget(this.position)
    }

    getPosition(){
        return [...this.position]
    }

    updatePos(dt) {
        const diffX = this.target[0] - this.position[0];
        const diffY = this.target[1] - this.position[1];
        const maxDelta = 100;
        const offset = 5

        const deltaX = diffX > 0? maxDelta: diffX < 0? -maxDelta: 0;
        const deltaY = diffY > 0? maxDelta: diffY < 0? -maxDelta: 0;

        if (Math.abs(diffX) < offset) {
            this.position[0] = this.target[0];
        } else {
            this.position[0] += deltaX * dt;
        }
        
        if (Math.abs(diffY) < offset) {
            this.position[1] = this.target[1];
        } else {
            this.position[1] += deltaY * dt;
        }

        this.updateAnimation(deltaX, deltaY);

        
    }

    updateAnimation(deltaX, deltaY) {
        if (deltaX == 0 && deltaY == 0) {
            return this.animation = 'idle';
        }

        this.animation = 'walking'
        if (deltaX > 0) {
            return this.facing = FACING.FACING_RIGTH;
        }
        if( deltaX < 0){
            return this.facing = FACING.FACING_LEFT;
        }
        if(deltaY > 0){
            return this.facing = FACING.FACING_FRONT;
        }
        if(deltaY < 0){
            return this.facing = FACING.FACING_BACK;
        }
    }
}