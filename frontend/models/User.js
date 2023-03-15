import FACING from '../FACING.js';

export class User {

    username = null;

    position = [0, 0];
    target = [0, 0];  

    avatar = "girl";
    avatar_scale = 0.3;

    // = FACING.FACING_FRONT;
    //animation = 'idle';

    currentRoom = null;

    tooFar = false;

    constructor(username, avatar, avatar_scale) {
        this.username = username;
        this.avatar = avatar;
        this.avatar_scale = avatar_scale;
    }
    
    setTarget(position){
        this.target = [position[0], position[1]];
    }

    getTarget(){
        return [...this.target]
    }

    setPosition(position){
        this.position = [position[0], position[1]]
        this.setTarget(this.position)
    }

    getPosition(){
        return [...this.position]
    }

    set3DTarget(position){  //recives a 3d position but we only store the x and z component
        this.target = [position[0], position[2]]; 
    }

    get3DTarget(){
        return [this.target[0], 0, this.target[1]]
    }
 
    set3DPosition(position){   //recives a 3d position but we only store the x and z component
        this.position = [position[0], position[2]] 
        this.set3DTarget(position)
    }

    get3DPosition(){  
        return [this.position[0], 0, this.position[1]]
    }

    update3Dposition(position){
        this.position = [position[0], position[2]] 
    }

    updatePos(dt) {
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
            let dist = vec3.distance([...this.position], [...this.target]);
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
                girl_pivot.position = nearest.position;

                if(nearest.isUpdated){
                    this.myUser.target = [...girl_pivot.position]
                }

                //console.log("girl pos: " + girl_pivot.position + " target pos: " + this.myUser.target)
                //console.log(dist)  
            }
            else{
                this.myUser.target = [...girl_pivot.position]
            }
        
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