import { MESSAGE_COMMAND, TARGET_MESSAGE_TYPE, CHAT_MESSAGE_TYPE } from "../../../../frontend/clients/COMMAND.js";

const CAN_HEAR_CHAT_RANGE = 250;

export const sendMessageCommandHandler = ({ srcUsername, to, body, rooms, clients, userPositionCache }) => {
  const { message } = body;
  if (message === undefined) throw new Error(`'message' undefined`);

  const roomId = clients[srcUsername].roomId;
  if (roomId === null) throw new Error(`can't send a message when not inside a room`)

  if (message.type === TARGET_MESSAGE_TYPE) {
    userPositionCache.setPosition(srcUsername, roomId, message.content)
  }

  let destUsernames = Array.from(rooms[roomId].usernames);

  if (message.type === CHAT_MESSAGE_TYPE) {
    const srcPosition = userPositionCache.getPosition(srcUsername, roomId)
    if (srcPosition && to !== 'all') {
      destUsernames = destUsernames.filter(destUsername => {
        const destPosition = userPositionCache.getPosition(destUsername, roomId)
        if (!destPosition) return false;
        return Math.hypot(destPosition[0] - srcPosition[0], destPosition[1] - srcPosition[1]) < CAN_HEAR_CHAT_RANGE;
      })
    }
  }

  destUsernames.forEach((destinationUsername) => {
    if (destinationUsername === srcUsername) return;
    const destClientConnection = clients[destinationUsername].connection;
    if (destClientConnection === undefined) return console.debug(`No connection for username: ${destinationUsername}`);
    if (!destClientConnection.connected) return console.debug(`Connection for username not connected: ${destinationUsername}`);
    destClientConnection.sendUTF(JSON.stringify({
      command: MESSAGE_COMMAND,
      body: { message, srcUsername },
    }));
  });
}