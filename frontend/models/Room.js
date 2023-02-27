import {clamp} from '../utils.js';

export class Room {
    id = -1;
    name = null;
    users = {};
    walkableSize = null;
    center = [0,0];
    url = null;
    exits = [];

    constructor({id, name, walkableSize, center, url, exits}) {
        this.id = id;
        this.name = name;
        this.walkableSize = walkableSize;
        this.center = center;
        this.url = url;
        this.exits = exits;
    }

    addUser(id, user) {
        this.users[id] = user;
    }

    removeUser(id){
        delete (this.users[id]);
    }

    removeAllUsers(){
        this.users = {}
    }

    clampToRoom(worldPos){
        return [
            clamp(worldPos[0], this.center[0]-this.walkableSize[0]/2, this.center[0]+this.walkableSize[0]/2),
            clamp(worldPos[1], this.center[1]-this.walkableSize[1]/2, this.center[1]+this.walkableSize[1]/2)
        ];        
    }

    getExit(position){

        for (var i = 0; i < this.exits.length; i++) {
            var exit = this.exits[i];
            var maxX = exit.position[0] + exit.size[0]/2;
            var minX = exit.position[0] - exit.size[0]/2;

            var maxY = exit.position[1] + exit.size[1]/2;
            var minY = exit.position[1] - exit.size[1]/2;

            if(position[0] < maxX && position[0] > minX && position[1] < maxY && position[1] > minY){
                return exit;
            }
        }
        return null;

    }   
}

