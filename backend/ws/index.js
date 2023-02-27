import { WebSocketServerWrapper } from './WebSocketServerWrapper.js';
import { commandHandlerFactory } from './commands/commandHandlerFactory.js';
import { LATEST_STATE_COMMAND, LEFT_ROOM_COMMAND } from '../../frontend/clients/COMMAND.js';
import { getUser, updateLastPositionUser } from '../database/users.js';

export default (httpServer, db, authenticator, userPositionCache) => {
    const clients = {}
    const rooms = {}

    const wss = new WebSocketServerWrapper(httpServer, (req) => {
        const [isValid, username] = authenticator.isTokenValid(req.resourceURL.query.token);
        if (!isValid) return false;
        if (clients[username] !== undefined){
            console.log("same user can't have 2 connections at the same time");
            return false;  // same user can't have 2 connections at the same time

        }
        return true;
    });

    wss.onNewConnection = async (connection, token) => {
        const username = authenticator.getUsername(token)

        if(clients[username] !== undefined) throw new Error("can't accept two connections for the same user")
        
        let { avatar, lastPosition, lastRoom } = await getUser(db, username)
        
        clients[username] = {
            connection,
            avatar,
            roomId: lastRoom  // todo it is correct ot pot here the lastRoom?
        };
        lastPosition = lastPosition ? lastPosition : [0,0];
        lastRoom = lastRoom ? lastRoom : 0;
        console.log(`[${(new Date()).toISOString()}] Client ${username} accepted (avatar=${avatar}) (latest state = [${lastPosition[0]}, ${lastPosition[1]}] @ ${lastRoom})`);
        

        connection.sendUTF(JSON.stringify({
            command:  LATEST_STATE_COMMAND,
            body: {
                username,
                position: lastPosition,
                roomId: lastRoom
            }
        }));

        return username;  // connection identifier
    };

    wss.onMessage = (username, message) => {
        if (message.type !== 'utf8') throw new Error(`Received unsupported message type: ${message.type}`);

        const { command, body } = JSON.parse(message.utf8Data);
        const commandHandler = commandHandlerFactory[command];
        try {
            if (commandHandler === undefined) throw new Error(`Command handler undefined for command ${command}`);
            commandHandler({ body, srcUsername: username, rooms, clients, userPositionCache });
            // console.debug(JSON.stringify(body))
        } catch (e) {
            console.error(`[${command}] Error while running command handler: ${e}`);
            if (process.env.ENV === 'dev') throw e;
        }
    }

    wss.onClose = (username, reasonCode, description) => {
        const roomId = clients[username].roomId
        if (roomId !== null){  // cleanup
            const lastPosition = userPositionCache.getPosition(username, roomId);
            console.log("storing postion: " + lastPosition + " at room " + roomId + " of user " + username);
            updateLastPositionUser(db, username, lastPosition, roomId);

            userPositionCache.popPosition(username, roomId)

            delete clients[username]
            
            const room = rooms[roomId];
            room.usernames.delete(username);
            room.usernames.forEach(otherClientInTheRoomId => {  // todo reuse function
                const destClientConnection = clients[otherClientInTheRoomId].connection;
                if (destClientConnection === undefined) return console.debug(`No connection for username: ${otherClientInTheRoomId}`);
                if (!destClientConnection.connected) return console.debug(`Connection for username not connected: ${otherClientInTheRoomId}`);
                destClientConnection.sendUTF(JSON.stringify({
                    command: LEFT_ROOM_COMMAND,
                    body: { username: username, roomId }, 
                }));
            });
    
            if (room.usernames.size === 0) delete rooms[roomId];
        }

        console.log(`[${(new Date()).toISOString()}] Client ${username} disconnected`);
    }
}