import { server as WebSocketServer } from 'websocket';


const originIsAllowed = (origin) => true;

export class WebSocketServerWrapper {
    onNewConnection = null;
    onMessage = null;
    onClose = null;

    constructor(httpServer, acceptRequest) {
        this.wss = new WebSocketServer({ httpServer, autoAcceptConnections: false });

        this.wss.on('request', async (req, res) => {
            console.log(`[${(new Date()).toISOString()}] connection 1`, req.origin)
            if (!originIsAllowed(req.origin) || !acceptRequest(req)) {
                // Make sure we only accept requests from an allowed origin
                req.reject();
                // console.debug(`[${(new Date()).toISOString()}] Rejected connection from origin: ${req.origin}`);
                return;
            }

            console.log(`[${(new Date()).toISOString()}] connection 2`, req.origin)

            var connection = req.accept('messaging-protocol', req.origin);
            let connectionId;
            if (this.onNewConnection) connectionId = await this.onNewConnection(connection, req.resourceURL.query.token);

            connection.on('message', (message) => this.onMessage(connectionId, message));
            connection.on('close', (reasonCode, description) => this.onClose(connectionId, reasonCode, description));
        });
    }
}
