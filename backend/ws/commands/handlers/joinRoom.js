import { JOINED_ROOM_COMMAND, ROOM_SUMMARY_MESSAGE_TYPE, MESSAGE_COMMAND, LEFT_ROOM_COMMAND } from "../../../../frontend/clients/COMMAND.js";

const leaveRoom = ({ srcUsername, roomId, rooms, clients, userPositionCache }) => {
  if (roomId === undefined) throw new Error(`'roomId' undefined`);
  
  let room = rooms[roomId];
  if (room === undefined) return console.debug(`Trying to leave an undefined room ${roomId}, ignoring...`);
  if (!room.usernames.has(srcUsername)) return console.debug(`Trying to leave the room ${roomId} you are not part of, ignoring...`);
  
  room.usernames.delete(srcUsername);
  clients[srcUsername].roomId = null;
  userPositionCache.popPosition(srcUsername, roomId)

  room.usernames.forEach(otherClientInTheRoomId => {
      const destClientConnection = clients[otherClientInTheRoomId].connection;
      if (destClientConnection === undefined) return console.debug(`No connection for username: ${otherClientInTheRoomId}`);
      if (!destClientConnection.connected) return console.debug(`Connection for username not connected: ${otherClientInTheRoomId}`);
      destClientConnection.sendUTF(JSON.stringify({
          command: LEFT_ROOM_COMMAND,
          body: { username: srcUsername, roomId }, 
      }));
  });

  if (room.usernames.size === 0) delete rooms[roomId];
}

export const joinRoomCommandHandler = ({ srcUsername, body, rooms, clients, userPositionCache }) => {
  const { roomId, position } = body;
  if (roomId === undefined) throw new Error(`'roomId' undefined`);

  // leave current room
  const currentRoomId = clients[srcUsername].roomId;
  if (currentRoomId !== null && currentRoomId !== undefined){
    leaveRoom({ 
      roomId: currentRoomId, 
      srcUsername, rooms, clients, userPositionCache })
  }
  
  let room = rooms[roomId];
  if (room === undefined) {
    console.debug(`Trying to join an undefined room, creating new room with id ${roomId}`);
    room = {
      usernames: new Set()
    };
    rooms[roomId] = room;
  }

  userPositionCache.setPosition(srcUsername, roomId, position)

  // notify other members of the room
  {
    const { avatar } = clients[srcUsername]
    room.usernames.forEach(otherClientInTheRoomId => {
      const client = clients[otherClientInTheRoomId];
      if (client === undefined) return console.debug(`No client for username: ${otherClientInTheRoomId}`);
  
      const { connection, ...props } = client;
      if (!connection.connected) return console.debug(`Connection for username not connected: ${otherClientInTheRoomId}`);
      connection.sendUTF(JSON.stringify({
          command: JOINED_ROOM_COMMAND,
          body: { 
            username: srcUsername, 
            roomId,
            avatar,
            position
          }, 
        }));  
    });
  }
  
  // send room state to the new joiner
  {
    const { connection } = clients[srcUsername]
    connection.sendUTF(JSON.stringify({
      command: MESSAGE_COMMAND,
      body: { 
        message: {  // todo simplify
          type: ROOM_SUMMARY_MESSAGE_TYPE,
          content: {
            roomId,
            users: Array.from(room.usernames).map(username => ({
              username, 
              position: userPositionCache.getPosition(username, roomId),
              avatar: clients[username].avatar
            }))
          }
        }
      }, 
    }));  
  }

  room.usernames.add(srcUsername);
  clients[srcUsername].roomId = roomId;
}