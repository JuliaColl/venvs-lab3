import { clamp } from '../utils.js';

export class Room {
    id = -1;
    name = null;
    users = {};
    walkarea = [0, 0];
    //floor = null;
    scale = 0;
    //url = null;
    exits = [];
    demo = null;

    constructor({ id, name, scale, walkarea, exits, demo }) {
        this.id = id;
        this.name = name;
        this.exits = exits;
        this.scale = scale
        this.walkarea = walkarea
        this.demo = demo;

        
        var funcBodyUpdate = demo.dynamic_object.update.match(/function[^{]+\{([\s\S]*)\}$/)[1];
        demo.dynamic_object.update = new Function(['dt'], funcBodyUpdate);

        var funcBodyRestart = demo.dynamic_object.restart.match(/function[^{]+\{([\s\S]*)\}$/)[1];
        demo.dynamic_object.restart = new Function([], funcBodyRestart);
        
        var funcBodysetParams = demo.dynamic_object.setParams.match(/function[^{]+\{([\s\S]*)\}$/)[1];
        demo.dynamic_object.setParams = new Function(['params'], funcBodysetParams);
        
        


        /*
        this.demo.dynamic_object.update = function (dt){
            const sdt = dt * 5;
            this.node.position[0] = this.node.position[0] + this.velocity[0] * sdt;
            this.node.position[1] = this.node.position[1] + this.velocity[1] * sdt + 1 / 2 * this.params.a.value * sdt * sdt;
            this.node.position[2] = this.node.position[2] + this.velocity[2] * sdt;
            this.velocity[1] = this.velocity[1] + this.params.a.value * sdt;
            this.node.position = [...this.node.position];

            if (this.node.position[1] < -10){
                this.restart()
            }

            return this.node.position;
        }
        

        
        this.demo.dynamic_object.restart = function (){
                this.node.position = [...this.position];
                this.velocity = [this.params.v0.value*Math.cos(this.params.alpha), this.params.v0.value*Math.sin(this.params.alpha), 0];
        }
        

        this.demo.dynamic_object.setParams = function (params){
            this.params.a.value = params.a;
            this.params.v0.value = params.v0;
            this.params.alpha = params.alpha;
            this.restart();
        }
        */
    }

    addUser(id, user) {
        this.users[id] = user;
    }

    removeUser(id) {
        delete (this.users[id]);
    }

    removeAllUsers() {
        this.users = {}
    }

    clampToRoom(worldPos) {
        return [
            clamp(worldPos[0], this.center[0] - this.walkableSize[0] / 2, this.center[0] + this.walkableSize[0] / 2),
            clamp(worldPos[1], this.center[1] - this.walkableSize[1] / 2, this.center[1] + this.walkableSize[1] / 2)
        ];
    }

    getExit(position) {

        for (var i = 0; i < this.exits.length; i++) {
            var exit = this.exits[i];
            var maxX = exit.position[0] + exit.size[0] / 2;
            var minX = exit.position[0] - exit.size[0] / 2;

            var maxY = exit.position[1] + exit.size[1] / 2;
            var minY = exit.position[1] - exit.size[1] / 2;

            if (position[0] < maxX && position[0] > minX && position[1] < maxY && position[1] > minY) {
                return exit;
            }
        }
        return null;

    }
}
