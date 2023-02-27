export default class UserPositionCache {
    rooms = null;

    constructor() {
        this.rooms = {}
    }

    setPosition(username, roomId, position){
        if (!this.rooms[roomId]) this.rooms[roomId] = {};
        this.rooms[roomId][username] = {
            position
        }
    }

    getPosition(username, roomId){
        const room = this.rooms[roomId];
        if (!room) return null;

        const user = room[username];
        if (!user) return null;

        return user.position;
    }

    popPosition(username, roomId){
        const room = this.rooms[roomId];
        if (!room) return;

        delete room[username]
    }
}
